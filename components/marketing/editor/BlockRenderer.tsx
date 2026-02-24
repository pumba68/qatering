'use client'

import React from 'react'
import {
  Play,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  MessageCircle,
  UtensilsCrossed,
  Tag,
  Star,
  Heart,
  Zap,
  Bell,
  Check,
  Gift,
  Trophy,
  ShoppingCart,
  Percent,
  Flame,
  Sparkles,
  Rocket,
  Coffee,
  Utensils,
  Pizza,
  Apple,
  Leaf,
  Sun,
  Moon,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  User,
  Users,
  Smile,
  ThumbsUp,
  Award,
  Crown,
} from 'lucide-react'
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
} from './editor-types'
import { fillPlaceholders, DEFAULT_GLOBAL_STYLE } from './editor-types'

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Star, Heart, Zap, Bell, Check, Gift, Trophy, ShoppingCart, Tag, Percent,
  Flame, Sparkles, Rocket, Coffee, Utensils, Pizza, Apple, Leaf, Sun, Moon,
  Mail, Phone, MapPin, Clock, Calendar, User, Users, Smile, ThumbsUp, Award, Crown,
}

// ─── Renderer Props ───────────────────────────────────────────────────────────

interface BlockRendererProps {
  block: Block
  isPreview?: boolean
  globalStyle?: GlobalStyle
}

// ─── TipTap HTML Renderer ─────────────────────────────────────────────────────

function renderTipTapContent(jsonStr: string, preview: boolean): string {
  if (!jsonStr) return preview ? '<span class="text-muted-foreground italic">Hier tippen...</span>' : ''
  try {
    const data = JSON.parse(jsonStr)
    type TipTapNode = { type?: string; text?: string; content?: TipTapNode[]; marks?: Array<{ type: string; attrs?: Record<string, string> }> }
    const renderNode = (node: TipTapNode): string => {
      if (!node) return ''
      if (node.type === 'text') {
        let text = node.text || ''
        if (preview) text = fillPlaceholders(text)
        if (node.marks) {
          node.marks.forEach((mark) => {
            if (mark.type === 'bold') text = `<strong>${text}</strong>`
            if (mark.type === 'italic') text = `<em>${text}</em>`
            if (mark.type === 'underline') text = `<u>${text}</u>`
            if (mark.type === 'link') text = `<a href="${mark.attrs?.href ?? '#'}" class="underline text-blue-600">${text}</a>`
          })
        }
        return text
      }
      const children = (node.content || []).map(renderNode).join('')
      if (node.type === 'paragraph') return `<p class="mb-2 last:mb-0">${children || '<br>'}</p>`
      if (node.type === 'hardBreak') return '<br>'
      if (node.type === 'bulletList') return `<ul class="list-disc pl-5 mb-2 space-y-1">${children}</ul>`
      if (node.type === 'orderedList') return `<ol class="list-decimal pl-5 mb-2 space-y-1">${children}</ol>`
      if (node.type === 'listItem') return `<li>${children}</li>`
      return children
    }
    return (data.content || []).map(renderNode).join('')
  } catch {
    const text = preview ? fillPlaceholders(jsonStr) : jsonStr
    return `<p>${text}</p>`
  }
}

// ─── YouTube ID Extractor ─────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match?.[1] ?? null
}

// ─── Countdown Hook ───────────────────────────────────────────────────────────

function useCountdown(targetDate: string) {
  const calc = () => {
    const diff = Math.max(0, new Date(targetDate).getTime() - Date.now())
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      expired: diff === 0,
    }
  }
  const [time, setTime] = React.useState(calc)
  React.useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate])
  return time
}

// ─── Individual Block Renderers ───────────────────────────────────────────────

