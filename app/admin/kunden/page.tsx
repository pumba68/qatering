'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  RefreshCw,
  Search,
  UserX,
  Hash,
  MapPin,
  Building2,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  BadgeCheck,
  Smartphone,
  CreditCard,
  Fingerprint,
  // PROJ-19: Bestellhistorie
  Package,
  Euro,
  ShoppingCart,
  CalendarDays,
  Globe,
  Monitor,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CustomerRow {
  id: string
  customerId: string | null
  name: string | null
  email: string
  image: string | null
  isAnonymous: boolean
  createdAt: string
  walletBalance: number
  primaryLocation: { id: string; name: string } | null
}

interface Identifier {
  id: string
  type: string
  value: string
  source: string | null
  addedAt: string
}

interface CompanyAccess {
  companyId: string
  companyName: string
  subsidyType: string
  subsidyValue: number | null
  subsidyMaxPerDay: number | null
  isActive: boolean
  validUntil: string | null
  employeeNumber: string | null
}

interface CustomerDetail {
  id: string
  customerId: string | null
  name: string | null
  email: string
  image: string | null
  isAnonymous: boolean
  mergedIntoId: string | null
  createdAt: string
  organization: { id: string; name: string } | null
  walletBalance: number
  locations: Array<{ id: string; name: string }>
  identifiers: Identifier[]
  companyAccess: CompanyAccess[]
}

// ─── PROJ-19 Types ───────────────────────────────────────────────────────────

interface OrderItem {
  id: string
  quantity: number
  price: number
  productName: string
  productCategory: string | null
  unitPrice: number
}

interface Order {
  id: string
  pickupCode: string
  status: string
  channel: string | null
  totalAmount: number
  finalAmount: number | null
  discountAmount: number | null
  employerSubsidyAmount: number | null
  paymentMethod: string | null
  paymentStatus: string
  notes: string | null
  createdAt: string
  pickupDate: string
  pickedUpAt: string | null
  location: { id: string; name: string }
  items: OrderItem[]
}

