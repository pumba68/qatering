// PROJ-25: Dashboard wurde durch den Customer Entry Flow ersetzt.
// Kunden landen jetzt direkt auf der Kantine-Auswahl (/).
import { redirect } from 'next/navigation'

export default function DashboardPage() {
  redirect('/')
}
