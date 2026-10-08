"""Promote the supplied US-state flag images to explicit image-valued facts."""
import argparse, datetime, json, zipfile
from pathlib import Path
parser=argparse.ArgumentParser()
parser.add_argument('input',type=Path)
parser.add_argument('output',type=Path)
args=parser.parse_args()
if args.input.resolve()==args.output.resolve():raise ValueError('Choose a separate output archive')
if args.output.exists():raise FileExistsError(args.output)
with zipfile.ZipFile(args.input) as source:
 bundle=json.loads(source.read('bundle.json'))
 if any(p['name']=='Флаг' for p in bundle['properties']):raise ValueError('Flag property already exists')
 bundle['properties'].append({'name':'Флаг','valueType':'image','multiple':False,'learnable':True,'subjectTypes':['Штат США'],'promptTemplates':{'forward':'Какому штату принадлежит этот флаг?'},'learning':{'choice':'on','match':'on','recallReveal':'on'}})
 bundle['deck']['learning']['properties'].append('Флаг')
 count=0
 for entity in bundle['entities']:
  for image in entity.get('images',[]):
   if Path(image['file']).name.startswith('flag-'):
    image.update(role='property',recognition=False,primary=False)
    entity['facts'].append({'property':'Флаг','value':{'file':image['file']},'source':{'kind':'url','url':image['sourceUrl'],'name':'Флаг из предоставленного пользователем пакета'},'verification':'user_confirmed'})
    count+=1
 if count!=50:raise ValueError(f'Expected 50 state flags; found {count}')
 manifest=json.loads(source.read('manifest.json'))
 manifest['createdAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
 args.output.parent.mkdir(parents=True,exist_ok=True)
 with zipfile.ZipFile(args.output,'w',compression=zipfile.ZIP_DEFLATED) as out:
  for entry in source.infolist():
   value=json.dumps(bundle if entry.filename=='bundle.json' else manifest,ensure_ascii=False,indent=2).encode('utf-8') if entry.filename in ('bundle.json','manifest.json') else source.read(entry.filename)
   out.writestr(entry,value)
print(f'Created {args.output}: {count} independent flag properties')
