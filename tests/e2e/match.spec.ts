import { expect, test } from '@playwright/test';

import { resetFixtureUsers } from './db-cleanup';

const fixtureUsernames = ['e2e_alice', 'e2e_bob', 'e2e_charlie'];

test.beforeEach(async () => {
  await resetFixtureUsers(fixtureUsernames);
});

test.afterEach(async () => {
  await resetFixtureUsers(fixtureUsernames);
});

test('matches two AniList planning lists with mocked AniList data', async ({ page }) => {
  await page.goto('/');

  await page.getByLabel('AniList username 1').fill('e2e_alice');
  await page.getByLabel('AniList username 2').fill('e2e_bob');
  await page.getByRole('button', { name: 'Find matches' }).click();

  await expect(page).toHaveURL('/?u=e2e_alice&u=e2e_bob');
  await expect(page.getByRole('button', { name: 'Random pick' })).toBeVisible();
  await expect(page.getByLabel('AniList username 1')).toHaveValue('e2e_alice');
  await expect(page.getByLabel('AniList username 2')).toHaveValue('e2e_bob');

  await expect(page.getByRole('main')).toContainText(/2\s*matches/i);
  await expect(page.locator('div').filter({ hasText: /^2Matches$/ })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^2Scanned$/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Cowboy Bebop/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Frieren: Beyond Journey/ })).toBeVisible();
  await expect(page.getByText('2/2')).toHaveCount(2);

  await page.getByLabel('AniList username 2').fill('e2e_charlie');
  await expect(page.getByRole('button', { name: 'Match now' })).toBeVisible();
  await expect(page).toHaveURL('/?u=e2e_alice&u=e2e_bob');

  await page.getByLabel('AniList username 2').fill('e2e_bob');
  await page.getByRole('button', { name: 'Random pick' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText(/Random pick:|Random pick rolling/)).toBeAttached();
  await expect(page.getByRole('link', { name: 'Lock it in' })).toBeVisible();
});
