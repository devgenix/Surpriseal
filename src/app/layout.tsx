import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import ThemeRegistry from '@/components/ThemeRegistry/ThemeRegistry';
import { CurrencyProvider } from '@/context/CurrencyContext';

const font = Plus_Jakarta_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Supriseal - Create Unforgettable Digital Surprises',
  description: 'Turn birthdays and anniversaries into a structured digital journey.',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
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

import { 
  Dancing_Script, 
  Playfair_Display, 
  Outfit, 
  Space_Grotesk, 
  Homemade_Apple, 
  Cormorant_Garamond 
} from 'next/font/google'

import { cn } from "@/lib/utils";

const dancingScript = Dancing_Script({ subsets: ['latin'], variable: '--font-dancing-script' })
const playfairDisplay = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair-display' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })
const homemadeApple = Homemade_Apple({ 
  subsets: ['latin'], 
  variable: '--font-homemade-apple',
  weight: '400'
})
const cormorantGaramond = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-cormorant-garamond' })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" crossOrigin="anonymous" />
      </head>
      <body className={cn(
        font.className, 
        dancingScript.variable,
        playfairDisplay.variable,
        outfit.variable,
        spaceGrotesk.variable,
        homemadeApple.variable,
        cormorantGaramond.variable
      )}>
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
