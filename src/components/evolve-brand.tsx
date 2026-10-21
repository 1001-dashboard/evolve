'use client';

import {useState} from 'react';
import logo from '../../public/brand/logo.png';
import {BASE_PATH} from '@/lib/config';

/** Use ordinary navigation under PHP proxy to avoid Next Flight requests.
 * Bundled logo still has a text fallback if its asset cannot be loaded. */
export function EvolveBrand({href='/',compact=false}:{href?:string;compact?:boolean}){
  const [failed,setFailed]=useState(false);
  const src=logo.src.startsWith(BASE_PATH+'/')?logo.src:BASE_PATH+logo.src;
  const destination=BASE_PATH+(href.startsWith('/')?href:'/'+href);
  return <a href={destination} className={'evolve-brand '+(compact?'evolve-brand-compact':'')} aria-label="Evolve, torna alla pagina principale">
    {failed?<span className="evolve-brand-fallback" aria-hidden="true"><span className="evolve-brand-mark"><i/><i/><i/></span><strong>Evolve</strong></span>
      :<><img src={src} width="185" height="54" alt="Evolve" onError={()=>setFailed(true)}/><span className="sr-only">Evolve</span></>}
  </a>;
}
