const express = require("express")
const path = require("path")
const fs = require("fs")
const bodyParser = require("body-parser")
const cors = require("cors")
const Insta = require('./batches/Auto')
const helper = require('./helper/helper')
const static = require('serve-static')
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


app.get("/", helper.asyncWrapper(async (req, res) => {
    res.render('main')
}))


app.post("/follow", helper.asyncWrapper(async (req, res) => {
    let url = req.body.url
    let id = req.body.id
    let pass = req.body.password
    await Insta.AutoFollow(url,id,pass)
    res.render("success")
}))

app.get('*',function(req,res){
    res.render('error')
})

app.listen(3001, function () {
    console.log('Express started on http://localhost:' + 3001 + '; press Ctrl-C to terminate.');
})

