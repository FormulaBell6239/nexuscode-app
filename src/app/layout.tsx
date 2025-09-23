// filepath: src/app/layout.tsx
import Navbar from '../components/Navbar';
import '../styles/globals.css';

export const metadata = {
  title: 'NexusCode',
  description: 'Gamified coding learning app',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
