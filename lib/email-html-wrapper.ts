/**
 * PROJ-9: E-Mail HTML-Wrapper
 * Bettet den gerenderten Template-HTML-Inhalt in eine vollständige E-Mail-Struktur ein.
 * Fügt hinzu: Tracking-Pixel, Abmelde-Link-Footer, Preheader.
 */

function xmlEsc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface WrapEmailOptions {
  bodyHtml: string          // Gerenderter Inhalt aus template-renderer.ts
  preheaderText?: string    // Vorschautext (nicht sichtbar, aber im Posteingang angezeigt)
  trackingToken: string     // Für Pixel + Unsubscribe-Link
  baseUrl: string           // z.B. https://qatering.vercel.app
  subject: string
}

/**
 * Gibt vollständiges E-Mail-HTML zurück (DOCTYPE + Tracking-Pixel + Unsubscribe-Footer).
 */
export function wrapEmailHtml(opts: WrapEmailOptions): string {
  const { bodyHtml, preheaderText, trackingToken, baseUrl, subject } = opts

  const pixelUrl = `${baseUrl}/api/email-track/open/${trackingToken}`
  const unsubscribeUrl = `${baseUrl}/unsubscribe/${trackingToken}`
  const preheader = preheaderText ? xmlEsc(preheaderText) : xmlEsc(subject)

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${xmlEsc(subject)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,sans-serif;">
  <!-- Preheader: sichtbar in manchen E-Mail-Clients als Vorschautext -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td>
              <!-- Inhalt aus Block-Editor -->
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Sie erhalten diese E-Mail, weil Sie dem Marketing-E-Mail-Versand zugestimmt haben.<br />
                <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline;">Abmelden</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- Tracking-Pixel -->
  <img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;border:0;width:1px;height:1px;" />
</body>
</html>`
}

/**
 * Schreibt alle <a href="..."> Links in Tracking-Redirects um.
 * Ausgenommen: Unsubscribe-Links und Tracking-URLs selbst.
 */
export function rewriteLinksForTracking(html: string, trackingToken: string, baseUrl: string): string {
  return html.replace(
    /href="((?!https?:\/\/[^"]*\/api\/email-track|https?:\/\/[^"]*\/unsubscribe)[^"]+)"/g,
    (_, url) => {
      const clickUrl = `${baseUrl}/api/email-track/click/${trackingToken}?url=${encodeURIComponent(url)}`
      return `href="${clickUrl}"`
    }
  )
}
