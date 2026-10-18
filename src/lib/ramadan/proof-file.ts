// Reuse only the stateless byte-format validator; no Qurban records/capabilities.
import{validateProofFile as validateBytes}from'../qurban/proof-file';import{RamadanError}from'./contracts';import type{ProofEvidence}from'./payment-contract';
export function validateProofFile(bytes:Uint8Array,name:string,type:string):ProofEvidence{try{return validateBytes(bytes,name,type);}catch{throw new RamadanError(422,'invalid');}}
