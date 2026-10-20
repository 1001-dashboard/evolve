'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Home,MessageCircle,CalendarCheck2,ChartNoAxesCombined,UserRound,ChevronDown,Compass,Target,Repeat2,Dumbbell,UtensilsCrossed,ShoppingBasket,BookOpen,ListChecks} from 'lucide-react';
const primary=[
 ['/giornata','Oggi',Home],['/coach','Coach',MessageCircle],['/piano','Il mio piano',CalendarCheck2],['/progressi','Progressi',ChartNoAxesCombined],['/profilo','Profilo',UserRound]
] as const;
const tools=[
 ['/percorsi','Percorsi',Target],['/routine','Routine',Repeat2],['/allenamento','Allenamento',Dumbbell],['/alimentazione','Alimentazione',UtensilsCrossed],['/mealprep','Meal prep e spesa',ShoppingBasket],['/scenari','Scenari',Compass],['/diario','Diario',BookOpen],['/azioni','Azioni',ListChecks]
] as const;
export function SidebarNav({mobileOnly=false}:{mobileOnly?:boolean}){
 const raw=usePathname();const pathname=raw.startsWith('/evolve/')?raw.slice('/evolve'.length):raw;
 const isActive=(p:string)=>pathname===p||(p==='/giornata'&&pathname==='/oggi');
 if(mobileOnly)return <nav className="mobile-nav" aria-label="Navigazione principale mobile">{primary.map(([url,name,Icon])=><Link key={url} href={url} className={'mobile-link '+(isActive(url)?'active':'')} aria-current={isActive(url)?'page':undefined}><Icon size={20}/><span>{name}</span></Link>)}</nav>;
 return <nav className="side-nav" aria-label="Navigazione principale">
  {primary.map(([url,name,Icon])=><Link key={url} href={url} className={'side-link '+(isActive(url)?'active':'')} aria-current={isActive(url)?'page':undefined}><Icon size={19}/>{name}</Link>)}
  <details className="sidebar-tools" open={tools.some(([url])=>isActive(url))}>
   <summary><ChevronDown size={16}/> Altri strumenti</summary>
   <div className="sidebar-tool-list">{tools.map(([url,name,Icon])=><Link key={url} href={url} className={'side-link '+(isActive(url)?'active':'')} aria-current={isActive(url)?'page':undefined}><Icon size={17}/>{name}</Link>)}</div>
  </details>
 </nav>;
}