function HeadlineBlock({ block, isPreview }: BlockRendererProps) {
  const props = block.props as HeadlineBlockProps
  const sizeMap = { h1: 'text-4xl', h2: 'text-3xl', h3: 'text-2xl', h4: 'text-xl' }
  const weightMap = {
    normal: 'font-normal', medium: 'font-medium', semibold: 'font-semibold',
    bold: 'font-bold', extrabold: 'font-extrabold',
  }
  const spacingMap = { tight: 'tracking-tight', normal: 'tracking-normal', wide: 'tracking-wide' }
  const lineMap = { tight: 'leading-tight', normal: 'leading-normal', relaxed: 'leading-relaxed' }
  const html = renderTipTapContent(props.content, !!isPreview)

  return (
    <div
      className={`${sizeMap[props.level || 'h2']} ${weightMap[props.fontWeight || 'bold']} ${spacingMap[props.letterSpacing || 'normal']} ${lineMap[props.lineHeight || 'tight']}`}
      style={{ color: props.color, textAlign: props.align || 'left' }}
      dangerouslySetInnerHTML={{ __html: html || (isPreview ? `<span>Überschrift</span>` : '<span class="text-gray-300">Überschrift eingeben...</span>') }}
    />
  )
}

function TextBlock({ block, isPreview }: BlockRendererProps) {
  const props = block.props as TextBlockProps
  const sizeMap = { xs: 'text-xs', sm: 'text-sm', base: 'text-base', lg: 'text-lg', xl: 'text-xl' }
  const lineMap = { tight: 'leading-tight', normal: 'leading-normal', relaxed: 'leading-relaxed', loose: 'leading-loose' }
  const html = renderTipTapContent(props.content, !!isPreview)

  return (
    <div
      className={`${sizeMap[props.fontSize || 'base']} ${lineMap[props.lineHeight || 'relaxed']}`}
      style={{ color: props.color }}
      dangerouslySetInnerHTML={{ __html: html || (isPreview ? '' : '<p class="text-gray-300">Text eingeben...</p>') }}
    />
  )
}

function ListBlock({ block, isPreview }: BlockRendererProps) {
  const props = block.props as ListBlockProps
  const sizeMap = { sm: 'text-sm', base: 'text-base', lg: 'text-lg' }
  const html = renderTipTapContent(props.content, !!isPreview)

  return (
    <div
      className={`${sizeMap[props.fontSize || 'base']} leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5`}
      style={{ color: props.color }}
      dangerouslySetInnerHTML={{ __html: html || (isPreview ? '' : `<ul class="list-disc pl-5 text-gray-300"><li>Listenpunkt 1</li><li>Listenpunkt 2</li></ul>`) }}
    />
  )
}

