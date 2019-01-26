const express = require("express")
const path = require("path")
const fs = require("fs")
const bodyParser = require("body-parser")
const cors = require("cors")
const helper = require('./helper/helper')
const static = require('serve-static')
const db = require('./helper/db')
const uuid = require('uuid')
const cookieParser = require('cookie-parser');
const expressSession = require('express-session')
const selenium = require('./batches/selenium')
const redis = require('./helper/redisPromise')
// var socketClientsArray = [] // The mobile client list connected to socket server
//  initialize app
var app = express()

function sleep(timeinterval)
{
    return new Promise((resolve,reject) => {

        setTimeout((function(){
            resolve(true)
        }),timeinterval)
    })
}


// Middleware
app.use(bodyParser.json({ limit: '50mb' }))
app.use(cors())
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '50mb',
    parameterLimit: 50000
}))
app.use('/public', static(path.join(__dirname, 'public')));

app.set('x-powered-by', false); // disable "X-Powered-By: Express" HTTP Header
app.use(cookieParser());
app.use(expressSession({
    secret: 'awsomehoyoungkk',
    resave: true,
    saveUninitialized: true
}));

// app.use(function(req, res, next) {
//     let path = req._parsedOriginalUrl.path
//     console.log(path)
//     if( path != '/' && req.session.user == null && path !='/signin' && path != '/favicon.ico') {
//         res.redirect('/')
//         res.end()
//         return
//     }
//     next();
// });

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.post('/signin',helper.asyncWrapper(async (req, res) => {

    let id = req.body.id
    let password = req.body.password

    console.log(id)
    console.log(password)
    if(id == 'spryfit' && password == 'asd') {
        req.session.user = {
            id:id,
            authorized: true
        };
        let hour = 3600000
        req.session.cookie.expires = new Date(Date.now() + hour)
        res.redirect('/success')
        res.end()
    }
    else
    {
        res.redirect('/')
        res.end()
    }
}))

app.get("/admin", helper.asyncWrapper(async (req, res) => {
    let conn = await db.connection()
    let data = (await conn.query("SELECT * FROM ADMIN"))[0][0]
    let msg = (await conn.query("SELECT * FROM MSG"))[0]
    conn.release()
    res.render('admin',{data:data, msg:msg})
    res.end();
}))

app.get("/user", helper.asyncWrapper(async (req, res) => {

    let conn = await db.connection()
    let sum = (await conn.query("SELECT SUM(ratio) as sum FROM HASHTAG WHERE state !='D'"))[0][0].sum
    let data = (await conn.query("SELECT * FROM USER WHERE state != 'D'"))[0]
    conn.release()
    res.render('user',{data:data, sum:0})
    //res.end();
}))

app.get("/hashtag", helper.asyncWrapper(async (req, res) => {

    let conn = await db.connection()

    let sum = (await conn.query("SELECT SUM(ratio) as sum FROM USER WHERE state !='D'"))[0][0].sum
    console.log(sum)
    let data = (await conn.query("SELECT * FROM HASHTAG WHERE state != 'D'"))[0]
    conn.release()
    res.render('hashtag',{data:data, sum:0})
    //rees.end();
}))

app.get("/posts", helper.asyncWrapper(async (req, res) => {

    let conn = await db.connection()
    let data = (await conn.query("SELECT * FROM POSTS WHERE state != 'D'"))[0]
    conn.release()
    res.render('posts',{data:data})
    res.end();
}))


app.post("/create", helper.asyncWrapper(async (req, res) => {


    console.log(req.body)
    if(req.body.url == null || req.body.ratio == null){
        res.redirect('/error')
        res.end()
        return
    }
    let table = req.body.table
    let url = req.body.url
    let ratio = parseInt(req.body.ratio)
    let msg = req.body.msg

    let conn = await db.connection()

    if(table == 'HASHTAG')
        url = 'https://www.instagram.com/explore/tags/' + url + '/'

    let insertQ
    insertQ = "INSERT INTO " + table + "(id, url, state, ratio) VALUES(?, ?, 'C', ?)"

    console.log(insertQ)
    await conn.query(insertQ,[uuid.v4(), url, ratio])
    conn.release()
    table = table.toLowerCase()
    res.redirect('/' + table)
    res.end();
}))

