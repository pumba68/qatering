import { ForceLightMode } from '@/components/menu/ForceLightMode'

/** Speiseplan immer im Light Mode – unabhängig von der globalen Theme-Einstellung */
export default function MenuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ForceLightMode>{children}</ForceLightMode>
}
