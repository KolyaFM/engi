import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {openAsBlob} from 'node:fs';
import {ZipWriter,BlobReader,TextReader,BlobWriter,configure} from '@zip.js/zip.js';
import {validateImport} from '../src/lib/engi/validate.ts';
import {parseV3} from '../src/lib/engi/import/schema-v3.ts';
import {buildImportPlan} from '../src/lib/engi/import/semantic-merge.ts';
import {manifestSchema,manifestV3Schema,safePath,sha256,checkImage,MAX_PACK_BYTES,MAX_MEDIA_BYTES} from '../src/services/pack-format.ts';
const [source,output]=process.argv.slice(2);if(!source||!output){console.error('Usage: npm run pack:build -- ./pack-source ./dist-packs/my-pack.engi');process.exit(1)}
configure({useWebWorkers:false});const root=resolve(source),raw=JSON.parse(await readFile(resolve(root,'bundle.json'),'utf8')),empty={entities:[],facts:[],media:[],tags:[],entityTags:[],missing:[],unresolved:[]};
const modern=raw.schemaVersion===3,bundle=modern?parseV3(raw):validateImport(raw,empty,true);if(modern){const plan=buildImportPlan(bundle,empty);if(plan.issues.length)throw Error('Пакет содержит неоднозначные ссылки: '+plan.issues.map(i=>i.label).join(', '))}
let input;try{input=JSON.parse(await readFile(resolve(root,'manifest.json'),'utf8'))}catch(e){if(!modern||e.code!=='ENOENT')throw e;input={format:'engi-pack',schemaVersion:3,name:bundle.name,createdAt:new Date().toISOString()}}
const files=[],paths=new Set(modern?bundle.entities.flatMap(e=>e.images.map(m=>m.file)):bundle.media.map(m=>m.url));let total=0;
for(const path of paths){if(!safePath(path)||!path.startsWith('media/'))throw Error('Media URL must be a safe media/ path');const mime=path.endsWith('.webp')?'image/webp':/\.jpe?g$/.test(path)?'image/jpeg':path.endsWith('.png')?'image/png':'';if(!mime)throw Error('Only WebP, JPEG, PNG');const blob=await openAsBlob(resolve(root,path),{type:mime});if(blob.size>MAX_MEDIA_BYTES)throw Error('Image over 16 MiB');total+=blob.size;if(total>MAX_PACK_BYTES)throw Error('Pack over 512 MiB');await checkImage(blob,mime);files.push({path,bytes:blob.size,sha256:await sha256(blob),mime})}
const manifest=(modern?manifestV3Schema:manifestSchema).parse({...input,files}),writer=new ZipWriter(new BlobWriter('application/zip'));await writer.add('manifest.json',new TextReader(JSON.stringify(manifest,null,2)));await writer.add('bundle.json',new TextReader(JSON.stringify(bundle,null,2)));for(const f of files)await writer.add(f.path,new BlobReader(await openAsBlob(resolve(root,f.path),{type:f.mime})),{level:0});const zip=await writer.close();if(zip.size>MAX_PACK_BYTES)throw Error('Final archive over 512 MiB');await mkdir(dirname(resolve(output)),{recursive:true});await writeFile(output,new Uint8Array(await zip.arrayBuffer()));console.log(JSON.stringify({output,bytes:zip.size,schemaVersion:manifest.schemaVersion,entities:bundle.entities.length,media:files.length},null,2));
