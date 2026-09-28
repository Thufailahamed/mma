import {
  Award,
  BarChart3,
  CalendarDays,
  FileText,
  Flame,
  History,
  ListOrdered,
  Trophy,
  Users,
} from 'lucide-react'
import { HomeSection } from '@/components/home/home-section'
import { LiveCta } from '@/components/home/live-cta'
import { LiveIndicator, StatCard } from '@/components/mma'

/**
 * Section order is fixed by the brief. Phase 1 renders every section's empty
 * state; later phases replace the empty bodies with real data and the order
 * does not move.
 */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl space-y-12 px-4 py-10">
      <section className="relative overflow-hidden rounded-card border border-border bg-gradient-to-br from-[#1a0508] to-background p-8 text-center shadow-card sm:p-12">
        <LiveIndicator state="upcoming" label="NO UPCOMING EVENT" className="mx-auto" />
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          The next fight is your call
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Events load from the D1 <code>events</code> table. This card lights up the moment the
          first card is announced.
        </p>
        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Record" value="—" />
          <StatCard label="KO / Sub" value="—" />
          <StatCard label="Community" value="—" />
          <StatCard label="Your XP" value="—" />
        </div>
      </section>

      <HomeSection
        title="Upcoming fights"
        icon={CalendarDays}
        emptyTitle="No bouts scheduled"
        emptyDescription="Fight cards appear here once an event is loaded into D1."
        action={{ href: '/events', label: 'Browse events' }}
        href="/events"
      />
      <HomeSection
        title="Latest analysis"
        icon={FileText}
        emptyTitle="No articles published"
        emptyDescription="The editorial desk has not published anything yet."
        action={{ href: '/articles', label: 'Read the archive' }}
        href="/articles"
      />
      <HomeSection
        title="Community predictions"
        icon={BarChart3}
        emptyTitle="No predictions yet"
        emptyDescription="Consensus percentages are calculated from submitted picks, so they need an event first."
      />
      <HomeSection
        title="Daily trivia"
        icon={Award}
        emptyTitle="Today's set is empty"
        emptyDescription="Questions are scheduled per day from the trivia tables."
      />
      <HomeSection
        title="Leaderboard"
        icon={Trophy}
        emptyTitle="No ranked users"
        emptyDescription="Earn prediction points and trivia XP to climb the board."
        href="/leaderboard"
      />
      <HomeSection
        title="Rankings"
        icon={ListOrdered}
        emptyTitle="No rankings published"
        emptyDescription="Rankings are versioned by date per division, starting Phase 2."
        href="/rankings"
      />
      <HomeSection
        title="Trending fighters"
        icon={Flame}
        emptyTitle="Nothing trending"
        emptyDescription="Trending is derived from follows, predictions, and page views."
        href="/fighters"
      />
      <HomeSection
        title="Latest results"
        icon={History}
        emptyTitle="No completed fights"
        emptyDescription="Results and official judge scores land here once events finish."
      />
      <HomeSection
        title="Who's online"
        icon={Users}
        emptyTitle="No activity recorded"
        emptyDescription="Active users are counted from the last 30 days of registrations."
      />

      <LiveCta />
    </main>
  )
}
