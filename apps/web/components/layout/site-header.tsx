import Link from 'next/link'
import { UserMenu } from '@/components/layout/user-menu'

const NAV = [
  { href: '/fighters', label: 'Fighters' },
  { href: '/events', label: 'Events' },
  { href: '/rankings', label: 'Rankings' },
  { href: '/predict', label: 'Predict' },
  { href: '/trivia', label: 'Trivia' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

export interface SiteHeaderProps {
  displayName?: string
}

export function SiteHeader({ displayName }: SiteHeaderProps) {
  const isSignedIn = displayName !== undefined

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center font-display text-lg font-extrabold tracking-tight"
        >
          CAGE
        </Link>

        <nav aria-label="Primary" className="hidden gap-5 text-sm text-muted-foreground sm:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <span className="ml-auto rounded bg-live px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] text-white">
          LIVE
        </span>

        {isSignedIn ? (
          <UserMenu displayName={displayName} />
        ) : (
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold transition-colors hover:border-live hover:text-live"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  )
}
