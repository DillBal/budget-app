/**
 * Card lock/unlock abstraction.
 *
 * IMPORTANT LIMITATION: There is no universal API that lets a third-party app
 * freeze an arbitrary bank debit/credit card. Plaid does not expose card
 * lock/unlock. Real support requires the card ISSUER's own API, e.g.:
 *   - Card-issuing platforms you control (Stripe Issuing, Marqeta, Lithic) -
 *     full lock/unlock support if you issued the card yourself.
 *   - Some major banks (e.g. Chase, Capital One, Bank of America, Amex)
 *     expose "lock card" only inside their own first-party apps, with no
 *     public third-party API.
 *
 * This service defines a common `CardControlProvider` interface. A `MockCardControlProvider`
 * is used by default so the app is fully functional end-to-end. Swap in a real
 * provider (e.g. `StripeIssuingCardControlProvider`) per-account once you know
 * which issuer APIs you actually have access to.
 */

export interface CardControlProvider {
  name: string;
  lock(externalAccountId: string): Promise<void>;
  unlock(externalAccountId: string): Promise<void>;
}

class MockCardControlProvider implements CardControlProvider {
  name = "mock";

  async lock(externalAccountId: string): Promise<void> {
    // Simulates a call to an issuer API. Replace with a real HTTP call
    // to your card issuer's lock endpoint when available.
    console.log(`[MockCardControlProvider] Locking card for account ${externalAccountId}`);
  }

  async unlock(externalAccountId: string): Promise<void> {
    console.log(`[MockCardControlProvider] Unlocking card for account ${externalAccountId}`);
  }
}

const providers: Record<string, CardControlProvider> = {
  mock: new MockCardControlProvider(),
};

export function getCardControlProvider(name: string = "mock"): CardControlProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown card control provider: ${name}`);
  }
  return provider;
}

export function registerCardControlProvider(provider: CardControlProvider) {
  providers[provider.name] = provider;
}
