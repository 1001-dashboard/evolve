import Link from 'next/link';
import Image from 'next/image';
import {SignOutButton} from './sign-out';
import {Home,MessageCircle,Target,Repeat2,BookOpen,ChartNoAxesCombined,UtensilsCrossed,ListChecks} from 'lucide-react';
const links=[['/oggi','Oggi',Home],['/percorsi','Percorsi',Target],['/routine','Routine',Repeat2],['/alimentazione','Alimentazione',UtensilsCrossed],['/diario','Diario',BookOpen],['/azioni','Azioni',ListChecks],['/progressi','Progressi',ChartNoAxesCombined],['/coach','Coach',MessageCircle]] as const;
const mobileLinks=[links[0],links[1],links[2],links[4],links[6]];
export function Shell({children,email}:{children:React.ReactNode;email:string}){
  return <div className="app-frame"><aside className="sidebar"><Link href="/oggi" className="brand-block"><Image src="/evolve/brand/logo.png" alt="Evolve" width={190} height={68} priority className="brand-image"/></Link><p className="sidebar-caption">ALLENATI A CAMBIARE</p><nav className="side-nav" aria-label="Navigazione principale">{links.map(([url,name,Icon])=><Link className="side-link" key={url} href={url}><Icon size={19}/>{name}</Link>)}</nav><div className="sidebar-bottom"><p className="muted text-xs break-all">{email}</p><SignOutButton/></div></aside><div className="workspace"><header className="mobile-header"><Link href="/oggi"><Image src="/evolve/brand/logo.png" alt="Evolve" width={125} height={45}/></Link><SignOutButton/></header><main id="contenuto" className="main-content">{children}</main><nav className="mobile-nav" aria-label="Navigazione mobile">{mobileLinks.map(([url,name,Icon])=><Link href={url} className="mobile-link" key={url}><Icon size={20}/><span>{name}</span></Link>)}</nav></div></div>
}
