import { test, expect } from '@playwright/test';

test.describe('CEP Lookup Integration', () => {
  test('should auto-fill address fields when entering a valid CEP', async ({ page }) => {
    await page.goto('/cadastro');

    // Find CEP input
    const cepInput = page.getByRole('textbox', { name: /CEP/i });
    await expect(cepInput).toBeVisible();

    // Enter a valid CEP (04002-000 - Rua Maria Figueiredo)
    await cepInput.fill('04002000');

    // Wait for auto-fill (ViaCEP response + toast)
    await page.waitForTimeout(2000);

    // Check if address fields were filled
    const logradouro = page.getByRole('textbox', { name: /Rua \/ Avenida/i });
    const bairro = page.getByRole('textbox', { name: /Bairro/i });
    const cidade = page.getByRole('textbox', { name: /Cidade/i });
    const uf = page.getByRole('textbox', { name: /^UF$/i });

    await expect(logradouro).toHaveValue('Rua Maria Figueiredo');
    await expect(bairro).toHaveValue('Paraíso');
    await expect(cidade).toHaveValue('São Paulo');
    await expect(uf).toHaveValue('SP');
  });

  test('should show error for invalid CEP', async ({ page }) => {
    await page.goto('/cadastro');

    const cepInput = page.getByRole('textbox', { name: /CEP/i });
    await cepInput.fill('00000000');

    // Wait for error handling
    await page.waitForTimeout(1000);

    // Check that no address fields were filled
    const logradouro = page.getByRole('textbox', { name: /Rua \/ Avenida/i });
    await expect(logradouro).toBeEmpty();
  });

  test('should have all new address fields in the form', async ({ page }) => {
    await page.goto('/cadastro');

    // Check all address-related fields exist
    await expect(page.getByRole('textbox', { name: /CEP/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Rua \/ Avenida/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Número/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Complemento/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Bairro/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /Cidade/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^UF$/i })).toBeVisible();
  });
});
