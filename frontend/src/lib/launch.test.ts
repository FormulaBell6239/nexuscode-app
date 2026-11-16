import { launchDestination } from './launch';

const returning = {
  standalone: true,
  pathname: '/roadmap',
  signedIn: true,
  guest: false,
  onboardingPending: false,
};

test('old installed shortcut opens the dashboard for a returning user', () => {
  expect(launchDestination(returning)).toBe('/');
});

test('unfinished onboarding is not skipped', () => {
  expect(launchDestination({ ...returning, onboardingPending: true })).toBe('/onboarding');
  expect(launchDestination({ ...returning, pathname: '/onboarding', onboardingPending: true })).toBeNull();
});

test('does not redirect regular browser visits or signed-out visitors', () => {
  expect(launchDestination({ ...returning, standalone: false })).toBeNull();
  expect(launchDestination({ ...returning, signedIn: false })).toBeNull();
});

test('does not redirect again when already on the dashboard', () => {
  expect(launchDestination({ ...returning, pathname: '/' })).toBeNull();
});
