import type { Metadata } from 'next'
import { AuthForm } from '@/components/mma/auth-form'

export const metadata: Metadata = { title: 'Create account' }

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-sm px-4 py-20">
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Create account</h1>
      <AuthForm mode="register" />
    </main>
  )
}
