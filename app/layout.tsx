import type { Metadata } from 'next';
import '../styles/tokens.css';
import './globals.css';
import { QueryProvider } from '../components/providers/QueryProvider';

export const metadata: Metadata = {
  title: 'PromoScan',
  description: "Collecte et structuration des promotions d'enseignes belges (F1)",
};

// Layout racine — tokens de design (styles/tokens.css) + provider TanStack Query montés une
// seule fois pour toute l'app (réutilisable par F2/F3/F4). Design détaillé de chaque écran dans
// docs/UI-DESIGN.md.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-base-bg text-base-text antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
