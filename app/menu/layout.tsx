import { ForceLightMode } from '@/components/menu/ForceLightMode'
import { MarketingPopupWrapper } from '@/components/marketing/MarketingPopupWrapper'

/** Speiseplan immer im Light Mode – unabhängig von der globalen Theme-Einstellung */
/** Marketing Popup: nur auf Menü-Seite (Kunden-Einstieg), 1x pro ungelesener Nachricht */
export default function MenuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ForceLightMode>
      {children}
      <MarketingPopupWrapper />
    </ForceLightMode>
  )
}
