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
  // PROJ-20: Präferenzen
  Leaf,
  AlertTriangle,
  Bot,
  Check,
  X,
  Plus,
  BarChart2,
  Clock,
  Utensils,
  // PROJ-21: Merkmale
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Award,
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

const TABS = ['Übersicht', 'Bestellhistorie', 'Präferenzen', 'Merkmale', 'Segmente'] as const
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

          {activeTab === 'Präferenzen' && data && (
            <PraeferenzenTab userId={data.id} />
          )}

          {activeTab === 'Merkmale' && data && (
            <MerkmaleTab userId={data.id} />
          )}

          {activeTab === 'Segmente' && data && (
            <SegmenteTab userId={data.id} />
          )}
        </>
      )}
    </SheetContent>
  )
}

// ─── PROJ-21 Types ────────────────────────────────────────────────────────────

interface CustomerMetricsData {
  activityStatus: string
  daysSinceLastOrder: number | null
  daysSinceRegistration: number
  preferredDayOfWeek: number | null
  preferredTimeSlot: string | null
  ltv: number
  avgOrderValue: number
  orderFrequencyPerWeek: number
  spend30d: number
  totalOrders: number
  firstOrderAt: string | null
  lastOrderAt: string | null
  customerTier: string
  rfmR: number
  rfmF: number
  rfmM: number
  rfmSegment: string
  frequencyTrend: string
  spendTrend: string
  orders30d: number
  orders30dPrev: number
  spend30dPrev: number
  churnRiskScore: number
  winBackScore: number | null
  upsellScore: number
  orderConsistencyScore: number | null
  orderDiversityScore: number
  lunchRegularityPct: number | null
  avgLeadTimeHours: number | null
  couponUsageRate: number
  walletUsageRate: number
  primaryChannel: string | null
  channelLoyaltyPct: number
  calculatedAt: string
}

// ─── PROJ-21 Helpers ──────────────────────────────────────────────────────────

