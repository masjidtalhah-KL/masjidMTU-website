// Test-only transport for existing Kuliah browser/export regressions.
// Evaluate actual read-only GROQ against the immutable repository snapshot;
// never contact Sanity, create a campaign descriptor, or change application code.
import './public-offline.mjs';
import {readFileSync,appendFileSync} from 'node:fs';
import {parse,evaluate} from 'groq-js';
const approved=JSON.parse(readFileSync(new URL('../../docs/LECTURE-FIRST-PUBLICATION-DRY-RUN.json',import.meta.url),'utf8')).plan;
const document={...approved.payload,_id:'lectureMonth-2026-10',_rev:'local-editorial-fixture'};
const dataset=[document,...approved.references.map(_id=>({_id,_type:'sanity.imageAsset'}))];
// Explicit offline-only published/draft/version/wrong-type cases. No production schema or seed.
const program=(id,extra={})=>({_id:id,_type:'program',description:'Penerangan editorial offline yang diluluskan untuk ujian.',...extra});
dataset.push(...['open','paused','closed','denied','module-off','archived','draft-campaign'].map(state=>program('local-program-'+state,{
  title:'Editorial title must not win',status:'archived',startAt:'2099-01-01T00:00:00Z',registrationUrl:'https://example.invalid/pay',isActive:false,
})),program('drafts.local-program-draft'),program('versions.release.local-program-version'),
program('local-program-wrong-type',{_type:'newsPost'}),program('local-program-malformed',{description:{html:'<script>bad</script>'}}),
program('local-program-html',{description:'<script>window.campaignInjected=true</script><img src=x onerror=alert(1)>'}),
program('local-program-collision',{slug:{current:'editorial-collision'},title:'Maklumat Kempen Ujian'}));
const offlineFetch=globalThis.fetch;
globalThis.fetch=async(input,options)=>{
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
  if(url.hostname!=='2o95jmms.api.sanity.io'||!/^\/v\d{4}-\d{2}-\d{2}\/data\/query\/production$/.test(url.pathname))return offlineFetch(input,options);
  const method=options?.method??(input instanceof Request?input.method:'GET');
  let query,params={};
  if(method==='GET'){
    query=url.searchParams.get('query');
    for(const [key,value] of url.searchParams)if(key.startsWith('$'))params[key.slice(1)]=JSON.parse(value);
  }else if(method==='POST'){
    const data=JSON.parse(options?.body??await input.clone().text());query=data.query;params=data.params??{};
  }else return offlineFetch(input,options);
  if(typeof query!=='string')return offlineFetch(input,options);
  const lecture=/_type\s*==\s*["']lectureMonth["']/.test(query);
  const campaign=/_id\s*==\s*\$documentId/.test(query)&&/_type\s*==\s*["']program["']/.test(query);
  if(!lecture&&!campaign)return offlineFetch(input,options);
  if(campaign)appendFileSync(new URL('../../../../outputs/f75-editorial-queries.jsonl',import.meta.url),JSON.stringify({documentId:params.documentId})+'\n');
  const result=await(await evaluate(parse(query),{dataset,params})).get();
  return new Response(JSON.stringify({result}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
};
