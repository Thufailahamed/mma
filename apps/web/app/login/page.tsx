import type { Metadata } from 'next'
import { AuthForm } from '@/components/mma/auth-form'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-20">
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Sign in</h1>
      <AuthForm mode="login" />
    </main>
  )
}
