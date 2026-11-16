export function launchDestination(options: {
  standalone: boolean;
  pathname: string;
  signedIn: boolean;
  guest: boolean;
  onboardingPending: boolean;
}): string | null {
  if (!options.standalone || (!options.signedIn && !options.guest)) return null;
  const destination = options.onboardingPending ? '/onboarding' : '/';
  return options.pathname === destination ? null : destination;
}
