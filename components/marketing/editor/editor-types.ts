// ─── Channel Types ────────────────────────────────────────────────────────────

export type EditorChannel = 'EMAIL' | 'IN_APP_BANNER' | 'PROMOTION_BANNER' | 'PUSH'

// ─── Block Types ──────────────────────────────────────────────────────────────

export type BlockType =
  | 'headline'
  | 'text'
  | 'image'
  | 'button'
  | 'spacer'
  | 'divider'
  | 'columns2'
  | 'columns3'
  | 'coupon'
  // New block types
  | 'video'
  | 'social'
  | 'list'
  | 'icon'
  | 'html'
  | 'countdown'
  | 'gif'
  | 'tagesMenue'
  | 'emailCapture'
  | 'phoneCapture'

// ─── Block Props Interfaces ───────────────────────────────────────────────────

export interface HeadlineBlockProps {
  content: string // TipTap JSON string
  level: 'h1' | 'h2' | 'h3' | 'h4'
  color: string
  align: 'left' | 'center' | 'right'
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold'
  letterSpacing: 'tight' | 'normal' | 'wide'
  lineHeight: 'tight' | 'normal' | 'relaxed'
}

export interface TextBlockProps {
  content: string // TipTap JSON string
  color: string
  fontSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  lineHeight: 'tight' | 'normal' | 'relaxed' | 'loose'
}

export interface ImageBlockProps {
  url: string
  altText: string
  align: 'left' | 'center' | 'right'
  width: string // e.g. '100%', '50%', '300px'
  linkUrl: string
  borderRadius: number // px
  border: boolean
  borderColor: string
  borderWidth: number
}

export interface ButtonBlockProps {
  label: string
  url: string
  bgColor: string
  textColor: string
  align: 'left' | 'center' | 'right'
  borderRadius: number // px
  fontSize: 'sm' | 'base' | 'lg'
  paddingX: number // px
  paddingY: number // px
  border: boolean
  borderColor: string
  fullWidth: boolean
}

export interface SpacerBlockProps {
  height: number // px
  bgColor: string
}

export interface DividerBlockProps {
  color: string
  thickness: number // px
  style: 'solid' | 'dashed' | 'dotted'
  width: number // percent
  align: 'left' | 'center' | 'right'
}

export interface ColumnsBlockProps {
  ratio: '50/50' | '33/67' | '67/33' | '25/75' | '75/25'
  columns: Block[][] // each column is a list of blocks
  gap: number // px gap between columns
}

export interface CouponBlockProps {
  couponId: string
  couponCode: string
  ctaText: string
  bgColor: string
  textColor: string
  codeBgColor: string
}

export interface VideoBlockProps {
  url: string // YouTube or Vimeo URL
  altText: string
  thumbnailUrl: string // custom thumbnail override
  borderRadius: number
}

export interface SocialBlockProps {
  align: 'left' | 'center' | 'right'
  iconSize: 'sm' | 'md' | 'lg'
  iconStyle: 'color' | 'monochrome'
  gap: number // px
  links: {
    platform: 'instagram' | 'facebook' | 'linkedin' | 'x' | 'youtube' | 'tiktok' | 'whatsapp'
    url: string
    enabled: boolean
  }[]
}

export interface ListBlockProps {
  content: string // TipTap JSON
  listType: 'bullet' | 'ordered'
  color: string
  fontSize: 'sm' | 'base' | 'lg'
}

export interface IconBlockProps {
  iconName: string // Lucide icon name key
  color: string
  size: number // px
  label: string
  labelColor: string
  align: 'left' | 'center' | 'right'
  bgColor: string
  rounded: boolean
}

export interface HtmlBlockProps {
  html: string
}

export interface CountdownBlockProps {
  targetDate: string // ISO datetime string
  showDays: boolean
  showHours: boolean
  showMinutes: boolean
  showSeconds: boolean
  label: string
  color: string
  bgColor: string
  unitColor: string
  borderRadius: number
}

export interface GifBlockProps {
  url: string
  altText: string
  width: string // e.g. '100%', '300px'
  align: 'left' | 'center' | 'right'
  borderRadius: number
}

export interface TagesMenueBlockProps {
  standortId: string
  standortName: string
  maxGerichte: number // 1–5
  layout: 'list' | 'cards'
  showDescription: boolean
  showPrice: boolean
  showImage: boolean
  primaryColor: string
}

export interface EmailCaptureBlockProps {
  placeholder: string
  buttonText: string
  buttonBgColor: string
  buttonTextColor: string
  attribute: string
  borderRadius: number
}

export interface PhoneCaptureBlockProps {
  placeholder: string
  buttonText: string
  buttonBgColor: string
  buttonTextColor: string
  attribute: string
  borderRadius: number
}

