import { expect, test } from '@playwright/test'

const WIDTHS = [375, 768, 1440] as const

for (const width of WIDTHS) {
  test(`no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    // 'networkidle' never settles behind a deployed Worker, which keeps
    // connections open. Wait for a deterministic signal instead.
    await page.waitForLoadState('load')
    await page.locator('main h1').first().waitFor()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('touch targets are at least 44px on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  const offenders = await page.evaluate(() => {
    const tooSmall: string[] = []
    for (const element of document.querySelectorAll('a, button')) {
      const rect = element.getBoundingClientRect()
      // Hidden elements have no box and cannot be tapped anyway.
      if (rect.width === 0 || rect.height === 0) continue
      if (rect.height < 44) {
        tooSmall.push(`${element.tagName}: ${(element.textContent ?? '').trim().slice(0, 30)}`)
      }
    }
    return tooSmall
  })

  expect(offenders).toEqual([])
})

test('nav collapses on a phone and the dense sections reflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')

  // The primary nav is hidden below sm rather than overflowing.
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeHidden()

  // Sections stack to a single full-width column.
  const sections = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('main > section'))
    return nodes.map((node) => Math.round(node.getBoundingClientRect().width))
  })
  const viewport = 375
  for (const width of sections) {
    expect(width).toBeLessThanOrEqual(viewport)
  }
})
