/**
 * Module dependencies.
 */
var utils = require('../utils/utils');
var invoke = utils.invoke;
var clone = utils.clone;
var Util = require('util');
/**
 *
 * invoke tick instant
 *
 * @module
 *
 * @param {String} key
 * @param {Object}  val
 * @param {Function} cb
 *
 */
exports.execSync = function (key, val, cb) {
    this.rewriter.tick({key: key, vak: val}, cb);
};

exports.exec = function () {
    var mergerKey;
    var cb = arguments[arguments.length - 1]
    if (typeof cb != 'function') {
        cb = null
    }

    switch (arguments.length) {
        case 3:
            // no mergerKey
            this.redis.sadd(this.FLUSH_SET_KEY, JSON.stringify({key: arguments[0], val: clone(arguments[1])}), cb);
            break
        case 4:
            mergerKey = [arguments[0], arguments[1]].join('');
            this.redis.hset(this.MERGER_MAP_KEY, mergerKey, JSON.stringify({key: arguments[0], val: clone(arguments[2])}), cb)
            break
        case 5:
            mergerKey = [arguments[0], arguments[1], arguments[2]].join('');
            var multi = this.redis.multi()
            multi.hset(this.MERGER_MAP_KEY, mergerKey, JSON.stringify({key: arguments[0], uid: arguments[1], val: clone(arguments[3])}))
            multi.sadd(Util.format(this.USER_SET_KEY, arguments[1]), mergerKey)
            multi.exec(cb)
            break
        default :
            cb(new Error('exec function at least have 3 argument'))
            break
    }
}


exports.sync = function () {
    if (this.rewriter) {
        this.rewriter.sync(this);
    }
};

exports.isDone = function (cb) {
    var writerEmpty = true, queueEmpty = false, mapEmpty = false;
    if (!!this.rewriter) {
        writerEmpty = this.rewriter.isDone();
    }
    var multi = this.redis.multi()
    multi.hlen(this.MERGER_MAP_KEY)
//    multi.this.scard(this.USER_SET_KEY)
    multi.exec(function (err, replies) {
        mapEmpty = replies[0] == 0
        queueEmpty = replies[1] == 0
        cb(err, writerEmpty && queueEmpty && mapEmpty)
    })
}


// flush must have mergerKey
exports.flush = function () {
    var mergerKey
    var cb = arguments[arguments.length - 1]
    var self = this
    var flushArguments = arguments
    if (typeof cb != 'function') {
        console.error('the last argument must be callback function!')
        console.error('from flush :' + arguments[0])
    } else {
        switch (arguments.length) {
            case 4:
                mergerKey = [arguments[0], arguments[1]].join('')
                this.redis.hdel(this.MERGER_MAP_KEY, mergerKey, function (err, res) {
                    self.rewriter.flush(flushArguments[0], flushArguments[2], cb)
                })
                break
            case 5:
                mergerKey = [arguments[0], arguments[1]].join('')
                var multi = this.redis.multi()
                multi.hdel(this.MERGER_MAP_KEY, mergerKey)
                multi.srem(Util.format(this.USER_SET_KEY, arguments[1]), mergerKey)
                multi.exec(function (err, res) {
                    self.rewriter.flush(flushArguments[0], flushArguments[3], cb)
                })
                break
            default :
                cb(new Error('exec function at least have 4 argument'))
                break
        }
    }
}

exports.flushByUid = function () {
    var cb = arguments[arguments.length - 1]
    if (typeof cb != 'function') {
        console.error('the last argument must be callback function!')
        console.error('from flush by uid :' + arguments[0])
    }
    var self = this
    var userKeyMap = self.redis.smembers(Util.format(self.USER_SET_KEY, arguments[0]), function (err, mergerKeys) {
        self.redis.hmget(self.MERGER_MAP_KEY, mergerKeys, function (err, res) {
            if (res != null) {
                for (var i = 0; i < res.length; i++) {
                    if (res[i] != null) {
                        var multi = self.redis.multi()
                        var mergerMapValue = JSON.parse(res[i])
                        mergerMapValue.mergerKey = mergerKeys[i]
                        self.rewriter.tick(mergerMapValue, function (err, res) {
                            // res is mergerMapValue
                            console.info('callback of tick in sync called!')
                            console.info('flush all byy uid: begin delete mergerMap :')
                            console.info(res)
                            multi.hdel(self.MERGER_MAP_KEY, res.mergerKey)
                            console.info('flush all byy uid: begin delete userSet userid: ' + res.uid + " mergerKey :" + res.mergerKey)
                            if (res.uid != null) {
                                multi.srem(Util.format(self.USER_SET_KEY, res.uid), res.mergerKey)
                            }
                            multi.exec(function (err, res) {
                                console.info('callback of hdel in sync called!')
                                console.info(err + '|' + res)
                            })
                        })
                    }
                }
                cb(err, res)
            } else {
                cb(err, res)
            }
        })
    });
}

exports.info = function () {
    var buf = ''
        , day = 86400000
        , uptime = new Date - this.server.start;

    this.dbs.forEach(function (db, i) {
        var keys = Object.keys(db)
            , len = keys.length;
        if (len) {
            buf += 'db' + i + ':keys=' + len + ',expires=0\r\n';
        }
    });

    return (buf);
};


