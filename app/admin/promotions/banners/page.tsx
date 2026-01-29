'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Megaphone, Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@chakra-ui/react'

interface PromotionBanner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string | null
  isActive: boolean
  createdAt: string
}

export default function PromotionsBannersPage() {
  const [banners, setBanners] = useState<PromotionBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<PromotionBanner | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formSubtitle, setFormSubtitle] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    fetchBanners()
  }, [])

  async function fetchBanners() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/promotion-banners?includeInactive=true')
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      setBanners(data)
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Motto-Banner',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditingBanner(null)
    setFormTitle('')
    setFormSubtitle('')
    setFormImageUrl('')
    setFormIsActive(true)
    setSheetOpen(true)
  }

  function openEdit(banner: PromotionBanner) {
    setEditingBanner(banner)
    setFormTitle(banner.title)
    setFormSubtitle(banner.subtitle || '')
    setFormImageUrl(banner.imageUrl || '')
    setFormIsActive(banner.isActive)
    setSheetOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) {
      toast({
        title: 'Titel fehlt',
        description: 'Bitte einen Titel eingeben.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    setSaving(true)
    try {
      if (editingBanner) {
        const response = await fetch(`/api/admin/promotion-banners/${editingBanner.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            subtitle: formSubtitle.trim() || null,
            imageUrl: formImageUrl.trim() || null,
            isActive: formIsActive,
          }),
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || 'Fehler beim Speichern')
        }
        toast({
          title: 'Gespeichert',
          description: 'Motto-Banner wurde aktualisiert.',
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
      } else {
        const response = await fetch('/api/admin/promotion-banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle.trim(),
            subtitle: formSubtitle.trim() || null,
            imageUrl: formImageUrl.trim() || null,
            isActive: formIsActive,
          }),
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || 'Fehler beim Erstellen')
        }
        toast({
          title: 'Erstellt',
          description: 'Motto-Banner wurde angelegt.',
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
      }
      setSheetOpen(false)
      fetchBanners()
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Speichern',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Möchten Sie dieses Motto-Banner wirklich löschen? Es wird von allen zugewiesenen Wochen entfernt.')) return
    try {
      const response = await fetch(`/api/admin/promotion-banners/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      toast({
        title: 'Gelöscht',
        description: 'Motto-Banner wurde entfernt.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
      fetchBanners()
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Löschen',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <p className="text-muted-foreground">Lade Motto-Banner…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Motto-Banner</h1>
          <p className="text-muted-foreground mt-1">
            Wiederverwendbare Banner für Motto-Wochen (z.&nbsp;B. Bayerische Woche, Italian Week). Zuweisung pro Woche im Speiseplan.
          </p>
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Banner anlegen
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <SheetHeader>
                <SheetTitle>{editingBanner ? 'Motto-Banner bearbeiten' : 'Neues Motto-Banner'}</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-6 flex-1 overflow-y-auto">
                <div className="grid gap-2">
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="z. B. Bayerische Woche"
                    maxLength={200}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subtitle">Untertitel (optional)</Label>
                  <Input
                    id="subtitle"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    placeholder="Kurzer Teaser-Text"
                    maxLength={500}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">Bild-URL (optional)</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
                {editingBanner && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded border-input"
                    />
                    <Label htmlFor="isActive">Aktiv (wird in Auswahl und auf Kunden-Seite angezeigt)</Label>
                  </div>
                )}
              </div>
              <SheetFooter>
                <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Speichern…' : editingBanner ? 'Speichern' : 'Anlegen'}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Noch keine Motto-Banner angelegt.</p>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" />
              Erstes Banner anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((banner) => (
            <Card key={banner.id} className={!banner.isActive ? 'opacity-70' : ''}>
              <div className="relative aspect-[3/1] overflow-hidden rounded-t-lg bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20">
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                )}
                {!banner.isActive && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-destructive/90 text-white text-xs font-medium rounded">
                    Inaktiv
                  </span>
                )}
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-2">{banner.title}</CardTitle>
                {banner.subtitle && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{banner.subtitle}</p>
                )}
              </CardHeader>
              <CardContent className="pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => openEdit(banner)}>
                  <Edit className="w-3.5 h-3.5" />
                  Bearbeiten
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(banner.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Löschen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
