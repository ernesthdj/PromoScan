import Link from 'next/link';

// Page d'accueil minimale — redirige mentalement vers le dashboard de collecte. Le contenu
// visuel réel (landing, présentation) est hors périmètre F1.
export default function HomePage() {
  return (
    <main style={{ padding: 32, fontFamily: 'system-ui, sans-serif' }}>
      <h1>PromoScan</h1>
      <p>
        <Link href="/dashboard/collecte">Aller au dashboard de collecte</Link>
      </p>
    </main>
  );
}
