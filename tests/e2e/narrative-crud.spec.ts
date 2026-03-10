import { test, expect } from '@playwright/test'

test.describe('US2: Multiple Narrative Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for app to hydrate
    await page.waitForSelector('header', { timeout: 5000 })
  })

  test('creates a default narrative on first load', async ({ page }) => {
    // App should auto-create a default narrative
    await expect(page.locator('text=My Narrative')).toBeVisible()
  })

  test('creates a new narrative via + button', async ({ page }) => {
    // Click the + button next to "Narratives"
    const addButton = page.locator('button[title="New narrative"]')
    await addButton.click()
    // Should see "New Narrative" in the list
    await expect(page.locator('input[value="New Narrative"]')).toBeVisible()
  })

  test('renames a narrative by double-clicking', async ({ page }) => {
    // Create a narrative first
    await page.locator('button[title="New narrative"]').click()
    // Press Enter to accept default name
    await page.keyboard.press('Enter')
    // Double-click to rename
    await page.locator('li').filter({ hasText: 'New Narrative' }).dblclick()
    await page.keyboard.type('Chapter 1')
    await page.keyboard.press('Enter')
    await expect(page.locator('text=Chapter 1')).toBeVisible()
  })

  test('switches between narratives', async ({ page }) => {
    // Create two narratives
    await page.locator('button[title="New narrative"]').click()
    await page.keyboard.type('Story A')
    await page.keyboard.press('Enter')

    await page.locator('button[title="New narrative"]').click()
    await page.keyboard.type('Story B')
    await page.keyboard.press('Enter')

    // Click on Story A
    await page.locator('li').filter({ hasText: 'Story A' }).click()
    await expect(page.locator('header span').filter({ hasText: 'Story A' })).toBeVisible()
  })

  test('deletes a narrative via right-click context menu', async ({ page }) => {
    // Create a narrative to delete
    await page.locator('button[title="New narrative"]').click()
    await page.keyboard.type('To Delete')
    await page.keyboard.press('Enter')

    // Right-click to get context menu
    await page.locator('li').filter({ hasText: 'To Delete' }).click({ button: 'right' })
    // Accept delete confirmation
    page.on('dialog', (dialog) => dialog.accept())
    await page.locator('button:has-text("Delete")').click()

    await expect(page.locator('text=To Delete')).not.toBeVisible()
  })
})
