export const APP_DB_VERSION=2;
export const storesV1={entities:'id,type',facts:'id,entityId,[entityId+key]',tags:'id',entityTags:'[entityId+tagId],entityId,tagId',media:'id,entityId,hash',learningState:'id,dueAt,stability,covered',reviewEvents:'id,timestamp,recipe,*targetIds',installedPacks:'packId',activeSessions:'id,updatedAt,status',appMeta:'key'};
export const storesV2={...storesV1,facts:'id,entityId,key,valueEntityId,[entityId+key]',propertyDefinitions:'id,valueKind',entityTypes:'id'};
