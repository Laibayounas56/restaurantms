import { ToastProvider } from '@/components/ui/ToastProvider'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
