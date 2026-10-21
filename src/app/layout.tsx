import type {Metadata} from 'next';
import './globals.css';
import './first-experience.css';
import './mobile-fixes.css'; // Responsive fixes must remain last.
export const metadata:Metadata={
 title:'Evolve — Il tuo percorso personale',
 description:'Coaching pratico, abitudini, allenamento, alimentazione e miglioramento personale su misura.',
 manifest:'/evolve/manifest.webmanifest',
 applicationName:'Evolve',
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="it"><body>{children}</body></html>}
