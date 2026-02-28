// POS-Layout: kein globales Nav, keine Sidebar – reine Kiosk-Ansicht
export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white antialiased">
      {children}
    </div>
  )
}
