/**
 * Module dependencies.
 */
var utils = require('../utils/utils');
var invoke = utils.invoke;
var Util = require('util');

/**
 * Initialize a new AOF Rewriter with the given `db`.
 *
 * @param {options}
 *
 */
var Rewriter = module.exports = function Rewriter(server) {
    this.server = server;
    this.count = 0;
};

/**
 * Initiate sync.
 */

Rewriter.prototype.sync = function () {
    var self = this, server = self.server
    var mergerMap = server.mergerMap;

    server.redis.hgetall(server.MERGER_MAP_KEY, function (err, res) {
        for (var mergerKey in res) {
            var multi = server.redis.multi()
            if (res[mergerKey] != null) {
                var mergerMapValue = JSON.parse(res[mergerKey])
                mergerMapValue.mergerKey = mergerKey
                self.tick(mergerMapValue, function (err, res) {
                    // res is mergerMapValue
                    console.log('callback of tick in sync called!')
                    console.log('begin delete mergerMap :')
                    console.log(res)
                    multi.hdel(server.MERGER_MAP_KEY, res.mergerKey)
                    console.log('begin delete userSet userid: ' + res.uid + " mergerKey :" + res.mergerKey)
                    if (res.uid != null) {
                        multi.srem(Util.format(server.USER_SET_KEY, res.uid), res.mergerKey)
                    }
                    multi.exec(function (err, res) {
                        console.log('callback of hdel in sync called!')
                        console.log(err + '|' + res)
                    })
                })
            }
        }
    })
////    console.log('mergerMap is :'+mergerMap)
//    for (var mergerKey in mergerMap) {
//        var entry = mergerMap[mergerKey];
//        self.tick(entry.key, entry.val);
//        delete mergerMap[mergerKey];
//
//        if (!!entry.uid && !!server.userKeyMap[entry.uid]) {
//            console.log(entry.uid + " user key map before delete:");
//            console.log(server.userKeyMap[entry.uid])
////            self.sdel(entry.uid,mergerKey)
//            delete server.userKeyMap[entry.uid][mergerKey]
//            console.log(entry.uid + " user key map after delete:");
//            console.log(server.userKeyMap[entry.uid])
//        }
//    }
    return true;
};

/*
 *
 * flush db
 *
 */
Rewriter.prototype.flush = function (key, val, cb) {
    this.tick({key: key, val: val}, cb);
};
/*
 *
 * judge task is done
 * tick's callback trans key back
 *
 */
Rewriter.prototype.tick = function (content, cb) {
    var key = content.key
    var val = content.val
    console.log("some tick !! key is :" + key + " val is :")
    console.log(val)
    var self = this, server = self.server;
    if (!server.client) {
        server.log.error('db sync client is null');
        return;
    }
    var syncb = server.mapping[key];
    if (!syncb) {
        server.log.error(key + ' callback function not exist ');
        return;
    }
    if (!cb) {
        self.count += 1;
        return invoke(syncb, server.client, val, function () {
            self.count -= 1;
        });
    } else {
        invoke(syncb, server.client, val, function (err, res) {
            cb(err, content)
        });
    }
};
/*
 *
 * judge task is done
 *
 */
Rewriter.prototype.isDone = function () {
    return this.count === 0;
};
