'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutTemplate,
  Plus,
  Search,
  MoreVertical,
  Copy,
  Archive,
  Trash2,
  Pencil,
  Star,
  StarOff,
  Mail,
  Megaphone,
  Bell,
  Monitor,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

type TemplateType = 'EMAIL' | 'IN_APP_BANNER' | 'PROMOTION_BANNER' | 'PUSH'
type TemplateStatus = 'ACTIVE' | 'ARCHIVED'

interface Template {
  id: string
  name: string
  type: TemplateType
  status: TemplateStatus
  isStarter: boolean
  isFavorite: boolean
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}

const TYPE_CONFIG: Record<TemplateType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  EMAIL: { label: 'E-Mail', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  IN_APP_BANNER: { label: 'In-App Banner', icon: Monitor, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
  PROMOTION_BANNER: { label: 'Promotion-Banner', icon: Megaphone, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  PUSH: { label: 'Push-Nachricht', icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
}

const FILTER_TYPES: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'Alle Typen' },
  { value: 'EMAIL', label: 'E-Mail' },
  { value: 'IN_APP_BANNER', label: 'In-App Banner' },
  { value: 'PROMOTION_BANNER', label: 'Promotion-Banner' },
  { value: 'PUSH', label: 'Push-Nachricht' },
]

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Zuletzt geändert' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'createdAt', label: 'Erstellt am' },
]

// Starter-Templates für den "Neu erstellen"-Dialog
const STARTER_TEMPLATES = [
  { id: 'starter-welcome', name: 'Willkommen an Bord', type: 'EMAIL' as TemplateType, description: 'Begrüßungs-Mail für neue Kunden' },
  { id: 'starter-menu', name: 'Wochen-Menü ist online', type: 'EMAIL' as TemplateType, description: 'Ankündigung neuer Wochenplan' },
  { id: 'starter-promo', name: 'Aktions-Woche', type: 'PROMOTION_BANNER' as TemplateType, description: 'Visueller Motto-Wochen-Banner' },
  { id: 'starter-offer', name: 'Neues Angebot entdecken', type: 'IN_APP_BANNER' as TemplateType, description: 'Banner auf der Menü-Seite' },
  { id: 'starter-push', name: 'Exklusiver Rabatt für dich', type: 'PUSH' as TemplateType, description: 'Push mit Coupon-Hinweis' },
  { id: 'starter-feedback', name: 'Feedback gewünscht', type: 'EMAIL' as TemplateType, description: 'Feedback-Anfrage nach Bestellung' },
]