app.post("/accountCreate", helper.asyncWrapper(async (req, res) => {


    console.log(req.body)
    if(req.body.url == null ){
        res.redirect('/error')
        res.end()
        return
    }

    let url = req.body.url

    let conn = await db.connection()

    let insertQ = 'INSERT INTO ACCOUNT(id, url, state, ratio) VALUES(?, ?, ? ,?)'
    console.log(insertQ)
    await conn.query(insertQ,[uuid.v4(), url, 'C',req.body.ratio])
    conn.release()
    res.redirect('/follow')
    res.end();
}))

app.post("/delete", helper.asyncWrapper(async (req, res) => {

    let table = req.body.table
    let id = req.body.id
    let conn = await db.connection()

    let deleteQ = "DELETE FROM " + table + " WHERE id = ?"
    await conn.query(deleteQ, [id]);
    conn.release()
    table = table.toLowerCase()

    if(table == 'account')
    {
        res.redirect('/follow')
        res.end()

    }else {
        res.redirect('/' + table)
        res.end();
    }
}))

app.post('/update', helper.asyncWrapper(async (req,res)=>{
    let conn = await db.connection()
    let id = req.body.id
    let pass = req.body.password

    await conn.query("UPDATE ADMIN SET id = ?, password = ?",[id,pass])
    conn.release()
    res.redirect('/admin')
    res.end()
}))

app.post('/msg', helper.asyncWrapper(async (req, res) => {

    let conn = await db.connection()
    let msg = req.body.msg

    let exist =(await conn.query("SELECT * FROM MSG WHERE msg = ?",[msg]))[0][0]

    console.log(exist)
    if(exist == undefined || exist == null) {
        await conn.query("INSERT INTO MSG(msg) VALUES(?)", [msg])
        conn.release()
        res.redirect('/admin')
        res.end()

    }else
    {
        conn.release()
        res.redirect('/admin')
        res.end()
    }
}))

app.get('/process/hashtag', helper.asyncWrapper(async (req,res)=>{
    let conn = await db.connection()

    let data = (await conn.query("SELECT * FROM HASHTAG WHERE state = 'C'"))[0]
    let account = (await conn.query("SELECT * FROM ADMIN"))[0][0]
    let driver = await selenium.getDriver()
    await selenium.loginToInsta(driver, account.id, account.password)
    let msg = (await conn.query("SELECT * FROM MSG"))[0]
    await redis.asyncSet('hash', 1)

    let count = (await conn.query("SELECT SUM(ratio) as sum FROM HASHTAG WHERE state != 'D'"))[0][0].sum
    for(let i=0;i<count;i++)
    {
        let uid = uuid.v4()
        let key = 'comment' + uid

        await redis.asyncSet(key, 'comment');
        redis.redisClient.expire(key,3600);

        let postkey = 'like' +uuid.v4()
        await redis.asyncSet(postkey,'l')
        redis.redisClient.expire(postkey,3600)

    }


    for(let i=0;i<data.length;i++)
    {
        let commentNum = await redis.getCommentNum()

        await selenium.fetchUrl(driver,data[i].url)
        let posts = await selenium.crawlPostFromHashTag(driver)
        console.log(msg)

        posts = await selenium.resetArrayWithPercent(posts, parseInt(data[i].ratio))
        console.log(posts)
        for(let j=0;j<posts.length;j++)
        {
            let comment = msg[parseInt(Math.floor(Math.random()*msg.length))].msg
            console.log(comment)

            await selenium.fetchUrl(driver,posts[j])
            await selenium.likeToPost(driver)
            await selenium.commentToposts(driver,comment)
        }
    }
    await driver.quit()
    //await redis.asyncSet('hash', 0)
    selenium.sendSlackMessage('InstaAutoBot - 해시태그 댓글 자동화 작업 완료')
    conn.release()
    res.json({statusCode:200, statusMsg:'success'})
    res.end()
}))

