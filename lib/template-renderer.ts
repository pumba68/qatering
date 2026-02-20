/**
 * Server-side utility: converts Block-Editor JSON → HTML
 * Shared between PROJ-9 (email) and PROJ-10 (in-app / push).
 */

import type {
  TemplateContent,
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
} from '@/components/marketing/editor/editor-types'

// ─── Placeholder substitution ─────────────────────────────────────────────────

export function fillPlaceholders(
  text: string,
  variables: Record<string, string>,
): string {
  return text.replace(/\{\{[^}]+\}\}/g, (match) => variables[match] ?? match)
}

// ─── TipTap JSON → HTML (minimal serialiser) ─────────────────────────────────

type TipTapNode = {
  type: string
  content?: TipTapNode[]
  text?: string
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  attrs?: Record<string, unknown>
}

function tiptapNodeToHtml(node: TipTapNode, variables: Record<string, string>): string {
  if (node.type === 'text') {
    let text = fillPlaceholders(node.text ?? '', variables)
    // Escape HTML
    text = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'bold') text = `<strong>${text}</strong>`
        else if (mark.type === 'italic') text = `<em>${text}</em>`
        else if (mark.type === 'underline') text = `<u>${text}</u>`
        else if (mark.type === 'strike') text = `<s>${text}</s>`
        else if (mark.type === 'link') {
          const href = mark.attrs?.href ?? '#'
          text = `<a href="${href}" style="color:inherit;">${text}</a>`
        }
      }
    }
    return text
  }

  const children = (node.content ?? [])
    .map((n) => tiptapNodeToHtml(n, variables))
    .join('')

  switch (node.type) {
    case 'doc':
      return children
    case 'paragraph':
      return children ? `<p style="margin:0 0 8px 0;">${children}</p>` : '<br>'
    case 'bulletList':
      return `<ul style="margin:0 0 8px 16px;padding:0;">${children}</ul>`
    case 'orderedList':
      return `<ol style="margin:0 0 8px 16px;padding:0;">${children}</ol>`
    case 'listItem':
      return `<li>${children}</li>`
    case 'blockquote':
      return `<blockquote style="border-left:3px solid #ccc;margin:0 0 8px 0;padding-left:12px;color:#555;">${children}</blockquote>`
    case 'hardBreak':
      return '<br>'
    default:
      return children
  }
}

function tiptapJsonToHtml(json: string, variables: Record<string, string>): string {
  try {
    const doc = JSON.parse(json) as TipTapNode
    return tiptapNodeToHtml(doc, variables)
  } catch {
    // Fall back to treating the value as plain text
    return fillPlaceholders(json, variables)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }
}

// ─── Block renderers ──────────────────────────────────────────────────────────

function renderHeadline(props: HeadlineBlockProps, variables: Record<string, string>): string {
  const html = tiptapJsonToHtml(props.content, variables)
  const tag = props.level
  const size = tag === 'h1' ? '28px' : tag === 'h2' ? '22px' : '18px'
  return `<${tag} style="margin:0 0 12px 0;font-size:${size};font-weight:700;color:${props.color};text-align:${props.align};">${html}</${tag}>`
}

function renderText(props: TextBlockProps, variables: Record<string, string>): string {
  const html = tiptapJsonToHtml(props.content, variables)
  const size = props.fontSize === 'sm' ? '13px' : props.fontSize === 'lg' ? '17px' : '15px'
  return `<div style="font-size:${size};color:${props.color};line-height:1.6;">${html}</div>`
}

function renderImage(props: ImageBlockProps): string {
  if (!props.url) return ''
  const align = props.align === 'center' ? 'margin:0 auto' : props.align === 'right' ? 'margin-left:auto' : ''
  const img = `<img src="${props.url}" alt="${props.altText ?? ''}" style="display:block;max-width:100%;width:${props.width};${align};">`
  return props.linkUrl
    ? `<a href="${props.linkUrl}" style="display:block;">${img}</a>`
    : img
}

