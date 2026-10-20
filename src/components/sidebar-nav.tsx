'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Home,MessageCircle,CalendarCheck2,ChartNoAxesCombined,UserRound,ChevronDown,Compass,Target,Repeat2,Dumbbell,UtensilsCrossed,ShoppingBasket,BookOpen,ListChecks,HelpCircle} from 'lucide-react';
const primary=[
 ['/giornata','Oggi',Home],['/coach','Coach: parti da qui',MessageCircle],['/piano','Il mio piano',CalendarCheck2],['/progressi','Risultati',ChartNoAxesCombined],['/profilo','Il mio profilo',UserRound]
] as const;
const hints:Record<string,string>={'/giornata':'Cosa fare oggi','/coach':'Da problema a piano','/piano':'Attività concordate','/progressi':'Cosa hai realizzato','/profilo':'Preferenze e obiettivi'};
const tools=[
 ['/percorsi','Percorsi guidati',Target],['/routine','Esercizi dei percorsi',Repeat2],['/allenamento','Allenamento',Dumbbell],['/alimentazione','Alimentazione',UtensilsCrossed],['/mealprep','Pasti e lista spesa',ShoppingBasket],['/scenari','Piani se-allora',Compass],['/diario','Diario',BookOpen],['/azioni','Vecchie azioni',ListChecks]
] as const;
export function SidebarNav({mobileOnly=false}:{mobileOnly?:boolean}){
 const raw=usePathname();const pathname=raw.startsWith('/evolve/')?raw.slice('/evolve'.length):raw;
 const isActive=(p:string)=>pathname===p||(p==='/giornata'&&pathname==='/oggi');
 if(mobileOnly)return <nav className="mobile-nav" aria-label="Navigazione principale mobile">{primary.map(([url,name,Icon])=><Link key={url} href={url} className={'mobile-link '+(isActive(url)?'active':'')} aria-current={isActive(url)?'page':undefined}><Icon size={20}/><span>{url==='/coach'?'Coach':url==='/profilo'?'Profilo':url==='/piano'?'Piano':name}</span></Link>)}</nav>;
 return <nav className="side-nav" aria-label="Navigazione principale">
  {primary.map(([url,name,Icon])=><Link key={url} href={url} className={'side-link side-link-main '+(isActive(url)?'active':'')} aria-current={isActive(url)?'page':undefined}><Icon size={19}/><span className="sidebar-label"><strong>{name}</strong><small>{hints[url]}</small></span></Link>)}
  <Link href="/guida" className={'side-link evolve-help-link '+(isActive('/guida')?'active':'')}><HelpCircle size={19}/><span className="sidebar-label"><strong>Come funziona?</strong><small>Guida con esempi pratici</small></span></Link>
  <details className="sidebar-tools" open={tools.some(([url])=>isActive(url))}>
   <summary><ChevronDown size={16}/> Strumenti specifici <small>Apri se ti servono</small></summary>
   <div className="sidebar-tool-list">{tools.map(([url,name,Icon])=><Link key={url} href={url} className={'side-link '+(isActive(url)?'active':'')} aria-current={isActive(url)?'page':undefined}><Icon size={17}/>{name}</Link>)}</div>
  </details>
 </nav>;
}
