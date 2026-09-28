import { expect, test } from '@playwright/test'

function unique() {
  return `e2e_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`
}

test('register, land on the homepage, then sign out', async ({ page }) => {
  const username = unique()
  const password = 'a-long-enough-password'

  await page.goto('/register')
  await page.getByLabel('Email').fill(`${username}@example.com`)
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Display name').fill('E2E Tester')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('button', { name: /Sign out/ })).toBeVisible()

  await page.getByRole('button', { name: /Sign out/ }).click()
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
})

test('a short password surfaces the server field error', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Email').fill(`${unique()}@example.com`)
  await page.getByLabel('Username').fill(unique())
  await page.getByLabel('Display name').fill('E2E Tester')
  await page.getByLabel('Password').fill('short')
  await page.getByRole('button', { name: 'Create account' }).click()

  // The server's own message, not a client guess.
  await expect(page.getByText('Use at least 12 characters')).toBeVisible()
})

test('an invalid email surfaces the server field error', async ({ page }) => {
  await page.goto('/register')
  await page.getByLabel('Email').fill('not-an-email')
  await page.getByLabel('Username').fill(unique())
  await page.getByLabel('Display name').fill('E2E Tester')
  await page.getByLabel('Password').fill('a-long-enough-password')
  await page.getByRole('button', { name: 'Create account' }).click()

  await expect(page.getByText('Invalid email address')).toBeVisible()
})

test('signing in with the wrong password shows the generic error', async ({ page }) => {
  const username = unique()
  const password = 'a-long-enough-password'

  await page.goto('/register')
  await page.getByLabel('Email').fill(`${username}@example.com`)
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Display name').fill('E2E Tester')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page).toHaveURL('/')

  await page.getByRole('button', { name: /Sign out/ }).click()
  await page.goto('/login')
  await page.getByLabel('Email').fill(`${username}@example.com`)
  await page.getByLabel('Password').fill('definitely-not-the-password')
  await page.getByRole('button', { name: 'Sign in' }).click()

  // The same message whether the email is unknown or the password is wrong.
  // Next's route announcer is also role=alert, so scope to the form.
  await expect(page.locator('form [role="alert"]')).toHaveText(
    'Email or password is incorrect.',
  )
})
