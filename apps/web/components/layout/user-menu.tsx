'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { apiLogout } from '@/lib/api'

export interface UserMenuProps {
  displayName: string
}

export function UserMenu({ displayName }: UserMenuProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    try {
      await apiLogout()
      router.push('/')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        void signOut()
      }}
      className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold transition-colors hover:border-live hover:text-live disabled:opacity-60"
    >
      {pending ? 'Signing out…' : `Sign out ${displayName}`}
    </button>
  )
}
