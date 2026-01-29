import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/auth/SessionProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { ChakraProvider } from '@/components/providers/ChakraProvider'
import Navbar from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kantine Platform',
  description: 'Online-Bestellungen für Kantinen und Catering',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={inter.className}>
        <ChakraProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col min-h-0">
                  {children}
                </div>
              </div>
            </SessionProvider>
          </ThemeProvider>
        </ChakraProvider>
      </body>
    </html>
  )
}
