import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Evolve — Personal Change & Life Coaching', description: 'Coaching situazionale, piani quotidiani, abitudini e miglioramento personale progressivo' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="it"><body>{children}</body></html>; }
