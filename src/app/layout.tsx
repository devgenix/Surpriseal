import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';
import { CurrencyProvider } from '@/context/CurrencyContext';

const font = Plus_Jakarta_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Supriseal - Create Unforgettable Digital Surprises',
  description: 'Turn birthdays and anniversaries into a structured digital journey.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Supriseal',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 0,
  viewportFit: 'cover',
  themeColor: '#e64c19',
}

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import TopProgressBar from '@/components/ui/TopProgressBar';
import { Suspense } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Outfit:wght@100..900&family=Space+Grotesk:wght@300..700&family=Homemade+Apple&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&display=swap" rel="stylesheet" />
      </head>
      <body className={font.className}>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <AuthProvider>
          <ThemeProvider>
            <ThemeRegistry>
              <CurrencyProvider>
                {children}
              </CurrencyProvider>
            </ThemeRegistry>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
