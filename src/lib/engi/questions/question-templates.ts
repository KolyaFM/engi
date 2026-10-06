import type {Format,PropertyDefinition} from '../types';

type Templates=NonNullable<PropertyDefinition['promptTemplates']>;
export const QUESTION_TEMPLATES:Readonly<Record<string,Templates>>={
 birth_date:{forward:'Когда родился {subject}?',timeline:'Когда родился {subject}?',sort:'Расположите людей по дате рождения: от ранней к поздней.'},
 presidency_start:{forward:'Когда {subject} стал президентом?',timeline:'Когда {subject} стал президентом?',sort:'Расположите президентов по началу президентства: от раннего к позднему.'},
 presidency_end:{forward:'Когда закончилось президентство {subject}?',timeline:'Когда закончилось президентство {subject}?',sort:'Расположите президентов по окончанию президентства: от раннего к позднему.'},
 party:{forward:'К какой партии принадлежал {subject}?'},
 created_by:{forward:'Кто автор «{subject}»?'},
 birth_place:{forward:'Где родился {subject}?'},
 creation_date:{forward:'Когда была создана работа «{subject}»?',timeline:'Когда была создана работа «{subject}»?',sort:'Расположите работы по дате создания: от ранней к поздней.'},
 capital:{forward:'Какой город является столицей {subject}?'},
 invented_by:{forward:'Кто изобрёл «{subject}»?'},
 event_start:{forward:'Когда началось событие «{subject}»?',timeline:'Когда началось событие «{subject}»?',sort:'Расположите события по дате начала: от ранней к поздней.'},
 movement:{forward:'К какому направлению относится «{subject}»?'},
 definition:{forward:'Что означает «{subject}»?'},
};

const present=(template:string|undefined)=>template?.trim()||undefined;
const defaults=(property:PropertyDefinition|undefined)=>property?QUESTION_TEMPLATES[property.id]:undefined;

/** An explicit setting and a real reverse template are both required. */
export function reversePromptAvailable(property:PropertyDefinition|undefined):boolean{
 if(!property)return false;
 const enabled=property.learning?.reverse??property.inverse?.enabled??false;
 return enabled&&!!present(property.promptTemplates?.reverse??defaults(property)?.reverse);
}

/** Templates are interpolated as text; replacement callbacks preserve literal dollar signs. */
export function questionPrompt(property:PropertyDefinition|undefined,subject:string,format:Format,direction:'forward'|'reverse'='forward'):string{
 const custom=property?.promptTemplates,builtin=defaults(property),label=property?.name.trim()||'Ответ';
 let template:string|undefined;
 if(direction==='reverse')template=present(custom?.reverse)??present(builtin?.reverse);
 else if(format==='missing')template=`Какой объект пропущен в последовательности по полю «${label}»?`;
 else if(format==='sort')template=present(custom?.sort)??present(builtin?.sort)??`Расположите объекты по полю «${label}»: от раннего к позднему.`;
 else if(format==='timeline')template=present(custom?.timeline)??present(custom?.forward)??present(builtin?.timeline)??present(builtin?.forward);
 else template=present(custom?.forward)??present(builtin?.forward);
 if(!template)template=direction==='reverse'?`Обратный вопрос для поля «${label}» не настроен.`:`Укажите «${label}» для «{subject}».`;
 return template.replace(/\{subject\}/g,()=>subject);
}
