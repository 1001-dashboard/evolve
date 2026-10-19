'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Home,MessageCircle,Target,Repeat2,BookOpen,ChartNoAxesCombined,UtensilsCrossed,ListChecks,CalendarCheck2,UserRound,Compass,Dumbbell,ShoppingBasket} from 'lucide-react';
const links=[['/giornata','Oggi',Home],['/profilo','Profilo',UserRound],['/scenari','Scenari',Compass],['/percorsi','Percorsi',Target],['/piano','Piano settimanale',CalendarCheck2],['/routine','Routine',Repeat2],['/allenamento','Allenamento',Dumbbell],['/alimentazione','Alimentazione',UtensilsCrossed],['/mealprep','Meal Prep e spesa',ShoppingBasket],['/diario','Diario',BookOpen],['/azioni','Azioni',ListChecks],['/progressi','Progressi',ChartNoAxesCombined],['/coach','Coach',MessageCircle]] as const;
const mobile=[links[0],links[2],links[3],links[5],links[1]];
export function SidebarNav({mobileOnly=false}:{mobileOnly?:boolean}){
 const pathname=usePathname();const chosen=mobileOnly?mobile:links;
 return <nav className={mobileOnly?'mobile-nav':'side-nav'} aria-label={mobileOnly?'Navigazione mobile':'Navigazione principale'}>{chosen.map(([url,name,Icon])=>{
  const active=pathname===url||pathname==='/evolve'+url||(url==='/giornata'&&(pathname==='/oggi'||pathname==='/evolve/oggi'));
  return <Link key={url} href={url} aria-current={active?'page':undefined} className={mobileOnly?'mobile-link':'side-link'}><Icon size={mobileOnly?20:19}/>{mobileOnly?<span>{name}</span>:name}</Link>;
 })}</nav>;
}
