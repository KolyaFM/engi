import type {Bundle,Deck,Media} from '../../lib/engi/types';
/** Remove a pack's descriptive count suffix on tiles, retaining its full stored name. */
export function deckTileTitle(name:string){return name.replace(/\s+[—–]\s+\d+\b.*$/u,'').trim()||name;}
export function deckCover(bundle:Bundle,deck:Deck):{media?:Media;fit:'cover'|'contain'}{
 const members=new Set((bundle.deckMembers??[]).filter(m=>m.deckId===deck.id&&!m.archived).map(m=>m.entityId)),images=bundle.media.filter(m=>members.has(m.entityId)&&!m.archived);
 const media=images.find(m=>m.primary&&m.role!=='property')??images.find(m=>m.role!=='property')??images[0];if(!media)return {fit:'cover'};
 const entity=bundle.entities.find(e=>e.id===media.entityId),type=bundle.entityTypes?.find(t=>t.id===entity?.type)?.name??entity?.type??'';
 const propertyImage=bundle.facts.some(f=>f.valueKind==='image'&&f.valueMediaId===media.id);
 const diagram=propertyImage||['map','flag','карта','флаг'].includes(media.role.toLowerCase())||/^(штат(?:\s+США)?|американский штат|state|us state|страна|country)$/iu.test(type);
 return {media,fit:diagram?'contain':'cover'};
}
