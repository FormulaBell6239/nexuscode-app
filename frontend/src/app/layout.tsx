// filepath: src/app/layout.tsx
import Navbar from '../components/Navbar';
import ThemeProvider from '../components/ThemeProvider';
import TouchOffsetFix from '../components/TouchOffsetFix';
import FeedbackButton from '../components/FeedbackButton';
import UnlockNotifier from '../components/UnlockNotifier';
import LaunchRedirect from '../components/LaunchRedirect';
import '../styles/globals.css';

export const metadata = {
  title: 'NexusCode',
  description: 'Gamified coding learning app',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'NexusCode', statusBarStyle: 'black-translucent' as const },
  icons: { apple: '/icon-192.png' },
};

export const viewport = { viewportFit: 'cover' as const, themeColor: '#080d17', interactiveWidget: 'resizes-content' as const, maximumScale: 1, userScalable: false };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LaunchRedirect />
        <ThemeProvider />
        <Navbar />
        <TouchOffsetFix />
        <UnlockNotifier />
        <FeedbackButton />
        <div className="appContent">
          {children}
        </div>
      </body>
    </html>
  );
}
