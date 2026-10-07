import {z} from 'zod';
export const MAX_PACK_BYTES=512*1024*1024;
export const MAX_MEDIA_BYTES=16*1024*1024;
export const allowedMimes=['image/webp','image/jpeg','image/png'] as const;
export function safePath(path:string){return path.length<=200&&!path.startsWith('/')&&!path.includes('\\')&&!path.includes(':')&&!path.split('/').some(s=>!s||s==='.'||s==='..')&&/^[A-Za-z0-9._/-]+$/.test(path)}
export const manifestSchema=z.object({format:z.literal('engi-pack'),schemaVersion:z.union([z.literal(1),z.literal(2)]),packId:z.string().regex(/^[A-Za-z0-9._-]{1,150}$/),packVersion:z.number().int().positive(),name:z.string().min(1).max(200),createdAt:z.string().datetime({offset:true}),files:z.array(z.object({path:z.string().refine(p=>safePath(p)&&p.startsWith('media/')),bytes:z.number().int().positive().max(MAX_MEDIA_BYTES),sha256:z.string().regex(/^[a-f0-9]{64}$/),mime:z.enum(allowedMimes)})).max(50000)});
export async function sha256(blob:Blob){const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')}
export async function checkImage(blob:Blob,mime:string){const bytes=new Uint8Array(await blob.slice(0,16).arrayBuffer());const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10;const jpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';if(!({'image/png':png,'image/jpeg':jpeg,'image/webp':webp}[mime]))throw Error('Содержимое изображения не соответствует MIME');}

export const manifestV3Schema=manifestSchema.omit({schemaVersion:true,packId:true,packVersion:true}).extend({schemaVersion:z.literal(3)}).strict();