// ─── Union Type ───────────────────────────────────────────────────────────────

export type BlockProps =
  | HeadlineBlockProps
  | TextBlockProps
  | ImageBlockProps
  | ButtonBlockProps
  | SpacerBlockProps
  | DividerBlockProps
  | ColumnsBlockProps
  | CouponBlockProps
  | VideoBlockProps
  | SocialBlockProps
  | ListBlockProps
  | IconBlockProps
  | HtmlBlockProps
  | CountdownBlockProps
  | GifBlockProps
  | TagesMenueBlockProps
  | EmailCaptureBlockProps
  | PhoneCaptureBlockProps

// ─── Block Base ───────────────────────────────────────────────────────────────

export interface BlockPadding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface Block {
  id: string
  type: BlockType
  props: BlockProps
  mobileVisibility: 'both' | 'desktop-only' | 'mobile-only'
  padding: BlockPadding
}

// ─── Global Style ─────────────────────────────────────────────────────────────

export interface GlobalStyle {
  bgColor: string
  contentBgColor: string
  primaryColor: string
  fontFamily: string
  linkColor: string
  padding: number // px inner padding of canvas
  contentWidth: number // px, typically 600
}

// ─── Template Content ─────────────────────────────────────────────────────────

export interface TemplateContent {
  globalStyle: GlobalStyle
  blocks: Block[]
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_GLOBAL_STYLE: GlobalStyle = {
  bgColor: '#f5f5f5',
  contentBgColor: '#ffffff',
  primaryColor: '#3b82f6',
  fontFamily: 'Inter',
  linkColor: '#3b82f6',
  padding: 24,
  contentWidth: 600,
}

export const DEFAULT_PADDING: BlockPadding = { top: 8, right: 0, bottom: 8, left: 0 }

export const DEFAULT_BLOCK_PROPS: Record<BlockType, BlockProps> = {
  headline: {
    content: '',
    level: 'h2',
    color: '#111111',
    align: 'left',
    fontWeight: 'bold',
    letterSpacing: 'normal',
    lineHeight: 'tight',
  } as HeadlineBlockProps,
  text: {
    content: '',
    color: '#333333',
    fontSize: 'base',
    lineHeight: 'relaxed',
  } as TextBlockProps,
  image: {
    url: '',
    altText: '',
    align: 'center',
    width: '100%',
    linkUrl: '',
    borderRadius: 0,
    border: false,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  } as ImageBlockProps,
  button: {
    label: 'Jetzt entdecken',
    url: '',
    bgColor: '#3b82f6',
    textColor: '#ffffff',
    align: 'center',
    borderRadius: 8,
    fontSize: 'base',
    paddingX: 24,
    paddingY: 12,
    border: false,
    borderColor: '#3b82f6',
    fullWidth: false,
  } as ButtonBlockProps,
  spacer: { height: 24, bgColor: 'transparent' } as SpacerBlockProps,
  divider: {
    color: '#e5e7eb',
    thickness: 1,
    style: 'solid',
    width: 100,
    align: 'center',
  } as DividerBlockProps,
  columns2: {
    ratio: '50/50',
    columns: [[], []],
    gap: 16,
  } as ColumnsBlockProps,
  columns3: {
    ratio: '50/50',
    columns: [[], [], []],
    gap: 16,
  } as ColumnsBlockProps,
  coupon: {
    couponId: '',
    couponCode: 'EXAMPLE25',
    ctaText: 'Code kopieren',
    bgColor: '#fff7ed',
    textColor: '#9a3412',
    codeBgColor: '#ffedd5',
  } as CouponBlockProps,
  video: {
    url: '',
    altText: 'Video abspielen',
    thumbnailUrl: '',
    borderRadius: 8,
  } as VideoBlockProps,
  social: {
    align: 'center',
    iconSize: 'md',
    iconStyle: 'color',
    gap: 12,
    links: [
      { platform: 'instagram', url: '', enabled: true },
      { platform: 'facebook', url: '', enabled: true },
      { platform: 'x', url: '', enabled: false },
      { platform: 'linkedin', url: '', enabled: false },
      { platform: 'youtube', url: '', enabled: false },
      { platform: 'tiktok', url: '', enabled: false },
      { platform: 'whatsapp', url: '', enabled: false },
    ],
  } as SocialBlockProps,
  list: {
    content: '',
    listType: 'bullet',
    color: '#333333',
    fontSize: 'base',
  } as ListBlockProps,
  icon: {
    iconName: 'Star',
    color: '#3b82f6',
    size: 48,
    label: '',
    labelColor: '#333333',
    align: 'center',
    bgColor: '#eff6ff',
    rounded: true,
  } as IconBlockProps,
  html: { html: '' } as HtmlBlockProps,
  countdown: {
    targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    showDays: true,
    showHours: true,
    showMinutes: true,
    showSeconds: true,
    label: 'Angebot endet in',
    color: '#111111',
    bgColor: '#f3f4f6',
    unitColor: '#6b7280',
    borderRadius: 8,
  } as CountdownBlockProps,
  gif: {
    url: '',
    altText: '',
    width: '100%',
    align: 'center',
    borderRadius: 0,
  } as GifBlockProps,
  tagesMenue: {
    standortId: '',
    standortName: '',
    maxGerichte: 3,
    layout: 'list',
    showDescription: true,
    showPrice: true,
    showImage: false,
    primaryColor: '#3b82f6',
  } as TagesMenueBlockProps,
  emailCapture: {
    placeholder: 'Deine E-Mail-Adresse',
    buttonText: 'Anmelden',
    buttonBgColor: '#3b82f6',
    buttonTextColor: '#ffffff',
    attribute: 'email',
    borderRadius: 8,
  } as EmailCaptureBlockProps,
  phoneCapture: {
    placeholder: 'Deine Telefonnummer',
    buttonText: 'Bestätigen',
    buttonBgColor: '#3b82f6',
    buttonTextColor: '#ffffff',
    attribute: 'phone',
    borderRadius: 8,
  } as PhoneCaptureBlockProps,
}

// ─── Channel Block Allowlist ──────────────────────────────────────────────────

export const CHANNEL_BLOCK_ALLOWLIST: Record<EditorChannel, BlockType[]> = {
  EMAIL: [
    'headline', 'text', 'list', 'image', 'video', 'gif', 'button', 'social',
    'icon', 'html', 'columns2', 'columns3', 'divider', 'spacer',
    'countdown', 'tagesMenue', 'coupon',
  ],
  IN_APP_BANNER: [
    'headline', 'text', 'list', 'image', 'gif', 'button', 'social',
    'icon', 'html', 'columns2', 'divider', 'spacer',
    'countdown', 'tagesMenue', 'coupon', 'emailCapture', 'phoneCapture',
  ],
  PROMOTION_BANNER: [
    'headline', 'text', 'image', 'gif', 'button', 'icon',
    'columns2', 'divider', 'spacer', 'countdown', 'coupon',
  ],
  PUSH: [], // Settings-only — no block canvas
}

// ─── Placeholder Variables ────────────────────────────────────────────────────

export const PLACEHOLDER_VARIABLES = [
  { label: 'Vorname', value: '{{Vorname}}' },
  { label: 'Nachname', value: '{{Nachname}}' },
  { label: 'E-Mail', value: '{{E-Mail}}' },
  { label: 'Standort', value: '{{Standort}}' },
  { label: 'Gericht des Tages', value: '{{Gericht_des_Tages}}' },
  { label: 'Coupon-Code', value: '{{Coupon_Code}}' },
  { label: 'Datum', value: '{{Datum}}' },
  { label: 'Wallet-Guthaben', value: '{{Wallet_Guthaben}}' },
]

export const PREVIEW_DATA: Record<string, string> = {
  '{{Vorname}}': 'Max',
  '{{Nachname}}': 'Mustermann',
  '{{E-Mail}}': 'max@example.de',
  '{{Standort}}': 'Berlin Mitte',
  '{{Gericht_des_Tages}}': 'Schnitzel mit Pommes',
  '{{Coupon_Code}}': 'SOMMER25',
  '{{Datum}}': new Date().toLocaleDateString('de-DE'),
  '{{Wallet_Guthaben}}': '12,50 €',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fillPlaceholders(text: string, data: Record<string, string> = PREVIEW_DATA): string {
  return text.replace(/\{\{[^}]+\}\}/g, (match) => data[match] ?? match)
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function createBlock(type: BlockType): Block {
  return {
    id: generateId(),
    type,
    props: JSON.parse(JSON.stringify(DEFAULT_BLOCK_PROPS[type])),
    mobileVisibility: 'both',
    padding: { ...DEFAULT_PADDING },
  }
}

// ─── Icon Map (subset of Lucide icons for IconBlock) ─────────────────────────

export const AVAILABLE_ICONS = [
  'Star', 'Heart', 'Zap', 'Bell', 'Check', 'Gift', 'Trophy',
  'ShoppingCart', 'Tag', 'Percent', 'Flame', 'Sparkles', 'Rocket',
  'Coffee', 'Utensils', 'Pizza', 'Apple', 'Leaf', 'Sun', 'Moon',
  'Mail', 'Phone', 'MapPin', 'Clock', 'Calendar', 'User', 'Users',
  'Smile', 'ThumbsUp', 'Award', 'Crown',
] as const

export type AvailableIconName = typeof AVAILABLE_ICONS[number]
