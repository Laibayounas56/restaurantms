import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/ToastProvider'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'RestaurantMS',
    template: '%s — RestaurantMS',
  },
  description: 'Restaurant Management System — digitalize your restaurant operations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}


