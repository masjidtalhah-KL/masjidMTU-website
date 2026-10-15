// Presentation only: authoritative registration values remain unchanged.
export const registrationStatusLabels={submitted:"Dihantar",cancelled:"Dibatalkan"} as const;
export function compactQurbanReference(reference:string){return reference.length>24?reference.slice(0,10)+"…"+reference.slice(-7):reference;}
