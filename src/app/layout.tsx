import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';
import { CurrencyProvider } from '@/context/CurrencyContext';

const font = Plus_Jakarta_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Supriseal - Create Unforgettable Digital Surprises',
  description: 'Turn birthdays and anniversaries into a structured digital journey.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover',
  themeColor: '#e64c19',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Supriseal',
  },
}

import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className={font.className}>
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