app.get('/process/user', helper.asyncWrapper(async (req,res)=>{
    let conn = await db.connection()
    await redis.asyncSet('user', 1)
    let data = (await conn.query("SELECT * FROM USER WHERE state = 'C'"))[0]
    let account = (await conn.query("SELECT * FROM ADMIN"))[0][0]

    let driver = await selenium.getDriver()
    let msg = (await conn.query("SELECT * FROM MSG"))[0]

    await selenium.loginToInsta(driver, account.id,account.password)

    let count = (await conn.query("SELECT SUM(ratio) as sum FROM USER WHERE state != 'D'"))[0][0].sum
    for(let i=0;i<count;i++)
    {
        let uid = uuid.v4()
        let key = 'comment' + uid

        await redis.asyncSet(key, 'comment');
        redis.redisClient.expire(key,3600);

        let postkey = 'like' +uuid.v4()
        await redis.asyncSet(postkey,'l')
        redis.redisClient.expire(postkey,3600)
    }


    for(let i =0;i<data.length;i++)
    {
        console.log(msg)
        await selenium.fetchUrl(driver, data[i].url)
        let posts = await selenium.crawlPostFromUser(driver)

        posts = await selenium.resetArrayWithPercent(posts, parseInt(data[i].ratio))
        console.log('///////////////////')
        console.log(posts)
        for(let j=0;j<posts.length;j++)
        {
            let comment = msg[parseInt(Math.floor(Math.random()*msg.length))].msg
            console.log(comment)
            await selenium.fetchUrl(driver,posts[j])
            await selenium.likeToPost(driver)
            await selenium.commentToposts(driver,comment)
        }
    }

    await redis.asyncSet('user', 0)
    await driver.quit()
    selenium.sendSlackMessage('InstaAutoBot - 유저계정 포스트 좋아요, 댓글 작업완료')
    conn.release()
    res.json({statusCode:200, statusMsg:'success'})
    res.end()
}))

app.get('/process/posts', helper.asyncWrapper(async (req,res)=>{
    let conn = await db.connection()
    await redis.asyncSet('posts',1)
    let data = (await conn.query("SELECT * FROM POSTS WHERE state = 'C'"))[0]
    let account = (await conn.query("SELECT * FROM ADMIN"))[0][0]
    let driver = await selenium.getDriver()

    await selenium.loginToInsta(driver, account.id,account.password)

    for(let i =0 ;i<data.length;i++)
    {
        let postkey = 'like' +uuid.v4()
        await redis.asyncSet(postkey,'l')
        redis.redisClient.expire(postkey,3600)
        for(let j=0;j<data[i].ratio;j++)
        {
            let commentkey = 'commentlike' +uuid.v4()
            await redis.asyncSet(commentkey,'l')
            redis.redisClient.expire(postkey,3600)
        }
    }

    for(let i=0;i<data.length;i++)
    {
        console.log(i)
        console.log('번째')
        await selenium.fetchUrl(driver,data[i].url)
        await selenium.likeToPost(driver)
        let postkey = 'like' +uuid.v4()
        await redis.asyncSet(postkey,'l')
        redis.redisClient.expire(postkey,3600)
        await selenium.fetchAllComments(driver)
        let comments = await selenium.getAllComments(driver)
        comments = await selenium.resetArrayWithPercent(comments,data[i].ratio)
        console.log(data[i].ratio)
        console.log(comments)
        for(let j=0;j<comments.length;j++)
        {
            await selenium.likeToComment(driver,comments[j]);
        }
    }
    await redis.asyncSet('posts', 0)
    await driver.quit()
    selenium.sendSlackMessage('InstaAutoBot - 포스트 좋아요, 특정 댓글 좋아요 자동화 작업 완료')
    conn.release()
    res.json({statusCode:200, statusMsg:'success'})
    res.end()
}))

