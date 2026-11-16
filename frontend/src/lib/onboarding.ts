function pendingKey(): string {
  const owner = localStorage.getItem('nexus_owner');
  return owner ? `nexus_onboarding_pending:${owner}` : 'nexus_onboarding_pending:guest';
}

export function isOnboardingPending(): boolean {
  return localStorage.getItem(pendingKey()) === 'true';
}

export function beginOnboarding(): void {
  localStorage.setItem(pendingKey(), 'true');
}

export function finishOnboarding(): void {
  localStorage.setItem('nexus_visited', 'true');
  localStorage.removeItem(pendingKey());
}
