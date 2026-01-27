'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tags, Trash2, Plus, Edit2, ArrowUp, ArrowDown } from 'lucide-react'

type MetadataType = 'DIET_CATEGORY' | 'ALLERGEN' | 'DISH_CATEGORY'

interface Metadata {
  id: string
  type: MetadataType
  name: string
  description: string | null
  icon: string | null
  color: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export default function MetadataPage() {
  const [metadata, setMetadata] = useState<Record<MetadataType, Metadata[]>>({
    DIET_CATEGORY: [],
    ALLERGEN: [],
    DISH_CATEGORY: [],
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<MetadataType>('DIET_CATEGORY')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Metadata | null>(null)

  useEffect(() => {
    fetchMetadata()
  }, [])

  async function fetchMetadata() {
    try {
      setLoading(true)
      const [dietCategories, allergens, dishCategories] = await Promise.all([
        fetch('/api/admin/metadata?type=DIET_CATEGORY&includeInactive=true').then((r) => r.json()),
        fetch('/api/admin/metadata?type=ALLERGEN&includeInactive=true').then((r) => r.json()),
        fetch('/api/admin/metadata?type=DISH_CATEGORY&includeInactive=true').then((r) => r.json()),
      ])

      setMetadata({
        DIET_CATEGORY: dietCategories,
        ALLERGEN: allergens,
        DISH_CATEGORY: dishCategories,
      })
    } catch (error) {
      console.error('Fehler beim Laden der Metadaten:', error)
      alert('Fehler beim Laden der Metadaten')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return

    try {
      const response = await fetch(`/api/admin/metadata/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      fetchMetadata()
    } catch (error) {
      alert('Fehler beim Löschen')
    }
  }

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/admin/metadata/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (!response.ok) throw new Error('Fehler beim Aktualisieren')
      fetchMetadata()
    } catch (error) {
      alert('Fehler beim Aktualisieren')
    }
  }

  async function handleMoveSortOrder(id: string, direction: 'up' | 'down') {
    const items = metadata[activeTab]
    const currentIndex = items.findIndex((item) => item.id === id)
    if (currentIndex === -1) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const currentItem = items[currentIndex]
    const targetItem = items[targetIndex]

    try {
      await Promise.all([
        fetch(`/api/admin/metadata/${currentItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: targetItem.sortOrder }),
        }),
        fetch(`/api/admin/metadata/${targetItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sortOrder: currentItem.sortOrder }),
        }),
      ])
      fetchMetadata()
    } catch (error) {
      alert('Fehler beim Verschieben')
    }
  }

  const getTypeLabel = (type: MetadataType) => {
    switch (type) {
      case 'DIET_CATEGORY':
        return 'Diät-Kategorien'
      case 'ALLERGEN':
        return 'Allergene'
      case 'DISH_CATEGORY':
        return 'Speise-Kategorien'
    }
  }

  const currentItems = metadata[activeTab]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Metadaten-Verwaltung</h1>
            <p className="text-muted-foreground mt-1">
              Verwalten Sie Diät-Kategorien, Allergene und Speise-Kategorien
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingItem(null)
              setShowForm(true)
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Neu hinzufügen
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MetadataType)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="DIET_CATEGORY">Diät-Kategorien</TabsTrigger>
            <TabsTrigger value="ALLERGEN">Allergene</TabsTrigger>
            <TabsTrigger value="DISH_CATEGORY">Speise-Kategorien</TabsTrigger>
          </TabsList>

          {(['DIET_CATEGORY', 'ALLERGEN', 'DISH_CATEGORY'] as MetadataType[]).map((type) => (
            <TabsContent key={type} value={type} className="mt-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Lädt...</div>
              ) : currentItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Noch keine {getTypeLabel(type)} vorhanden. Erstellen Sie den ersten Eintrag!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentItems.map((item, index) => (
                    <Card
                      key={item.id}
                      className={`transition-all ${!item.isActive ? 'opacity-60' : ''}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg flex items-center gap-2">
                              {item.icon && <span>{item.icon}</span>}
                              {item.name}
                            </CardTitle>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMoveSortOrder(item.id, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMoveSortOrder(item.id, 'down')}
                              disabled={index === currentItems.length - 1}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-2"
                            onClick={() => {
                              setEditingItem(item)
                              setShowForm(true)
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                            Bearbeiten
                          </Button>
                          <Button
                            variant={item.isActive ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => handleToggleActive(item.id, item.isActive)}
                          >
                            {item.isActive ? 'Aktiv' : 'Inaktiv'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {showForm && (
          <MetadataForm
            type={activeTab}
            metadata={editingItem}
            onClose={() => {
              setShowForm(false)
              setEditingItem(null)
            }}
            onSave={() => {
              fetchMetadata()
              setShowForm(false)
              setEditingItem(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

function MetadataForm({
  type,
  metadata,
  onClose,
  onSave,
}: {
  type: MetadataType
  metadata: Metadata | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: metadata?.name || '',
    description: metadata?.description || '',
    icon: metadata?.icon || '',
    color: metadata?.color || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload = {
        type,
        ...formData,
        description: formData.description || null,
        icon: formData.icon || null,
        color: formData.color || null,
      }

      const url = metadata ? `/api/admin/metadata/${metadata.id}` : '/api/admin/metadata'
      const method = metadata ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Fehler beim Speichern')
      }
      onSave()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Fehler beim Speichern')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full border border-border">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {metadata ? 'Metadaten bearbeiten' : 'Neue Metadaten'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="z.B. vegan, Gluten, Hauptgericht"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Optionale Beschreibung..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon/Emoji</Label>
                <Input
                  id="icon"
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🌱 oder icon-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Farbe (HEX)</Label>
                <Input
                  id="color"
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#22c55e"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSaving} className="flex-1">
                {isSaving ? 'Speichert...' : 'Speichern'}
              </Button>
              <Button type="button" onClick={onClose} variant="outline">
                Abbrechen
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