app.get('/process/follow', helper.asyncWrapper(async (req,res) => {

    let conn = await db.connection()
    let data = (await conn.query("SELECT * FROM ACCOUNT WHERE state = 'C'"))[0]
    let account = (await conn.query("SELECT * FROM ADMIN"))[0][0]
    let driver = await selenium.getDriver()

    for(let i =0 ;i<data.length;i++)
    {
        for(let j=0;j<data[i].ratio;j++)
        {
            let followkey = 'follow' +uuid.v4()
            await redis.asyncSet(followkey, 'l')
            redis.redisClient.expire(followkey, 3600)
        }
    }
    await selenium.loginToInsta(driver, account.id, account.password)

    for(let i=0;i<data.length;i++)
    {
        console.log(i)
        console.log('번째')
        await selenium.fetchUrl(driver,data[i].url)
        let arr = await selenium.fetchFollowerFromModal(driver)
        arr = await selenium.resetArrayWithPercent(arr,data[i].ratio)

        for(let i=0;i<arr.length;i++)
        {
            await selenium.followFromModal(driver, arr[i])
            await sleep(4000)
        }
    }
    await redis.asyncSet('follow', 0)
    await driver.quit()
    selenium.sendSlackMessage('InstaAutoBot - 유저 팔로우 완료')
    conn.release()
    res.json({statusCode:200, statusMsg:'success'})
    res.end()

}))

app.get("/success", helper.asyncWrapper(async (req, res) => {

        res.render('success')

}))

app.post("/delmsg", helper.asyncWrapper(async (req, res) => {

    let conn = await db.connection()
    let msg = req.body.msg

    await conn.query("DELETE FROM MSG WHERE msg = ?",[msg])
    conn.release()
    res.redirect('/admin')
    res.end()
}))

app.get('/number', helper.asyncWrapper(async (req,res) => {

    let pivot = (await redis.getCommentNum()) - (await redis.getCommentLikeNum())
    let pivot2 = await redis.getLikeNum()
    let responseData = {commentNum:pivot, likeNum: pivot2}

    res.send(responseData);
    res.end();

}))

app.get('/number2', helper.asyncWrapper(async (req,res) => {

    let pivot = await redis.getLikeNum()
    let pivot2 = await redis.getCommentLikeNum()
    let responseData = {likeNum:pivot, commentlikeNum: pivot2}

    res.send(responseData);
    res.end();

}))

app.get('/number3', helper.asyncWrapper(async (req,res) => {

    let pivot = await redis.getFollowNum()
    console.log(pivot)
    let responseData = {followNum:pivot}
    res.send(responseData);
    res.end();

}))


app.get('/postscheck', helper.asyncWrapper(async (req,res) => {


    let pivot = parseInt(await redis.asyncGet('posts'))
    let code
    if(pivot == 1)
    {
        code = 400;
    }
    else
    {
        code = 200;
    }

    let responseData = {statusCode:code}

    res.send(responseData);
    res.end();

}))

app.get('/usercheck', helper.asyncWrapper(async (req,res) => {


    let pivot = parseInt(await redis.asyncGet('user'))
    let code
    if(pivot == 1)
    {
        code = 400;
    }
    else
    {
        code = 200;
    }

    let responseData = {statusCode:code}
    res.send(responseData);
    res.end();

}))

app.get('/follow',helper.asyncWrapper(async (req,res) => {

    let conn = await db.connection()
    let data = (await conn.query("SELECT * FROM ACCOUNT WHERE state != 'D'"))[0]
    conn.release()
    res.render('follow',{data:data})

}))

app.get("/test", helper.asyncWrapper(async (req, res) => {
    if(req.session.user != null)
    {
        res.redirect('/success')
    }
    else {
        res.render('main')
    }
}))
app.get("/", helper.asyncWrapper(async (req, res) => {
    if(req.session.user != null)
    {
        res.redirect('/success')
    }
    else {
        res.render('main')
    }
}))

app.get('*',function(req,res){
    res.render('error')
})


app.listen(3001, function () {
    console.log('Express started on http://localhost:' + 3001 + '; press Ctrl-C to terminate.');
})
