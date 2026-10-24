import type { Metadata } from 'next'
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google'

import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
const _playfairDisplay = Playfair_Display({ subsets: ["latin"] });
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
export const metadata: Metadata = {
  title: 'Dr. Tushar & Dr. Shweta- Wedding Invitation',
  description: 'We warmly invite you to join us in celebrating our wedding and to be a part of the happiness, love, and unforgettable memories that make this occasion so special. ✨Your presence will make our special day even more memorable, and your love and blessings will mean the world to us. 💕🙏',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
         <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Alice&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={playfair.className}>
        {children}
        {/* <Analytics /> */}
      </body>
    </html>
  )
}
