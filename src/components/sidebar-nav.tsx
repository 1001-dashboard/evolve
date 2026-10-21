'use client';
import {BASE_PATH} from '@/lib/config';
import {usePathname} from 'next/navigation';
import {useState} from 'react';
import {Home,MessageCircle,CalendarCheck2,ChartNoAxesCombined,UserRound,ChevronDown,Compass,Target,Repeat2,Dumbbell,UtensilsCrossed,ShoppingBasket,BookOpen,ListChecks,HelpCircle,Menu,X} from 'lucide-react';

const publicHref=(path:string)=>BASE_PATH+path;

const primary=[
 ['/giornata','Oggi',Home],
 ['/coach','Coach: parti da qui',MessageCircle],
 ['/piano','Il mio piano',CalendarCheck2],
 ['/progressi','Risultati',ChartNoAxesCombined],
 ['/profilo','Il mio profilo',UserRound]
] as const;
const hints:Record<string,string>={
 '/giornata':'Cosa fare oggi', '/coach':'Da problema a piano',
 '/piano':'Attività concordate', '/progressi':'Cosa hai realizzato',
 '/profilo':'Preferenze e obiettivi'
};
const tools=[
 ['/percorsi','Percorsi guidati',Target],
 ['/routine','Esercizi dei percorsi',Repeat2],
 ['/allenamento','Allenamento',Dumbbell],
 ['/alimentazione','Alimentazione',UtensilsCrossed],
 ['/mealprep','Pasti e lista spesa',ShoppingBasket],
 ['/scenari','Piani se-allora',Compass],
 ['/diario','Diario',BookOpen],
 ['/azioni','Vecchie azioni',ListChecks]
] as const;

export function SidebarNav({mobileOnly=false}:{mobileOnly?:boolean}){
 const raw=usePathname()??'';
 const pathname=raw.startsWith('/evolve/')?raw.slice('/evolve'.length):raw;
 const isActive=(p:string)=>pathname===p||(p==='/giornata'&&pathname==='/oggi');
 const [open,setOpen]=useState(false);

 if(mobileOnly){
   const main=primary.slice(0,4);
   const mobileTools=[primary[4], ...tools, ['/guida','Come funziona?',HelpCircle] as const];
   return <>
     <nav className="mobile-nav" aria-label="Navigazione principale mobile">
       {main.map(([url,name,Icon])=><a key={url} href={publicHref(url)} className={'mobile-link '+(isActive(url)?'active':'')} aria-current={isActive(url)?'page':undefined} onClick={()=>setOpen(false)}><Icon size={20}/><span>{url==='/coach'?'Coach':url==='/piano'?'Piano':name}</span></a>)}
       <button className="mobile-link mobile-more-trigger" type="button" aria-expanded={open} aria-controls="evolve-mobile-tools" onClick={()=>setOpen(v=>!v)}>
         {open?<X size={20}/>:<Menu size={20}/>}<span>Altro</span>
       </button>
     </nav>
     {open&&<div className="mobile-tools-panel" id="evolve-mobile-tools" role="region" aria-label="Tutti gli strumenti Evolve">
       <div className="mobile-tools-heading"><strong>Strumenti Evolve</strong><button type="button" aria-label="Chiudi menu" onClick={()=>setOpen(false)}><X size={18}/></button></div>
       <div className="mobile-tools-grid">
         {mobileTools.map(([url,name,Icon])=><a key={url} href={publicHref(url)} className={'mobile-tool '+(isActive(url)?'active':'')} aria-current={isActive(url)?'page':undefined} onClick={()=>setOpen(false)}><Icon size={18}/><span>{name}</span></a>)}
       </div>
     </div>}
   </>;
 }
 return <nav className="side-nav" aria-label="Navigazione principale">
  {primary.map(([url,name,Icon])=><a key={url} href={publicHref(url)} className={'side-link side-link-main '+(isActive(url)?'active':'')} aria-current={isActive(url)?'page':undefined}><Icon size={19}/><span className="sidebar-label"><strong>{name}</strong><small>{hints[url]}</small></span></a>)}
  <a href={publicHref("/guida")} className={'side-link evolve-help-link '+(isActive('/guida')?'active':'')}><HelpCircle size={19}/><span className="sidebar-label"><strong>Come funziona?</strong><small>Guida con esempi pratici</small></span></a>
  <details className="sidebar-tools" open={tools.some(([url])=>isActive(url))}>
   <summary><ChevronDown size={16}/> Strumenti specifici <small>Apri se ti servono</small></summary>
   <div className="sidebar-tool-list">{tools.map(([url,name,Icon])=><a key={url} href={publicHref(url)} className={'side-link '+(isActive(url)?'active':'')} aria-current={isActive(url)?'page':undefined}><Icon size={17}/>{name}</a>)}</div>
  </details>
 </nav>;
}
