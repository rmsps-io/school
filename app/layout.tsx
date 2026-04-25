import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'

// Body font — clean and modern for UI
const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

// Display font — elegant for headings
const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Residential Maa Saraswati Public School',
    template: '%s | RMSPS',
  },
  description:
    'Residential Maa Saraswati Public School — Kating Chowk, Supaul. A premier residential school providing quality education with holistic development.',
  keywords: [
    'Residential Maa Saraswati Public School',
    'RMSPS',
    'Supaul school',
    'Bihar school',
    'Kating Chowk',
    'residential school',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    title: 'Residential Maa Saraswati Public School',
    description: 'Premium school management system — Kating Chowk, Supaul, Bihar',
    siteName: 'RMSPS',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${dmSerif.variable}`}
      suppressHydrationWarning
    >
      <body className={jakartaSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
