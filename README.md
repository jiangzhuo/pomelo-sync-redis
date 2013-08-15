#pomelo-sync-redis
##pomelo-sync
```
data sync module is simple sync memory data into store engine like mysql,redis,file.

As we known, updating data is very frequently in game application. Especial in MMORPG kind game. User game data,such as location,flood,equipment,etc. almost always change as time going. For the purpose of avoid such update action cost, we decide to keep a copy data in memory. And keep synchronized with a timer and log;

Data sync can support both timer call and instance invoke for the different
situation. Most of time the developer don't pay attention to it;

Data sync also can support memory operation like NOSQL database such as
redis,mongodb etc. most of time developer can seem as a memory database without
transaction.

Data sync features include timer sync,set,get,mset,mget,hset,hget,incr,decr,flush,merger,showdown,info,etc. and the developer can extend it very easily.
```
##Differenc from pomelo-sync
pomelo-sync-redis is modified from pomelo-sync, there are serveral differences:  
1. pomelo-sync use javascript object to merger data, pomelo-sync-redis use a hash in redis to merger data.  
2. pomelo-sync-redis use a self implement queue to store flush data, pomelo-sync-redis use a set in redis to store flush data.  
3. every pomelo-sync instace will execute sync job, pomelo-sync-redis can set which instance to execute sync job. and every instace can add job, which is like pomelo-sync.  
4. each pomelo-sync instance will not share data with other, pomelo-sync-redis can share and merger data through redis.  
5. pomelo-sync-redis can flush a part of data in mergerMap immediately. (through flushByUid method)


##Installation
```
npm install pomelo-sync-redis
```

##Usage
``` javascript

var opt = opt || {};

var updateUser = function(dbclient,val) {
    console.log('mock save %j',val);
}

var dbclient = {};//db connection etc;
var id = 10001;
var optKey = 'updateUser';
var mapping = {optKey:updateUer}; //key function mapping 
opt.mapping = mapping; 
opt.client = dbclient; // store engine client
opt.interval = 2000; // exec sync interval
opt.port = 6379; // redis server port
opt.host = "127.0.0.1" // redis server ip
var redisKeys = {
    MERGER_MAP_KEY: "POMELO:SYNC:MERGER:MAP", 
    USER_SET_KEY: "POMELO:SYNC:%s:SET", 
    FLUSH_SET_KEY: "POMELO:SYNC:FLUSH:SET"
    } // keys will used in redis
opt.keys = keys
opt.isSyncer = true // if ture, this pomelo sync instance will execute sync job at interval, default is false. At least one pomelo-sync-redis is set to syncer !!
var Sync = require('pomelo-sync-redis');
var sync = new Sync(opt) ;
sync.exec(optKey,id,{name:'hello'});

``` 

##API
###sync.exec(key,uid,id,val,cb)
Add an object to sync for timer exec. 
####Arguments
+ key - the key function mapping for wanted to call back,it must be unique.
+ uid - an id to identify group of data. [optional]
+ id - object primary key for merger operation. 
+ val -  the object wanted to synchronized. 
+ cb - the function call back when the job is add (not executed !). [optional]

###sync.flush(key,uid,id,val,cb)
immediately synchronized the memory data without waiting timer and will remove
waiting queue data;
####Arguments
+ key - the key function mapping for wanted to call back,it must be unique.
+ uid - an id to identify group of data. [optional]
+ id - object primary key for merger operation. 
+ val -  the object wanted to synchronized. 
+ cb - the function call back when timer exec. [optional]

###sync.isDone
get the db sync status when the queue is empty,it should return true;otherwise
return false;

###sync.flushByUid(uid,cb)
immediately synchronized the memory data, which added from exec method with uid argument, without waiting timer and will remove waiting queue data;
####Arguments
+ uid - the uid used in exec and flush method
+ cb - callback function when all the sync job with uid is done.
this modules do not support,user should realize it self.

##ADD
for more usage detail , reading source and benchmark and test case from
source is recommended;
