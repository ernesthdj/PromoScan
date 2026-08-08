// app/(auth)/layout.tsx — layout du groupe de routes non authentifiées (login).
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>;
}
