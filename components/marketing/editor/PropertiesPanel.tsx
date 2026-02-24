'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Link2,
  Eye, Monitor, Smartphone, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type {
  Block,
  GlobalStyle,
  HeadlineBlockProps,
  TextBlockProps,
  ImageBlockProps,
  ButtonBlockProps,
  SpacerBlockProps,
  DividerBlockProps,
  ColumnsBlockProps,
  CouponBlockProps,
  VideoBlockProps,
  SocialBlockProps,
  ListBlockProps,
  IconBlockProps,
  HtmlBlockProps,
  CountdownBlockProps,
  GifBlockProps,
  TagesMenueBlockProps,
  EmailCaptureBlockProps,
  PhoneCaptureBlockProps,
  BlockPadding,
} from './editor-types'
import { PLACEHOLDER_VARIABLES, AVAILABLE_ICONS } from './editor-types'

// ─── Props ─────────────────────────────────────────────────────────────────────

interface PropertiesPanelProps {
  selectedBlock: Block | null
  globalStyle: GlobalStyle
  onBlockChange: (id: string, updates: Partial<Block>) => void
  onGlobalStyleChange: (style: Partial<GlobalStyle>) => void
  showGlobalStyle: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 h-8">
      <div className="relative w-7 h-7 shrink-0 rounded-md overflow-hidden border border-border cursor-pointer">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="w-full h-full" style={{ backgroundColor: value || '#000000' }} />
      </div>
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-xs font-mono flex-1"
        placeholder="#000000"
      />
    </div>
  )
}

