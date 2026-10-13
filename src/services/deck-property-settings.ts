import type {EngiDB} from '../db/engi-db';
import {getBundle,contentTables} from '../db/repositories';
import {createDeckStudyCatalog} from './deck-study-catalog';
export type DeckPropertySettings={version:1;revision:number;byDeck:Record<string,{disabledPropertyIds:string[];imageRecognition:boolean;optionOverrides?:Record<string,boolean>}>};
export const DECK_PROPERTY_SETTINGS_KEY='deckPropertySettings';
export const emptyDeckPropertySettings=():DeckPropertySettings=>({version:1,revision:0,byDeck:{}});
export function cleanDeckPropertySettings(value:unknown):DeckPropertySettings{
 const v=value as Partial<DeckPropertySettings>|undefined;if(v?.version!==1||!v.byDeck||typeof v.byDeck!=='object')return emptyDeckPropertySettings();
 const byDeck:DeckPropertySettings['byDeck']={};for(const [id,row] of Object.entries(v.byDeck))if(row&&Array.isArray(row.disabledPropertyIds)&&typeof row.imageRecognition==='boolean')Object.defineProperty(byDeck,id,{value:{disabledPropertyIds:[...new Set(row.disabledPropertyIds.filter(x=>typeof x==='string'))],imageRecognition:row.imageRecognition,...(row.optionOverrides&&typeof row.optionOverrides==='object'?{optionOverrides:Object.fromEntries(Object.entries(row.optionOverrides).filter(([,value])=>typeof value==='boolean'))}:{})},enumerable:true,writable:true,configurable:true});
 return {version:1,revision:Number.isSafeInteger(v.revision)&&v.revision!>=0?v.revision!:0,byDeck};
}
export async function readDeckPropertySettings(d:EngiDB){return cleanDeckPropertySettings((await d.appMeta.get(DECK_PROPERTY_SETTINGS_KEY))?.value);}
export async function saveDeckStudySelection(d:EngiDB,deckId:string,enabledOptionIds:string[]){return d.transaction('rw',[...contentTables(d),d.appMeta],async()=>{
 const b=await getBundle(d);if(!b.decks?.some(x=>x.id===deckId&&!x.archived))throw Error('Колода недоступна');
 const options=createDeckStudyCatalog(b).optionsFor(deckId),available=new Set(options.map(o=>o.id)),enabled=new Set(enabledOptionIds);if(enabledOptionIds.some(id=>!available.has(id)))throw Error('Выберите доступные свойства');
 const settings=await readDeckPropertySettings(d),previous=Object.hasOwn(settings.byDeck,deckId)?settings.byDeck[deckId]:undefined,optionOverrides={...previous?.optionOverrides,...Object.fromEntries(options.map(o=>[o.id,enabled.has(o.id)]))};
 const next:DeckPropertySettings={version:1,revision:settings.revision+1,byDeck:{...settings.byDeck,[deckId]:{disabledPropertyIds:previous?.disabledPropertyIds??[],imageRecognition:previous?.imageRecognition??true,optionOverrides}}};await d.appMeta.put({key:DECK_PROPERTY_SETTINGS_KEY,value:next});return next;
});}
export async function saveDeckPropertySelection(d:EngiDB,deckId:string,enabledPropertyIds:string[],imageRecognition:boolean){return d.transaction('rw',[...contentTables(d),d.appMeta],async()=>{
 const b=await getBundle(d);if(!b.decks?.some(x=>x.id===deckId&&!x.archived))throw Error('Колода недоступна');
 const options=createDeckStudyCatalog(b).optionsFor(deckId),available=new Set(options.filter(o=>o.kind==='property').map(o=>o.propertyId));
 if(enabledPropertyIds.some(id=>!available.has(id))||typeof imageRecognition!=='boolean')throw Error('Выберите доступные свойства');
 const settings=await readDeckPropertySettings(d),previous=Object.hasOwn(settings.byDeck,deckId)?settings.byDeck[deckId]:undefined;
 const disabledPropertyIds=[...new Set([...[...available].filter(id=>!enabledPropertyIds.includes(id)),...(previous?.disabledPropertyIds??[]).filter(id=>!available.has(id))])].sort();
 const next:DeckPropertySettings={version:1,revision:settings.revision+1,byDeck:{...settings.byDeck,[deckId]:{disabledPropertyIds,imageRecognition}}};await d.appMeta.put({key:DECK_PROPERTY_SETTINGS_KEY,value:next});return next;
 });}
