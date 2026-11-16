import { beginOnboarding, finishOnboarding, isOnboardingPending } from './onboarding';
import { endSession, startSession } from './session';

const storage = new Map<string, string>();

beforeAll(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    configurable: true,
  });
});

beforeEach(() => storage.clear());

test('keeps an incomplete account onboarding pending across sign out and login', () => {
  const session = { token: 'token', user: { id: 1 } };
  startSession(session);
  beginOnboarding();
  endSession();
  startSession(session);
  expect(isOnboardingPending()).toBe(true);
  finishOnboarding();
  expect(isOnboardingPending()).toBe(false);
  expect(localStorage.getItem('nexus_visited')).toBe('true');
  endSession();
  startSession(session);
  expect(isOnboardingPending()).toBe(false);
});

test('does not apply another account or guest onboarding to a returning user', () => {
  beginOnboarding();
  startSession({ token: 'token', user: { id: 1 } });
  beginOnboarding();
  startSession({ token: 'token', user: { id: 2 } });
  expect(isOnboardingPending()).toBe(false);
});
