const redis = require('redis')
const account = require("../config/account")
const db = require("./db");
// const pool= db.pool;
// Initialize Redis Client
const redisClient = redis.createClient({
    host: account.REDIS_HOST,
    port: account.REDIS_PORT,
    password: account.REDIS_PASSWORD
})

async function asynchgetall(key)
{
    return new Promise((resolve,reject) => {
        redisClient.hgetall(key, function (err, temp) {
            resolve(temp);
        })
    })
}

async function asyncget(key)
{
    return new Promise((resolve,reject) => {
        redisClient.get(key, function (err, temp) {
            resolve(temp);
        })
    })
}

async function asynlrange(key)
{
    return new Promise((resolve,reject) => {
        redisClient.lrange(key, 0,-1 ,function (err, temp) {
            resolve(temp);
        })
    })
}

async function asyncset(key,value)
{
    return new Promise((resolve,reject) => {
        redisClient.set(key, value,function (err, temp) {
            resolve(temp);
        })
    })
}

async function asynchmset(key,value)
{
    return new Promise((resolve,reject) => {
        redisClient.hmset(key,value,function (err, temp) {
            resolve(temp);
        })
    })
}

async function asyncrpush(key,value)
{
    return new Promise((resolve,reject) => {
        redisClient.rpush(key,value,function (err, temp) {
            resolve(temp);
        })
    })
}

async function asyncdel(key)
{
    return new Promise((resolve,reject) => {
        redisClient.del(key,function (err, temp) {
            resolve(temp);
        })
    })
}

async function setNotisFromDBtoRedis()
{
    let conn= await db.connection()
    let notis = (await conn.query("SELECT * FROM TODAY_NOTICE WHERE state = 'C' ORDER BY created_date"))[0];

    for(let i=0;i<notis.length;i++)
    {
        redisClient.rpush("TODAY_NOTI",notis[i].id)
        redisClient.hmset(notis[i].id,notis[i])
    }

    return new Promise((resolve,reject) => {
        resolve(notis)
    })
}

async function getCommentNum() {
    return new Promise(async (resolve, reject) => {
        let count = 0;

        redisClient.keys('comment*', function (err, keys) {
            keys.forEach(function (key, pos) {
                count++
            });
            resolve(count)
        })
    })
}

async function getLikeNum() {
    return new Promise(async (resolve, reject) => {
        let count = 0;

        redisClient.keys('like*', function (err, keys) {
            keys.forEach(function (key, pos) {
                count++
            });
            resolve(count)
        })
    })
}

async function getCommentLikeNum()
{
    return new Promise(async (resolve, reject) => {
        let count = 0;

        redisClient.keys('commentlike*', function (err, keys) {
            keys.forEach(function (key, pos) {
                count++
            });
            resolve(count)
        })
    })
}

async function getFollowNum()
{
    return new Promise(async (resolve, reject) => {
        let count = 0;

        redisClient.keys('follow*', function (err, keys) {
            keys.forEach(function (key, pos) {
                count++
            });
            resolve(count)
        })
    })
}

module.exports.redisClient = redisClient
module.exports.setNotisFromDbtoRedis = setNotisFromDBtoRedis
module.exports.asyncGet = asyncget
module.exports.asyncGetall = asynchgetall
module.exports.asyncLrange = asynlrange
module.exports.asyncSet = asyncset
module.exports.asyncHmset = asynchmset
module.exports.asyncRpush = asyncrpush
module.exports.asyncDel = asyncdel
module.exports.getCommentNum = getCommentNum
module.exports.getLikeNum = getLikeNum
module.exports.getCommentLikeNum = getCommentLikeNum
module.exports.getFollowNum = getFollowNum