function activityStatusConfig(status: string): { label: string; className: string; description: string } {
  switch (status) {
    case 'AKTIV':       return { label: 'Aktiv',        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',   description: 'Letzte Bestellung in den letzten 30 Tagen' }
    case 'GELEGENTLICH':return { label: 'Gelegentlich', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',description: 'Letzte Bestellung vor 31–90 Tagen' }
    case 'SCHLAFEND':   return { label: 'Schlafend',    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',description: 'Letzte Bestellung vor 91–180 Tagen' }
    case 'ABGEWANDERT': return { label: 'Abgewandert',  className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',           description: 'Letzte Bestellung vor mehr als 180 Tagen' }
    default:            return { label: 'Neu',          className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',          description: 'Noch keine Bestellung aufgegeben' }
  }
}

function tierConfig(tier: string): { label: string; className: string } {
  switch (tier) {
    case 'PLATIN':  return { label: 'Platin',   className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' }
    case 'GOLD':    return { label: 'Gold',     className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
    case 'SILBER':  return { label: 'Silber',   className: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }
    case 'BRONZE':  return { label: 'Bronze',   className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' }
    default:        return { label: 'Standard', className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' }
  }
}

function rfmSegmentLabel(seg: string): { label: string; description: string } {
  const map: Record<string, { label: string; description: string }> = {
    CHAMPION:        { label: 'Stammkunde',          description: 'Bestellt oft, viel und kürzlich' },
    LOYAL:           { label: 'Treuer Kunde',         description: 'Regelmäßiger Gast mit gutem Wert' },
    POTENTIAL:       { label: 'Aufstrebend',          description: 'Kürzlich aktiv, noch wenig Frequenz' },
    NEEDS_ATTENTION: { label: 'Schläft ein',          description: 'War treu, jetzt seltener' },
    AT_RISK:         { label: 'Risiko-Kunde',         description: 'Könnte bald abwandern' },
    CANT_LOSE:       { label: 'Verlorener Champion',  description: 'War sehr wertvoll, jetzt inaktiv' },
    HIBERNATING:     { label: 'Hibernator',           description: 'Lange inaktiv, geringer Wert' },
    NEW_CUSTOMER:    { label: 'Neukunde',             description: 'Erste Bestellung vor weniger als 30 Tagen' },
  }
  return map[seg] ?? { label: seg, description: '' }
}

function trendIcon(trend: string) {
  if (trend === 'WACHSEND')    return <TrendingUp className="w-4 h-4 text-green-600" />
  if (trend === 'RUECKLAEUFIG') return <TrendingDown className="w-4 h-4 text-red-600" />
  return <Minus className="w-4 h-4 text-muted-foreground" />
}

function trendClass(trend: string): string {
  if (trend === 'WACHSEND')    return 'text-green-600'
  if (trend === 'RUECKLAEUFIG') return 'text-red-600'
  return 'text-muted-foreground'
}

function trendLabel(trend: string): string {
  if (trend === 'WACHSEND')    return 'Wachsend'
  if (trend === 'RUECKLAEUFIG') return 'Rückläufig'
  return 'Stabil'
}

function trendPct(current: number, prev: number): string {
  if (prev === 0) return current > 0 ? '+100 %' : '—'
  const pct = Math.round(((current - prev) / prev) * 100)
  return pct > 0 ? `+${pct} %` : `${pct} %`
}

function dayOfWeekLabel(day: number | null): string {
  if (day === null) return '—'
  return ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][day] ?? '—'
}

function timeSlotLabel21(slot: string | null): string {
  const map: Record<string, string> = { BREAKFAST: 'Frühstück', LUNCH: 'Mittagessen', AFTERNOON: 'Nachmittag', EVENING: 'Abend' }
  return slot ? (map[slot] ?? slot) : '—'
}

// ─── PROJ-21 MerkmaleTab ──────────────────────────────────────────────────────

function MerkmaleTab({ userId }: { userId: string }) {
  const [metrics, setMetrics] = useState<CustomerMetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [recalculating, setRecalculating] = useState(false)
  const [retryAfterMinutes, setRetryAfterMinutes] = useState<number | null>(null)

  const fetchMetrics = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/kunden/${userId}/merkmale`)
      .then(r => r.json())
      .then(d => setMetrics(d.metrics ?? null))
      .catch(() => {/* error handled by null state */})
      .finally(() => setLoading(false))
  }, [userId])

  useEffect(() => { fetchMetrics() }, [fetchMetrics])

  const handleRecalculate = async () => {
    setRecalculating(true)
    setRetryAfterMinutes(null)
    const res = await fetch(`/api/admin/kunden/${userId}/merkmale/recalculate`, { method: 'POST' })
    if (res.ok) {
      fetchMetrics()
    } else if (res.status === 429) {
      const body = await res.json()
      setRetryAfterMinutes(body.retryAfterMinutes ?? null)
    }
    setRecalculating(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="px-6 py-8 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Activity className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Noch keine Merkmale berechnet</p>
          <p className="text-xs text-muted-foreground mt-1">Klicke auf „Neu berechnen" um die Merkmale zu erstellen.</p>
        </div>
        <Button size="sm" onClick={handleRecalculate} disabled={recalculating}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${recalculating ? 'animate-spin' : ''}`} />
          Neu berechnen
        </Button>
      </div>
    )
  }

  const actStatus = activityStatusConfig(metrics.activityStatus)
  const tier = tierConfig(metrics.customerTier)
  const rfm = rfmSegmentLabel(metrics.rfmSegment)
  const staleData = (Date.now() - new Date(metrics.calculatedAt).getTime()) > 48 * 3600000

  return (
    <div className="px-6 py-5 space-y-6">

      {/* Stale data warning */}
      {staleData && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          Daten werden aktualisiert – letzter Stand: {formatDate(metrics.calculatedAt)}
        </div>
      )}

      {/* ── Header-Karte: Status + Tier + RFM ── */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${actStatus.className}`}
            title={actStatus.description}
          >
            {actStatus.label}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${tier.className}`}>
            <Award className="w-3 h-3" />
            {tier.label}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {rfm.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{rfm.label}:</span> {rfm.description}
          {metrics.daysSinceLastOrder !== null && (
            <span className="ml-2">· Letzte Bestellung vor {metrics.daysSinceLastOrder} Tagen</span>
          )}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          <span>RFM: R{metrics.rfmR} · F{metrics.rfmF} · M{metrics.rfmM}</span>
          {metrics.preferredDayOfWeek !== null && (
            <span>Lieblingstag: {dayOfWeekLabel(metrics.preferredDayOfWeek)}</span>
          )}
          {metrics.preferredTimeSlot && (
            <span>Zeitslot: {timeSlotLabel21(metrics.preferredTimeSlot)}</span>
          )}
        </div>
      </div>

      {/* ── Wert & Frequenz ── */}
      <div>
        <SectionHeader label="Wert & Frequenz" />
        <div className="grid grid-cols-2 gap-3">
          {([
            { label: 'Lifetime Value',    value: formatCurrency(metrics.ltv),              sub: 'Gesamtumsatz' },
            { label: 'Ø Warenkorb',       value: formatCurrency(metrics.avgOrderValue),     sub: 'pro Bestellung' },
            { label: 'Bestellfrequenz',   value: `${metrics.orderFrequencyPerWeek.toFixed(1)}×/Wo`, sub: `${metrics.totalOrders} Bestellungen gesamt` },
            { label: 'Ausgaben 30d',      value: formatCurrency(metrics.spend30d),          sub: 'letzte 30 Tage' },
          ] as const).map(tile => (
            <div key={tile.label} className="rounded-lg border border-border bg-background p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{tile.label}</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{tile.value}</p>
              <p className="text-[10px] text-muted-foreground">{tile.sub}</p>
            </div>
          ))}
        </div>
        {(metrics.firstOrderAt || metrics.lastOrderAt) && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {metrics.firstOrderAt && <span>Erste Bestellung: {formatDate(metrics.firstOrderAt)}</span>}
            {metrics.lastOrderAt && <span>Letzte Bestellung: {formatDate(metrics.lastOrderAt)}</span>}
          </div>
        )}
      </div>

      {/* ── Trend ── */}
      <div>
        <SectionHeader label="Trend (letzte 30 Tage)" />
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Bestellfrequenz</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {trendIcon(metrics.frequencyTrend)}
              <span className={`text-sm font-semibold ${trendClass(metrics.frequencyTrend)}`}>{trendLabel(metrics.frequencyTrend)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.orders30d} vs. {metrics.orders30dPrev} Bestellungen
              {' '}<span className={trendClass(metrics.frequencyTrend)}>({trendPct(metrics.orders30d, metrics.orders30dPrev)})</span>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Ausgaben</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {trendIcon(metrics.spendTrend)}
              <span className={`text-sm font-semibold ${trendClass(metrics.spendTrend)}`}>{trendLabel(metrics.spendTrend)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(metrics.spend30d)} vs. {formatCurrency(metrics.spend30dPrev)}
              {' '}<span className={trendClass(metrics.spendTrend)}>({trendPct(metrics.spend30d, metrics.spend30dPrev)})</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Risiko & Potenzial ── */}
      <div>
        <SectionHeader label="Risiko & Potenzial" />
        <div className="space-y-3">
          {metrics.churnRiskScore > 20 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-foreground">Abwanderungsrisiko</span>
                <span className={
                  metrics.churnRiskScore >= 70 ? 'text-red-600 font-semibold' :
                  metrics.churnRiskScore >= 40 ? 'text-amber-600 font-semibold' :
                  'text-green-600 font-semibold'
                }>
                  {metrics.churnRiskScore >= 70 ? 'Hohes Risiko' : metrics.churnRiskScore >= 40 ? 'Mittleres Risiko' : 'Geringes Risiko'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${metrics.churnRiskScore >= 70 ? 'bg-red-500' : metrics.churnRiskScore >= 40 ? 'bg-amber-500' : 'bg-green-500'}`}
                    style={{ width: `${metrics.churnRiskScore}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">{metrics.churnRiskScore}/100</span>
              </div>
            </div>
          )}

          {metrics.winBackScore !== null && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-foreground">Win-Back-Priorität</span>
                <span className="text-blue-600 font-semibold">
                  {metrics.winBackScore >= 70 ? 'Hoch' : metrics.winBackScore >= 40 ? 'Mittel' : 'Niedrig'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${metrics.winBackScore}%` }} />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">{metrics.winBackScore}/100</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-foreground">Upsell-Potenzial</span>
              <span className="text-muted-foreground">
                {metrics.upsellScore >= 70 ? 'Hoch' : metrics.upsellScore >= 40 ? 'Mittel' : 'Gering'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${metrics.upsellScore}%` }} />
              </div>
              <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">{metrics.upsellScore}/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Verhaltensprofil ── */}
      <div>
        <SectionHeader label="Verhaltensprofil" />
        <div className="space-y-3">
          {metrics.orderConsistencyScore !== null && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-foreground">Konsistenz</span>
                <span className="text-muted-foreground">
                  {metrics.orderConsistencyScore >= 75 ? 'Sehr regelmäßig' : metrics.orderConsistencyScore >= 50 ? 'Mäßig regelmäßig' : 'Sporadisch'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${metrics.orderConsistencyScore}%` }} />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">{metrics.orderConsistencyScore}/100</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-foreground">Produktvielfalt</span>
              <span className="text-muted-foreground">
                {metrics.orderDiversityScore >= 70 ? 'Probiert gerne Neues' : metrics.orderDiversityScore >= 40 ? 'Ausgewogen' : 'Treu zu Favoriten'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full bg-teal-500" style={{ width: `${metrics.orderDiversityScore}%` }} />
              </div>
              <span className="text-xs tabular-nums text-muted-foreground w-12 text-right">{metrics.orderDiversityScore}/100</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 text-xs">
            {metrics.lunchRegularityPct !== null && (
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Mittagsfrequenz</span>
                <span className="font-medium">{Math.round(metrics.lunchRegularityPct * 100)} % Werktage</span>
              </div>
            )}
            {metrics.avgLeadTimeHours !== null && (
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-muted-foreground">Ø Vorlaufzeit</span>
                <span className="font-medium">{metrics.avgLeadTimeHours.toFixed(1)} Std.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Engagement ── */}
      <div>
        <SectionHeader label="Engagement & Kanal" />
        <div className="space-y-0 text-xs">
          {([
            { label: 'Coupon-Nutzung', value: `${Math.round(metrics.couponUsageRate * 100)} % der Bestellungen` },
            { label: 'Wallet-Nutzung', value: `${Math.round(metrics.walletUsageRate * 100)} % der Bestellungen` },
            ...(metrics.primaryChannel ? [{ label: 'Primärer Kanal', value: `${channelLabel(metrics.primaryChannel)} (${Math.round(metrics.channelLoyaltyPct * 100)} %)` }] : []),
          ] as Array<{ label: string; value: string }>).map(row => (
            <div key={row.label} className="flex justify-between py-1.5 border-b border-border last:border-0">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            Stand: {new Date(metrics.calculatedAt).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · Täglich aktualisiert
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={handleRecalculate}
          disabled={recalculating || retryAfterMinutes !== null}
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${recalculating ? 'animate-spin' : ''}`} />
          {retryAfterMinutes !== null ? `Wieder in ${retryAfterMinutes} Min.` : 'Neu berechnen'}
        </Button>
      </div>
    </div>
  )
}

// ─── PROJ-20 Types ────────────────────────────────────────────────────────────

interface ExplicitPref {
  id: string
  key: string
  value: string | null
  source: string
  confidence: number | null
  updatedAt: string
}

interface PrefSuggestion {
  key: string
  label: string
  confidence: number
  orderCount: number
  matchingOrderCount: number
}

interface ImplicitStats {
  orderCount: number
  windowDays: number
  topCategories: Array<{ name: string; count: number; pct: number }>
  topProducts: Array<{ name: string; count: number }>
  preferredChannel: string | null
  preferredTimeSlot: string | null
}

interface PrefAuditEntry {
  id: string
  action: string
  key: string
  value: string | null
  confidence: number | null
  changedByName: string
  changedAt: string
}

interface DietLikelyhoodItem {
  key: string
  label: string
  score: number
  matchCount: number
  totalOrders: number
}

interface CategoryLikelyhoodItem {
  name: string
  score: number
  matchCount: number
  totalOrders: number
}

interface LikelyhoodData {
  totalOrders: number
  windowDays: number
  dietProfile: DietLikelyhoodItem[]
  categoryProfile: CategoryLikelyhoodItem[]
}

interface PraeferenzenData {
  explicit: ExplicitPref[]
  suggestions: PrefSuggestion[]
  likelyhood: LikelyhoodData
  implicit: ImplicitStats
  auditLog: PrefAuditEntry[]
}

// ─── PROJ-20 Helpers ──────────────────────────────────────────────────────────

const ALLERGEN_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'ALLERGEN_GLUTEN',      label: 'Gluten' },
  { key: 'ALLERGEN_CRUSTACEANS', label: 'Schalentiere' },
  { key: 'ALLERGEN_EGGS',        label: 'Eier' },
  { key: 'ALLERGEN_FISH',        label: 'Fisch' },
  { key: 'ALLERGEN_PEANUTS',     label: 'Erdnüsse' },
  { key: 'ALLERGEN_SOYBEANS',    label: 'Soja' },
  { key: 'ALLERGEN_MILK',        label: 'Milch/Laktose' },
  { key: 'ALLERGEN_TREE_NUTS',   label: 'Nüsse' },
  { key: 'ALLERGEN_CELERY',      label: 'Sellerie' },
  { key: 'ALLERGEN_MUSTARD',     label: 'Senf' },
  { key: 'ALLERGEN_SESAME',      label: 'Sesam' },
  { key: 'ALLERGEN_SULPHITES',   label: 'Sulfite' },
  { key: 'ALLERGEN_LUPIN',       label: 'Lupinen' },
  { key: 'ALLERGEN_MOLLUSCS',    label: 'Weichtiere' },
  { key: 'ALLERGEN_CUSTOM',      label: 'Sonstiges (Freitext)' },
]

const DIET_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'DIET_VEGETARIAN',  label: 'Vegetarisch' },
  { key: 'DIET_VEGAN',       label: 'Vegan' },
  { key: 'DIET_HALAL',       label: 'Halal' },
  { key: 'DIET_KOSHER',      label: 'Kosher' },
  { key: 'DIET_GLUTEN_FREE', label: 'Glutenfrei' },
  { key: 'DIET_LACTOSE_FREE', label: 'Laktosefrei' },
  { key: 'DIET_LOW_CARB',    label: 'Low Carb' },
  { key: 'DIET_KETO',        label: 'Keto' },
]

