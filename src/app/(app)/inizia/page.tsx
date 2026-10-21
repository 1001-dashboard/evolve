import '@/app/onboarding.css';
import {SmartOnboardingClient} from '@/components/smart-onboarding-client';
export const metadata={title:'Inizia con Evolve · Personalizzazione'};
export default function OnboardingPage(){return <main className="ob-page"><SmartOnboardingClient/><p style={{textAlign:'center',margin:'18px 0 0',fontSize:13}}><a href="/evolve/installa" style={{color:'#087783',fontWeight:650}}>Usi Android? Aggiungi Evolve alla schermata Home →</a></p></main>}
