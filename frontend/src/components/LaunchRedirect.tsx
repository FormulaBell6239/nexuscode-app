'use client';

import { useEffect } from 'react';
import { isOnboardingPending } from '@/lib/onboarding';
import { launchDestination } from '@/lib/launch';

export default function LaunchRedirect() {
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && window.navigator.standalone === true);
    const destination = launchDestination({
      standalone,
      pathname: window.location.pathname,
      signedIn: Boolean(localStorage.getItem('token')),
      guest: Boolean(localStorage.getItem('nexus_guest')),
      onboardingPending: isOnboardingPending(),
    });
    if (destination) window.location.replace(destination);
  }, []);

  return null;
}