const ALL_PREF_OPTIONS = [...ALLERGEN_OPTIONS, ...DIET_OPTIONS]

function prefKeyLabel(key: string): string {
  return ALL_PREF_OPTIONS.find(o => o.key === key)?.label ?? key
}

function isAllergenKey(key: string) { return key.startsWith('ALLERGEN_') }

function timeSlotLabel(slot: string | null): string {
  const map: Record<string, string> = {
    BREAKFAST: 'Frühstück (vor 10h)',
    LUNCH:     'Mittag (10–14h)',
    AFTERNOON: 'Nachmittag (14–17h)',
    EVENING:   'Abend (nach 17h)',
  }
  return slot ? (map[slot] ?? slot) : '–'
}

const MIN_LIKELYHOOD_ORDERS = 5 // Mindestanzahl Bestellungen für Likelihood-Anzeige

function likelyhoodColor(score: number): { bar: string; text: string; badge: string } {
  if (score >= 0.7) return {
    bar:   'bg-green-500',
    text:  'text-green-700 dark:text-green-400',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }
  if (score >= 0.4) return {
    bar:   'bg-amber-500',
    text:  'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  }
  return {
    bar:   'bg-gray-400',
    text:  'text-muted-foreground',
    badge: 'bg-muted text-muted-foreground',
  }
}

function likelyhoodLabel(score: number): string {
  if (score >= 0.7) return 'Sehr wahrscheinlich'
  if (score >= 0.4) return 'Möglich'
  return 'Selten'
}

function auditActionLabel(action: string): string {
  const map: Record<string, string> = {
    ADDED:     'Hinzugefügt',
    REMOVED:   'Entfernt',
    CONFIRMED: 'Vorschlag bestätigt',
  }
  return map[action] ?? action
}

// ─── PROJ-20 Präferenzen Tab ──────────────────────────────────────────────────

function PraeferenzenTab({ userId }: { userId: string }) {
  const [data, setData] = useState<PraeferenzenData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [addKey, setAddKey] = useState('')
  const [addValue, setAddValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionKey, setActionKey] = useState<string | null>(null) // which suggestion is being acted on
  const [showAudit, setShowAudit] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/kunden/${userId}/praeferenzen`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAdd = async () => {
    if (!addKey) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/kunden/${userId}/praeferenzen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: addKey, value: addKey === 'ALLERGEN_CUSTOM' ? addValue : null }),
      })
      if (res.ok) {
        setAddKey('')
        setAddValue('')
        await fetchData()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/admin/kunden/${userId}/praeferenzen/${id}`, { method: 'DELETE' })
      await fetchData()
    } catch { /* silent */ }
  }

  const handleConfirm = async (s: PrefSuggestion) => {
    setActionKey(s.key)
    try {
      await fetch(`/api/admin/kunden/${userId}/praeferenzen/vorschlag/bestaetigen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: s.key, confidence: s.confidence }),
      })
      await fetchData()
    } finally {
      setActionKey(null)
    }
  }

  const handleIgnore = async (key: string) => {
    setActionKey(key)
    try {
      await fetch(`/api/admin/kunden/${userId}/praeferenzen/vorschlag/ignorieren`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      })
      await fetchData()
    } finally {
      setActionKey(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-6 py-10 text-center text-sm text-muted-foreground">
        Daten konnten nicht geladen werden.
      </div>
    )
  }

  const allergens = data.explicit.filter(p => isAllergenKey(p.key))
  const diets     = data.explicit.filter(p => !isAllergenKey(p.key))

  // Options not yet selected
  const usedKeys = new Set(data.explicit.map(p => p.key))
  const availableOptions = ALL_PREF_OPTIONS.filter(o => !usedKeys.has(o.key))

  return (
    <div className="flex flex-col gap-0 divide-y divide-border">

      {/* ── Explizite Präferenzen ──────────────────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Explizite Präferenzen
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Manuell hinterlegt</p>
          </div>
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode(v => !v)}
          >
            {editMode ? 'Fertig' : 'Bearbeiten'}
          </Button>
        </div>

        {/* Allergene */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            Allergene
          </p>
          <div className="flex flex-wrap gap-2">
            {allergens.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                {editMode ? 'Keine Allergene – füge unten eines hinzu.' : 'Keine Allergene hinterlegt'}
              </p>
            )}
            {allergens.map(p => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              >
                {p.value ?? prefKeyLabel(p.key)}
                {editMode && (
                  <button
                    onClick={() => handleRemove(p.id)}
                    className="ml-1 hover:text-red-900 dark:hover:text-red-200"
                    aria-label="Entfernen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Diätformen */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Leaf className="w-3 h-3 text-green-600" />
            Diätformen
          </p>
          <div className="flex flex-wrap gap-2">
            {diets.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                {editMode ? 'Keine Diätform – füge unten eine hinzu.' : 'Keine Diätformen hinterlegt'}
              </p>
            )}
            {diets.map(p => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                {p.source === 'ADMIN' && p.confidence != null && (
                  <Bot className="w-3 h-3 opacity-60" aria-label="Aus Bestellverhalten bestätigt" />
                )}
                {prefKeyLabel(p.key)}
                {editMode && (
                  <button
                    onClick={() => handleRemove(p.id)}
                    className="ml-1 hover:text-green-900 dark:hover:text-green-200"
                    aria-label="Entfernen"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Add Form (Edit Mode) */}
        {editMode && (
          <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted/40 rounded-lg border border-border/50">
            <Select value={addKey} onValueChange={setAddKey}>
              <SelectTrigger className="h-8 text-xs w-52">
                <SelectValue placeholder="Präferenz auswählen…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_sep_allergen" disabled className="text-xs font-semibold text-muted-foreground opacity-100">
                  — Allergene —
                </SelectItem>
                {ALLERGEN_OPTIONS.filter(o => !usedKeys.has(o.key)).map(o => (
                  <SelectItem key={o.key} value={o.key} className="text-xs">{o.label}</SelectItem>
                ))}
                <SelectItem value="_sep_diet" disabled className="text-xs font-semibold text-muted-foreground opacity-100">
                  — Diätformen —
                </SelectItem>
                {DIET_OPTIONS.filter(o => !usedKeys.has(o.key)).map(o => (
                  <SelectItem key={o.key} value={o.key} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {addKey === 'ALLERGEN_CUSTOM' && (
              <Input
                className="h-8 text-xs w-40"
                placeholder="Allergen-Name…"
                value={addValue}
                onChange={e => setAddValue(e.target.value)}
                maxLength={200}
              />
            )}

            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleAdd}
              disabled={!addKey || addKey.startsWith('_sep') || saving || (addKey === 'ALLERGEN_CUSTOM' && !addValue.trim())}
            >
              {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 mr-1" />}
              Hinzufügen
            </Button>
          </div>
        )}

        {/* Audit Trail */}
        {data.auditLog.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowAudit(v => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAudit ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Änderungsprotokoll ({data.auditLog.length})
            </button>
            {showAudit && (
              <div className="mt-2 space-y-1">
                {data.auditLog.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        entry.action === 'REMOVED' ? 'text-red-600' :
                        entry.action === 'CONFIRMED' ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {auditActionLabel(entry.action)}
                      </span>
                      <span className="text-foreground">{prefKeyLabel(entry.key)}</span>
                      {entry.value && <span className="text-muted-foreground">„{entry.value}"</span>}
                      {entry.confidence != null && (
                        <span className="text-muted-foreground">({Math.round(entry.confidence * 100)} % Konfidenz)</span>
                      )}
                    </div>
                    <div className="text-right text-muted-foreground">
                      <span>{entry.changedByName}</span>
                      <span className="ml-2">{formatDate(entry.changedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Vorgeschlagene Präferenzen ─────────────────────────────────────── */}
      {data.suggestions.length > 0 && (
        <div className="px-6 py-5">
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-amber-500" />
              Vorgeschlagene Präferenzen
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Basierend auf Bestellverhalten – zur Bestätigung vorgeschlagen
            </p>
          </div>

          <div className="space-y-2">
            {data.suggestions.map(s => {
              const pct = Math.round(s.confidence * 100)
              const isActing = actionKey === s.key
              return (
                <div
                  key={s.key}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {prefKeyLabel(s.key) !== s.key ? prefKeyLabel(s.key) : s.label}
                      </span>
                      <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                        {pct} %
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.matchingOrderCount} von {s.orderCount} Bestellungen (letzte {data.implicit.windowDays} Tage)
                    </p>
                    {/* Confidence bar */}
                    <div className="mt-1.5 h-1.5 w-full bg-amber-200 dark:bg-amber-800/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      size="sm"
                      className="h-7 text-xs px-2 bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleConfirm(s)}
                      disabled={isActing}
                    >
                      {isActing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                      Bestätigen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2"
                      onClick={() => handleIgnore(s.key)}
                      disabled={isActing}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Ignorieren
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Berechnetes Präferenzprofil (Likelihood-Scores) ──────────────── */}
      {data.likelyhood.totalOrders >= MIN_LIKELYHOOD_ORDERS && (
        data.likelyhood.dietProfile.length > 0 || data.likelyhood.categoryProfile.length > 0
      ) && (
        <div className="px-6 py-5">
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-primary" />
              Berechnetes Präferenzprofil
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Likelihood-Scores aus {data.likelyhood.totalOrders} Bestellungen (letzte {data.likelyhood.windowDays} Tage) &nbsp;·&nbsp; nicht editierbar
            </p>
          </div>

          <div className="space-y-5">
            {/* Diät-Profil */}
            {data.likelyhood.dietProfile.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-green-600" />
                  Diäteigenschaften
                </p>
                <div className="space-y-2">
                  {data.likelyhood.dietProfile.map(item => {
                    const pct = Math.round(item.score * 100)
                    const colors = likelyhoodColor(item.score)
                    const displayLabel = prefKeyLabel(item.key) !== item.key ? prefKeyLabel(item.key) : item.label
                    return (
                      <div key={item.key} className="flex items-center gap-3">
                        <span className="text-xs w-28 truncate text-foreground font-medium" title={displayLabel}>
                          {displayLabel}
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${colors.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold w-10 text-right tabular-nums ${colors.text}`}>
                          {pct} %
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full w-28 text-center ${colors.badge}`}>
                          {likelyhoodLabel(item.score)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Kategorie-Profil */}
            {data.likelyhood.categoryProfile.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Utensils className="w-3 h-3" />
                  Kategorien
                </p>
                <div className="space-y-2">
                  {data.likelyhood.categoryProfile.map(item => {
                    const pct = Math.round(item.score * 100)
                    const colors = likelyhoodColor(item.score)
                    return (
                      <div key={item.name} className="flex items-center gap-3">
                        <span className="text-xs w-28 truncate text-foreground font-medium" title={item.name}>
                          {item.name}
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${colors.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold w-10 text-right tabular-nums ${colors.text}`}>
                          {pct} %
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full w-28 text-center ${colors.badge}`}>
                          {likelyhoodLabel(item.score)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Legende */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />≥ 70 % Sehr wahrscheinlich</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />40–70 % Möglich</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />&lt; 40 % Selten</span>
          </div>
        </div>
      )}

      {/* ── Implizite Verhaltensstatistiken ───────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Verhaltensstatistiken
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automatisch ermittelt – nicht editierbar &nbsp;·&nbsp; letzte {data.implicit.windowDays} Tage
          </p>
        </div>

        {data.implicit.orderCount < 5 ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
            <BarChart2 className="w-4 h-4 flex-shrink-0" />
            Noch nicht genug Daten für automatische Auswertung (mind. 5 Bestellungen, aktuell: {data.implicit.orderCount})
          </div>
        ) : (
          <div className="space-y-5">
            {/* Top Kategorien */}
            {data.implicit.topCategories.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Utensils className="w-3 h-3" />
                  Top Kategorien
                </p>
                <div className="space-y-1.5">
                  {data.implicit.topCategories.map(cat => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <span className="text-xs w-32 truncate text-foreground" title={cat.name}>{cat.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full"
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">{cat.pct} %</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Produkte */}
            {data.implicit.topProducts.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Top Produkte
                </p>
                <div className="space-y-1">
                  {data.implicit.topProducts.map((prod, i) => (
                    <div key={prod.name} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-muted-foreground font-medium">{i + 1}.</span>
                      <span className="flex-1 truncate text-foreground" title={prod.name}>{prod.name}</span>
                      <span className="text-muted-foreground">{prod.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Kanal & Uhrzeit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Bevorzugter Kanal
                </p>
                <div className="flex items-center gap-1.5">
                  <ChannelIcon channel={data.implicit.preferredChannel} />
                  <span className="text-sm font-medium text-foreground">
                    {channelLabel(data.implicit.preferredChannel)}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Bevorzugte Zeit
                </p>
                <span className="text-sm font-medium text-foreground">
                  {timeSlotLabel(data.implicit.preferredTimeSlot)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PROJ-22b SegmenteTab ─────────────────────────────────────────────────────

function SegmenteTab({ userId }: { userId: string }) {
  const [segments, setSegments] = useState<{ id: string; name: string; description: string | null }[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/kunden/${userId}/segmente`)
      .then((r) => r.json())
      .then((d) => setSegments(d.segments ?? []))
      .catch(() => setSegments([]))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        Lade Segmente…
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <h3 className="font-semibold text-base">Mitglied in Segmenten</h3>
      {!segments || segments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Dieser Kunde ist aktuell in keinem Segment.</p>
      ) : (
        <div className="space-y-2">
          {segments.map((seg) => (
            <div
              key={seg.id}
              className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{seg.name}</p>
                {seg.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{seg.description}</p>
                )}
              </div>
              <Link
                href="/admin/marketing/segments"
                className="ml-3 shrink-0 text-xs text-primary hover:underline"
              >
                Zum Segment →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
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
