import { daysInMonth, lectureMonthDocumentId, monthKey, type CmsImage, type MonthSchedule, type PosterImage, type PosterSettings, type Speaker, type SessionType } from "./model";

export type Ref = { _type: "reference"; _ref: string };
export type PhotoLayout = { fit?: "contain" | "cover"; positionY?: number; zoom?: number; borderInset?: number };
export type MonthDocument = {
  _id: string; _type: "lectureMonth"; _rev?: string; year: number; month: number; showInfaq?: boolean;
  entries: { _key: string; _type: "lectureDay"; date: string; isManualOverride: boolean;
    sessions: { _key: string; _type: "lectureSession"; sessionType: SessionType; speaker?: Ref; speakerName?: string; topic?: string; photo?: CmsImage; photoLayout?: PhotoLayout; sourceRule?: Ref }[];
    specialPoster?: { image: CmsImage; mode: "full"; fit: "cover" | "contain"; position?: "top" | "center" | "bottom" };
  }[];
};
export const stableJson = (value: unknown): string => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const sessionTypes = new Set(["subuh", "maghrib", "jumaat", "yasin"]);
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function text(value: unknown, max: number, label: string) { assert(typeof value === "string" && value.length <= max, `Invalid ${label}.`); }
function reference(value: Ref | undefined) { if (value) assert(value._type === "reference" && /^[a-zA-Z0-9_-]+$/.test(value._ref) && !value._ref.startsWith("drafts."), "Reference must use a stable published ID."); }
export function validateCmsImage(image: CmsImage) {
  assert(["editorialImage", "image"].includes(image?._type) && image.asset?._type === "reference" && /^image-[a-f0-9]{40}-[1-9]\d*x[1-9]\d*-(png|jpg|webp)$/.test(image.asset._ref), "Invalid image reference.");
  text(image.alt, 300, "Image alt"); assert(image.alt.trim(), "Image alt is required.");
  if (image.crop) { const c=image.crop; assert([c.top,c.bottom,c.left,c.right].every(v=>Number.isFinite(v)&&v>=0&&v<1)&&c.top+c.bottom<1&&c.left+c.right<1,"Invalid image crop."); }
  if (image.hotspot) { const h=image.hotspot; assert([h.x,h.y,h.width,h.height].every(v=>Number.isFinite(v)&&v>=0&&v<=1)&&h.width>0&&h.height>0,"Invalid image hotspot."); }
}
export function validateMonthDocument(document: MonthDocument) {
  const id=lectureMonthDocumentId(document.year,document.month);
  const allowed=(value:object,keys:string[])=>assert(Object.keys(value).every(key=>keys.includes(key)),"Unsupported CMS fields; review required before saving.");
  allowed(document,["_id","_type","_rev","_createdAt","_updatedAt","year","month","showInfaq","entries"]);
  assert(document._type==="lectureMonth"&&(document._id===id||document._id===`drafts.${id}`),"Invalid month document identity.");
  assert(document.showInfaq===undefined||typeof document.showInfaq==="boolean","showInfaq must be boolean.");
  assert(Array.isArray(document.entries)&&document.entries.length<=31,"Invalid Jadual dates.");
  const dates=new Set<string>(), keys=new Set<string>();
  for(const entry of document.entries) {
    allowed(entry,["_key","_type","date","isManualOverride","sessions","specialPoster"]);
    assert(entry._type==="lectureDay"&&typeof entry._key==="string"&&/^[\w-]+$/.test(entry._key)&&!keys.has(entry._key),"Invalid or duplicate date key."); keys.add(entry._key);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(entry.date)&&entry.date.startsWith(monthKey(document.year,document.month)+"-")&&!dates.has(entry.date),"Duplicate or out-of-month date.");dates.add(entry.date);
    const day=Number(entry.date.slice(-2));assert(day>=1&&day<=daysInMonth(document.year,document.month),"Invalid calendar date.");
    assert(typeof entry.isManualOverride==="boolean"&&Array.isArray(entry.sessions)&&entry.sessions.length<=2,"Invalid override or sessions; maximum 2.");
    const sessionKeys=new Set<string>();
    for(const session of entry.sessions) {
      allowed(session,["_key","_type","sessionType","speaker","speakerName","topic","photo","photoLayout","sourceRule"]);
      assert(session._type==="lectureSession"&&typeof session._key==="string"&&/^[\w-]+$/.test(session._key)&&!sessionKeys.has(session._key)&&sessionTypes.has(session.sessionType),"Invalid session key or type.");sessionKeys.add(session._key);
      if(session.speakerName!==undefined)text(session.speakerName,160,"Name snapshot");
      if(session.topic!==undefined)text(session.topic,160,"Topic snapshot");
      reference(session.speaker);reference(session.sourceRule);
      assert(!session.speaker||!!session.speakerName?.trim(),"Selected Penceramah requires a name snapshot.");
      if(session.photo)validateCmsImage(session.photo);
      if(session.photoLayout) {
        const p=session.photoLayout;assert(!!session.photo&&(!p.fit||["cover","contain"].includes(p.fit)),"Photo layout requires a valid photo and fit.");
        assert(p.positionY===undefined||(Number.isFinite(p.positionY)&&p.positionY>=0&&p.positionY<=100),"Invalid photo position.");
        assert(p.zoom===undefined||(Number.isFinite(p.zoom)&&p.zoom>=1&&p.zoom<=1.6),"Invalid photo zoom.");
        assert(p.borderInset===undefined||(Number.isFinite(p.borderInset)&&p.borderInset>=0&&p.borderInset<=20),"Invalid photo inset.");
      }
    }
    if(entry.specialPoster) { const p=entry.specialPoster;assert(entry.isManualOverride&&p.mode==="full"&&["cover","contain"].includes(p.fit)&&(!p.position||["top","center","bottom"].includes(p.position)),"Special poster must be a full manual override with valid fit and position.");validateCmsImage(p.image); }
  }
  // Runtime-only URLs/geometry, fixture state and secret fields cannot reach a CMS payload.
  assert(!/"(?:src|originalFile|localHash|generalDonationQr|blob|day|geometry|token)"\s*:/.test(JSON.stringify(document)),"Runtime fields must not be persisted.");
}
export type ImageResolver = (image: PosterImage | NonNullable<Speaker["photo"]>, alt: string) => Promise<CmsImage>;
export async function serializeMonth(schedule: MonthSchedule, speakers: Speaker[], settings: PosterSettings, image: ImageResolver): Promise<MonthDocument> {
  lectureMonthDocumentId(schedule.year,schedule.month);
  const entries: MonthDocument["entries"]=[];
  const days=new Set<number>();
  for(const entry of [...schedule.entries].sort((a,b)=>a.day-b.day)) {
    assert(Number.isInteger(entry.day)&&entry.day>=1&&entry.day<=daysInMonth(schedule.year,schedule.month)&&!days.has(entry.day),"Invalid or duplicate date.");days.add(entry.day);
    assert(entry.sessions.length<=2,"Maximum two sessions per date.");
    const sessions: MonthDocument["entries"][number]["sessions"]=[];
    for(const session of entry.sessions) {
      const speaker=speakers.find(s=>s.id===session.speakerId), snapshot=session.speakerName!==undefined;
      assert(!session.speakerId||snapshot||!!speaker,"Penceramah is missing from the library; reload.");
      const name=snapshot?session.speakerName!:speaker?.name;
      const photo=snapshot?session.photo:speaker?.photo;
      const value: typeof sessions[number]={_key:session.id,_type:"lectureSession",sessionType:session.sessionType,topic:session.topic};
      if(session.speakerId)value.speaker={_type:"reference",_ref:session.speakerId};
      if(name!==undefined)value.speakerName=name;
      if(session.sourceRuleId)value.sourceRule={_type:"reference",_ref:session.sourceRuleId};
      if(photo){value.photo=await image(photo,photo.cmsImage?.alt||`Potret ${name||"penceramah"}`);value.photoLayout=Object.fromEntries(Object.entries({fit:photo.fit,positionY:photo.positionY,zoom:photo.zoom,borderInset:photo.borderInset}).filter(([,v])=>v!==undefined));}
      sessions.push(value);
    }
    const value: typeof entries[number]={_key:`day-${entry.day}`,_type:"lectureDay",date:`${monthKey(schedule.year,schedule.month)}-${String(entry.day).padStart(2,"0")}`,isManualOverride:entry.isManualOverride,sessions};
    if(entry.specialPoster){const p=entry.specialPoster;value.specialPoster={image:await image(p.image,p.image.alt),mode:p.mode,fit:p.fit,...(p.position?{position:p.position}:{})};}
    entries.push(value);
  }
  const payload: MonthDocument={_id:`drafts.${lectureMonthDocumentId(schedule.year,schedule.month)}`,_type:"lectureMonth",year:schedule.year,month:schedule.month,showInfaq:settings.showInfaq===undefined?true:settings.showInfaq,entries};
  validateMonthDocument(payload);return payload;
}
export function imageView(image: CmsImage, projectId: string, dataset: string): PosterImage {
  validateCmsImage(image);const match=/^image-([a-f0-9]{40})-(\d+)x(\d+)-(png|jpg|webp)$/.exec(image.asset._ref)!;
  const src=`https://cdn.sanity.io/images/${projectId}/${dataset}/${match[1]}-${match[2]}x${match[3]}.${match[4]}`;
  // Original asset URL. Do not render silently altered image crop/hotspot snapshots.
  if(image.crop&&[image.crop.top,image.crop.bottom,image.crop.left,image.crop.right].some(v=>v!==0))throw new Error("Image has a saved crop; review the source before editing or exporting.");
  return {src,width:Number(match[2]),height:Number(match[3]),alt:image.alt,assetId:image.asset._ref,cmsImage:structuredClone(image)};
}
export function deserializeMonth(document: MonthDocument, projectId: string, dataset: string): MonthSchedule {
  validateMonthDocument(document);
  return {year:document.year,month:document.month,entries:document.entries.map(e=>({day:Number(e.date.slice(-2)),isManualOverride:e.isManualOverride,sessions:e.sessions.map(s=>({id:s._key,sessionType:s.sessionType,speakerId:s.speaker?._ref||"",topic:s.topic||"",...(s.speakerName!==undefined?{speakerName:s.speakerName}:{}),...(s.photo?{photo:{...imageView(s.photo,projectId,dataset),...s.photoLayout}}:{}),...(s.sourceRule?{sourceRuleId:s.sourceRule._ref}:{})})),...(e.specialPoster?{specialPoster:{...e.specialPoster,image:imageView(e.specialPoster.image,projectId,dataset)}}:{})}))};
}
