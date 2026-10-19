'use client';

import Link from 'next/link';
import {useState} from 'react';
import logo from '../../public/brand/logo.png';
import {BASE_PATH} from '@/lib/config';

/** Uses bundled static asset to bypass ambiguous /public paths behind Aruba proxy.
 * Always displays a recognizable wordmark if the image cannot load. */
export function EvolveBrand({href='/',compact=false}:{href?:string;compact?:boolean}){
  const [failed,setFailed]=useState(false);
  const src=logo.src.startsWith(BASE_PATH+'/')?logo.src:BASE_PATH+logo.src;
  return <Link href={href} className={'evolve-brand '+(compact?'evolve-brand-compact':'')} aria-label="Evolve, torna alla pagina principale">
    {failed?<span className="evolve-brand-fallback" aria-hidden="true"><span className="evolve-brand-mark"><i/><i/><i/></span><strong>Evolve</strong></span>
      :<><img src={src} width="185" height="54" alt="Evolve" onError={()=>setFailed(true)}/><span className="sr-only">Evolve</span></>}
  </Link>;
}
