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

export interface HeadlineBlockProps {
  content: string // TipTap JSON string
  level: 'h1' | 'h2' | 'h3'
  color: string
  align: 'left' | 'center' | 'right'
}

export interface TextBlockProps {
  content: string // TipTap JSON string
  color: string
  fontSize: 'sm' | 'base' | 'lg'
}

export interface ImageBlockProps {
  url: string
  altText: string
  align: 'left' | 'center' | 'right'
  width: string // e.g. '100%', '50%', '300px'
  linkUrl: string
}

export interface ButtonBlockProps {
  label: string
  url: string
  bgColor: string
  textColor: string
  align: 'left' | 'center' | 'right'
}

export interface SpacerBlockProps {
  height: number // px
}

export interface DividerBlockProps {
  color: string
  thickness: number // px
  style: 'solid' | 'dashed' | 'dotted'
}

export interface ColumnsBlockProps {
  ratio: '50/50' | '33/67' | '67/33'
  columns: Block[][] // each column is a list of blocks
}

export interface CouponBlockProps {
  couponId: string
  couponCode: string
  ctaText: string
}

export type BlockProps =
  | HeadlineBlockProps
  | TextBlockProps
  | ImageBlockProps
  | ButtonBlockProps
  | SpacerBlockProps
  | DividerBlockProps
  | ColumnsBlockProps
  | CouponBlockProps

export interface Block {
  id: string
  type: BlockType
  props: BlockProps
}

export interface GlobalStyle {
  bgColor: string
  primaryColor: string
  fontFamily: string
  padding: number // px inner padding of canvas
}

export interface TemplateContent {
  globalStyle: GlobalStyle
  blocks: Block[]
}

export const DEFAULT_GLOBAL_STYLE: GlobalStyle = {
  bgColor: '#ffffff',
  primaryColor: '#3b82f6',
  fontFamily: 'Inter',
  padding: 24,
}

export const DEFAULT_BLOCK_PROPS: Record<BlockType, BlockProps> = {
  headline: { content: '', level: 'h1', color: '#111111', align: 'left' } as HeadlineBlockProps,
  text: { content: '', color: '#333333', fontSize: 'base' } as TextBlockProps,
  image: { url: '', altText: '', align: 'center', width: '100%', linkUrl: '' } as ImageBlockProps,
  button: { label: 'Jetzt entdecken', url: '', bgColor: '#3b82f6', textColor: '#ffffff', align: 'center' } as ButtonBlockProps,
  spacer: { height: 24 } as SpacerBlockProps,
  divider: { color: '#e5e7eb', thickness: 1, style: 'solid' } as DividerBlockProps,
  columns2: { ratio: '50/50', columns: [[], []] } as ColumnsBlockProps,
  columns3: { ratio: '50/50', columns: [[], [], []] } as ColumnsBlockProps,
  coupon: { couponId: '', couponCode: '', ctaText: 'Code kopieren' } as CouponBlockProps,
}

export const PLACEHOLDER_VARIABLES = [
  { label: 'Vorname', value: '{{Vorname}}' },
  { label: 'Nachname', value: '{{Nachname}}' },
  { label: 'E-Mail', value: '{{E-Mail}}' },
  { label: 'Standort', value: '{{Standort}}' },
  { label: 'Gericht des Tages', value: '{{Gericht_des_Tages}}' },
  { label: 'Coupon-Code', value: '{{Coupon_Code}}' },
  { label: 'Datum', value: '{{Datum}}' },
]

export const PREVIEW_DATA: Record<string, string> = {
  '{{Vorname}}': 'Max',
  '{{Nachname}}': 'Mustermann',
  '{{E-Mail}}': 'max@example.de',
  '{{Standort}}': 'Berlin Mitte',
  '{{Gericht_des_Tages}}': 'Schnitzel mit Pommes',
  '{{Coupon_Code}}': 'SOMMER25',
  '{{Datum}}': new Date().toLocaleDateString('de-DE'),
}

export function fillPlaceholders(text: string, data: Record<string, string> = PREVIEW_DATA): string {
  return text.replace(/\{\{[^}]+\}\}/g, (match) => data[match] ?? match)
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}
