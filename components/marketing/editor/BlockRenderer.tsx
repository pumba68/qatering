'use client'

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
import { fillPlaceholders, DEFAULT_GLOBAL_STYLE } from './editor-types'

interface BlockRendererProps {
  block: Block
  isPreview?: boolean
  globalStyle?: GlobalStyle
}

function renderTipTapContent(jsonStr: string, preview: boolean): string {
  if (!jsonStr) return preview ? '<span class="text-muted-foreground">Hier tippen...</span>' : ''
  try {
    const data = JSON.parse(jsonStr)
    // Simple HTML rendering from TipTap JSON
    const renderNode = (node: { type?: string; text?: string; content?: typeof data[]; marks?: Array<{ type: string }> }): string => {
      if (!node) return ''
      if (node.type === 'text') {
        let text = node.text || ''
        if (preview) text = fillPlaceholders(text)
        if (node.marks) {
          node.marks.forEach((mark: { type: string }) => {
            if (mark.type === 'bold') text = `<strong>${text}</strong>`
            if (mark.type === 'italic') text = `<em>${text}</em>`
            if (mark.type === 'underline') text = `<u>${text}</u>`
          })
        }
        return text
      }
      const children = (node.content || []).map(renderNode).join('')
      if (node.type === 'paragraph') return `<p class="mb-2">${children || '<br>'}</p>`
      if (node.type === 'hardBreak') return '<br>'
      if (node.type === 'bulletList') return `<ul class="list-disc pl-5 mb-2">${children}</ul>`
      if (node.type === 'orderedList') return `<ol class="list-decimal pl-5 mb-2">${children}</ol>`
      if (node.type === 'listItem') return `<li>${children}</li>`
      return children
    }
    return (data.content || []).map(renderNode).join('')
  } catch {
    // If not JSON, treat as plain text
    const text = preview ? fillPlaceholders(jsonStr) : jsonStr
    return `<p>${text}</p>`
  }
}

function HeadlineBlock({ block, isPreview }: BlockRendererProps) {
  const props = block.props as HeadlineBlockProps
  const Tag = props.level || 'h2'
  const sizeMap = { h1: 'text-3xl', h2: 'text-2xl', h3: 'text-xl' }
  const html = renderTipTapContent(props.content, !!isPreview)

  return (
    <div
      className={`font-bold leading-tight ${sizeMap[props.level || 'h2']}`}
      style={{ color: props.color, textAlign: props.align || 'left' }}
      dangerouslySetInnerHTML={{ __html: html || (isPreview ? `<${Tag}>Headline</${Tag}>` : '') }}
    />
  )
}

function TextBlock({ block, isPreview }: BlockRendererProps) {
  const props = block.props as TextBlockProps
  const sizeMap = { sm: 'text-sm', base: 'text-base', lg: 'text-lg' }
  const html = renderTipTapContent(props.content, !!isPreview)

  return (
    <div
      className={`leading-relaxed ${sizeMap[props.fontSize || 'base']}`}
      style={{ color: props.color }}
      dangerouslySetInnerHTML={{
        __html: html || (isPreview ? '<p class="text-muted-foreground">Text hier eingeben...</p>' : ''),
      }}
    />
  )
}

function ImageBlock({ block }: BlockRendererProps) {
  const props = block.props as ImageBlockProps
  const alignMap = { left: 'mr-auto', center: 'mx-auto', right: 'ml-auto' }

  if (!props.url) {
    return (
      <div className="w-full aspect-video rounded-lg bg-muted border-2 border-dashed border-border flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Bild-URL eingeben oder hochladen</p>
      </div>
    )
  }

  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={props.url}
      alt={props.altText || ''}
      style={{ width: props.width || '100%' }}
      className={`rounded-lg block ${alignMap[props.align || 'center']}`}
    />
  )

  if (props.linkUrl) {
    return <a href={props.linkUrl} target="_blank" rel="noreferrer">{img}</a>
  }
  return img
}

function ButtonBlock({ block }: BlockRendererProps) {
  const props = block.props as ButtonBlockProps
  const alignMap = { left: 'text-left', center: 'text-center', right: 'text-right' }

  return (
    <div className={alignMap[props.align || 'center']}>
      <span
        className="inline-block px-6 py-3 rounded-lg font-medium text-sm cursor-default"
        style={{ backgroundColor: props.bgColor || '#3b82f6', color: props.textColor || '#ffffff' }}
      >
        {props.label || 'Button'}
      </span>
    </div>
  )
}

function SpacerBlock({ block }: BlockRendererProps) {
  const props = block.props as SpacerBlockProps
  return <div style={{ height: `${props.height || 24}px` }} className="w-full" />
}

function DividerBlock({ block }: BlockRendererProps) {
  const props = block.props as DividerBlockProps
  return (
    <hr
      style={{
        borderColor: props.color || '#e5e7eb',
        borderTopWidth: `${props.thickness || 1}px`,
        borderTopStyle: props.style || 'solid',
        borderBottomWidth: 0,
      }}
    />
  )
}

function ColumnsBlock({ block, isPreview }: BlockRendererProps) {
  const props = block.props as ColumnsBlockProps
  const ratioMap: Record<string, string[]> = {
    '50/50': ['w-1/2', 'w-1/2'],
    '33/67': ['w-1/3', 'w-2/3'],
    '67/33': ['w-2/3', 'w-1/3'],
  }
  const widths = ratioMap[props.ratio] || ['w-1/2', 'w-1/2']
  const cols = props.columns || [[], []]

  return (
    <div className="flex gap-4 flex-wrap">
      {cols.map((colBlocks, i) => (
        <div key={i} className={`${widths[i] || 'flex-1'} min-w-0`}>
          {colBlocks.length === 0 ? (
            <div className="h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Spalte {i + 1}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {colBlocks.map((b) => (
                <BlockRendererSwitch key={b.id} block={b} isPreview={isPreview} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CouponBlock({ block }: BlockRendererProps) {
  const props = block.props as CouponBlockProps

  return (
    <div className="rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 dark:bg-blue-950/20 p-4 text-center">
      <p className="text-xs text-blue-600 font-medium mb-1">Coupon-Code</p>
      <p className="text-2xl font-bold text-blue-700 tracking-widest font-mono break-all">
        {props.couponCode || 'CODE'}
      </p>
      {props.ctaText && (
        <p className="text-sm text-blue-600 mt-2">{props.ctaText}</p>
      )}
    </div>
  )
}

export function BlockRendererSwitch({ block, isPreview, globalStyle = DEFAULT_GLOBAL_STYLE }: BlockRendererProps) {
  void globalStyle // available for future use (e.g. theme-aware rendering)
  switch (block.type) {
    case 'headline': return <HeadlineBlock block={block} isPreview={isPreview} />
    case 'text': return <TextBlock block={block} isPreview={isPreview} />
    case 'image': return <ImageBlock block={block} isPreview={isPreview} />
    case 'button': return <ButtonBlock block={block} isPreview={isPreview} />
    case 'spacer': return <SpacerBlock block={block} isPreview={isPreview} />
    case 'divider': return <DividerBlock block={block} isPreview={isPreview} />
    case 'columns2':
    case 'columns3': return <ColumnsBlock block={block} isPreview={isPreview} />
    case 'coupon': return <CouponBlock block={block} isPreview={isPreview} />
    default: return null
  }
}
