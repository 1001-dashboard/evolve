import {redirect} from 'next/navigation';
/** Keep all legacy links working; daily coaching lives at /giornata. */
export default function Oggi(){redirect('/giornata');}
