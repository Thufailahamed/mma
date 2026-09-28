import { expect, test } from '@playwright/test'

const SECTION_HEADINGS = [
  'Upcoming fights',
  'Latest analysis',
  'Community predictions',
  'Daily trivia',
  'Leaderboard',
  'Rankings',
  'Trending fighters',
  'Latest results',
]

test('every homepage section renders a designed empty state', async ({ page }) => {
  await page.goto('/')

  for (const heading of SECTION_HEADINGS) {
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  }

  // Each empty state states what is missing rather than rendering nothing.
  await expect(page.getByText('No bouts scheduled')).toBeVisible()
  await expect(page.getByText('No predictions yet')).toBeVisible()
  await expect(page.getByText('No ranked users')).toBeVisible()
})

test('the fight night CTA is honestly labelled, not broken', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Fight Night Mode' })).toBeVisible()
  await expect(page.getByText('COMING SOON')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Arrives in Phase 6' })).toBeDisabled()
})

test('the site chrome renders at every width', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'CAGE' })).toBeVisible()
  await expect(page.getByText('LIVE', { exact: true })).toBeVisible()

  // The primary nav collapses below sm rather than overflowing. It stays in
  // the DOM so the links remain crawlable; getByRole would skip it while
  // display:none, so address it directly.
  const nav = page.locator('nav[aria-label="Primary"]')
  await expect(nav).toHaveCount(1)
  const width = page.viewportSize()?.width ?? 0
  if (width < 640) {
    await expect(nav).toBeHidden()
  } else {
    await expect(nav).toBeVisible()
  }
})
