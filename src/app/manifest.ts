import type {MetadataRoute} from 'next';
/** Existing branded PNG assets are reused; never cache private pages. */
export default function manifest():MetadataRoute.Manifest{
 return {
  id:'/evolve/',name:'Evolve — Il tuo percorso personale',short_name:'Evolve',
  description:'Coaching pratico, abitudini, allenamento, alimentazione e obiettivi personali.',
  start_url:'/evolve/giornata',scope:'/evolve/',display:'standalone',
  background_color:'#f5f9fb',theme_color:'#0b8f91',lang:'it',orientation:'any',
  icons:[
   {src:'/evolve/brand/evolve_app_menta_192.png',sizes:'192x192',type:'image/png',purpose:'any'},
   {src:'/evolve/brand/evolve_app_menta_512.png',sizes:'512x512',type:'image/png',purpose:'any'},
  ],
 };
}