function TemplateThumbnail({ template }: { template: Template }) {
  const cfg = TYPE_CONFIG[template.type]
  const Icon = cfg.icon

  if (template.thumbnailUrl) {
    return (
      <div className="w-full aspect-video rounded-t-xl overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={template.thumbnailUrl} alt={template.name} className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div className={`w-full aspect-video rounded-t-xl flex flex-col items-center justify-center gap-2 ${cfg.bg}`}>
      <Icon className={`w-10 h-10 ${cfg.color}`} />
      <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
    </div>
  )
}

function TemplateCardSkeleton() {
  return (
    <Card className="rounded-2xl overflow-hidden border-border/50">
      <Skeleton className="w-full aspect-video rounded-none" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  )
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'ARCHIVED' | 'ALL'>('ACTIVE')
  const [sort, setSort] = useState('updatedAt')

  // New template dialog
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [newStep, setNewStep] = useState<1 | 2>(1)
  const [selectedType, setSelectedType] = useState<TemplateType | null>(null)
  const [creating, setCreating] = useState(false)

  // Archive / Delete confirmation
  const [archiveTarget, setArchiveTarget] = useState<Template | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType !== 'ALL') params.set('type', filterType)
      if (filterStatus !== 'ALL') params.set('status', filterStatus)
      if (search) params.set('search', search)
      params.set('sort', sort)

      const res = await fetch(`/api/admin/marketing/templates?${params}`)
      const data = await res.json().catch(() => [])
      setTemplates(Array.isArray(data) ? data : [])
    } catch {
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [filterType, filterStatus, search, sort])

  useEffect(() => {
    const timer = setTimeout(fetchTemplates, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchTemplates, search])

  const handleDuplicate = async (template: Template) => {
    try {
      await fetch(`/api/admin/marketing/templates/${template.id}/duplicate`, { method: 'POST' })
      fetchTemplates()
    } catch { /* ignore */ }
  }

  const handleToggleFavorite = async (template: Template) => {
    try {
      await fetch(`/api/admin/marketing/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !template.isFavorite }),
      })
      fetchTemplates()
    } catch { /* ignore */ }
  }

  const handleArchive = async () => {
    if (!archiveTarget) return
    setActionLoading(true)
    try {
      await fetch(`/api/admin/marketing/templates/${archiveTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: archiveTarget.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED' }),
      })
      setArchiveTarget(null)
      fetchTemplates()
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      await fetch(`/api/admin/marketing/templates/${deleteTarget.id}`, { method: 'DELETE' })
      setDeleteTarget(null)
      fetchTemplates()
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateFromBlank = async () => {
    if (!selectedType) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/marketing/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Neues Template', type: selectedType, content: { globalStyle: {}, blocks: [] } }),
      })
      const data = await res.json()
      if (data.id) {
        setNewDialogOpen(false)
        router.push(`/admin/marketing/templates/${data.id}/editor`)
      }
    } finally {
      setCreating(false)
    }
  }

  const handleCreateFromStarter = async (starter: typeof STARTER_TEMPLATES[0]) => {
    setCreating(true)
    try {
      const res = await fetch('/api/admin/marketing/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: starter.name, type: starter.type, content: { globalStyle: {}, blocks: [] } }),
      })
      const data = await res.json()
      if (data.id) {
        setNewDialogOpen(false)
        router.push(`/admin/marketing/templates/${data.id}/editor`)
      }
    } finally {
      setCreating(false)
    }
  }

  const openNewDialog = () => {
    setNewStep(1)
    setSelectedType(null)
    setNewDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-fuchsia-950/20 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <LayoutTemplate className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Marketing Vorlagen</h1>
              <p className="text-muted-foreground mt-0.5">
                Erstelle und verwalte Templates für E-Mails, Banner, Promotions und Push-Nachrichten.
              </p>
            </div>
          </div>
          <Button
            onClick={openNewDialog}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Neu erstellen
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Vorlagen durchsuchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              {FILTER_TYPES.find((t) => t.value === filterType)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {FILTER_TYPES.map((t) => (
              <DropdownMenuItem key={t.value} onClick={() => setFilterType(t.value)}>
                {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {filterStatus === 'ACTIVE' ? 'Aktiv' : filterStatus === 'ARCHIVED' ? 'Archiviert' : 'Alle Status'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus('ACTIVE')}>Aktiv</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('ARCHIVED')}>Archiviert</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('ALL')}>Alle Status</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {SORT_OPTIONS.find((s) => s.value === sort)?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {SORT_OPTIONS.map((s) => (
              <DropdownMenuItem key={s.value} onClick={() => setSort(s.value)}>
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="text-sm text-muted-foreground ml-auto">
          {!loading && `${templates.length} Vorlage${templates.length !== 1 ? 'n' : ''}`}
        </span>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <TemplateCardSkeleton key={i} />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <LayoutTemplate className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Keine Vorlagen gefunden</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            {search || filterType !== 'ALL'
              ? 'Passe die Filter an oder erstelle eine neue Vorlage.'
              : 'Erstelle deine erste Marketing-Vorlage mit dem Block-Editor.'}
          </p>
          <Button onClick={openNewDialog} className="mt-4 gap-2 bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="w-4 h-4" />
            Erste Vorlage erstellen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((template) => {
            const cfg = TYPE_CONFIG[template.type]
            return (
              <Card
                key={template.id}
                className="rounded-2xl overflow-hidden border-border/50 hover:border-violet-300 hover:shadow-md transition-all group cursor-pointer"
                onClick={() => router.push(`/admin/marketing/templates/${template.id}/editor`)}
              >
                <TemplateThumbnail template={template} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{template.name}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={`text-xs gap-1 ${cfg.color} ${cfg.bg} border-0`}
                        >
                          <cfg.icon className="w-3 h-3" />
                          {cfg.label}
                        </Badge>
                        {template.status === 'ARCHIVED' && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Archiviert
                          </Badge>
                        )}
                        {template.isStarter && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">
                            Starter
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(template.updatedAt), { addSuffix: true, locale: de })}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/marketing/templates/${template.id}/editor`)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplizieren
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleFavorite(template)}>
                          {template.isFavorite ? (
                            <><StarOff className="w-4 h-4 mr-2" />Favorit entfernen</>
                          ) : (
                            <><Star className="w-4 h-4 mr-2" />Als Favorit markieren</>
                          )}
                        </DropdownMenuItem>
                        {!template.isStarter && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setArchiveTarget(template)}>
                              <Archive className="w-4 h-4 mr-2" />
                              {template.status === 'ARCHIVED' ? 'Wiederherstellen' : 'Archivieren'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(template)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* New Template Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {newStep === 1 ? 'Vorlage erstellen – Typ wählen' : 'Startpunkt wählen'}
            </DialogTitle>
            <DialogDescription>
              {newStep === 1
                ? 'Wähle den Kanal für deine neue Marketing-Vorlage.'
                : 'Starte mit einer leeren Vorlage oder nutze ein fertiges Starter-Template.'}
            </DialogDescription>
          </DialogHeader>

          {newStep === 1 && (
            <div className="grid grid-cols-2 gap-3 py-2">
              {(Object.entries(TYPE_CONFIG) as [TemplateType, typeof TYPE_CONFIG[TemplateType]][]).map(([type, cfg]) => {
                const Icon = cfg.icon
                return (
                  <button
                    key={type}
                    onClick={() => { setSelectedType(type); setNewStep(2) }}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all hover:border-violet-400 ${
                      selectedType === type ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' : 'border-border'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${cfg.bg}`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{cfg.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {type === 'EMAIL' && 'Kampagnen-Mails & Automation'}
                        {type === 'IN_APP_BANNER' && 'Banners & Popups in der App'}
                        {type === 'PROMOTION_BANNER' && 'Motto-Wochen & Aktionen'}
                        {type === 'PUSH' && 'Mobile Push-Benachrichtigungen'}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {newStep === 2 && selectedType && (
            <div className="space-y-4 py-2">
              {/* Blank option */}
              <button
                onClick={handleCreateFromBlank}
                disabled={creating}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-border hover:border-violet-400 transition-all text-left"
              >
                <div className="p-3 rounded-xl bg-muted">
                  <Plus className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Leere Vorlage</p>
                  <p className="text-sm text-muted-foreground">Starte mit einer leeren Canvas und baue frei</p>
                </div>
              </button>

              {/* Starter templates filtered by type */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Oder aus Starter-Template:</p>
                <div className="grid grid-cols-1 gap-2">
                  {STARTER_TEMPLATES.filter((s) => s.type === selectedType).map((starter) => {
                    const cfg = TYPE_CONFIG[starter.type]
                    const Icon = cfg.icon
                    return (
                      <button
                        key={starter.id}
                        onClick={() => handleCreateFromStarter(starter)}
                        disabled={creating}
                        className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/10 transition-all text-left"
                      >
                        <div className={`p-2 rounded-lg ${cfg.bg}`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{starter.name}</p>
                          <p className="text-xs text-muted-foreground">{starter.description}</p>
                        </div>
                      </button>
                    )
                  })}
                  {STARTER_TEMPLATES.filter((s) => s.type === selectedType).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Noch keine Starter-Templates für diesen Typ verfügbar.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {newStep === 2 && (
              <Button variant="outline" onClick={() => setNewStep(1)}>Zurück</Button>
            )}
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Abbrechen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation */}
      <Dialog open={!!archiveTarget} onOpenChange={() => setArchiveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Vorlage {archiveTarget?.status === 'ARCHIVED' ? 'wiederherstellen' : 'archivieren'}?
            </DialogTitle>
            <DialogDescription>
              {archiveTarget?.status === 'ARCHIVED'
                ? `"${archiveTarget?.name}" wird wieder aktiviert.`
                : `"${archiveTarget?.name}" wird archiviert und aus der aktiven Liste entfernt.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveTarget(null)}>Abbrechen</Button>
            <Button onClick={handleArchive} disabled={actionLoading}>
              {actionLoading ? 'Wird gespeichert...' : archiveTarget?.status === 'ARCHIVED' ? 'Wiederherstellen' : 'Archivieren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vorlage löschen?</DialogTitle>
            <DialogDescription>
              &quot;{deleteTarget?.name}&quot; wird unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Abbrechen</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? 'Wird gelöscht...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
