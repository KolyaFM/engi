import './work-badge.css';
export type WorkKind='learning'|'repeat'|'mistakes';
export function WorkBadge({kind,value,label=false}:{kind:WorkKind;value:number;label?:boolean}){const text={learning:'В обучении',repeat:'Повторить',mistakes:'Ошибки'}[kind];return <span className={`work-badge ${kind}`} aria-label={`${text}: ${value}`}><strong>{value}</strong>{label&&<small>{text}</small>}</span>;}
