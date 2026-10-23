// filepath: src/app/layout.tsx
import Navbar from '../components/Navbar';
import ThemeProvider from '../components/ThemeProvider';
import UnlockNotifier from '../components/UnlockNotifier';
import '../styles/globals.css';

export const metadata = {
  title: 'NexusCode',
  description: 'Gamified coding learning app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider />
        <Navbar />
        <UnlockNotifier />
        <div className="appContent">
          {children}
        </div>
      </body>
    </html>
  );
}
