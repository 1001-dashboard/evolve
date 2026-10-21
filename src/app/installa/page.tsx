import {InstallEvolveClient} from '@/components/install-evolve-client';
import {BASE_PATH} from '@/lib/config';
import '@/app/first-experience.css';
export const metadata={title:'Installa Evolve su Android'};
export default function Installa(){return <main className="auth-install-page"><InstallEvolveClient/><p className="auth-back"><a href={BASE_PATH+'/inizia'}>← Torna al tuo percorso</a></p></main>}
