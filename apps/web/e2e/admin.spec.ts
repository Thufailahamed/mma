import { expect, test } from '@playwright/test'

function unique() {
  return `adm_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`
}

test('a normal user is refused admin metrics', async ({ page }) => {
  const username = unique()

  await page.goto('/register')
  await page.getByLabel('Email').fill(`${username}@example.com`)
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Display name').fill('Not An Admin')
  await page.getByLabel('Password').fill('a-long-enough-password')
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL('/')

  // page.request shares the browser context's cookie jar; the standalone
  // `request` fixture would send no session and get 401 instead of 403.
  const response = await page.request.get('/api/admin/metrics', { failOnStatusCode: false })
  expect(response.status()).toBe(403)

  const body = (await response.json()) as { error: { code: string } }
  expect(body.error.code).toBe('FORBIDDEN')
})

test('a normal user cannot smuggle a role through the request body', async ({ page }) => {
  const username = unique()
  await page.goto('/')

  // Playwright's request API does not run the app's JavaScript, so the CSRF
  // header that lib/api.ts normally attaches has to be set explicitly from
  // the cookie the middleware issued.
  const csrf = await page.context().cookies()
  const token = csrf.find((cookie) => cookie.name === 'mma_csrf')?.value
  expect(token).toBeTruthy()

  const response = await page.request.post('/api/auth/register', {
    headers: { 'x-csrf-token': token! },
    data: {
      email: `${username}@example.com`,
      username,
      displayName: 'Sneaky',
      password: 'a-long-enough-password',
      role: 'ADMIN',
      xp: 999_999,
    },
  })

  expect(response.status()).toBe(201)
  const body = (await response.json()) as { data: Record<string, unknown> }
  expect(body.data.role).toBe('USER')
  expect(body.data).not.toHaveProperty('xp')
  expect(body.data).not.toHaveProperty('passwordHash')
})

test('mutating endpoints reject a request with no CSRF header', async ({ page }) => {
  // A context with no CSRF cookie at all.
  const response = await page.request.post('/api/auth/logout', { failOnStatusCode: false })
  expect([401, 403]).toContain(response.status())
})
