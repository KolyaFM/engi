import {useEffect,useState} from 'react';
import {useMediaUrl} from '../../media/use-media-url';
export function KnowledgeImage({src,alt='',className='',onFail}:{src?:string;alt?:string;className?:string;onFail?:()=>void}){const media=useMediaUrl(src),[failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[src]);useEffect(()=>{if(media.failed)onFail?.()},[media.failed]);return media.url&&!failed?<img className={className} src={media.url} alt={alt} onError={()=>{setFailed(true);onFail?.()}}/>:<div className={'image-unavailable '+className}>{src?'Изображение недоступно':'◇'}</div>}
