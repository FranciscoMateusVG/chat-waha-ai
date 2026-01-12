import { test, expect } from '@playwright/test'

test.describe('WhatsApp Accounts E2E', () => {
  test.describe('API CRUD', () => {
    test('full CRUD flow for whatsapp accounts', async ({ request }) => {
      const email = `wa-crud-${Date.now()}@example.com`

      // Register and authenticate
      const registerResponse = await request.post('http://localhost:3001/auth/register', {
        data: { email, password: 'watest123', name: 'WA CRUD Test' }
      })
      expect(registerResponse.ok()).toBeTruthy()

      // Create account
      const createResponse = await request.post('http://localhost:3001/whatsapp-accounts', {
        data: { name: 'Test WA Account', phoneNumber: '+5511999999999' }
      })
      expect(createResponse.ok()).toBeTruthy()

      const createBody = await createResponse.json()
      const account = createBody.account
      expect(account.name).toBe('Test WA Account')
      expect(account.phoneNumber).toBe('+5511999999999')
      expect(account.status).toBe('pending')

      const accountId = account.id

      // Read all
      const listResponse = await request.get('http://localhost:3001/whatsapp-accounts')
      expect(listResponse.ok()).toBeTruthy()

      const listBody = await listResponse.json()
      expect(listBody.accounts.some((a: { id: string }) => a.id === accountId)).toBeTruthy()

      // Read one
      const getResponse = await request.get(`http://localhost:3001/whatsapp-accounts/${accountId}`)
      expect(getResponse.ok()).toBeTruthy()

      const getBody = await getResponse.json()
      expect(getBody.account.id).toBe(accountId)

      // Update (using PUT as per controller)
      const updateResponse = await request.put(`http://localhost:3001/whatsapp-accounts/${accountId}`, {
        data: { name: 'Updated WA Account', status: 'active' }
      })
      expect(updateResponse.ok()).toBeTruthy()

      const updateBody = await updateResponse.json()
      expect(updateBody.account.name).toBe('Updated WA Account')
      expect(updateBody.account.status).toBe('active')

      // Delete
      const deleteResponse = await request.delete(`http://localhost:3001/whatsapp-accounts/${accountId}`)
      expect(deleteResponse.status()).toBe(204)

      // Verify deletion
      const getDeletedResponse = await request.get(`http://localhost:3001/whatsapp-accounts/${accountId}`)
      expect(getDeletedResponse.status()).toBe(404)
    })

    test('whatsapp accounts require authentication', async ({ request }) => {
      // Clear any existing cookies by using a fresh context
      const response = await request.get('http://localhost:3001/whatsapp-accounts', {
        headers: { Cookie: '' }
      })
      // Should be 401 without auth
      expect(response.status()).toBe(401)
    })

    test('users can only see their own accounts', async ({ request }) => {
      // Create user 1 and their account
      const email1 = `user1-${Date.now()}@example.com`
      await request.post('http://localhost:3001/auth/register', {
        data: { email: email1, password: 'pass123', name: 'User 1' }
      })

      const createResponse = await request.post('http://localhost:3001/whatsapp-accounts', {
        data: { name: 'User 1 Account' }
      })
      const createBody = await createResponse.json()
      const account1 = createBody.account

      // Create user 2 and try to access user 1's account
      const email2 = `user2-${Date.now()}@example.com`
      await request.post('http://localhost:3001/auth/register', {
        data: { email: email2, password: 'pass123', name: 'User 2' }
      })

      // User 2's list should not contain user 1's account
      const listResponse = await request.get('http://localhost:3001/whatsapp-accounts')
      const listBody = await listResponse.json()

      const hasUser1Account = listBody.accounts.some((a: { id: string }) => a.id === account1.id)
      expect(hasUser1Account).toBeFalsy()
    })
  })

  test.describe('Frontend UI', () => {
    test('frontend serves whatsapp accounts related content', async ({ page }) => {
      // This is a basic smoke test - the main UI auth flow is tested in auth.spec.ts
      await page.goto('/')
      await page.waitForLoadState('networkidle', { timeout: 30000 })

      // Frontend should be accessible and showing login or dashboard
      const hasForm = await page.locator('form').isVisible({ timeout: 10000 }).catch(() => false)
      const hasDashboard = await page.locator('.dashboard, nav').isVisible({ timeout: 5000 }).catch(() => false)

      // Either shows login form or dashboard (if already authenticated)
      expect(hasForm || hasDashboard).toBeTruthy()
    })
  })
})
