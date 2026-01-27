'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Utensils, Flame, Edit, Trash2, Grid3x3, Table } from 'lucide-react'

interface Dish {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  category: string | null
  dietTags: string[]
  allergens: string[]
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  isActive: boolean
  createdAt: string
}

export default function AdminDishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  useEffect(() => {
    fetchDishes()
  }, [])

  async function fetchDishes() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dishes?includeInactive=true')
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      setDishes(data)
    } catch (error) {
      console.error('Fehler:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Möchten Sie dieses Gericht wirklich löschen?')) return

    try {
      const response = await fetch(`/api/admin/dishes/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      fetchDishes()
    } catch (error) {
      alert('Fehler beim Löschen')
    }
  }

  function renderDishCard(dish: Dish, index: number) {
    const dietTags = (dish.dietTags && Array.isArray(dish.dietTags)) ? dish.dietTags : []
    const hasVegan = dietTags.some(t => t && t.toLowerCase().includes('vegan'))
    const hasVegetarian = dietTags.some(t => t && t.toLowerCase().includes('vegetarisch'))
    
    return (
      <div
        key={dish.id}
        className={`group relative bg-card rounded-2xl overflow-hidden border border-border/50 transition-all duration-300 ${
          dish.isActive
            ? 'hover:shadow-2xl hover:scale-[1.02]'
            : 'opacity-60'
        }`}
        style={{
          animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
        }}
      >
        {/* Bild-Bereich mit Badges */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {dish.imageUrl ? (
            <img
              src={dish.imageUrl}
              alt={dish.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Utensils className="w-16 h-16 text-primary/30" />
            </div>
          )}
          
          {/* Overlay Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {dish.category && (
              <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-md shadow-lg">
                {dish.category.toUpperCase()}
              </span>
            )}
            {dietTags.some(t => t && (t.toLowerCase().includes('fit') || t.toLowerCase().includes('vital'))) && (
              <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-md shadow-lg">
                FIT & VITAL
              </span>
            )}
          </div>

          {/* Inaktiv Badge (rechts oben) */}
          {!dish.isActive && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 bg-destructive/90 backdrop-blur-sm text-white text-xs font-medium rounded-md shadow-sm">
                Inaktiv
              </span>
            </div>
          )}
        </div>

        {/* Content-Bereich */}
        <div className="p-4 space-y-3">
          {/* Gerichtsname */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-2 leading-tight">
              {dish.name}
            </h3>
            {dish.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                {dish.description}
              </p>
            )}
          </div>

          {/* Kalorien, Diät-Kategorien und Allergene in einer Zeile */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {dish.calories && (
              <div className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="font-medium text-foreground">{dish.calories} kcal</span>
              </div>
            )}
            
            {/* Diät-Kategorien */}
            {dietTags.length > 0 && (
              <>
                {dish.calories && <span className="text-muted-foreground">•</span>}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {hasVegan && (
                    <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                      Vegan
                    </span>
                  )}
                  {hasVegetarian && !hasVegan && (
                    <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                      Vegetarisch
                    </span>
                  )}
                  {dietTags
                    .filter(t => t && !t.toLowerCase().includes('vegan') && !t.toLowerCase().includes('vegetarisch'))
                    .slice(0, 2)
                    .map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </>
            )}

            {/* Allergene */}
            {dish.allergens && Array.isArray(dish.allergens) && dish.allergens.length > 0 && (
              <>
                {(dish.calories || dietTags.length > 0) && <span className="text-muted-foreground">•</span>}
                <div className="flex items-center gap-1 flex-wrap">
                  {dish.allergens.slice(0, 3).map((allergen, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full font-medium"
                    >
                      {allergen}
                    </span>
                  ))}
                  {dish.allergens.length > 3 && (
                    <span className="text-muted-foreground">
                      +{dish.allergens.length - 3}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Admin-Aktionen */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50 mt-2">
            <Button
              onClick={() => {
                setEditingDish(dish)
                setShowForm(true)
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-2" />
              Bearbeiten
            </Button>
            <Button
              onClick={() => handleDelete(dish.id)}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Löschen
            </Button>
          </div>
        </div>
      </div>
    )
  }

  function renderDishRow(dish: Dish, index: number) {
    const dietTags = (dish.dietTags && Array.isArray(dish.dietTags)) ? dish.dietTags : []
    const hasVegan = dietTags.some(t => t && t.toLowerCase().includes('vegan'))
    const hasVegetarian = dietTags.some(t => t && t.toLowerCase().includes('vegetarisch'))
    
    return (
      <tr
        key={dish.id}
        className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${
          !dish.isActive ? 'opacity-60' : ''
        }`}
      >
        {/* Thumbnail - volle Höhe der Zeile */}
        <td className="p-0 w-32">
          <div className="relative h-full min-h-[120px] w-32 overflow-hidden bg-muted">
            {dish.imageUrl ? (
              <img
                src={dish.imageUrl}
                alt={dish.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Utensils className="w-8 h-8 text-primary/30" />
              </div>
            )}
            {/* Overlay Badges auf Thumbnail */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {dish.category && (
                <span className="px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded shadow-lg">
                  {dish.category.toUpperCase()}
                </span>
              )}
            </div>
            {!dish.isActive && (
              <div className="absolute top-2 right-2">
                <span className="px-1.5 py-0.5 bg-destructive/90 text-white text-[10px] font-medium rounded shadow-sm">
                  Inaktiv
                </span>
              </div>
            )}
          </div>
        </td>
        
        {/* Name */}
        <td className="p-4">
          <div>
            <h3 className="font-bold text-foreground mb-1">{dish.name}</h3>
            {dish.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {dish.description}
              </p>
            )}
          </div>
        </td>
        
        {/* Kategorie */}
        <td className="p-4">
          {dish.category ? (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs rounded font-medium">
              {dish.category}
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </td>
        
        {/* Tags */}
        <td className="p-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {hasVegan && (
              <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                Vegan
              </span>
            )}
            {hasVegetarian && !hasVegan && (
              <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                Vegetarisch
              </span>
            )}
            {dietTags
              .filter(t => t && !t.toLowerCase().includes('vegan') && !t.toLowerCase().includes('vegetarisch'))
              .slice(0, 2)
              .map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            {dish.allergens && dish.allergens.length > 0 && (
              <>
                {dish.allergens.slice(0, 2).map((allergen, idx) => (
                  <span
                    key={`allergen-${idx}`}
                    className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium"
                  >
                    {allergen}
                  </span>
                ))}
              </>
            )}
          </div>
        </td>
        
        {/* Kalorien */}
        <td className="p-4">
          {dish.calories ? (
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-foreground">{dish.calories} kcal</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </td>
        
        {/* Status */}
        <td className="p-4">
          {dish.isActive ? (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs rounded font-medium">
              Aktiv
            </span>
          ) : (
            <span className="px-2 py-1 bg-destructive/10 text-destructive text-xs rounded font-medium">
              Inaktiv
            </span>
          )}
        </td>
        
        {/* Aktionen */}
        <td className="p-4">
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => {
                setEditingDish(dish)
                setShowForm(true)
              }}
              variant="outline"
              size="sm"
            >
              <Edit className="w-4 h-4 mr-1" />
              Bearbeiten
            </Button>
            <Button
              onClick={() => handleDelete(dish.id)}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Löschen
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Gerichte-Verwaltung</h1>
          <div className="flex gap-4 items-center">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8"
              >
                <Table className="w-4 h-4" />
              </Button>
            </div>
            <Link
              href="/admin/menu-planner"
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              Speiseplan-Editor
            </Link>
            <Button
              onClick={() => {
                setEditingDish(null)
                setShowForm(true)
              }}
            >
              + Neues Gericht
            </Button>
          </div>
        </div>

        {showForm && (
          <DishForm
            dish={editingDish}
            onClose={() => {
              setShowForm(false)
              setEditingDish(null)
            }}
            onSave={() => {
              fetchDishes()
              setShowForm(false)
              setEditingDish(null)
            }}
          />
        )}

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Lädt...</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dishes.map((dish, index) => renderDishCard(dish, index))}
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm text-foreground w-32">Bild</th>
                    <th className="text-left p-4 font-semibold text-sm text-foreground">Name</th>
                    <th className="text-left p-4 font-semibold text-sm text-foreground">Kategorie</th>
                    <th className="text-left p-4 font-semibold text-sm text-foreground">Tags</th>
                    <th className="text-left p-4 font-semibold text-sm text-foreground">Kalorien</th>
                    <th className="text-left p-4 font-semibold text-sm text-foreground">Status</th>
                    <th className="text-right p-4 font-semibold text-sm text-foreground">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {dishes.map((dish, index) => renderDishRow(dish, index))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {dishes.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            Noch keine Gerichte vorhanden. Erstellen Sie das erste Gericht!
          </div>
        )}
      </div>
    </div>
  )
}

function DishForm({
  dish,
  onClose,
  onSave,
}: {
  dish: Dish | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: dish?.name || '',
    description: dish?.description || '',
    imageUrl: dish?.imageUrl || '',
    category: dish?.category || '',
    dietTags: dish?.dietTags || [] as string[],
    allergens: dish?.allergens || [] as string[],
    calories: dish?.calories?.toString() || '',
    protein: dish?.protein?.toString() || '',
    carbs: dish?.carbs?.toString() || '',
    fat: dish?.fat?.toString() || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [dietOptions, setDietOptions] = useState<string[]>([])
  const [allergenOptions, setAllergenOptions] = useState<string[]>([])
  const [dishCategoryOptions, setDishCategoryOptions] = useState<string[]>([])
  const [loadingMetadata, setLoadingMetadata] = useState(true)

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [dietCategories, allergens, dishCategories] = await Promise.all([
          fetch('/api/admin/metadata?type=DIET_CATEGORY').then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`)
            return r.json()
          }),
          fetch('/api/admin/metadata?type=ALLERGEN').then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`)
            return r.json()
          }),
          fetch('/api/admin/metadata?type=DISH_CATEGORY').then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`)
            return r.json()
          }),
        ])

        setDietOptions(dietCategories.map((m: any) => m.name))
        setAllergenOptions(allergens.map((m: any) => m.name))
        setDishCategoryOptions(dishCategories.map((m: any) => m.name))
      } catch (error) {
        console.error('Fehler beim Laden der Metadaten:', error)
        // Fallback zu leeren Arrays
        setDietOptions([])
        setAllergenOptions([])
        setDishCategoryOptions([])
      } finally {
        setLoadingMetadata(false)
      }
    }
    loadMetadata()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload = {
        ...formData,
        calories: formData.calories ? parseInt(formData.calories) : null,
        protein: formData.protein ? parseFloat(formData.protein) : null,
        carbs: formData.carbs ? parseFloat(formData.carbs) : null,
        fat: formData.fat ? parseFloat(formData.fat) : null,
      }

      const url = dish ? `/api/admin/dishes/${dish.id}` : '/api/admin/dishes'
      const method = dish ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Fehler beim Speichern')
      onSave()
    } catch (error) {
      alert('Fehler beim Speichern')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleTag = (tag: string, type: 'dietTags' | 'allergens') => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].includes(tag)
        ? prev[type].filter((t) => t !== tag)
        : [...prev[type], tag],
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {dish ? 'Gericht bearbeiten' : 'Neues Gericht'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Name des Gerichts"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Beschreibung
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Beschreibung des Gerichts..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">
                Bild-URL
              </Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Kategorie
              </Label>
              {loadingMetadata ? (
                <Input
                  id="category"
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Lädt Kategorien..."
                  disabled
                />
              ) : (
                <div className="space-y-2">
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">-- Keine Kategorie --</option>
                    {dishCategoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="oder eigene Kategorie eingeben"
                    className="mt-2"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Diät-Kategorien</Label>
              {loadingMetadata ? (
                <div className="text-sm text-muted-foreground">Lädt Diät-Kategorien...</div>
              ) : dietOptions.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Keine Diät-Kategorien verfügbar. Erstellen Sie welche unter{' '}
                  <Link href="/admin/metadata" className="text-primary underline">
                    Metadaten-Verwaltung
                  </Link>
                  .
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {dietOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleTag(option, 'dietTags')}
                      className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                        formData.dietTags.includes(option)
                          ? 'bg-green-600 dark:bg-green-700 text-white scale-105 shadow-md'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Allergene</Label>
              {loadingMetadata ? (
                <div className="text-sm text-muted-foreground">Lädt Allergene...</div>
              ) : allergenOptions.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Keine Allergene verfügbar. Erstellen Sie welche unter{' '}
                  <Link href="/admin/metadata" className="text-primary underline">
                    Metadaten-Verwaltung
                  </Link>
                  .
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allergenOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleTag(option, 'allergens')}
                      className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                        formData.allergens.includes(option)
                          ? 'bg-destructive text-destructive-foreground scale-105 shadow-md'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="calories">Kalorien</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Kohlenhydrate (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                  placeholder="0.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">Fett (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  value={formData.fat}
                  onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                  placeholder="0.0"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? 'Speichert...' : 'Speichern'}
              </Button>
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
