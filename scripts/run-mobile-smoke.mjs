import {spawn} from 'node:child_process';
import {mkdir,access,writeFile} from 'node:fs/promises';
import {createMobileSmokeFixtures} from './mobile-smoke-fixtures.mjs';
const folder=process.env.ENGI_SMOKE_OUTPUT??'artifacts/mobile-smoke',servers=[],logs=[];
await mkdir(folder,{recursive:true});await access('dist/index.html').catch(()=>{throw Error('Сначала выполните pnpm build.');});
function child(args,env={}){return spawn(process.execPath,args,{cwd:process.cwd(),env:{...process.env,...env},windowsHide:true,stdio:['ignore','pipe','pipe']});}
async function run(args,env={}){const p=child(args,env);p.stdout.on('data',v=>{process.stdout.write(v);logs.push(v.toString());});p.stderr.on('data',v=>{process.stderr.write(v);logs.push(v.toString());});await new Promise((resolve,reject)=>{p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(Error(`${args.join(' ')} exited ${code}`)));});}
async function serve(mode,port){const p=child(['node_modules/vite/bin/vite.js',...(mode==='preview'?['preview']:[]),'--host','127.0.0.1','--port',String(port),'--strictPort']);servers.push(p);let failure;p.on('error',e=>failure=e);p.on('exit',code=>failure=Error(`Test server exited ${code}`));p.stderr.on('data',v=>logs.push(v.toString()));p.stdout.on('data',v=>logs.push(v.toString()));const url=`http://127.0.0.1:${port}/engi/`;for(let n=0;n<100;n++){if(failure)throw failure;try{if((await fetch(url,{signal:AbortSignal.timeout(1000)})).ok)return url;}catch{}await new Promise(r=>setTimeout(r,100));}throw Error('Test server did not start');}
try{
 await createMobileSmokeFixtures();for(const key of ['a','b'])await run(['--import','tsx','scripts/build-engi-pack.mjs',`artifacts/mobile-smoke-fixtures/${key}`,`artifacts/mobile-smoke-fixtures/${key}.engi`]);
 const production=await serve('preview',Number(process.env.ENGI_SMOKE_PORT??4175)),development=await serve('dev',Number(process.env.ENGI_GESTURE_PORT??5175));
 await run(['tests/mobile-study-smoke.mjs'],{ENGI_SMOKE_URL:production});
 for(const file of ['recall-mobile-swipe-browser.mjs','mobile-swipe-browser.mjs','recall22-browser.mjs'])await run(['tests/'+file],{ENGI_TEST_URL:development});
}finally{for(const server of servers)server.kill();await writeFile(folder+'/runner.log',logs.join(''));}
