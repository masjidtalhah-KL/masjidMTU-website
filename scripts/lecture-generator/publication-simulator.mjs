// In-memory Actions simulator only. Never connects to Sanity or uses credentials.
export const clone=value=>JSON.parse(JSON.stringify(value));
export function publicationMemory(documents=[]) {
 const store=new Map(documents.map(d=>[d._id,clone(d)])),calls={actions:[],uploads:[]};let revision=0;
 const client={store,calls,beforeAction:undefined,afterAction:undefined,beforeFetch:undefined,
 config:()=>({projectId:'2o95jmms',dataset:'production',perspective:'raw',useCdn:false,maxRetries:0}),
 async getDocument(id){return clone(store.get(id)??null);},
 async fetch(query,params) {
  await client.beforeFetch?.(query,params);
  if(query.startsWith('*[_id in $ids]'))return params.ids.flatMap(id=>store.has(id)?[clone(store.get(id))]:[]);
  if(query.includes('"speakers":'))return {speakers:[],rules:[]};
  if(query.includes('_id=="siteSettings"'))return clone(store.get('siteSettings')??null);
  if(query.startsWith('count('))return [...store.keys()].filter(id=>id.startsWith('drafts.')).length;
  throw Error('Unexpected simulator query '+query);
 },
 assets:{async upload(){calls.uploads.push(true);throw Error('Publication may not upload assets.');}},
 async action(actions) {
  calls.actions.push(clone(actions));await client.beforeAction?.();
  const next=new Map([...store].map(([id,d])=>[id,clone(d)]));
  const conflict=()=>{throw Object.assign(Error('Atomic revision conflict'),{statusCode:409});};
  for(const a of actions) {
   if(a.actionType==='sanity.action.document.create'){
    if(next.has(a.publishedId))conflict();
    if(next.has(a.attributes._id)){if(a.ifExists==='ignore')continue;conflict();}
    next.set(a.attributes._id,{...clone(a.attributes),_rev:'sim-'+ ++revision});
   } else if(a.actionType==='sanity.action.document.publish') {
    const draft=next.get(a.draftId),published=next.get(a.publishedId);
    if(!draft||draft._rev!==a.ifDraftRevisionId||(a.ifPublishedRevisionId&&published?._rev!==a.ifPublishedRevisionId))conflict();
    next.set(a.publishedId,{...clone(draft),_id:a.publishedId,_rev:'sim-published-'+ ++revision});
    next.delete(a.draftId); // Built-in supported publication semantics, not an application deletion.
   } else if(a.actionType==='sanity.action.document.version.create'){
    if(next.has(a.versionId)||next.get(a.baseId)?._rev!==a.ifBaseRevisionId)conflict();
    next.set(a.versionId,{...clone(next.get(a.baseId)),_id:a.versionId,_rev:'sim-draft-'+ ++revision});
   } else if(a.actionType==='sanity.action.document.version.replace'){
    if(!next.has(a.document._id))conflict();next.set(a.document._id,{...clone(a.document),_rev:'sim-draft-'+ ++revision});
   } else if(a.actionType==='sanity.action.document.edit'){
    const draft=next.get(a.draftId);if(!draft||draft._rev!==a.patch.ifRevisionID)conflict();
    next.set(a.draftId,{...draft,...clone(a.patch.set),_rev:'sim-draft-'+ ++revision});
   } else throw Error('Unexpected action '+a.actionType);
  }
  store.clear();for(const [id,d]of next)store.set(id,d);
  await client.afterAction?.();return {transactionId:'sim-transaction',results:actions.map(()=>({status:'success'}))};
 },
 };
 return client;
}
