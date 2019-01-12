const express = require("express")
const path = require("path")
const fs = require("fs")
const bodyParser = require("body-parser")
const cors = require("cors")
const helper = require('./helper/helper')
const static = require('serve-static')
const db = require('./helper/db')
const uuid = require('uuid')
const selenium = require('./batches/selenium')
// var socketClientsArray = [] // The mobile client list connected to socket server
//  initialize app
var app = express()

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

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.get("/admin", helper.asyncWrapper(async (req, res) => {
    let conn = await db.connection()
    let data = (await conn.query("SELECT * FROM ADMIN"))[0][0]
    conn.release()
    res.render('admin',{data:data})
    res.end();
}))

app.get("/user", helper.asyncWrapper(async (req, res) => {

    let conn = await db.connection()
    let data = (await conn.query("SELECT * FROM USER WHERE state != 'D'"))[0]
    conn.release()
    res.render('user',{data:data})
    //res.end();
}))

app.get("/hashtag", helper.asyncWrapper(async (req, res) => {

    let conn = await db.connection()
    let data = (await conn.query("SELECT * FROM HASHTAG WHERE state != 'D'"))[0]
    conn.release()
    res.render('hashtag',{data:data})
    //res.end();
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

    let conn = await db.connection()

    if(table == 'HASHTAG')
        url = 'https://www.instagram.com/explore/tags/' + url + '/'

    let insertQ = "INSERT INTO "+ table + "(id, url, state, ratio) VALUES(?, ?, 'C', ?)"
    console.log(insertQ)
    await conn.query(insertQ,[uuid.v4(), url, ratio])
    conn.release()
    table = table.toLowerCase()
    res.redirect('/' + table)
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
    res.redirect('/' + table)
    res.end();
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

app.get('/process/hashtag', helper.asyncWrapper(async (req,res)=>{
    let conn = await db.connection()

    let data = (await conn.query("SELECT * FROM HASHTAG WHERE state = 'C'"))[0]
    let account = (await conn.query("SELECT * FROM ADMIN"))[0][0]
    let msg = (await conn.query("SELECT * FROM MSG"))[0][0].msg
    let driver = await selenium.getDriver()
    await selenium.loginToInsta(driver, account.id, account.password)
    for(let i=0;i<data.length;i++)
    {
        await selenium.fetchUrl(driver,data[i].url)
        let posts = await selenium.crawlPostFromHashTag(driver)

        posts = await selenium.resetArrayWithPercent(posts, parseInt(data[i].ratio))
        console.log('///////////////////')
        console.log(posts)
        for(let j=0;j<posts.length;j++)
        {
            await selenium.fetchUrl(driver,posts[j])
            await selenium.likeToPost(driver)
            await selenium.commentToposts(driver,msg)
        }
    }
    conn.release()
    res.redirect('/hashtag')
    res.end()
}))

app.get('/process/user', helper.asyncWrapper(async (req,res)=>{
    let conn = await db.connection()

    let data = (await conn.query("SELECT * FROM USER WHERE state = 'C'"))[0]
    let account = (await conn.query("SELECT * FROM ADMIN"))[0][0]
    let msg = (await conn.query("SELECT * FROM MSG"))[0][0].msg
    let driver = await selenium.getDriver()

    await selenium.loginToInsta(driver, account.id,account.password)

    for(let i =0;i<data.length;i++)
    {
        await selenium.fetchUrl(driver, data[i].url)
        let posts = await selenium.crawlPostFromUser(driver)

        posts = await selenium.resetArrayWithPercent(posts, parseInt(data[i].ratio))
        console.log('///////////////////')
        console.log(posts)
        for(let j=0;j<posts.length;j++)
        {
            await selenium.fetchUrl(driver,posts[j])
            await selenium.likeToPost(driver)
            await selenium.commentToposts(driver,msg)
        }
    }
    conn.release()
    res.redirect('/user')
    res.end()
}))

app.get('/process/posts', helper.asyncWrapper(async (req,res)=>{
    let conn = await db.connection()

    let data = (await conn.query("SELECT * FROM POSTS WHERE state = 'C'"))[0]
    let account = (await conn.query("SELECT * FROM ADMIN"))[0][0]
    let msg = (await conn.query("SELECT * FROM MSG"))[0][0].msg
    let driver = await selenium.getDriver()

    await selenium.loginToInsta(driver, account.id,account.password)

    for(let i=0;i<data.length;i++)
    {
        await selenium.fetchUrl(driver,data[i].url)
        await selenium.likeToPost(driver)
        await selenium.fetchAllComments(driver)
        let comments = await selenium.getAllComments(driver)
        comments = await selenium.resetArrayWithPercent(comments,data[i].ratio)
        console.log(comments)
        for(let j=0;j<comments.length;j++)
        {
            await selenium.likeToComment(driver,comments[j]);
        }
    }
    conn.release()
    res.redirect('/posts')
    res.end()
}))

app.get("/", helper.asyncWrapper(async (req, res) => {
    res.render('main')
}))

app.get('*',function(req,res){
    res.render('error')
})


app.listen(3001, function () {
    console.log('Express started on http://localhost:' + 3001 + '; press Ctrl-C to terminate.');
})

