import {EvolveBrand} from './evolve-brand';
import {SidebarNav} from './sidebar-nav';
import {SignOutButton} from './sign-out';
export function Shell({children,email}:{children:React.ReactNode;email:string}){
  return <div className="app-frame"><aside className="sidebar"><div className="brand-block"><EvolveBrand href="/oggi"/></div><p className="sidebar-caption">ALLENATI A CAMBIARE</p><SidebarNav/><div className="sidebar-bottom"><p className="muted text-xs break-all">{email}</p><SignOutButton/></div></aside><div className="workspace"><header className="mobile-header"><EvolveBrand href="/oggi" compact/><SignOutButton/></header><main id="contenuto" className="main-content">{children}</main><SidebarNav mobileOnly/></div></div>;
}
