'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'
import { Bold, Italic, Underline, Link2, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
} from './editor-types'
import { PLACEHOLDER_VARIABLES } from './editor-types'

interface PropertiesPanelProps {
  selectedBlock: Block | null
  globalStyle: GlobalStyle
  onBlockChange: (id: string, props: Partial<Block['props']>) => void
  onGlobalStyleChange: (style: Partial<GlobalStyle>) => void
  showGlobalStyle: boolean
}

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
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || 'Hier tippen...' }),
    ],
    content: content ? (() => { try { return JSON.parse(content) } catch { return content } })() : '',
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()))
    },
    editorProps: {
      attributes: {
        class: 'min-h-[80px] p-2 text-sm focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const current = JSON.stringify(editor.getJSON())
    const incoming = content
    if (current !== incoming) {
      try {
        const parsed = JSON.parse(incoming)
        editor.commands.setContent(parsed)
      } catch {
        editor.commands.setContent(incoming || '')
      }
    }
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  const insertPlaceholder = (value: string) => {
    editor?.commands.insertContent(value)
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold className="w-3 h-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic className="w-3 h-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Underline className="w-3 h-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => {
            const url = prompt('Link-URL:')
            if (url) editor?.chain().focus().setLink({ href: url }).run()
          }}
        >
          <Link2 className="w-3 h-3" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2">
              {'{{}}'} Platzhalter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {PLACEHOLDER_VARIABLES.map((v) => (
              <DropdownMenuItem key={v.value} onClick={() => insertPlaceholder(v.value)}>
                {v.label} <span className="ml-2 text-muted-foreground font-mono text-xs">{v.value}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

function HeadlineProperties({ block, onChange }: { block: Block; onChange: (p: Partial<HeadlineBlockProps>) => void }) {
  const props = block.props as HeadlineBlockProps
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs mb-1 block">Text</Label>
        <TipTapEditor
          content={props.content}
          placeholder="Headline eingeben..."
          onChange={(json) => onChange({ content: json })}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Ebene</Label>
          <div className="flex gap-1">
            {(['h1', 'h2', 'h3'] as const).map((l) => (
              <Button
                key={l}
                type="button"
                size="sm"
                variant={props.level === l ? 'default' : 'outline'}
                className="h-8 flex-1 text-xs"
                onClick={() => onChange({ level: l })}
              >
                {l.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Ausrichtung</Label>
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((a) => (
              <Button
                key={a}
                type="button"
                size="sm"
                variant={props.align === a ? 'default' : 'outline'}
                className="h-8 flex-1 text-xs"
                onClick={() => onChange({ align: a })}
              >
                {a === 'left' ? '←' : a === 'center' ? '↔' : '→'}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Farbe</Label>
        <div className="flex gap-2 items-center">
          <input type="color" value={props.color || '#111111'} onChange={(e) => onChange({ color: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
          <Input value={props.color || '#111111'} onChange={(e) => onChange({ color: e.target.value })} className="h-8 text-xs font-mono" />
        </div>
      </div>
    </div>
  )
}

function TextProperties({ block, onChange }: { block: Block; onChange: (p: Partial<TextBlockProps>) => void }) {
  const props = block.props as TextBlockProps
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs mb-1 block">Text</Label>
        <TipTapEditor
          content={props.content}
          placeholder="Text eingeben..."
          onChange={(json) => onChange({ content: json })}
        />
      </div>
      <div>
        <Label className="text-xs mb-1 block">Schriftgröße</Label>
        <div className="flex gap-1">
          {(['sm', 'base', 'lg'] as const).map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={props.fontSize === s ? 'default' : 'outline'}
              className="h-8 flex-1 text-xs"
              onClick={() => onChange({ fontSize: s })}
            >
              {s === 'sm' ? 'Klein' : s === 'base' ? 'Normal' : 'Groß'}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Textfarbe</Label>
        <div className="flex gap-2 items-center">
          <input type="color" value={props.color || '#333333'} onChange={(e) => onChange({ color: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
          <Input value={props.color || '#333333'} onChange={(e) => onChange({ color: e.target.value })} className="h-8 text-xs font-mono" />
        </div>
      </div>
    </div>
  )
}

function ImageProperties({ block, onChange }: { block: Block; onChange: (p: Partial<ImageBlockProps>) => void }) {
  const props = block.props as ImageBlockProps
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs mb-1 block">Bild-URL</Label>
        <Input value={props.url} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://..." className="h-8 text-xs" />
      </div>
      <div>
        <Label className="text-xs mb-1 block">Alt-Text</Label>
        <Input value={props.altText} onChange={(e) => onChange({ altText: e.target.value })} placeholder="Beschreibung des Bildes" className="h-8 text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Breite</Label>
          <Input value={props.width} onChange={(e) => onChange({ width: e.target.value })} placeholder="100%" className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-xs mb-1 block">Ausrichtung</Label>
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((a) => (
              <Button key={a} type="button" size="sm" variant={props.align === a ? 'default' : 'outline'} className="h-8 flex-1 text-xs" onClick={() => onChange({ align: a })}>
                {a === 'left' ? '←' : a === 'center' ? '↔' : '→'}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Link bei Klick (optional)</Label>
        <Input value={props.linkUrl} onChange={(e) => onChange({ linkUrl: e.target.value })} placeholder="https://..." className="h-8 text-xs" />
      </div>
    </div>
  )
}

function ButtonProperties({ block, onChange }: { block: Block; onChange: (p: Partial<ButtonBlockProps>) => void }) {
  const props = block.props as ButtonBlockProps
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs mb-1 block">Beschriftung</Label>
        <Input value={props.label} onChange={(e) => onChange({ label: e.target.value })} className="h-8 text-xs" />
      </div>
      <div>
        <Label className="text-xs mb-1 block">Link-URL</Label>
        <Input value={props.url} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://..." className="h-8 text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs mb-1 block">Hintergrund</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={props.bgColor || '#3b82f6'} onChange={(e) => onChange({ bgColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
            <Input value={props.bgColor || '#3b82f6'} onChange={(e) => onChange({ bgColor: e.target.value })} className="h-8 text-xs font-mono" />
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1 block">Textfarbe</Label>
          <div className="flex gap-2 items-center">
            <input type="color" value={props.textColor || '#ffffff'} onChange={(e) => onChange({ textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
            <Input value={props.textColor || '#ffffff'} onChange={(e) => onChange({ textColor: e.target.value })} className="h-8 text-xs font-mono" />
          </div>
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Ausrichtung</Label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <Button key={a} type="button" size="sm" variant={props.align === a ? 'default' : 'outline'} className="h-8 flex-1 text-xs" onClick={() => onChange({ align: a })}>
              {a === 'left' ? 'Links' : a === 'center' ? 'Mitte' : 'Rechts'}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SpacerProperties({ block, onChange }: { block: Block; onChange: (p: Partial<SpacerBlockProps>) => void }) {
  const props = block.props as SpacerBlockProps
  return (
    <div>
      <Label className="text-xs mb-1 block">Höhe: {props.height || 24}px</Label>
      <input
        type="range"
        min={8}
        max={120}
        value={props.height || 24}
        onChange={(e) => onChange({ height: Number(e.target.value) })}
        className="w-full"
      />
    </div>
  )
}

function DividerProperties({ block, onChange }: { block: Block; onChange: (p: Partial<DividerBlockProps>) => void }) {
  const props = block.props as DividerBlockProps
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs mb-1 block">Farbe</Label>
        <div className="flex gap-2 items-center">
          <input type="color" value={props.color || '#e5e7eb'} onChange={(e) => onChange({ color: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
          <Input value={props.color || '#e5e7eb'} onChange={(e) => onChange({ color: e.target.value })} className="h-8 text-xs font-mono" />
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Stil</Label>
        <div className="flex gap-1">
          {(['solid', 'dashed', 'dotted'] as const).map((s) => (
            <Button key={s} type="button" size="sm" variant={props.style === s ? 'default' : 'outline'} className="h-8 flex-1 text-xs capitalize" onClick={() => onChange({ style: s })}>
              {s}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ColumnsProperties({ block, onChange }: { block: Block; onChange: (p: Partial<ColumnsBlockProps>) => void }) {
  const props = block.props as ColumnsBlockProps
  return (
    <div>
      <Label className="text-xs mb-1 block">Spalten-Verhältnis</Label>
      <div className="flex gap-1 flex-wrap">
        {(['50/50', '33/67', '67/33'] as const).map((r) => (
          <Button key={r} type="button" size="sm" variant={props.ratio === r ? 'default' : 'outline'} className="h-8 text-xs" onClick={() => onChange({ ratio: r })}>
            {r}
          </Button>
        ))}
      </div>
    </div>
  )
}

function CouponProperties({ block, onChange }: { block: Block; onChange: (p: Partial<CouponBlockProps>) => void }) {
  const props = block.props as CouponBlockProps
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs mb-1 block">Coupon-Code</Label>
        <Input value={props.couponCode} onChange={(e) => onChange({ couponCode: e.target.value })} placeholder="z.B. SOMMER25" className="h-8 text-xs font-mono" />
      </div>
      <div>
        <Label className="text-xs mb-1 block">CTA-Text</Label>
        <Input value={props.ctaText} onChange={(e) => onChange({ ctaText: e.target.value })} placeholder="Code kopieren" className="h-8 text-xs" />
      </div>
    </div>
  )
}

function GlobalStylePanel({ style, onChange }: { style: GlobalStyle; onChange: (s: Partial<GlobalStyle>) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Settings2 className="w-3.5 h-3.5" />
        Globale Einstellungen
      </p>
      <div>
        <Label className="text-xs mb-1 block">Hintergrundfarbe</Label>
        <div className="flex gap-2 items-center">
          <input type="color" value={style.bgColor} onChange={(e) => onChange({ bgColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
          <Input value={style.bgColor} onChange={(e) => onChange({ bgColor: e.target.value })} className="h-8 text-xs font-mono" />
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Primärfarbe</Label>
        <div className="flex gap-2 items-center">
          <input type="color" value={style.primaryColor} onChange={(e) => onChange({ primaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
          <Input value={style.primaryColor} onChange={(e) => onChange({ primaryColor: e.target.value })} className="h-8 text-xs font-mono" />
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Schriftart</Label>
        <div className="grid grid-cols-2 gap-1">
          {['Inter', 'Georgia', 'Roboto', 'Lato'].map((f) => (
            <Button key={f} type="button" size="sm" variant={style.fontFamily === f ? 'default' : 'outline'} className="h-8 text-xs" onClick={() => onChange({ fontFamily: f })}>
              {f}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-xs mb-1 block">Innenabstand: {style.padding}px</Label>
        <input
          type="range"
          min={8}
          max={64}
          value={style.padding}
          onChange={(e) => onChange({ padding: Number(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  )
}

export function PropertiesPanel({
  selectedBlock,
  globalStyle,
  onBlockChange,
  onGlobalStyleChange,
  showGlobalStyle,
}: PropertiesPanelProps) {
  const handleChange = (props: Partial<Block['props']>) => {
    if (selectedBlock) onBlockChange(selectedBlock.id, props)
  }

  if (showGlobalStyle) {
    return (
      <aside className="w-72 shrink-0 border-l border-border bg-background flex flex-col overflow-y-auto">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-foreground">Template-Einstellungen</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <GlobalStylePanel style={globalStyle} onChange={onGlobalStyleChange} />
        </div>
      </aside>
    )
  }

  if (!selectedBlock) {
    return (
      <aside className="w-72 shrink-0 border-l border-border bg-background flex flex-col">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-foreground">Eigenschaften</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <Settings2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Block auswählen zum Bearbeiten</p>
          </div>
        </div>
      </aside>
    )
  }

  const typeLabel: Record<string, string> = {
    headline: 'Headline', text: 'Text', image: 'Bild', button: 'Button',
    spacer: 'Spacer', divider: 'Trennlinie', columns2: '2-Spalten', columns3: '3-Spalten', coupon: 'Coupon',
  }

  return (
    <aside className="w-72 shrink-0 border-l border-border bg-background flex flex-col overflow-y-auto">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold text-foreground">{typeLabel[selectedBlock.type] || 'Block'} Eigenschaften</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {selectedBlock.type === 'headline' && <HeadlineProperties block={selectedBlock} onChange={handleChange as (p: Partial<HeadlineBlockProps>) => void} />}
        {selectedBlock.type === 'text' && <TextProperties block={selectedBlock} onChange={handleChange as (p: Partial<TextBlockProps>) => void} />}
        {selectedBlock.type === 'image' && <ImageProperties block={selectedBlock} onChange={handleChange as (p: Partial<ImageBlockProps>) => void} />}
        {selectedBlock.type === 'button' && <ButtonProperties block={selectedBlock} onChange={handleChange as (p: Partial<ButtonBlockProps>) => void} />}
        {selectedBlock.type === 'spacer' && <SpacerProperties block={selectedBlock} onChange={handleChange as (p: Partial<SpacerBlockProps>) => void} />}
        {selectedBlock.type === 'divider' && <DividerProperties block={selectedBlock} onChange={handleChange as (p: Partial<DividerBlockProps>) => void} />}
        {(selectedBlock.type === 'columns2' || selectedBlock.type === 'columns3') && (
          <ColumnsProperties block={selectedBlock} onChange={handleChange as (p: Partial<ColumnsBlockProps>) => void} />
        )}
        {selectedBlock.type === 'coupon' && <CouponProperties block={selectedBlock} onChange={handleChange as (p: Partial<CouponBlockProps>) => void} />}
      </div>
    </aside>
  )
}