function ImageBlock({ block, isPreview }: BlockRendererProps) {
  const props = block.props as ImageBlockProps
  const img = (
    <img
      src={props.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect width="400" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" font-family="sans-serif" font-size="14" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EBild%3C/text%3E%3C/svg%3E'}
      alt={props.altText || ''}
      style={{
        width: props.width || '100%',
        maxWidth: '100%',
        borderRadius: props.borderRadius ? `${props.borderRadius}px` : undefined,
        border: props.border ? `${props.borderWidth}px solid ${props.borderColor}` : undefined,
        display: 'block',
        margin: props.align === 'center' ? '0 auto' : props.align === 'right' ? '0 0 0 auto' : '0',
      }}
    />
  )

  if (props.linkUrl && isPreview) {
    return <a href={props.linkUrl} target="_blank" rel="noreferrer">{img}</a>
  }
  return img
}

function VideoBlock({ block }: BlockRendererProps) {
  const props = block.props as VideoBlockProps
  const ytId = extractYouTubeId(props.url)
  const thumb = props.thumbnailUrl || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null)

  if (!props.url && !thumb) {
    return (
      <div className="flex items-center justify-center h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-400">
          <Play className="w-8 h-8 mx-auto mb-1" />
          <p className="text-xs">YouTube oder Vimeo URL eingeben</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative overflow-hidden cursor-pointer group"
      style={{ borderRadius: props.borderRadius ? `${props.borderRadius}px` : undefined }}
    >
      {thumb ? (
        <img src={thumb} alt={props.altText || 'Video'} className="w-full block" />
      ) : (
        <div className="h-48 bg-gray-900 w-full" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <div className="w-16 h-16 bg-white/95 rounded-full flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
          <Play className="w-7 h-7 text-gray-900 ml-1" />
        </div>
      </div>
    </div>
  )
}

function ButtonBlock({ block }: BlockRendererProps) {
  const props = block.props as ButtonBlockProps
  const sizeMap = { sm: '0.8rem', base: '0.9rem', lg: '1rem' }

  const btn = (
    <div style={{ textAlign: props.align || 'center' }}>
      <span
        style={{
          display: props.fullWidth ? 'block' : 'inline-block',
          backgroundColor: props.bgColor || '#3b82f6',
          color: props.textColor || '#ffffff',
          borderRadius: `${props.borderRadius ?? 8}px`,
          fontSize: sizeMap[props.fontSize || 'base'],
          fontWeight: 600,
          padding: `${props.paddingY ?? 12}px ${props.paddingX ?? 24}px`,
          border: props.border ? `2px solid ${props.borderColor}` : 'none',
          cursor: 'pointer',
          textDecoration: 'none',
          lineHeight: 1.4,
        }}
      >
        {props.label || 'Button-Text'}
      </span>
    </div>
  )
  return btn
}

function SocialBlock({ block }: BlockRendererProps) {
  const props = block.props as SocialBlockProps
  const sizeMap = { sm: 28, md: 36, lg: 44 }
  const sz = sizeMap[props.iconSize || 'md']

  const PlatformIcon: Record<string, React.ElementType> = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
    x: Twitter,
    youtube: Youtube,
    tiktok: Sparkles, // placeholder
    whatsapp: MessageCircle,
  }

  const colorMap: Record<string, string> = {
    instagram: '#E1306C',
    facebook: '#1877F2',
    linkedin: '#0A66C2',
    x: '#000000',
    youtube: '#FF0000',
    tiktok: '#010101',
    whatsapp: '#25D366',
  }

  const enabledLinks = props.links.filter((l) => l.enabled)

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: props.align || 'center',
        gap: `${props.gap || 12}px`,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {enabledLinks.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Keine Plattformen aktiviert</p>
      ) : (
        enabledLinks.map((link) => {
          const Icon = PlatformIcon[link.platform] || Star
          const color = props.iconStyle === 'monochrome' ? '#374151' : colorMap[link.platform] || '#374151'
          return (
            <div
              key={link.platform}
              className="flex items-center justify-center rounded-full transition-transform hover:scale-110"
              style={{
                width: sz,
                height: sz,
                backgroundColor: props.iconStyle === 'monochrome' ? '#f3f4f6' : `${color}15`,
                cursor: 'pointer',
              }}
              title={link.platform}
            >
              <Icon style={{ width: sz * 0.5, height: sz * 0.5, color }} />
            </div>
          )
        })
      )}
    </div>
  )
}

