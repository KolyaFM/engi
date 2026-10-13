import {useEffect,useState} from 'react';
import {db,type PackRow} from '../db/engi-db';
import {removeInstalledPack,finishPackMediaCleanup} from '../services/pack-removal';
import {toast} from 'sonner';
import './installed-packs.css';

export function InstalledPacksPanel({revision,onImport,onChanged}:{revision:number;onImport:()=>void;onChanged?:()=>Promise<void>}){
 const [packs,setPacks]=useState<PackRow[]>([]),[busy,setBusy]=useState<string>(),[error,setError]=useState(''),[pending,setPending]=useState(false);
 async function refresh(){const [rows,journal]=await Promise.all([db.installedPacks.toArray(),db.appMeta.get('packRemoval:pendingMedia')]);setPacks(rows);setPending(!!journal?.value?.length);}
 useEffect(()=>{let active=true;void finishPackMediaCleanup().catch(e=>{if(active)setError('Не удалось очистить файлы: '+e.message);}).finally(()=>{if(active)void refresh();});return()=>{active=false;};},[revision]);
 async function remove(pack:PackRow){
  if(busy||!window.confirm(`Удалить пакет «${pack.name}» вместе с его колодами, изображениями, правками и прогрессом? Общие данные других пакетов и отдельно созданных личных записей сохранятся.`))return;
  setBusy(pack.packId);setError('');
  try{await removeInstalledPack(pack.packId);toast.success('Пакет удалён');}
  catch(e){setError((e as Error).message);}
  finally{try{await refresh();await onChanged?.();}catch(e){setError((e as Error).message);}finally{setBusy(undefined);}}
 }
 async function retry(){setBusy('cleanup');setError('');try{await finishPackMediaCleanup();}catch(e){setError((e as Error).message);}finally{await refresh();setBusy(undefined);}}
 return <section className="panel installed-packs-panel"><div className="section-heading"><h2>Пакеты</h2><button type="button" className="button primary" disabled={!!busy} onClick={onImport}>Импортировать пакет</button></div>
  {packs.length?packs.map(pack=><div className="review-row installed-pack-row" key={pack.packId}><div><h3>{pack.name}</h3><p className="muted">{pack.entityIds.length} объектов · {pack.factIds.length} свойств</p></div><button type="button" className="button outline" aria-label={`Удалить пакет ${pack.name}`} disabled={!!busy} onClick={()=>void remove(pack)}>{busy===pack.packId?'Удаляем…':'Удалить'}</button></div>):<p className="muted">Нет установленных пакетов.</p>}
  {error&&<p role="alert">{error}</p>}{pending&&<button type="button" className="button outline" disabled={!!busy} onClick={()=>void retry()}>Завершить очистку файлов</button>}
 </section>;
}