interface OrderKpis {
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
  lastOrderAt: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysSince(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days === 0) return 'Heute'
  if (days === 1) return 'Gestern'
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.floor(days / 30)}M`
  return `${Math.floor(days / 365)}J`
}

function memberDuration(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return 'Heute registriert'
  if (days < 30) return `${days} Tag${days === 1 ? '' : 'e'}`
  if (days < 365) return `${Math.floor(days / 30)} Monat${Math.floor(days / 30) === 1 ? '' : 'e'}`
  const years = Math.floor(days / 365)
  const months = Math.floor((days % 365) / 30)
  return months > 0 ? `${years} Jahr${years === 1 ? '' : 'e'}, ${months} Monat${months === 1 ? '' : 'e'}` : `${years} Jahr${years === 1 ? '' : 'e'}`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

function identifierIcon(type: string) {
  switch (type) {
    case 'APP_ID': return <Smartphone className="w-3 h-3 text-muted-foreground" />
    case 'EMPLOYEE_ID': return <BadgeCheck className="w-3 h-3 text-muted-foreground" />
    case 'BADGE_ID': return <CreditCard className="w-3 h-3 text-muted-foreground" />
    case 'DEVICE_ID': return <Fingerprint className="w-3 h-3 text-muted-foreground" />
    default: return <Hash className="w-3 h-3 text-muted-foreground" />
  }
}

function identifierLabel(type: string): string {
  const map: Record<string, string> = {
    APP_ID: 'App-ID',
    EMPLOYEE_ID: 'Mitarbeiter-ID',
    BADGE_ID: 'Badge-ID',
    DEVICE_ID: 'Geräte-ID',
    EXTERNAL_ID: 'Externe ID',
  }
  return map[type] ?? type
}

function subsidyLabel(type: string, value: number | null, maxPerDay: number | null): string {
  if (type === 'NONE' || value === null) return 'Kein Zuschuss'
  if (type === 'FIXED') return `${formatCurrency(value)}/Tag${maxPerDay ? ` (max. ${formatCurrency(maxPerDay)})` : ''}`
  if (type === 'PERCENTAGE') return `${value}% Rabatt${maxPerDay ? ` (max. ${formatCurrency(maxPerDay)})` : ''}`
  return `${value}`
}

// ─── Status Pill ─────────────────────────────────────────────────────────────

// Aktivitätsstatus wird in PROJ-21 berechnet; hier nur Anonym / Neu als Fallback
function StatusPill({ isAnonymous }: { isAnonymous: boolean }) {
  if (isAnonymous) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        Anonym
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      Neu
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, email, isAnonymous, size = 'sm' }: { name: string | null; email: string; isAnonymous: boolean; size?: 'sm' | 'lg' }) {
  const dim = size === 'lg' ? 'w-14 h-14 text-xl' : 'w-9 h-9 text-sm'
  if (isAnonymous) {
    return (
      <div className={`${dim} rounded-full bg-muted flex items-center justify-center flex-shrink-0`}>
        <UserX className={size === 'lg' ? 'w-6 h-6 text-muted-foreground' : 'w-4 h-4 text-muted-foreground'} />
      </div>
    )
  }
  return (
    <div className={`${dim} rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center flex-shrink-0`}>
      {initials(name, email)}
    </div>
  )
}

// ─── Section Header ────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
      <hr className="border-border mt-2" />
    </div>
  )
}

// ─── PROJ-19 Helpers ─────────────────────────────────────────────────────────

const ORDER_STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING:    { label: 'Offen',         className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  CONFIRMED:  { label: 'Bestätigt',     className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  PREPARING:  { label: 'In Zubereitung',className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  READY:      { label: 'Bereit',        className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  PICKED_UP:  { label: 'Abgeholt',      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  CANCELLED:  { label: 'Storniert',     className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  REFUNDED:   { label: 'Erstattet',     className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
}

function OrderStatusPill({ status }: { status: string }) {
  const s = ORDER_STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  )
}

function ChannelIcon({ channel }: { channel: string | null }) {
  const cls = 'w-3 h-3'
  switch (channel) {
    case 'APP':      return <Smartphone className={cls} />
    case 'WEB':      return <Globe className={cls} />
    case 'TERMINAL': return <Monitor className={cls} />
    case 'KASSE':    return <CreditCard className={cls} />
    case 'ADMIN':    return <ShieldCheck className={cls} />
    default:         return <HelpCircle className={cls} />
  }
}

function channelLabel(channel: string | null): string {
  const map: Record<string, string> = { APP: 'App', WEB: 'Web', TERMINAL: 'Terminal', KASSE: 'Kasse', ADMIN: 'Admin' }
  return channel ? (map[channel] ?? 'Unbekannt') : 'Unbekannt'
}

// ─── PROJ-19 Bestellhistorie Tab ──────────────────────────────────────────────

function BestellhistorieTab({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [kpis, setKpis] = useState<OrderKpis | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchOrders = useCallback(async (
    currentPage: number,
    currentSearch: string,
    currentStatus: string,
    currentDateFrom: string,
    currentDateTo: string,
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(currentPage) })
      if (currentSearch) params.set('search', currentSearch)
      if (currentStatus && currentStatus !== 'all') params.set('status', currentStatus)
      if (currentDateFrom) params.set('dateFrom', currentDateFrom)
      if (currentDateTo) params.set('dateTo', currentDateTo)
      const res = await fetch(`/api/admin/kunden/${userId}/bestellungen?${params}`)
      const json = await res.json()
      setOrders(json.data ?? [])
      setKpis(json.kpis ?? null)
      setTotal(json.pagination?.total ?? 0)
      setTotalPages(json.pagination?.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchOrders(page, search, statusFilter, dateFrom, dateTo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, dateFrom, dateTo])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setPage(1)
      fetchOrders(1, value, statusFilter, dateFrom, dateTo)
    }, 300)
  }

  const handleReset = () => {
    setSearch('')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
    fetchOrders(1, '', 'all', '', '')
  }

  const hasFilters = search || statusFilter !== 'all' || dateFrom || dateTo

  return (
    <div className="pb-4">
      {/* KPI-Kacheln */}
      {kpis && (
        <div className="grid grid-cols-2 gap-2 px-6 pb-4 pt-2">
          <div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1.5">
              <Package className="w-3.5 h-3.5" />
              Bestellungen
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{kpis.totalOrders}</p>
            <p className="text-xs text-muted-foreground mt-0.5">gesamt</p>
          </div>
          <div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1.5">
              <Euro className="w-3.5 h-3.5" />
              Gesamtumsatz
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
              {formatCurrency(kpis.totalRevenue)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">inkl. aller Bestellungen</p>
          </div>
          <div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1.5">
              <ShoppingCart className="w-3.5 h-3.5" />
              Ø Warenkorb
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {kpis.totalOrders > 0 ? formatCurrency(kpis.avgOrderValue) : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">pro Bestellung</p>
          </div>
          <div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-3 border border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              Letzte Bestellung
            </div>
            <p className="text-lg font-bold text-foreground">
              {kpis.lastOrderAt ? formatDate(kpis.lastOrderAt) : '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {kpis.lastOrderAt ? daysSince(kpis.lastOrderAt) + ' her' : 'Noch keine'}
            </p>
          </div>
        </div>
      )}

      {/* Filter-Leiste */}
      <div className="px-6 pb-3 flex flex-wrap gap-2 border-b border-border mb-0">
        <div className="relative flex-1 min-w-[130px]">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Bestellnr. suchen…"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none"
        >
          <option value="all">Alle Status</option>
          {Object.entries(ORDER_STATUS_MAP).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none"
        />
        {hasFilters && (
          <button onClick={handleReset} className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground rounded-md border border-input bg-background">
            Zurücksetzen
          </button>
        )}
      </div>

      {/* Bestellliste */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center px-4">
          <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Noch keine Bestellungen</p>
          <p className="text-xs text-muted-foreground mt-1">
            {hasFilters ? 'Keine Bestellungen für diese Filter.' : 'Dieser Kunde hat noch keine Bestellung aufgegeben.'}
          </p>
        </div>
      ) : (
        <div className="px-6 pt-3 space-y-2">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id
            const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED'
            const displayAmount = order.finalAmount ?? order.totalAmount

            return (
              <div
                key={order.id}
                className="border border-border rounded-xl overflow-hidden"
              >
                {/* Bestellkarte Header */}
                <div
                  className="cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  {/* Obere Zeile */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
                        {new Date(order.createdAt).toLocaleDateString('de-DE', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })} · {new Date(order.createdAt).toLocaleTimeString('de-DE', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <span className="text-xs font-mono text-foreground truncate">
                        #{order.pickupCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <OrderStatusPill status={order.status} />
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                  </div>
                  {/* Untere Zeile */}
                  <div className="flex items-center justify-between px-4 pb-3">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.location?.name ?? '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <ChannelIcon channel={order.channel} />
                        {channelLabel(order.channel)}
                      </span>
                      <span>{order.items.length} Artikel</span>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${
                      isCancelled ? 'text-red-600 dark:text-red-400 line-through' : 'text-foreground'
                    }`}>
                      {formatCurrency(displayAmount)}
                    </span>
                  </div>
                </div>

                {/* Expandierter Detail-Bereich */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 px-4 py-3">
                    {/* Produktliste */}
                    <div className="space-y-2 mb-3">
                      {order.items.map((item) => (
                        <div className="flex items-start justify-between text-sm" key={item.id}>
                          <div className="min-w-0 flex-1 pr-4">
                            <span className="font-medium text-foreground">{item.productName}</span>
                            {item.productCategory && (
                              <span className="text-xs text-muted-foreground ml-2">{item.productCategory}</span>
                            )}
                          </div>
                          <span className="text-muted-foreground tabular-nums flex-shrink-0 text-xs">
                            {item.quantity} × {formatCurrency(item.unitPrice)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Metadaten */}
                    <div className="border-t border-border/50 pt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Gesamt: <strong className="text-foreground">{formatCurrency(order.totalAmount)}</strong></span>
                      {order.discountAmount && order.discountAmount > 0 && (
                        <span className="text-green-600">Rabatt: -{formatCurrency(order.discountAmount)}</span>
                      )}
                      {order.employerSubsidyAmount && order.employerSubsidyAmount > 0 && (
                        <span className="text-blue-600">Zuschuss: -{formatCurrency(order.employerSubsidyAmount)}</span>
                      )}
                      {order.finalAmount && order.finalAmount !== order.totalAmount && (
                        <span>Endbetrag: <strong className="text-foreground">{formatCurrency(order.finalAmount)}</strong></span>
                      )}
                      {order.paymentMethod && <span>Zahlung: {order.paymentMethod}</span>}
                      {order.notes && <span>📝 {order.notes}</span>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && orders.length > 0 && (
        <div className="flex items-center justify-between px-6 pt-3 mt-2 border-t border-border text-xs">
          <span className="text-muted-foreground">
            {total} Bestellungen · Seite {page} von {totalPages}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2" disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2" disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Drawer Tabs ─────────────────────────────────────────────────────────────

const TABS = ['Übersicht', 'Bestellhistorie', 'Präferenzen', 'Merkmale'] as const
type Tab = typeof TABS[number]

// ─── Drawer Content ───────────────────────────────────────────────────────────

function CustomerDrawer({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('Übersicht')
  const [data, setData] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllIdentifiers, setShowAllIdentifiers] = useState(false)

  useEffect(() => {
    setLoading(true)
    setData(null)
    setActiveTab('Übersicht')
    fetch(`/api/admin/kunden/${customerId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [customerId])

  return (
    <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto p-0" onInteractOutside={onClose}>
      {loading || !data ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Drawer Header */}
          <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-5">
            <div className="flex items-start gap-4">
              <Avatar name={data.name} email={data.email} isAnonymous={data.isAnonymous} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {data.isAnonymous ? '[anonymisiert]' : (data.name ?? '—')}
                  </h2>
                  {data.isAnonymous && (
                    <Badge variant="secondary" className="text-xs">Anonym</Badge>
                  )}
                  {data.mergedIntoId && (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Zusammengeführt</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {data.isAnonymous ? '[anonymisiert]' : data.email}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kunde seit {formatDate(data.createdAt)} ({memberDuration(data.createdAt)})
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border px-6 bg-background">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content — Übersicht hat eigenen padded Container */}
          {activeTab === 'Übersicht' && (
          <div className="px-6 py-5 space-y-6">
            {true && (
              <>
                {/* Identifikatoren */}
                <div>
                  <SectionHeader label="Identifikatoren" />
                  <div className="flex flex-wrap gap-2">
                    {/* Customer-ID immer anzeigen */}
                    {data.customerId && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md text-xs font-mono text-foreground border border-border/50">
                        <Hash className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate max-w-[160px]" title={data.customerId}>{data.customerId}</span>
                        <span className="text-muted-foreground">(Customer-ID)</span>
                      </span>
                    )}

                    {/* Weitere Identifikatoren */}
                    {(showAllIdentifiers ? data.identifiers : data.identifiers.slice(0, 4)).map((id) => (
                      <span key={id.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md text-xs font-mono text-foreground border border-border/50">
                        {identifierIcon(id.type)}
                        <span>{id.value}</span>
                        <span className="text-muted-foreground">({identifierLabel(id.type)})</span>
                      </span>
                    ))}

                    {data.identifiers.length === 0 && (
                      <p className="text-sm text-muted-foreground">Keine weiteren Identifikatoren hinterlegt</p>
                    )}
                  </div>
                  {data.identifiers.length > 4 && !showAllIdentifiers && (
                    <button
                      onClick={() => setShowAllIdentifiers(true)}
                      className="mt-2 text-xs text-primary hover:underline"
                    >
                      + {data.identifiers.length - 4} weitere anzeigen
                    </button>
                  )}
                </div>

                {/* Organisation & Standorte */}
                <div>
                  <SectionHeader label="Organisation & Standort" />
                  {data.organization ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">{data.organization.name}</span>
                      </div>
                      {data.locations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {data.locations.map((loc) => (
                            <span key={loc.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-border text-xs text-foreground bg-background">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              {loc.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Kein Standort zugeordnet</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine Organisation zugeordnet</p>
                  )}
                </div>

                {/* Zuschüsse & Berechtigungen */}
                <div>
                  <SectionHeader label="Zuschüsse & Berechtigungen" />
                  {data.companyAccess.length > 0 ? (
                    <div className="space-y-2">
                      {data.companyAccess.map((ca) => {
                        const expired = ca.validUntil && new Date(ca.validUntil) < new Date()
                        const inactive = !ca.isActive || expired
                        return (
                          <div key={ca.companyId} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${inactive ? 'bg-gray-300' : 'bg-green-500'}`} />
                              <div>
                                <p className={`text-sm font-medium ${inactive ? 'text-muted-foreground' : 'text-foreground'}`}>
                                  {ca.companyName}
                                </p>
                                {ca.employeeNumber && (
                                  <p className="text-xs text-muted-foreground">Personalnr.: {ca.employeeNumber}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm ${inactive ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {subsidyLabel(ca.subsidyType, ca.subsidyValue, ca.subsidyMaxPerDay)}
                              </p>
                              {inactive && (
                                <p className="text-xs text-orange-500">
                                  {expired ? `Abgelaufen ${formatDate(ca.validUntil!)}` : 'Inaktiv'}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine Unternehmens-Zuordnung hinterlegt</p>
                  )}
                </div>

                {/* Wallet */}
                <div>
                  <SectionHeader label="Wallet" />
                  <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${data.walletBalance > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                        <Wallet className={`w-5 h-5 ${data.walletBalance > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Aktuelles Guthaben</p>
                        <p className={`text-2xl font-bold tabular-nums ${
                          data.walletBalance > 0
                            ? 'text-green-600 dark:text-green-400'
                            : data.walletBalance < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-orange-500'
                        }`}>
                          {formatCurrency(data.walletBalance)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/wallet?userId=${data.id}`}>
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        Aufladen
                      </Link>
                    </Button>
                  </div>
                </div>
              </>
            )}

          </div>
          )}

          {/* Bestellhistorie — verwaltet eigenen Padding */}
          {activeTab === 'Bestellhistorie' && data && (
            <BestellhistorieTab userId={data.id} />
          )}

          {activeTab === 'Präferenzen' && (
            <div className="px-6 py-5 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Präferenzen & Allergien</p>
              <p className="text-xs text-muted-foreground mt-1">Wird in PROJ-20 implementiert</p>
            </div>
          )}

          {activeTab === 'Merkmale' && (
            <div className="px-6 py-5 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <RefreshCw className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Abgeleitete Merkmale</p>
              <p className="text-xs text-muted-foreground mt-1">Wird in PROJ-21 implementiert</p>
            </div>
          )}
        </>
      )}
    </SheetContent>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KundenPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('createdAt_desc')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchCustomers = useCallback(
    async (currentPage: number, currentSearch: string, currentSort: string) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          search: currentSearch,
          sort: currentSort,
        })
        const res = await fetch(`/api/admin/kunden?${params}`)
        const json = await res.json()
        setCustomers(json.data ?? [])
        setTotal(json.pagination?.total ?? 0)
        setTotalPages(json.pagination?.totalPages ?? 1)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Initial load
  useEffect(() => {
    fetchCustomers(page, search, sort)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort])

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      setPage(1)
      fetchCustomers(1, value, sort)
    }, 300)
  }

  const handleSortChange = (value: string) => {
    setSort(value)
    setPage(1)
  }

  const handleRefresh = () => fetchCustomers(page, search, sort)

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Kunden</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? '…' : `${total.toLocaleString('de-DE')} Kunden gesamt`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Suche Name, E-Mail, Mitarbeiter-ID …"
              className="pl-9 h-9"
            />
          </div>

          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="h-9 w-[180px]">
              <SelectValue placeholder="Sortierung" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt_desc">Neueste zuerst</SelectItem>
              <SelectItem value="createdAt_asc">Älteste zuerst</SelectItem>
              <SelectItem value="name_asc">Name A–Z</SelectItem>
              <SelectItem value="name_desc">Name Z–A</SelectItem>
            </SelectContent>
          </Select>

          {(search || sort !== 'createdAt_desc') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setSort('createdAt_desc')
                setPage(1)
                fetchCustomers(1, '', 'createdAt_desc')
              }}
            >
              Zurücksetzen
            </Button>
          )}
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-10"></th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kunde</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Standort</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wallet</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Seit</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-muted rounded animate-pulse w-32 mb-1" />
                    <div className="h-3 bg-muted rounded animate-pulse w-48" />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="h-3 bg-muted rounded animate-pulse w-20" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 bg-muted rounded animate-pulse w-16 ml-auto" />
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="h-5 bg-muted rounded-full animate-pulse w-14" />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="h-3 bg-muted rounded animate-pulse w-8 ml-auto" />
                  </td>
                </tr>
              ))
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Keine Kunden gefunden</p>
                  {search && <p className="text-xs mt-1">Versuche andere Suchbegriffe</p>}
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Avatar name={c.name} email={c.email} isAnonymous={c.isAnonymous} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-foreground">
                      {c.isAnonymous ? '[anonymisiert]' : (c.name ?? '—')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {c.isAnonymous ? '[anonymisiert]' : c.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {c.primaryLocation?.name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-semibold tabular-nums ${
                      c.walletBalance > 0
                        ? 'text-green-600 dark:text-green-400'
                        : c.walletBalance < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-orange-500'
                    }`}>
                      {formatCurrency(c.walletBalance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusPill isAnonymous={c.isAnonymous} />
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">{daysSince(c.createdAt)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {!loading && customers.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/10">
            <p className="text-sm text-muted-foreground">
              {total.toLocaleString('de-DE')} Einträge · Seite {page} von {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Drawer */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        {selectedId && (
          <CustomerDrawer
            customerId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </Sheet>
    </div>
  )
}
