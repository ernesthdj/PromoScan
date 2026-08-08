// lib/infrastructure/adapters/headlessBrowser.ts
//
// Lanceur Chromium partagé par les adaptateurs "headless" (Delhaize, Lidl) — Playwright +
// `@sparticuz/chromium`, package dédié compatible avec le runtime serverless de Vercel
// (docs/ARCHITECTURE.md §1/§7 : "package dédié serverless, timeout explicite, aucun script tiers
// non contrôlé exécuté").
//
// SELFDOUBT : `@sparticuz/chromium` nécessite en général `runtime = "nodejs"` (pas "edge") sur la
// route Next.js qui l'utilise, et un `maxDuration` suffisant côté vercel.json — point de
// dimensionnement déjà signalé à DevOps (#8) par l'Architecte (ARCHITECTURE §1/§5.4, tier Vercel
// non confirmé). Le comportement exact du binaire Chromium empaqueté (taille, cold start) en
// conditions réelles Vercel n'est pas vérifiable depuis ce poste de développement.

import chromium from '@sparticuz/chromium';
import { chromium as playwrightChromium, type Browser, type Page } from 'playwright-core';
import { getScraperUserAgent } from './httpClient';

export interface HeadlessSession {
  browser: Browser;
  page: Page;
}

export async function launchHeadlessSession(timeoutMs: number): Promise<HeadlessSession> {
  const isLocalDev = process.env.NODE_ENV === 'development';

  const browser = await playwrightChromium.launch({
    // En local (dev), on utilise le Chromium système installé par `playwright install` si
    // disponible ; en production serverless, le binaire @sparticuz/chromium est requis (le
    // Chromium "complet" de Playwright est trop volumineux pour une fonction Vercel).
    executablePath: isLocalDev ? undefined : await chromium.executablePath(),
    args: isLocalDev ? [] : chromium.args,
    headless: true,
    timeout: timeoutMs,
  });

  const page = await browser.newPage({ userAgent: getScraperUserAgent() });
  page.setDefaultTimeout(timeoutMs);
  page.setDefaultNavigationTimeout(timeoutMs);

  return { browser, page };
}

export async function closeHeadlessSession(session: HeadlessSession): Promise<void> {
  try {
    await session.page.close();
  } finally {
    await session.browser.close();
  }
}