function renderButton(props: ButtonBlockProps, variables: Record<string, string>): string {
  const label = fillPlaceholders(props.label, variables)
  const wrapAlign =
    props.align === 'center' ? 'text-align:center;' : props.align === 'right' ? 'text-align:right;' : ''
  return `<div style="${wrapAlign}"><a href="${props.url}" style="display:inline-block;padding:12px 24px;background:${props.bgColor};color:${props.textColor};border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a></div>`
}

function renderSpacer(props: SpacerBlockProps): string {
  return `<div style="height:${props.height}px;"></div>`
}

function renderDivider(props: DividerBlockProps): string {
  return `<hr style="border:none;border-top:${props.thickness}px ${props.style} ${props.color};margin:0;">`
}

function renderColumns(
  props: ColumnsBlockProps,
  globalStyle: GlobalStyle,
  variables: Record<string, string>,
): string {
  const [left, right] = props.ratio.split('/')
  const ratios = [parseInt(left), parseInt(right)]
  const total = ratios.reduce((a, b) => a + b, 0)

  const cols = props.columns.map((colBlocks, i) => {
    const width = `${(ratios[i] / total) * 100}%`
    const inner = colBlocks
      .map((b) => renderBlock(b, globalStyle, variables))
      .join('')
    return `<td style="width:${width};vertical-align:top;padding:4px;">${inner}</td>`
  })

  return `<table style="width:100%;border-collapse:collapse;"><tr>${cols.join('')}</tr></table>`
}

function renderCoupon(props: CouponBlockProps, variables: Record<string, string>): string {
  const code = fillPlaceholders(props.couponCode, variables)
  const cta = fillPlaceholders(props.ctaText, variables)
  return `<div style="border:2px dashed #e5e7eb;border-radius:8px;padding:16px;text-align:center;">
  <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">Ihr Gutschein-Code:</p>
  <p style="margin:0 0 12px 0;font-size:22px;font-weight:700;letter-spacing:2px;font-family:monospace;">${code}</p>
  <span style="display:inline-block;padding:8px 20px;background:#f3f4f6;border-radius:4px;font-size:13px;cursor:pointer;">${cta}</span>
</div>`
}

// ─── Block dispatcher ─────────────────────────────────────────────────────────

function renderBlock(
  block: Block,
  globalStyle: GlobalStyle,
  variables: Record<string, string>,
): string {
  switch (block.type) {
    case 'headline':
      return renderHeadline(block.props as HeadlineBlockProps, variables)
    case 'text':
      return renderText(block.props as TextBlockProps, variables)
    case 'image':
      return renderImage(block.props as ImageBlockProps)
    case 'button':
      return renderButton(block.props as ButtonBlockProps, variables)
    case 'spacer':
      return renderSpacer(block.props as SpacerBlockProps)
    case 'divider':
      return renderDivider(block.props as DividerBlockProps)
    case 'columns2':
    case 'columns3':
      return renderColumns(block.props as ColumnsBlockProps, globalStyle, variables)
    case 'coupon':
      return renderCoupon(block.props as CouponBlockProps, variables)
    default:
      return ''
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Converts a Block-Editor TemplateContent object into an HTML string.
 *
 * @param content   - Parsed TemplateContent (globalStyle + blocks[])
 * @param variables - Placeholder substitution map, e.g. { '{{Vorname}}': 'Max' }
 * @returns         Safe HTML string ready for server-side delivery
 */
export function renderTemplateToHtml(
  content: TemplateContent,
  variables: Record<string, string> = {},
): string {
  const { globalStyle, blocks } = content

  const fontFamily = globalStyle.fontFamily
    ? `${globalStyle.fontFamily}, sans-serif`
    : 'system-ui, sans-serif'

  const body = blocks
    .map((b) => `<div style="margin-bottom:8px;">${renderBlock(b, globalStyle, variables)}</div>`)
    .join('')

  return `<div style="background:${globalStyle.bgColor};font-family:${fontFamily};padding:${globalStyle.padding}px;">${body}</div>`
}
