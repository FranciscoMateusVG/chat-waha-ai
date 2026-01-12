import { test, expect } from '@playwright/test'

test.describe('Service Health', () => {
  test('API health endpoint returns ok', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health')
    expect(response.ok()).toBeTruthy()

    const body = await response.json()
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBeDefined()
  })

  test('Frontend is serving', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Chat WAHA|Carregando/)
  })
})