function PaddingEditor({
  padding,
  onChange,
}: {
  padding: BlockPadding
  onChange: (p: BlockPadding) => void
}) {
  const [linked, setLinked] = React.useState(false)
  const p = padding || { top: 8, right: 0, bottom: 8, left: 0 }

  const update = (key: keyof BlockPadding, val: number) => {
    if (linked) {
      onChange({ top: val, right: val, bottom: val, left: val })
    } else {
      onChange({ ...p, [key]: val })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">Innenabstand (px)</Label>
        <button
          onClick={() => setLinked(!linked)}
          className={cn(
            'text-[10px] px-1.5 py-0.5 rounded border transition-colors',
            linked ? 'bg-violet-100 border-violet-300 text-violet-700' : 'border-border text-muted-foreground'
          )}
        >
          {linked ? 'verknüpft' : 'getrennt'}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {(['top', 'right', 'bottom', 'left'] as const).map((key) => (
          <div key={key} className="text-center">
            <input
              type="number"
              min={0}
              max={200}
              value={p[key]}
              onChange={(e) => update(key, Number(e.target.value))}
              className="w-full h-7 text-center text-xs border border-border rounded bg-background focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
            <p className="text-[9px] text-muted-foreground mt-0.5 capitalize">{key === 'top' ? 'O' : key === 'right' ? 'R' : key === 'bottom' ? 'U' : 'L'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TipTap Editor ─────────────────────────────────────────────────────────────

function TipTapEditor({
  content,
  placeholder,
  onChange,
}: {
  content: string
  placeholder?: string
  onChange: (json: string) => void
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || 'Hier tippen...' }),
    ],
    content: content ? (() => { try { return JSON.parse(content) } catch { return content } })() : '',
    onUpdate: ({ editor }) => onChange(JSON.stringify(editor.getJSON())),
    editorProps: {
      attributes: { class: 'min-h-[80px] p-2.5 text-sm focus:outline-none prose prose-sm max-w-none' },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = JSON.stringify(editor.getJSON())
    if (current !== content) {
      try { editor.commands.setContent(JSON.parse(content)) }
      catch { editor.commands.setContent(content || '') }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  const insertPlaceholder = (value: string) => editor?.commands.insertContent(value)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-muted/40 flex-wrap">
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          data-active={editor?.isActive('bold')}>
          <Bold className="w-3 h-3" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
          onClick={() => editor?.chain().focus().toggleItalic().run()}>
          <Italic className="w-3 h-3" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
          onClick={() => editor?.chain().focus().toggleUnderline?.().run()}>
          <UnderlineIcon className="w-3 h-3" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
          onClick={() => {
            const url = window.prompt('URL eingeben')
            if (url) editor?.chain().focus().setLink({ href: url }).run()
          }}>
          <Link2 className="w-3 h-3" />
        </Button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] px-1.5 font-normal">
              {'{{…}}'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]">
            {PLACEHOLDER_VARIABLES.map((v) => (
              <DropdownMenuItem key={v.value} onSelect={() => insertPlaceholder(v.value)} className="text-xs">
                {v.label} <span className="ml-auto text-muted-foreground font-mono text-[10px]">{v.value}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <EditorContent editor={editor} className="text-sm" />
    </div>
  )
}

// ─── Block-Specific Content Editors ──────────────────────────────────────────

function HeadlineEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<HeadlineBlockProps>) => void }) {
  const props = block.props as HeadlineBlockProps
  return (
    <div className="space-y-3">
      <TipTapEditor content={props.content} placeholder="Überschrift..." onChange={(v) => onPropsChange({ content: v })} />
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Ebene">
          <Select value={props.level || 'h2'} onValueChange={(v) => onPropsChange({ level: v as HeadlineBlockProps['level'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['h1', 'h2', 'h3', 'h4'].map((l) => <SelectItem key={l} value={l} className="text-xs">{l.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Ausrichtung">
          <Select value={props.align || 'left'} onValueChange={(v) => onPropsChange({ align: v as HeadlineBlockProps['align'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left" className="text-xs">Links</SelectItem>
              <SelectItem value="center" className="text-xs">Mitte</SelectItem>
              <SelectItem value="right" className="text-xs">Rechts</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Gewicht">
          <Select value={props.fontWeight || 'bold'} onValueChange={(v) => onPropsChange({ fontWeight: v as HeadlineBlockProps['fontWeight'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal" className="text-xs">Normal</SelectItem>
              <SelectItem value="medium" className="text-xs">Medium</SelectItem>
              <SelectItem value="semibold" className="text-xs">Semibold</SelectItem>
              <SelectItem value="bold" className="text-xs">Bold</SelectItem>
              <SelectItem value="extrabold" className="text-xs">Extrabold</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Zeilenabstand">
          <Select value={props.lineHeight || 'tight'} onValueChange={(v) => onPropsChange({ lineHeight: v as HeadlineBlockProps['lineHeight'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tight" className="text-xs">Eng</SelectItem>
              <SelectItem value="normal" className="text-xs">Normal</SelectItem>
              <SelectItem value="relaxed" className="text-xs">Weit</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
      <FieldRow label="Farbe"><ColorInput value={props.color} onChange={(v) => onPropsChange({ color: v })} /></FieldRow>
    </div>
  )
}

function TextEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<TextBlockProps>) => void }) {
  const props = block.props as TextBlockProps
  return (
    <div className="space-y-3">
      <TipTapEditor content={props.content} placeholder="Text eingeben..." onChange={(v) => onPropsChange({ content: v })} />
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Schriftgröße">
          <Select value={props.fontSize || 'base'} onValueChange={(v) => onPropsChange({ fontSize: v as TextBlockProps['fontSize'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="xs" className="text-xs">XS</SelectItem>
              <SelectItem value="sm" className="text-xs">S</SelectItem>
              <SelectItem value="base" className="text-xs">M</SelectItem>
              <SelectItem value="lg" className="text-xs">L</SelectItem>
              <SelectItem value="xl" className="text-xs">XL</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Zeilenabstand">
          <Select value={props.lineHeight || 'relaxed'} onValueChange={(v) => onPropsChange({ lineHeight: v as TextBlockProps['lineHeight'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tight" className="text-xs">Eng</SelectItem>
              <SelectItem value="normal" className="text-xs">Normal</SelectItem>
              <SelectItem value="relaxed" className="text-xs">Weit</SelectItem>
              <SelectItem value="loose" className="text-xs">Sehr weit</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
      <FieldRow label="Farbe"><ColorInput value={props.color} onChange={(v) => onPropsChange({ color: v })} /></FieldRow>
    </div>
  )
}

function ListEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<ListBlockProps>) => void }) {
  const props = block.props as ListBlockProps
  return (
    <div className="space-y-3">
      <TipTapEditor content={props.content} placeholder="Listeneinträge..." onChange={(v) => onPropsChange({ content: v })} />
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Listentyp">
          <Select value={props.listType || 'bullet'} onValueChange={(v) => onPropsChange({ listType: v as ListBlockProps['listType'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bullet" className="text-xs">Aufzählung</SelectItem>
              <SelectItem value="ordered" className="text-xs">Nummeriert</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Schriftgröße">
          <Select value={props.fontSize || 'base'} onValueChange={(v) => onPropsChange({ fontSize: v as ListBlockProps['fontSize'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm" className="text-xs">S</SelectItem>
              <SelectItem value="base" className="text-xs">M</SelectItem>
              <SelectItem value="lg" className="text-xs">L</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
      <FieldRow label="Farbe"><ColorInput value={props.color} onChange={(v) => onPropsChange({ color: v })} /></FieldRow>
    </div>
  )
}

function ImageEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<ImageBlockProps>) => void }) {
  const props = block.props as ImageBlockProps
  return (
    <div className="space-y-3">
      <FieldRow label="Bild-URL">
        <Input value={props.url} onChange={(e) => onPropsChange({ url: e.target.value })} className="h-8 text-xs" placeholder="https://…" />
      </FieldRow>
      <FieldRow label="Alt-Text">
        <Input value={props.altText} onChange={(e) => onPropsChange({ altText: e.target.value })} className="h-8 text-xs" placeholder="Bildbeschreibung" />
      </FieldRow>
      <FieldRow label="Link-URL">
        <Input value={props.linkUrl} onChange={(e) => onPropsChange({ linkUrl: e.target.value })} className="h-8 text-xs" placeholder="https://…" />
      </FieldRow>
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Breite">
          <Input value={props.width} onChange={(e) => onPropsChange({ width: e.target.value })} className="h-8 text-xs" placeholder="100%" />
        </FieldRow>
        <FieldRow label="Ausrichtung">
          <Select value={props.align || 'center'} onValueChange={(v) => onPropsChange({ align: v as ImageBlockProps['align'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left" className="text-xs">Links</SelectItem>
              <SelectItem value="center" className="text-xs">Mitte</SelectItem>
              <SelectItem value="right" className="text-xs">Rechts</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Rundung (px)">
          <Input type="number" value={props.borderRadius || 0} onChange={(e) => onPropsChange({ borderRadius: Number(e.target.value) })} className="h-8 text-xs" />
        </FieldRow>
        <FieldRow label="Rahmen">
          <div className="flex items-center gap-2 h-8">
            <input type="checkbox" checked={props.border || false} onChange={(e) => onPropsChange({ border: e.target.checked })} className="w-4 h-4" />
            <span className="text-xs text-muted-foreground">Rahmen anzeigen</span>
          </div>
        </FieldRow>
      </div>
      {props.border && (
        <div className="grid grid-cols-2 gap-2">
          <FieldRow label="Rahmen-Farbe"><ColorInput value={props.borderColor} onChange={(v) => onPropsChange({ borderColor: v })} /></FieldRow>
          <FieldRow label="Stärke (px)">
            <Input type="number" value={props.borderWidth || 1} onChange={(e) => onPropsChange({ borderWidth: Number(e.target.value) })} className="h-8 text-xs" />
          </FieldRow>
        </div>
      )}
    </div>
  )
}

function VideoEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<VideoBlockProps>) => void }) {
  const props = block.props as VideoBlockProps
  return (
    <div className="space-y-3">
      <FieldRow label="YouTube / Vimeo URL">
        <Input value={props.url} onChange={(e) => onPropsChange({ url: e.target.value })} className="h-8 text-xs" placeholder="https://youtube.com/watch?v=…" />
      </FieldRow>
      <FieldRow label="Eigenes Vorschaubild (optional)">
        <Input value={props.thumbnailUrl} onChange={(e) => onPropsChange({ thumbnailUrl: e.target.value })} className="h-8 text-xs" placeholder="https://…" />
      </FieldRow>
      <FieldRow label="Alt-Text">
        <Input value={props.altText} onChange={(e) => onPropsChange({ altText: e.target.value })} className="h-8 text-xs" placeholder="Video beschreibung" />
      </FieldRow>
      <FieldRow label="Rundung (px)">
        <Input type="number" value={props.borderRadius || 0} onChange={(e) => onPropsChange({ borderRadius: Number(e.target.value) })} className="h-8 text-xs" />
      </FieldRow>
    </div>
  )
}

function ButtonEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<ButtonBlockProps>) => void }) {
  const props = block.props as ButtonBlockProps
  return (
    <div className="space-y-3">
      <FieldRow label="Beschriftung">
        <Input value={props.label} onChange={(e) => onPropsChange({ label: e.target.value })} className="h-8 text-xs" placeholder="Button-Text" />
      </FieldRow>
      <FieldRow label="URL / Link">
        <Input value={props.url} onChange={(e) => onPropsChange({ url: e.target.value })} className="h-8 text-xs" placeholder="https://…" />
      </FieldRow>
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Hintergrundfarbe"><ColorInput value={props.bgColor} onChange={(v) => onPropsChange({ bgColor: v })} /></FieldRow>
        <FieldRow label="Textfarbe"><ColorInput value={props.textColor} onChange={(v) => onPropsChange({ textColor: v })} /></FieldRow>
        <FieldRow label="Ausrichtung">
          <Select value={props.align || 'center'} onValueChange={(v) => onPropsChange({ align: v as ButtonBlockProps['align'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left" className="text-xs">Links</SelectItem>
              <SelectItem value="center" className="text-xs">Mitte</SelectItem>
              <SelectItem value="right" className="text-xs">Rechts</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Schriftgröße">
          <Select value={props.fontSize || 'base'} onValueChange={(v) => onPropsChange({ fontSize: v as ButtonBlockProps['fontSize'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm" className="text-xs">S</SelectItem>
              <SelectItem value="base" className="text-xs">M</SelectItem>
              <SelectItem value="lg" className="text-xs">L</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Rundung (px)">
          <Input type="number" value={props.borderRadius ?? 8} onChange={(e) => onPropsChange({ borderRadius: Number(e.target.value) })} className="h-8 text-xs" />
        </FieldRow>
        <FieldRow label="Padding H (px)">
          <Input type="number" value={props.paddingX ?? 24} onChange={(e) => onPropsChange({ paddingX: Number(e.target.value) })} className="h-8 text-xs" />
        </FieldRow>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="btn-fullwidth" checked={props.fullWidth || false} onChange={(e) => onPropsChange({ fullWidth: e.target.checked })} className="w-4 h-4" />
        <Label htmlFor="btn-fullwidth" className="text-xs text-muted-foreground cursor-pointer">Volle Breite</Label>
      </div>
    </div>
  )
}

function SocialEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<SocialBlockProps>) => void }) {
  const props = block.props as SocialBlockProps
  const platformLabels: Record<string, string> = {
    instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn',
    x: 'X (Twitter)', youtube: 'YouTube', tiktok: 'TikTok', whatsapp: 'WhatsApp',
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Ausrichtung">
          <Select value={props.align || 'center'} onValueChange={(v) => onPropsChange({ align: v as SocialBlockProps['align'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left" className="text-xs">Links</SelectItem>
              <SelectItem value="center" className="text-xs">Mitte</SelectItem>
              <SelectItem value="right" className="text-xs">Rechts</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Icon-Größe">
          <Select value={props.iconSize || 'md'} onValueChange={(v) => onPropsChange({ iconSize: v as SocialBlockProps['iconSize'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm" className="text-xs">Klein</SelectItem>
              <SelectItem value="md" className="text-xs">Mittel</SelectItem>
              <SelectItem value="lg" className="text-xs">Groß</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Icon-Stil">
          <Select value={props.iconStyle || 'color'} onValueChange={(v) => onPropsChange({ iconStyle: v as SocialBlockProps['iconStyle'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="color" className="text-xs">Farbig</SelectItem>
              <SelectItem value="monochrome" className="text-xs">Einfarbig</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Abstand (px)">
          <Input type="number" value={props.gap || 12} onChange={(e) => onPropsChange({ gap: Number(e.target.value) })} className="h-8 text-xs" />
        </FieldRow>
      </div>
      <Separator />
      <p className="text-xs font-medium text-muted-foreground">Plattformen & Links</p>
      <div className="space-y-2">
        {props.links.map((link, i) => (
          <div key={link.platform} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={link.enabled}
              onChange={(e) => {
                const updated = [...props.links]
                updated[i] = { ...link, enabled: e.target.checked }
                onPropsChange({ links: updated })
              }}
              className="w-3.5 h-3.5 shrink-0"
            />
            <span className="text-xs w-20 shrink-0">{platformLabels[link.platform]}</span>
            <Input
              value={link.url}
              onChange={(e) => {
                const updated = [...props.links]
                updated[i] = { ...link, url: e.target.value }
                onPropsChange({ links: updated })
              }}
              className="h-7 text-xs"
              placeholder="https://…"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function IconEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<IconBlockProps>) => void }) {
  const props = block.props as IconBlockProps
  return (
    <div className="space-y-3">
      <FieldRow label="Icon">
        <Select value={props.iconName || 'Star'} onValueChange={(v) => onPropsChange({ iconName: v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-48">
            {AVAILABLE_ICONS.map((name) => (
              <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Label">
        <Input value={props.label} onChange={(e) => onPropsChange({ label: e.target.value })} className="h-8 text-xs" placeholder="Optionales Label" />
      </FieldRow>
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Icon-Farbe"><ColorInput value={props.color} onChange={(v) => onPropsChange({ color: v })} /></FieldRow>
        <FieldRow label="Hintergrund"><ColorInput value={props.bgColor} onChange={(v) => onPropsChange({ bgColor: v })} /></FieldRow>
        <FieldRow label="Label-Farbe"><ColorInput value={props.labelColor} onChange={(v) => onPropsChange({ labelColor: v })} /></FieldRow>
        <FieldRow label="Größe (px)">
          <Input type="number" value={props.size || 48} onChange={(e) => onPropsChange({ size: Number(e.target.value) })} className="h-8 text-xs" />
        </FieldRow>
      </div>
      <FieldRow label="Ausrichtung">
        <Select value={props.align || 'center'} onValueChange={(v) => onPropsChange({ align: v as IconBlockProps['align'] })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left" className="text-xs">Links</SelectItem>
            <SelectItem value="center" className="text-xs">Mitte</SelectItem>
            <SelectItem value="right" className="text-xs">Rechts</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="icon-rounded" checked={props.rounded !== false} onChange={(e) => onPropsChange({ rounded: e.target.checked })} className="w-4 h-4" />
        <Label htmlFor="icon-rounded" className="text-xs text-muted-foreground cursor-pointer">Runder Hintergrund</Label>
      </div>
    </div>
  )
}

function HtmlEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<HtmlBlockProps>) => void }) {
  const props = block.props as HtmlBlockProps
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">HTML-Code</Label>
      <Textarea
        value={props.html}
        onChange={(e) => onPropsChange({ html: e.target.value })}
        className="min-h-[160px] text-xs font-mono resize-y"
        placeholder="<div>Dein HTML hier...</div>"
      />
      <p className="text-[10px] text-muted-foreground">Merge-Tags wie {'{{Vorname}}'} werden beim Versand ersetzt.</p>
    </div>
  )
}

function CountdownEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<CountdownBlockProps>) => void }) {
  const props = block.props as CountdownBlockProps
  return (
    <div className="space-y-3">
      <FieldRow label="Zieldatum & -uhrzeit">
        <Input
          type="datetime-local"
          value={props.targetDate?.slice(0, 16) || ''}
          onChange={(e) => onPropsChange({ targetDate: e.target.value })}
          className="h-8 text-xs"
        />
      </FieldRow>
      <FieldRow label="Beschriftung">
        <Input value={props.label} onChange={(e) => onPropsChange({ label: e.target.value })} className="h-8 text-xs" placeholder="Angebot endet in" />
      </FieldRow>
      <div className="flex flex-wrap gap-3">
        {[
          { key: 'showDays', label: 'Tage' },
          { key: 'showHours', label: 'Stunden' },
          { key: 'showMinutes', label: 'Minuten' },
          { key: 'showSeconds', label: 'Sekunden' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={props[key as keyof CountdownBlockProps] as boolean}
              onChange={(e) => onPropsChange({ [key]: e.target.checked } as Partial<CountdownBlockProps>)}
              className="w-3.5 h-3.5"
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Textfarbe"><ColorInput value={props.color} onChange={(v) => onPropsChange({ color: v })} /></FieldRow>
        <FieldRow label="Kastenfarbe"><ColorInput value={props.bgColor} onChange={(v) => onPropsChange({ bgColor: v })} /></FieldRow>
        <FieldRow label="Einheit-Farbe"><ColorInput value={props.unitColor} onChange={(v) => onPropsChange({ unitColor: v })} /></FieldRow>
        <FieldRow label="Rundung (px)">
          <Input type="number" value={props.borderRadius ?? 8} onChange={(e) => onPropsChange({ borderRadius: Number(e.target.value) })} className="h-8 text-xs" />
        </FieldRow>
      </div>
    </div>
  )
}

function GifEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<GifBlockProps>) => void }) {
  const props = block.props as GifBlockProps
  return (
    <div className="space-y-3">
      <FieldRow label="GIF-URL">
        <Input value={props.url} onChange={(e) => onPropsChange({ url: e.target.value })} className="h-8 text-xs" placeholder="https://media.giphy.com/…" />
      </FieldRow>
      <FieldRow label="Alt-Text">
        <Input value={props.altText} onChange={(e) => onPropsChange({ altText: e.target.value })} className="h-8 text-xs" placeholder="GIF Beschreibung" />
      </FieldRow>
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Breite">
          <Input value={props.width} onChange={(e) => onPropsChange({ width: e.target.value })} className="h-8 text-xs" placeholder="100%" />
        </FieldRow>
        <FieldRow label="Ausrichtung">
          <Select value={props.align || 'center'} onValueChange={(v) => onPropsChange({ align: v as GifBlockProps['align'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left" className="text-xs">Links</SelectItem>
              <SelectItem value="center" className="text-xs">Mitte</SelectItem>
              <SelectItem value="right" className="text-xs">Rechts</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Rundung (px)">
          <Input type="number" value={props.borderRadius || 0} onChange={(e) => onPropsChange({ borderRadius: Number(e.target.value) })} className="h-8 text-xs" />
        </FieldRow>
      </div>
    </div>
  )
}

function TagesMenueEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<TagesMenueBlockProps>) => void }) {
  const props = block.props as TagesMenueBlockProps
  const [locations, setLocations] = React.useState<{ id: string; name: string }[]>([])

  React.useEffect(() => {
    fetch('/api/admin/standorte').then((r) => r.ok ? r.json() : null).then((data) => {
      if (Array.isArray(data)) setLocations(data)
      else if (Array.isArray(data?.locations)) setLocations(data.locations)
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-3">
      <FieldRow label="Standort">
        <Select
          value={props.standortId || ''}
          onValueChange={(v) => {
            const loc = locations.find((l) => l.id === v)
            onPropsChange({ standortId: v, standortName: loc?.name || v })
          }}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Standort wählen…" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((l) => <SelectItem key={l.id} value={l.id} className="text-xs">{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Max. Gerichte (1–5)">
        <Input
          type="number"
          min={1} max={5}
          value={props.maxGerichte || 3}
          onChange={(e) => onPropsChange({ maxGerichte: Math.min(5, Math.max(1, Number(e.target.value))) })}
          className="h-8 text-xs"
        />
      </FieldRow>
      <FieldRow label="Layout">
        <Select value={props.layout || 'list'} onValueChange={(v) => onPropsChange({ layout: v as TagesMenueBlockProps['layout'] })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="list" className="text-xs">Liste</SelectItem>
            <SelectItem value="cards" className="text-xs">Karten</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <div className="flex flex-col gap-2">
        {[
          { key: 'showDescription', label: 'Beschreibung anzeigen' },
          { key: 'showPrice', label: 'Preis anzeigen' },
          { key: 'showImage', label: 'Bild anzeigen' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props[key as keyof TagesMenueBlockProps] as boolean}
              onChange={(e) => onPropsChange({ [key]: e.target.checked } as Partial<TagesMenueBlockProps>)}
              className="w-3.5 h-3.5"
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CouponEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<CouponBlockProps>) => void }) {
  const props = block.props as CouponBlockProps
  return (
    <div className="space-y-3">
      <FieldRow label="Coupon-Code">
        <Input value={props.couponCode} onChange={(e) => onPropsChange({ couponCode: e.target.value })} className="h-8 text-xs font-mono" placeholder="CODE25" />
      </FieldRow>
      <FieldRow label="CTA-Text">
        <Input value={props.ctaText} onChange={(e) => onPropsChange({ ctaText: e.target.value })} className="h-8 text-xs" placeholder="Code kopieren" />
      </FieldRow>
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Hintergrund"><ColorInput value={props.bgColor} onChange={(v) => onPropsChange({ bgColor: v })} /></FieldRow>
        <FieldRow label="Textfarbe"><ColorInput value={props.textColor} onChange={(v) => onPropsChange({ textColor: v })} /></FieldRow>
        <FieldRow label="Code-Hintergrund"><ColorInput value={props.codeBgColor} onChange={(v) => onPropsChange({ codeBgColor: v })} /></FieldRow>
      </div>
    </div>
  )
}

function SpacerEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<SpacerBlockProps>) => void }) {
  const props = block.props as SpacerBlockProps
  return (
    <div className="space-y-3">
      <FieldRow label="Höhe (px)">
        <Input type="number" min={4} max={400} value={props.height || 24} onChange={(e) => onPropsChange({ height: Number(e.target.value) })} className="h-8 text-xs" />
      </FieldRow>
      <FieldRow label="Hintergrundfarbe">
        <ColorInput value={props.bgColor === 'transparent' ? '#ffffff' : (props.bgColor || '#ffffff')} onChange={(v) => onPropsChange({ bgColor: v })} />
      </FieldRow>
    </div>
  )
}

function DividerEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<DividerBlockProps>) => void }) {
  const props = block.props as DividerBlockProps
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Stil">
          <Select value={props.style || 'solid'} onValueChange={(v) => onPropsChange({ style: v as DividerBlockProps['style'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="solid" className="text-xs">Durchgehend</SelectItem>
              <SelectItem value="dashed" className="text-xs">Gestrichelt</SelectItem>
              <SelectItem value="dotted" className="text-xs">Gepunktet</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Stärke (px)">
          <Input type="number" min={1} max={20} value={props.thickness || 1} onChange={(e) => onPropsChange({ thickness: Number(e.target.value) })} className="h-8 text-xs" />
        </FieldRow>
        <FieldRow label="Breite (%)">
          <Input type="number" min={10} max={100} value={props.width || 100} onChange={(e) => onPropsChange({ width: Number(e.target.value) })} className="h-8 text-xs" />
        </FieldRow>
        <FieldRow label="Ausrichtung">
          <Select value={props.align || 'center'} onValueChange={(v) => onPropsChange({ align: v as DividerBlockProps['align'] })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left" className="text-xs">Links</SelectItem>
              <SelectItem value="center" className="text-xs">Mitte</SelectItem>
              <SelectItem value="right" className="text-xs">Rechts</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
      <FieldRow label="Farbe"><ColorInput value={props.color} onChange={(v) => onPropsChange({ color: v })} /></FieldRow>
    </div>
  )
}

function ColumnsEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<ColumnsBlockProps>) => void }) {
  const props = block.props as ColumnsBlockProps
  return (
    <div className="space-y-3">
      <FieldRow label="Verhältnis">
        <Select value={props.ratio || '50/50'} onValueChange={(v) => onPropsChange({ ratio: v as ColumnsBlockProps['ratio'] })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="50/50" className="text-xs">50 / 50</SelectItem>
            <SelectItem value="33/67" className="text-xs">33 / 67</SelectItem>
            <SelectItem value="67/33" className="text-xs">67 / 33</SelectItem>
            <SelectItem value="25/75" className="text-xs">25 / 75</SelectItem>
            <SelectItem value="75/25" className="text-xs">75 / 25</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Abstand (px)">
        <Input type="number" value={props.gap ?? 16} onChange={(e) => onPropsChange({ gap: Number(e.target.value) })} className="h-8 text-xs" />
      </FieldRow>
    </div>
  )
}

function EmailCaptureEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<EmailCaptureBlockProps>) => void }) {
  const props = block.props as EmailCaptureBlockProps
  return (
    <div className="space-y-3">
      <FieldRow label="Placeholder"><Input value={props.placeholder} onChange={(e) => onPropsChange({ placeholder: e.target.value })} className="h-8 text-xs" /></FieldRow>
      <FieldRow label="Button-Text"><Input value={props.buttonText} onChange={(e) => onPropsChange({ buttonText: e.target.value })} className="h-8 text-xs" /></FieldRow>
      <FieldRow label="Ziel-Attribut"><Input value={props.attribute} onChange={(e) => onPropsChange({ attribute: e.target.value })} className="h-8 text-xs" placeholder="email" /></FieldRow>
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Button-Farbe"><ColorInput value={props.buttonBgColor} onChange={(v) => onPropsChange({ buttonBgColor: v })} /></FieldRow>
        <FieldRow label="Rundung (px)"><Input type="number" value={props.borderRadius ?? 8} onChange={(e) => onPropsChange({ borderRadius: Number(e.target.value) })} className="h-8 text-xs" /></FieldRow>
      </div>
    </div>
  )
}

function PhoneCaptureEditor({ block, onPropsChange }: { block: Block; onPropsChange: (p: Partial<PhoneCaptureBlockProps>) => void }) {
  const props = block.props as PhoneCaptureBlockProps
  return (
    <div className="space-y-3">
      <FieldRow label="Placeholder"><Input value={props.placeholder} onChange={(e) => onPropsChange({ placeholder: e.target.value })} className="h-8 text-xs" /></FieldRow>
      <FieldRow label="Button-Text"><Input value={props.buttonText} onChange={(e) => onPropsChange({ buttonText: e.target.value })} className="h-8 text-xs" /></FieldRow>
      <FieldRow label="Ziel-Attribut"><Input value={props.attribute} onChange={(e) => onPropsChange({ attribute: e.target.value })} className="h-8 text-xs" placeholder="phone" /></FieldRow>
      <div className="grid grid-cols-2 gap-2">
        <FieldRow label="Button-Farbe"><ColorInput value={props.buttonBgColor} onChange={(v) => onPropsChange({ buttonBgColor: v })} /></FieldRow>
        <FieldRow label="Rundung (px)"><Input type="number" value={props.borderRadius ?? 8} onChange={(e) => onPropsChange({ borderRadius: Number(e.target.value) })} className="h-8 text-xs" /></FieldRow>
      </div>
    </div>
  )
}

// ─── Global Style Editor ──────────────────────────────────────────────────────

function GlobalStyleEditor({ globalStyle, onChange }: { globalStyle: GlobalStyle; onChange: (s: Partial<GlobalStyle>) => void }) {
  return (
    <div className="space-y-3 p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Globale Stile</p>
      <FieldRow label="Inhaltsbreite (px)">
        <Input type="number" min={400} max={900} value={globalStyle.contentWidth || 600} onChange={(e) => onChange({ contentWidth: Number(e.target.value) })} className="h-8 text-xs" />
      </FieldRow>
      <FieldRow label="Hintergrundfarbe (Seite)">
        <ColorInput value={globalStyle.bgColor} onChange={(v) => onChange({ bgColor: v })} />
      </FieldRow>
      <FieldRow label="Inhalts-Hintergrund">
        <ColorInput value={globalStyle.contentBgColor} onChange={(v) => onChange({ contentBgColor: v })} />
      </FieldRow>
      <FieldRow label="Primärfarbe">
        <ColorInput value={globalStyle.primaryColor} onChange={(v) => onChange({ primaryColor: v })} />
      </FieldRow>
      <FieldRow label="Link-Farbe">
        <ColorInput value={globalStyle.linkColor} onChange={(v) => onChange({ linkColor: v })} />
      </FieldRow>
      <FieldRow label="Schriftart">
        <Select value={globalStyle.fontFamily} onValueChange={(v) => onChange({ fontFamily: v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['Inter', 'Georgia', 'Lato', 'Roboto', 'Open Sans', 'Helvetica', 'Arial'].map((f) => (
              <SelectItem key={f} value={f} className="text-xs" style={{ fontFamily: f }}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Innenabstand (px)">
        <Input type="number" min={0} max={80} value={globalStyle.padding} onChange={(e) => onChange({ padding: Number(e.target.value) })} className="h-8 text-xs" />
      </FieldRow>
    </div>
  )
}

// ─── Main Properties Panel ────────────────────────────────────────────────────

export function PropertiesPanel({
  selectedBlock,
  globalStyle,
  onBlockChange,
  onGlobalStyleChange,
  showGlobalStyle,
}: PropertiesPanelProps) {
  if (showGlobalStyle) {
    return (
      <aside className="w-72 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
        <GlobalStyleEditor globalStyle={globalStyle} onChange={onGlobalStyleChange} />
      </aside>
    )
  }

  if (!selectedBlock) {
    return (
      <aside className="w-72 shrink-0 border-l border-gray-200 bg-white flex flex-col items-center justify-center text-center px-6">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Eye className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">Block auswählen</p>
        <p className="text-xs text-gray-400 mt-1">Klicke auf einen Block im Canvas, um ihn zu bearbeiten.</p>
      </aside>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateProps = (partial: Partial<any>) => {
    onBlockChange(selectedBlock.id, {
      props: { ...selectedBlock.props, ...partial },
    })
  }

  const updateBlock = (partial: Partial<Block>) => {
    onBlockChange(selectedBlock.id, partial)
  }

  const BLOCK_LABELS: Record<string, string> = {
    headline: 'Überschrift', text: 'Fließtext', list: 'Liste', image: 'Bild',
    video: 'Video', button: 'Button / CTA', social: 'Social Media', icon: 'Icon',
    html: 'HTML-Block', columns2: '2-Spalten', columns3: '3-Spalten',
    divider: 'Trennlinie', spacer: 'Spacer', countdown: 'Countdown',
    gif: 'GIF / Sticker', tagesMenue: 'Tagesmenü', coupon: 'Coupon',
    emailCapture: 'E-Mail Eingabe', phoneCapture: 'Telefon Eingabe',
  }

  return (
    <aside className="w-72 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-200 shrink-0">
        <p className="text-xs font-semibold text-gray-700">{BLOCK_LABELS[selectedBlock.type] || selectedBlock.type}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="shrink-0 grid grid-cols-3 h-9 mx-3 my-2 rounded-md">
          <TabsTrigger value="content" className="text-xs">Inhalt</TabsTrigger>
          <TabsTrigger value="style" className="text-xs">Stil</TabsTrigger>
          <TabsTrigger value="mobile" className="text-xs">Mobil</TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="flex-1 overflow-y-auto px-4 pb-4 mt-0 space-y-3">
          {selectedBlock.type === 'headline' && <HeadlineEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'text' && <TextEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'list' && <ListEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'image' && <ImageEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'video' && <VideoEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'button' && <ButtonEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'social' && <SocialEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'icon' && <IconEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'html' && <HtmlEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'countdown' && <CountdownEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'gif' && <GifEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'tagesMenue' && <TagesMenueEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'coupon' && <CouponEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'spacer' && <SpacerEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'divider' && <DividerEditor block={selectedBlock} onPropsChange={updateProps} />}
          {(selectedBlock.type === 'columns2' || selectedBlock.type === 'columns3') && <ColumnsEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'emailCapture' && <EmailCaptureEditor block={selectedBlock} onPropsChange={updateProps} />}
          {selectedBlock.type === 'phoneCapture' && <PhoneCaptureEditor block={selectedBlock} onPropsChange={updateProps} />}
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="flex-1 overflow-y-auto px-4 pb-4 mt-0 space-y-4">
          <PaddingEditor
            padding={selectedBlock.padding || { top: 8, right: 0, bottom: 8, left: 0 }}
            onChange={(p) => updateBlock({ padding: p })}
          />
        </TabsContent>

        {/* Mobile Tab */}
        <TabsContent value="mobile" className="flex-1 overflow-y-auto px-4 pb-4 mt-0 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sichtbarkeit</Label>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { value: 'both', label: 'Desktop & Mobil', icon: null },
                { value: 'desktop-only', label: 'Nur Desktop', icon: Monitor },
                { value: 'mobile-only', label: 'Nur Mobil', icon: Smartphone },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => updateBlock({ mobileVisibility: value as Block['mobileVisibility'] })}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs transition-colors',
                    selectedBlock.mobileVisibility === value
                      ? 'border-violet-500 bg-violet-50 text-violet-700'
                      : 'border-border bg-background text-muted-foreground hover:border-violet-300'
                  )}
                >
                  {Icon ? <Icon className="w-3.5 h-3.5 shrink-0" /> : <Eye className="w-3.5 h-3.5 shrink-0" />}
                  {label}
                  {selectedBlock.mobileVisibility === value && <Check className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Steuert ob dieser Block auf Desktop, Mobil oder auf beiden Geräten sichtbar ist.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}

