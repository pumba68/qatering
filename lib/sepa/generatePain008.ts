/**
 * SEPA Direct Debit XML Generator – pain.008.003.03 CORE (PROJ-16)
 *
 * Generates a valid ISO 20022 pain.008.003.03 XML file for SEPA Core Direct Debit.
 * Uses plain string building to avoid xmlbuilder2/DOM compatibility issues in Next.js RSC.
 */

export interface SepaCreditor {
  name: string          // Betreiber (initiating party / creditor name)
  iban: string          // Betreiber-IBAN (credit to this account)
  bic: string           // Betreiber-BIC
  creditorId: string    // Gläubiger-ID (CdtrSchmeId)
}

export interface SepaDebtor {
  name: string          // Vertragspartner-Name
  iban: string          // Vertragspartner-IBAN
  bic: string           // Vertragspartner-BIC
  mandateReference: string   // Mandatsreferenz
  mandateDate: Date          // Datum der Mandatsunterzeichnung
}

export interface SepaTransaction {
  endToEndId: string    // Eindeutige Referenz (z.B. Rechnungs-ID oder "INV-2025-01")
  amount: number        // Betrag in EUR (als Dezimalzahl, z.B. 125.50)
  debtor: SepaDebtor
  remittanceInfo?: string  // Verwendungszweck (optional)
}

export interface SepaDirectDebitParams {
  creditor: SepaCreditor
  transactions: SepaTransaction[]
  dueDate: Date             // Fälligkeitsdatum (ReqdColltnDt)
  seqType: 'FRST' | 'RCUR' // FRST = Erstlastschrift, RCUR = Folgelastschrift
  messageId?: string        // Optional: eigene Message-ID
  paymentInfoId?: string    // Optional: eigene Payment-Info-ID
}

/** Formats a Date to YYYY-MM-DD (ISO date, no time). */
function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Formats a Date to YYYY-MM-DDTHH:MM:SS (ISO datetime, no ms). */
function toIsoDateTime(d: Date): string {
  return d.toISOString().slice(0, 19)
}

/**
 * Sanitizes a string for SEPA XML:
 * - Normalizes German umlauts
 * - Strips diacritics
 * - Removes characters not in ISO 20022 character set
 */
function sanitize(s: string, maxLen = 70): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-zA-Z0-9 /\-?:().,'+]/g, '')
    .slice(0, maxLen)
}

/** Escapes special XML characters in text content. */
function xmlEsc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Generates a pain.008.003.03 XML string for SEPA Core Direct Debit.
 * Returns the XML as a string.
 * Throws if required fields are missing or amounts are zero.
 */
export function generatePain008(params: SepaDirectDebitParams): string {
  const { creditor, transactions, dueDate, seqType } = params

  if (!transactions.length) throw new Error('Keine Transaktionen vorhanden.')

  const totalAmount = transactions.reduce((s, t) => s + t.amount, 0)
  if (totalAmount <= 0) throw new Error('Gesamtbetrag muss groesser als 0 sein.')

  const now = new Date()
  const msgId = params.messageId ?? `MSG-${Date.now()}`
  const pmtInfId = params.paymentInfoId ?? `PMTINF-${Date.now()}`

  const creditorName = xmlEsc(sanitize(creditor.name))
  const creditorIban = xmlEsc(creditor.iban.replace(/\s/g, '').toUpperCase())
  const creditorBic = xmlEsc(creditor.bic.toUpperCase())
  const creditorId = xmlEsc(creditor.creditorId)

  const txBlocks = transactions.map((tx) => {
    const debtorName = xmlEsc(sanitize(tx.debtor.name))
    const debtorIban = xmlEsc(tx.debtor.iban.replace(/\s/g, '').toUpperCase())
    const debtorBic = xmlEsc(tx.debtor.bic.toUpperCase())
    const mandateId = xmlEsc(tx.debtor.mandateReference.slice(0, 35))
    const mandateDate = toIsoDate(tx.debtor.mandateDate)
    const e2eId = xmlEsc(tx.endToEndId.slice(0, 35))
    const amount = tx.amount.toFixed(2)
    const remittance = tx.remittanceInfo
      ? `\n      <RmtInf><Ustrd>${xmlEsc(sanitize(tx.remittanceInfo, 140))}</Ustrd></RmtInf>`
      : ''

    return `    <DrctDbtTxInf>
      <PmtId><EndToEndId>${e2eId}</EndToEndId></PmtId>
      <InstdAmt Ccy="EUR">${amount}</InstdAmt>
      <DrctDbtTx>
        <MndtRltdInf>
          <MndtId>${mandateId}</MndtId>
          <DtOfSgntr>${mandateDate}</DtOfSgntr>
        </MndtRltdInf>
      </DrctDbtTx>
      <DbtrAgt><FinInstnId><BIC>${debtorBic}</BIC></FinInstnId></DbtrAgt>
      <Dbtr><Nm>${debtorName}</Nm></Dbtr>
      <DbtrAcct><Id><IBAN>${debtorIban}</IBAN></Id></DbtrAcct>${remittance}
    </DrctDbtTxInf>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.003.03"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="urn:iso:std:iso:20022:tech:xsd:pain.008.003.03 pain.008.003.03.xsd">
  <CstmrDrctDbtInitn>
    <GrpHdr>
      <MsgId>${xmlEsc(msgId)}</MsgId>
      <CreDtTm>${toIsoDateTime(now)}</CreDtTm>
      <NbOfTxs>${transactions.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <InitgPty><Nm>${creditorName}</Nm></InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>${xmlEsc(pmtInfId)}</PmtInfId>
      <PmtMtd>DD</PmtMtd>
      <NbOfTxs>${transactions.length}</NbOfTxs>
      <CtrlSum>${totalAmount.toFixed(2)}</CtrlSum>
      <PmtTpInf>
        <SvcLvl><Cd>SEPA</Cd></SvcLvl>
        <LclInstrm><Cd>CORE</Cd></LclInstrm>
        <SeqTp>${seqType}</SeqTp>
      </PmtTpInf>
      <ReqdColltnDt>${toIsoDate(dueDate)}</ReqdColltnDt>
      <Cdtr><Nm>${creditorName}</Nm></Cdtr>
      <CdtrAcct><Id><IBAN>${creditorIban}</IBAN></Id></CdtrAcct>
      <CdtrAgt><FinInstnId><BIC>${creditorBic}</BIC></FinInstnId></CdtrAgt>
      <CdtrSchmeId>
        <Id>
          <PrvtId>
            <Othr>
              <Id>${creditorId}</Id>
              <SchmeNm><Prtry>SEPA</Prtry></SchmeNm>
            </Othr>
          </PrvtId>
        </Id>
      </CdtrSchmeId>
${txBlocks}
    </PmtInf>
  </CstmrDrctDbtInitn>
</Document>`
}

/**
 * Calculates the earliest allowed collection date for SEPA CORE.
 * CORE requires at least 5 business days lead time (weekends excluded, no holidays for MVP).
 */
export function earliestSepaCoreDueDate(): Date {
  const d = new Date()
  let workdays = 0
  while (workdays < 5) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) workdays++ // skip Sunday (0) and Saturday (6)
  }
  d.setHours(0, 0, 0, 0)
  return d
}
