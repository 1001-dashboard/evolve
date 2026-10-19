'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Home,MessageCircle,Target,Repeat2,BookOpen,ChartNoAxesCombined,UtensilsCrossed,ListChecks} from 'lucide-react';
const links=[['/oggi','Oggi',Home],['/percorsi','Percorsi',Target],['/routine','Routine',Repeat2],['/alimentazione','Alimentazione',UtensilsCrossed],['/diario','Diario',BookOpen],['/azioni','Azioni',ListChecks],['/progressi','Progressi',ChartNoAxesCombined],['/coach','Coach',MessageCircle]] as const;
const mobile=[links[0],links[1],links[2],links[4],links[6]];
export function SidebarNav({mobileOnly=false}:{mobileOnly?:boolean}){
  const pathname=usePathname();
  const chosen=mobileOnly?mobile:links;
  return <nav className={mobileOnly?'mobile-nav':'side-nav'} aria-label={mobileOnly?'Navigazione mobile':'Navigazione principale'}>{chosen.map(([url,name,Icon])=>{
    const active=pathname===url||pathname==='/evolve'+url;
    return <Link key={url} href={url} aria-current={active?'page':undefined} className={mobileOnly?'mobile-link':'side-link'}><Icon size={mobileOnly?20:19}/>{mobileOnly?<span>{name}</span>:name}</Link>;
  })}</nav>;
}
