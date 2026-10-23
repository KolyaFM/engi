/** Diagnostic IDs and counts only; never persisted in a session or sent over the network. */
export type SelectionDecision={
 branch:string;lane?:'due'|'first';availableFormats?:Record<string,number>;
 rhythm?:{kind:string;score:number;blocked?:string;components:Record<string,number>}[];
 actualInteraction?:import('./feed-interactions').FeedInteraction;
 practice?:{reservedProperty?:string;recentProperties:string[];deferredCandidates:number;presentationCounts?:{property:string;choice:number;recall:number}[]};
 checks:Record<string,{status:'not-reached'|'disabled'|'cooldown'|'no-compatible-group'|'generated';count?:number}>;
 alternatives?:{priority:number;format:string;presentation:string;objects:string[];properties:string[];group:boolean;objectPenalty:number;formatPenalty:number}[];
 rejected?:{priority:number;format:string;group:boolean;reason:'materialization'}[];
 selected?:{objectDistance:number|null;propertyDistance:number|null;formatDistance:number|null};
};
