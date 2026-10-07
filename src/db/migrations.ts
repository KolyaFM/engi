export const APP_DB_VERSION=4;
export const storesV1={entities:'id,type',facts:'id,entityId,[entityId+key]',tags:'id',entityTags:'[entityId+tagId],entityId,tagId',media:'id,entityId,hash',learningState:'id,dueAt,stability,covered',reviewEvents:'id,timestamp,recipe,*targetIds',installedPacks:'packId',activeSessions:'id,updatedAt,status',appMeta:'key'};
export const storesV2={...storesV1,facts:'id,entityId,key,valueEntityId,[entityId+key]',propertyDefinitions:'id,valueKind',entityTypes:'id'};

export const storesV3={...storesV2,targetMappings:'legacyId,unitId'};


export const storesV4={...storesV3,decks:'id,name',deckMembers:'[deckId+entityId],deckId,entityId'};
