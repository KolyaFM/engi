// Schema versions are independent of shell updates. Future versions use .upgrade()
// to transform rows in place. A failed upgrade must never erase user data.
export const APP_DB_VERSION=1;
export const storesV1={entities:'id,type',facts:'id,entityId,[entityId+key]',tags:'id',entityTags:'[entityId+tagId],entityId,tagId',media:'id,entityId,hash',learningState:'id,dueAt,stability,covered',reviewEvents:'id,timestamp,recipe,*targetIds',installedPacks:'packId',activeSessions:'id,updatedAt,status',appMeta:'key'};
