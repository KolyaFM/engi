import {db,type EngiDB} from '../db/engi-db';
import {contentTables,getBundle} from '../db/repositories';
import {validateImport} from '../lib/engi/validate';
import type {Deck} from '../lib/engi/types';
const tables=(d:EngiDB)=>[...contentTables(d),d.activeSessions];
export async function saveDeck(deck:Deck,d:EngiDB=db){return d.transaction('rw',tables(d),async()=>{const current=await getBundle(d),row={...deck,name:deck.name.trim(),origin:deck.origin??'user' as const,userModified:true};validateImport({...current,decks:[...current.decks!.filter(x=>x.id!==deck.id),row]},current,true);await d.decks.put(row);await d.activeSessions.where('status').equals('active').modify({status:'completed'});return row})}
export async function archiveDeck(id:string,d:EngiDB=db){return d.transaction('rw',tables(d),async()=>{const deck=await d.decks.get(id);if(!deck)throw Error('Колода не найдена');await d.decks.put({...deck,archived:true,userModified:true});await d.activeSessions.where('status').equals('active').modify({status:'completed'})})}
export async function attachDeckMember(entityId:string,deckId:string,d:EngiDB=db){return d.transaction('rw',tables(d),async()=>{if(!await d.entities.get(entityId)||!await d.decks.get(deckId))throw Error('Колода или объект не найдены');await d.deckMembers.put({entityId,deckId,archived:false,origin:'user',userModified:true});await d.activeSessions.where('status').equals('active').modify({status:'completed'})})}
export async function detachDeckMember(entityId:string,deckId:string,d:EngiDB=db){return d.transaction('rw',tables(d),async()=>{await d.deckMembers.put({entityId,deckId,archived:true,origin:'user',userModified:true});await d.activeSessions.where('status').equals('active').modify({status:'completed'})})}
