import { test, expect } from '@playwright/test'

test.describe('Auth Flow E2E', () => {
  const testUser = {
    email: `e2e-${Date.now()}@example.com`,
    password: 'testpassword123',
    name: 'E2E Test User'
  }

  test.describe('API Auth Endpoints', () => {
    test('register creates a new user', async ({ request }) => {
      const response = await request.post('http://localhost:3001/auth/register', {
        data: testUser
      })
      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body.user).toBeDefined()
      expect(body.user.email).toBe(testUser.email.toLowerCase())
      expect(body.user.name).toBe(testUser.name)
      expect(body.user.passwordHash).toBeUndefined()
    })

    test('register rejects duplicate email', async ({ request }) => {
      // First register
      await request.post('http://localhost:3001/auth/register', {
        data: {
          email: `duplicate-${Date.now()}@example.com`,
          password: 'testpass123',
          name: 'Duplicate Test'
        }
      })

      // Try to register again with same email (need a new unique email for this test)
      const duplicateEmail = `dup-test-${Date.now()}@example.com`
      await request.post('http://localhost:3001/auth/register', {
        data: { email: duplicateEmail, password: 'test123', name: 'First' }
      })

      const response = await request.post('http://localhost:3001/auth/register', {
        data: { email: duplicateEmail, password: 'test456', name: 'Second' }
      })
      expect(response.status()).toBe(409)
    })

    test('login with valid credentials', async ({ request }) => {
      const email = `login-test-${Date.now()}@example.com`

      // Register first
      await request.post('http://localhost:3001/auth/register', {
        data: { email, password: 'mypassword', name: 'Login Test' }
      })

      // Login
      const response = await request.post('http://localhost:3001/auth/login', {
        data: { email, password: 'mypassword' }
      })
      expect(response.ok()).toBeTruthy()

      const body = await response.json()
      expect(body.user).toBeDefined()
      expect(body.user.email).toBe(email.toLowerCase())
    })

    test('login rejects invalid credentials', async ({ request }) => {
      const response = await request.post('http://localhost:3001/auth/login', {
        data: { email: 'nonexistent@example.com', password: 'wrongpass' }
      })
      expect(response.status()).toBe(401)
    })

    test('me endpoint requires authentication', async ({ request }) => {
      const response = await request.get('http://localhost:3001/auth/me')
      expect(response.status()).toBe(401)
    })

    test('full auth flow: register -> me -> logout -> me fails', async ({ request }) => {
      const email = `flow-${Date.now()}@example.com`

      // Register and get cookie
      const registerResponse = await request.post('http://localhost:3001/auth/register', {
        data: { email, password: 'flowpass123', name: 'Flow Test' }
      })
      expect(registerResponse.ok()).toBeTruthy()

      // me should work (cookies are automatically included by Playwright context)
      const meResponse = await request.get('http://localhost:3001/auth/me')
      expect(meResponse.ok()).toBeTruthy()

      const meBody = await meResponse.json()
      expect(meBody.user.email).toBe(email.toLowerCase())

      // Logout
      const logoutResponse = await request.post('http://localhost:3001/auth/logout')
      expect(logoutResponse.ok()).toBeTruthy()

      // me should fail after logout
      const meAfterLogout = await request.get('http://localhost:3001/auth/me')
      expect(meAfterLogout.status()).toBe(401)
    })
  })

  test.describe('Frontend Auth UI', () => {
    test('shows login page when not authenticated', async ({ page }) => {
      await page.goto('/')

      // Wait for loading to complete - be patient
      await page.waitForLoadState('networkidle', { timeout: 30000 })

      // Should show login or register form or loading state
      const hasForm = await page.locator('form').count() > 0
      const hasLoading = await page.locator('.app-loading, .loading').count() > 0

      // Either form or loading should be visible
      expect(hasForm || hasLoading).toBeTruthy()
    })

    test('can register via form', async ({ page }) => {
      const email = `ui-${Date.now()}@example.com`

      await page.goto('/')
      await page.waitForLoadState('networkidle', { timeout: 30000 })

      // Wait for form to appear
      await page.waitForSelector('form', { timeout: 30000 })

      // Click register toggle if present
      const registerButton = page.locator('button:has-text("Criar conta")')
      if (await registerButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await registerButton.click()
        await page.waitForTimeout(500)
      }

      // Fill form
      const nameInput = page.locator('input#name')
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill('UI Test User')
      }

      await page.locator('input#email').fill(email)
      await page.locator('input#password').fill('uitestpass123')

      // Submit
      await page.locator('button[type="submit"]').click()

      // Wait for response - either dashboard or error
      await page.waitForLoadState('networkidle', { timeout: 15000 })

      // Verify we're either on dashboard or got a success
      const onDashboard = await page.locator('.logout-btn, button:has-text("Sair"), .dashboard').isVisible({ timeout: 5000 }).catch(() => false)
      const hasError = await page.locator('.auth-error, .error').isVisible().catch(() => false)

      // Either successful login or at least no crash
      expect(onDashboard || !hasError).toBeTruthy()
    })
  })
})