function IconBlock({ block }: BlockRendererProps) {
  const props = block.props as IconBlockProps
  const IconComp = ICON_MAP[props.iconName] || Star
  const sz = props.size || 48

  return (
    <div style={{ textAlign: props.align || 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: sz * 1.4,
            height: sz * 1.4,
            backgroundColor: props.bgColor || '#eff6ff',
            borderRadius: props.rounded ? '50%' : '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconComp style={{ width: sz, height: sz, color: props.color || '#3b82f6' }} />
        </div>
        {props.label && (
          <p className="text-sm font-medium" style={{ color: props.labelColor || '#333333' }}>
            {props.label}
          </p>
        )}
      </div>
    </div>
  )
}

function HtmlBlock({ block }: BlockRendererProps) {
  const props = block.props as HtmlBlockProps
  if (!props.html) {
    return (
      <div className="flex items-center justify-center h-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <p className="text-xs text-gray-400 font-mono">{'<HTML-Block>'}</p>
      </div>
    )
  }
  return <div dangerouslySetInnerHTML={{ __html: props.html }} />
}

function CountdownBlock({ block }: BlockRendererProps) {
  const props = block.props as CountdownBlockProps
  const { days, hours, minutes, seconds, expired } = useCountdown(props.targetDate)

  const units = [
    { show: props.showDays, value: days, label: 'Tage' },
    { show: props.showHours, value: hours, label: 'Std.' },
    { show: props.showMinutes, value: minutes, label: 'Min.' },
    { show: props.showSeconds, value: seconds, label: 'Sek.' },
  ].filter((u) => u.show)

  return (
    <div className="text-center py-2">
      {props.label && (
        <p className="text-sm mb-3 font-medium" style={{ color: props.color || '#111111' }}>
          {props.label}
        </p>
      )}
      {expired && (
        <span className="inline-block text-xs bg-yellow-100 text-yellow-700 rounded px-2 py-0.5 mb-2">
          Timer abgelaufen
        </span>
      )}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {units.map(({ value, label }, i) => (
          <React.Fragment key={label}>
            {i > 0 && <span className="text-2xl font-bold" style={{ color: props.color || '#111111' }}>:</span>}
            <div
              className="flex flex-col items-center justify-center min-w-[60px] py-3 px-4"
              style={{
                backgroundColor: props.bgColor || '#f3f4f6',
                borderRadius: `${props.borderRadius ?? 8}px`,
              }}
            >
              <span className="text-3xl font-bold tabular-nums" style={{ color: props.color || '#111111' }}>
                {String(value).padStart(2, '0')}
              </span>
              <span className="text-xs mt-0.5" style={{ color: props.unitColor || '#6b7280' }}>
                {label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

function GifBlock({ block }: BlockRendererProps) {
  const props = block.props as GifBlockProps

  if (!props.url) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <p className="text-xs text-gray-400">GIF-URL eingeben</p>
      </div>
    )
  }

  return (
    <div style={{ textAlign: props.align || 'center' }}>
      <img
        src={props.url}
        alt={props.altText || ''}
        style={{
          width: props.width || '100%',
          maxWidth: '100%',
          borderRadius: props.borderRadius ? `${props.borderRadius}px` : undefined,
          display: 'inline-block',
        }}
      />
    </div>
  )
}

function TagesMenueBlock({ block }: BlockRendererProps) {
  const props = block.props as TagesMenueBlockProps

  return (
    <div className="border-2 border-dashed border-amber-300 bg-amber-50/60 rounded-xl p-5 text-center">
      <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 text-amber-400" />
      <p className="text-sm font-semibold text-amber-700 mb-1">
        Tagesmenü{props.standortName ? `: ${props.standortName}` : ''}
      </p>
      <p className="text-xs text-amber-600/80 mb-2">
        Max. {props.maxGerichte} Gericht{props.maxGerichte !== 1 ? 'e'  : ''} · Layout: {props.layout === 'list' ? 'Liste' : 'Karten'}
      </p>
      <p className="text-[10px] text-amber-500/70 italic">
        Wird beim Versand automatisch mit dem heutigen Menü befüllt
      </p>
    </div>
  )
}

function CouponBlock({ block }: BlockRendererProps) {
  const props = block.props as CouponBlockProps

  return (
    <div
      className="rounded-xl p-5 text-center space-y-3"
      style={{ backgroundColor: props.bgColor || '#fff7ed' }}
    >
      <div className="flex items-center justify-center gap-2">
        <Tag className="w-4 h-4" style={{ color: props.textColor || '#9a3412' }} />
        <p className="text-sm font-semibold" style={{ color: props.textColor || '#9a3412' }}>
          Dein Gutschein-Code
        </p>
      </div>
      <div
        className="font-mono text-xl font-bold tracking-widest py-3 px-4 rounded-lg break-all"
        style={{
          backgroundColor: props.codeBgColor || '#ffedd5',
          color: props.textColor || '#9a3412',
        }}
      >
        {props.couponCode || 'CODE'}
      </div>
      {props.ctaText && (
        <button
          className="text-sm underline underline-offset-2"
          style={{ color: props.textColor || '#9a3412' }}
        >
          {props.ctaText}
        </button>
      )}
    </div>
  )
}

function SpacerBlock({ block }: BlockRendererProps) {
  const props = block.props as SpacerBlockProps
  return (
    <div
      style={{
        height: `${props.height || 24}px`,
        backgroundColor: props.bgColor === 'transparent' ? undefined : props.bgColor,
      }}
    />
  )
}

function DividerBlock({ block }: BlockRendererProps) {
  const props = block.props as DividerBlockProps
  return (
    <div style={{ textAlign: props.align || 'center', lineHeight: 0 }}>
      <hr
        style={{
          display: 'inline-block',
          width: `${props.width || 100}%`,
          borderTop: `${props.thickness || 1}px ${props.style || 'solid'} ${props.color || '#e5e7eb'}`,
          margin: 0,
        }}
      />
    </div>
  )
}

function ColumnsBlock({ block, globalStyle, isPreview }: BlockRendererProps) {
  const props = block.props as ColumnsBlockProps
  const ratioMap: Record<string, number[]> = {
    '50/50': [50, 50],
    '33/67': [33, 67],
    '67/33': [67, 33],
    '25/75': [25, 75],
    '75/25': [75, 25],
  }
  const ratios = ratioMap[props.ratio] ?? [50, 50]
  const cols = props.columns ?? [[], []]

  return (
    <div style={{ display: 'flex', gap: `${props.gap ?? 16}px` }}>
      {cols.map((colBlocks, colIdx) => (
        <div key={colIdx} style={{ flex: ratios[colIdx] ?? 50 }}>
          {colBlocks.length === 0 ? (
            <div className="h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-xs text-gray-300">Spalte {colIdx + 1}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {colBlocks.map((b) => (
                <BlockRendererSwitch key={b.id} block={b} globalStyle={globalStyle} isPreview={isPreview} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function EmailCaptureBlock({ block }: BlockRendererProps) {
  const props = block.props as EmailCaptureBlockProps

  return (
    <div className="flex gap-2">
      <input
        type="email"
        placeholder={props.placeholder || 'Deine E-Mail-Adresse'}
        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none"
        readOnly
        style={{ borderRadius: `${props.borderRadius ?? 8}px` }}
      />
      <button
        className="px-4 py-2 text-sm font-semibold whitespace-nowrap"
        style={{
          backgroundColor: props.buttonBgColor || '#3b82f6',
          color: props.buttonTextColor || '#ffffff',
          borderRadius: `${props.borderRadius ?? 8}px`,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {props.buttonText || 'Anmelden'}
      </button>
    </div>
  )
}

function PhoneCaptureBlock({ block }: BlockRendererProps) {
  const props = block.props as PhoneCaptureBlockProps

  return (
    <div className="flex gap-2">
      <div
        className="flex-1 flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 bg-white"
        style={{ borderRadius: `${props.borderRadius ?? 8}px` }}
      >
        <span className="text-gray-400 text-xs">🇩🇪 +49</span>
        <span className="text-gray-300">{props.placeholder || 'Telefonnummer'}</span>
      </div>
      <button
        className="px-4 py-2 text-sm font-semibold whitespace-nowrap"
        style={{
          backgroundColor: props.buttonBgColor || '#3b82f6',
          color: props.buttonTextColor || '#ffffff',
          borderRadius: `${props.borderRadius ?? 8}px`,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {props.buttonText || 'Bestätigen'}
      </button>
    </div>
  )
}

// ─── Main Renderer Switch ─────────────────────────────────────────────────────

export function BlockRendererSwitch({ block, isPreview, globalStyle = DEFAULT_GLOBAL_STYLE }: BlockRendererProps) {
  const paddingStyle: React.CSSProperties = block.padding
    ? {
        paddingTop: `${block.padding.top}px`,
        paddingRight: `${block.padding.right}px`,
        paddingBottom: `${block.padding.bottom}px`,
        paddingLeft: `${block.padding.left}px`,
      }
    : {}

  const inner = (() => {
    switch (block.type) {
      case 'headline':    return <HeadlineBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'text':        return <TextBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'list':        return <ListBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'image':       return <ImageBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'video':       return <VideoBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'button':      return <ButtonBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'social':      return <SocialBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'icon':        return <IconBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'html':        return <HtmlBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'countdown':   return <CountdownBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'gif':         return <GifBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'tagesMenue':  return <TagesMenueBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'coupon':      return <CouponBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'spacer':      return <SpacerBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'divider':     return <DividerBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'columns2':
      case 'columns3':    return <ColumnsBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'emailCapture':  return <EmailCaptureBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      case 'phoneCapture':  return <PhoneCaptureBlock block={block} isPreview={isPreview} globalStyle={globalStyle} />
      default:            return <div className="text-xs text-gray-400 italic p-2">Unbekannter Block</div>
    }
  })()

  if (!isPreview) return <div style={paddingStyle}>{inner}</div>
  return <div style={paddingStyle}>{inner}</div>
}
