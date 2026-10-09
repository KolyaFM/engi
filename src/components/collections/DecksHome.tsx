import {ContinuousOutline} from '../../ui/ContinuousOutline';
import {CheckIcon} from '../../ui/AppIcons';
import {deckTileTitle,deckCover} from './deck-presentation';
import {useEffect,useMemo,useState} from 'react';
import type {Snapshot} from '../../lib/engi/types';
import type {LearningLifecycle} from '../../lib/engi/study-core/acquisition';
import {createDeckTargetIndex,deckOverview,type DeckSelection} from '../../services/deck-overview';
import {KnowledgeImage} from '../knowledge/KnowledgeImage';
import './decks-home.css';
export function WorkBadges({learning,repeat,mistakes,labels=false}:{learning:number;repeat:number;mistakes:number;labels?:boolean}){
 return <div className={`work-badges ${labels?'with-labels':''}`}>{[{key:'learning',value:learning,label:'В обучении'},{key:'repeat',value:repeat,label:'Повторить'},{key:'mistakes',value:mistakes,label:'Ошибки'}].map(x=><span className={`work-badge ${x.key}`} key={x.key} aria-label={`${x.label}: ${x.value}`}><strong>{x.value}</strong>{labels&&<small>{x.label}</small>}</span>)}</div>;
}
export function DecksHome({snapshot,lifecycle,selection,targetIndex,busy,legacyResume,onToggle,onStart,onImport}:{snapshot:Snapshot;lifecycle?:LearningLifecycle;selection:DeckSelection;targetIndex:ReturnType<typeof createDeckTargetIndex>;busy:boolean;legacyResume?:()=>void;onToggle:(id:string)=>void;onStart:()=>void;onImport:()=>void}){
 const [now,setNow]=useState(Date.now());useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer)},[]);
 // Updating selection never moves a tile. Last-study ordering changes after a session.
 const decks=useMemo(()=>(snapshot.bundle.decks??[]).filter(d=>!d.archived).sort((a,b)=>(selection.lastStudied[b.id]??'').localeCompare(selection.lastStudied[a.id]??'')||a.name.localeCompare(b.name,'ru')),[snapshot.bundle,selection.lastStudied]);
 const overviews=useMemo(()=>new Map(decks.map(deck=>[deck.id,deckOverview(snapshot,lifecycle,[deck.id],now,targetIndex)])),[decks,snapshot,lifecycle,now,targetIndex]);
 const summary=useMemo(()=>deckOverview(snapshot,lifecycle,selection.ids,now,targetIndex),[snapshot,lifecycle,selection.ids,now,targetIndex]);
 return <section className="decks-home feed-home"><div className="deck-cover-grid">{decks.map(deck=>{const chosen=selection.ids.includes(deck.id),stats=overviews.get(deck.id)!,cover=deckCover(snapshot.bundle,deck);return <article className={`deck-cover ${chosen?'is-selected':''}`} key={deck.id}><button className={`deck-select cover-${cover.fit}`} aria-label={`Учить колоду «${deck.name}»`} aria-pressed={chosen} disabled={busy} onClick={()=>onToggle(deck.id)}>{cover.media&&<KnowledgeImage src={cover.media.url} alt=""/>}<span className="deck-selection-mark" aria-hidden="true">{chosen&&<CheckIcon/>}</span><span className="deck-cover-content"><strong className="deck-cover-title">{deckTileTitle(deck.name)}</strong><span className="deck-progress-percent">{stats.percent}%</span><span className="deck-progress-track" role="progressbar" aria-label={`Изучено в колоде «${deck.name}»`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats.percent}><span style={{width:stats.percent+'%'}}/></span><WorkBadges {...stats}/></span></button><ContinuousOutline/></article>;})}</div>{!decks.length&&<div className="decks-empty"><button className="button primary" onClick={onImport}>Добавить колоду</button></div>}<div className="decks-start-bar"><WorkBadges {...summary} labels/><button className="button primary decks-start" disabled={busy||!legacyResume&&(!selection.ids.length||!summary.total)} onClick={legacyResume??onStart}>{busy?'Подготавливаем…':legacyResume?'Продолжить с прошлого места':'Начать обучение'}</button></div></section>;
}
