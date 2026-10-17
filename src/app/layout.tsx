import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Evolve — Personal AI Coach', description: 'Percorsi personali, coaching quotidiano, azioni e diario' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="it"><body>{children}</body></html>; }
