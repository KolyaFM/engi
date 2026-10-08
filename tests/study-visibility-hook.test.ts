import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

/** Execute the actual hook under React's render-before-effect-cleanup ordering. */
function harness(){
 let reference:{current:unknown}|undefined,pending:(()=>unknown)|undefined,cleanup:(()=>void)|undefined,seq=0;
 const calls:{owner:string;episode:string;event:string}[]=[],listeners:Record<string,()=>void>={};
 const source=readFileSync(new URL('../src/components/study/useStudyVisibility.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const doc={visibilityState:'visible',addEventListener(name:string,handler:()=>void){listeners[name]=handler;},removeEventListener(name:string){delete listeners[name];}};
 const context={exports:{} as Record<string,any>,require(){return {useRef(value:unknown){return reference??={current:value};},useEffect(effect:()=>unknown){pending=effect;}};},
  document:doc,window:{addEventListener(){},removeEventListener(){}},crypto:{randomUUID(){return 'ep-'+(++seq);}},setInterval(){return 1;},clearInterval(){}};
 runInNewContext(code,context);
 return {calls,render(owner:string){context.exports.useStudyVisibility(owner,true,async(episode:string,event:string)=>{calls.push({owner,episode,event});},(e:Error)=>{throw e;});},
  flush(){cleanup?.();cleanup=pending!() as (()=>void)|undefined;},hide(){doc.visibilityState='hidden';listeners.visibilitychange();},show(){doc.visibilityState='visible';listeners.visibilitychange();},unmount(){cleanup?.();}};
}
test('visibility cleanup closes the old card using its own handler after the next card renders',()=>{
 const h=harness();h.render('A');h.flush();h.render('B');h.flush();h.unmount();
 assert.deepEqual(h.calls,[{owner:'A',episode:'ep-1',event:'start'},{owner:'A',episode:'ep-1',event:'end'},{owner:'B',episode:'ep-2',event:'start'},{owner:'B',episode:'ep-2',event:'end'}]);
});
test('hiding and restoring a tab closes its episode and starts a fresh visible episode',()=>{
 const h=harness();h.render('A');h.flush();h.hide();h.show();h.unmount();
 assert.deepEqual(h.calls.map(c=>[c.owner,c.episode,c.event]),[['A','ep-1','start'],['A','ep-1','end'],['A','ep-2','start'],['A','ep-2','end']]);
});
