/**
 * SEPA validation utilities (PROJ-15)
 * IBAN: ISO 13616 format check + Luhn/mod-97 checksum
 * BIC: ISO 9362 format
 * Gläubiger-ID: ISO 25577
 */

const IBAN_COUNTRY_LENGTHS: Record<string, number> = {
  AT: 20, BE: 16, CH: 21, CY: 28, CZ: 24, DE: 22, DK: 18,
  EE: 20, ES: 24, FI: 18, FR: 27, GB: 22, GR: 27, HR: 21,
  HU: 28, IE: 22, IS: 26, IT: 27, LI: 21, LT: 20, LU: 20,
  LV: 21, MC: 27, MT: 31, NL: 18, NO: 15, PL: 28, PT: 25,
  RO: 24, SE: 24, SI: 19, SK: 24, SM: 27,
}

/**
 * Validates an IBAN string.
 * Returns null if valid, or an error message string.
 */
export function validateIban(raw: string): string | null {
  const iban = raw.replace(/\s/g, '').toUpperCase()
  if (iban.length < 5) return 'IBAN ist zu kurz.'

  const country = iban.slice(0, 2)
  const expectedLen = IBAN_COUNTRY_LENGTHS[country]
  if (!expectedLen) return `Unbekanntes Länderkürzel "${country}".`
  if (iban.length !== expectedLen) {
    return `IBAN für ${country} muss ${expectedLen} Zeichen lang sein (aktuell: ${iban.length}).`
  }

  // Rearrange: move first 4 chars to end, convert letters to digits
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  const numeric = rearranged
    .split('')
    .map((c) => (c >= 'A' && c <= 'Z' ? String(c.charCodeAt(0) - 55) : c))
    .join('')

  // Mod-97 check
  let remainder = 0
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + parseInt(numeric[i], 10)) % 97
  }
  if (remainder !== 1) return 'IBAN-Prüfziffer ist ungültig.'

  return null
}

/**
 * Validates a BIC/SWIFT code (8 or 11 characters).
 * Returns null if valid, or an error message string.
 */
export function validateBic(raw: string): string | null {
  const bic = raw.replace(/\s/g, '').toUpperCase()
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bic)) {
    return 'BIC muss 8 oder 11 Zeichen haben (z.B. DEUTDEDB oder DEUTDEDBXXX).'
  }
  return null
}

/**
 * Validates a SEPA Creditor Identifier (Gläubiger-ID).
 * Format: 2 letter country code + 2 check digits + 3 letter creditor business code + up to 28 alphanumeric chars
 * Example: DE98ZZZ09999999999
 * Returns null if valid, or an error message string.
 */
export function validateCreditorId(raw: string): string | null {
  const id = raw.replace(/\s/g, '').toUpperCase()
  if (!/^[A-Z]{2}[0-9]{2}[A-Z]{3}[A-Z0-9]{1,28}$/.test(id)) {
    return 'Ungültige Gläubiger-ID. Format: 2 Länderbuchstaben + 2 Prüfziffern + 3 Buchstaben (Geschäftsbereich) + bis zu 28 alphanumerische Zeichen (z.B. DE98ZZZ09999999999).'
  }
  return null
}

/**
 * Returns a masked IBAN string for display (e.g. "DE89 •••• •••• •••• 3700")
 */
export function maskIban(iban: string): string {
  const clean = iban.replace(/\s/g, '').toUpperCase()
  if (clean.length < 8) return clean
  const prefix = clean.slice(0, 4)
  const suffix = clean.slice(-4)
  const middle = '•'.repeat(Math.max(0, clean.length - 8))
  // Group into blocks of 4
  const full = prefix + middle + suffix
  return full.match(/.{1,4}/g)?.join(' ') ?? full
}
