// Browser-cached data that belongs to one account. Wiped whenever the account changes.
const USER_SCOPED_KEYS = [
  'nexus_completed',
  'nexus_completed_assignments',
  'nexus_visited',
  'nexus_plan',
  'pending_lesson',
  'avatarRingColor',
  'bannerCard',
  'bannerTexture',
  'bannerTextureStrength',
  'bannerCustomStart',
  'bannerCustomEnd',
  'playgroundProjects',
  'playgroundPyProjects',
  'playgroundWebDraft',
  'playgroundPyDraft',
  'playgroundLastMode',
];

export function clearUserData() {
  USER_SCOPED_KEYS.forEach((k) => localStorage.removeItem(k));
}

export function endSession() {
  ['token', 'user', 'nexus_guest', 'nexus_owner'].forEach((k) => localStorage.removeItem(k));
  clearUserData();
}

// Call after a successful login/register: drops the previous account's cache.
export function startSession(session: { token: string; user: { id: number } }) {
  const owner = String(session.user.id);
  if (localStorage.getItem('nexus_owner') !== owner) clearUserData();
  localStorage.setItem('nexus_owner', owner);
  localStorage.setItem('token', session.token);
  localStorage.setItem('user', JSON.stringify(session.user));
  localStorage.removeItem('nexus_guest');
}
