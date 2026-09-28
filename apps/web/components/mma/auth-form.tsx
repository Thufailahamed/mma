'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import type { FieldIssue } from '@mma/shared'
import { ApiError, apiPost } from '@/lib/api'

export interface AuthFormProps {
  mode: 'login' | 'register'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [issues, setIssues] = useState<FieldIssue[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setIssues([])
    setMessage(null)

    try {
      const body =
        mode === 'login'
          ? { email, password }
          : { email, username, displayName, password }
      await apiPost(`/api/auth/${mode}`, body)
      router.push('/')
      router.refresh()
    } catch (error) {
      if (error instanceof ApiError) {
        setIssues(error.details)
        setMessage(error.details.length > 0 ? null : error.message)
      } else {
        setMessage('Something went wrong. Please try again.')
      }
    } finally {
      setPending(false)
    }
  }

  const issueFor = (path: string) => issues.find((issue) => issue.path === path)?.message

  const inputClass =
    'h-11 w-full rounded-md border border-border bg-card px-3 text-sm transition-colors focus:border-ring focus:outline-none'

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event)
      }}
      className="space-y-4"
      noValidate
    >
      {message ? (
        <p
          role="alert"
          className="rounded-md border border-live/40 bg-live/10 px-3 py-2 text-sm text-live"
        >
          {message}
        </p>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
        {issueFor('email') ? (
          <span className="text-xs text-live">{issueFor('email')}</span>
        ) : null}
      </label>

      {mode === 'register' ? (
        <>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Username</span>
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={inputClass}
            />
            {issueFor('username') ? (
              <span className="text-xs text-live">{issueFor('username')}</span>
            ) : null}
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Display name</span>
            <input
              name="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={inputClass}
            />
            {issueFor('displayName') ? (
              <span className="text-xs text-live">{issueFor('displayName')}</span>
            ) : null}
          </label>
        </>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Password</span>
        <input
          type="password"
          name="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
        {issueFor('password') ? (
          <span className="text-xs text-live">{issueFor('password')}</span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-md bg-primary font-semibold text-primary-foreground transition-colors hover:bg-live disabled:opacity-60"
      >
        {pending ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === 'login' ? (
          <>
            No account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:text-live">
              Register
            </Link>
          </>
        ) : (
          <>
            Already registered?{' '}
            <Link href="/login" className="font-semibold text-primary hover:text-live">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  )
}
