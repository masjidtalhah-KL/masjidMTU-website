import{pathToFileURL}from'node:url';
import fs from'node:fs';import path from'node:path';import{localWorker}from'./worker.mjs';import{localReviewStack}from'../ramadan-domain/review-fixture.mjs';import{root}from'../admin-foundation/database.mjs';
export const reviewTokenFile=path.join(root,'.cache/ramadan-review-storage-token.json');
export const REVIEW_RENEW_MS=45*60*1000;
export function renewReviewToken(){
 localReviewStack();const cache=path.dirname(reviewTokenFile);fs.mkdirSync(cache,{recursive:true});if(fs.realpathSync(cache)!==cache)throw Error('Review credential directory must not be redirected');
 if(fs.existsSync(reviewTokenFile)&&fs.lstatSync(reviewTokenFile).isSymbolicLink())throw Error('Review credential must not be a link');
 const temporary=reviewTokenFile+'.'+process.pid+'.tmp';try{fs.writeFileSync(temporary,JSON.stringify({token:localWorker()}),{flag:'wx',mode:0o600});fs.renameSync(temporary,reviewTokenFile);}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){if(process.argv.length!==3||process.argv[2]!=='renew')throw Error('Usage: node scripts/ramadan-payment/review-token.mjs renew');renewReviewToken();console.info('Local scoped Storage token renewed. No database records changed.');}
