
//////////////////////////////// EC2 업로드시 주석처리//////////////////////////////
const webdriver = require('selenium-webdriver')
const Key = webdriver.Key
const By = webdriver.By
const rq = require("request-promise-native")
const redis = require('../helper/redisPromise')

function sleep(timeinterval)
{
    return new Promise((resolve,reject) => {

        setTimeout((function(){
            resolve(true)
        }),timeinterval)
})
}


async function getDriver() {

    return new Promise((resolve, reject) => {
        new webdriver.Builder().forBrowser('firefox').build().then(async (driver) => {
            resolve(driver)
        })
    })
}
//////////////////////////////////////////////////////////////////////////////////////////


//////////////////////////////// EC2 업로드시 주석해제////////////////////////////////////////
//const rq = require("request-promise-native")
// const webdriver = require('selenium-webdriver')
// const By = webdriver.By
// const Key = webdriver.Key
// var firefox = require('selenium-webdriver/firefox')
// var options = new firefox.Options().setBinary(firefox.Channel.NIGHTLY)
// options.addArguments("-headless")
// //const chrome = require('selenium-webdriver/chrome');
//
//
// // 슬립 함수
// function sleep(timeinterval)
// {
//     return new Promise((resolve,reject) => {
//
//         setTimeout((function(){
//             resolve(true)
//         }),timeinterval)
//     })
// }
//
// async function getDriver() {
//
//     return new Promise((resolve, reject) => {
//         new webdriver.Builder().forBrowser('firefox').setFirefoxOptions(options).build().then(async (driver) => {
//             resolve(driver)
//         })
//     })
// }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// 특정 페이지 불러오는 함수.
async function fetchUrl(driver, url)
{
    return new Promise(async (resolve,reject) =>{

        await driver.get(url)
        resolve()
    })
}

// 특정 포스트에 댓글을 다는 함수
async function commentToPost(driver,message){

    return new Promise(async (resolve, reject) => {
            //댓글다는 기능
            await sleep(2000)

            await sleep(2000)

            let element2 = await driver.findElement(By.css('#react-root > section > footer'));
            await driver.executeScript("arguments[0].scrollIntoView()", element2);
            await sleep(3000)

            let element3 = await driver.findElement(By.css('#react-root > section > main > div > div > article > div.eo2As > section.sH9wk._JgwE > div > form > textarea'))
            await driver.findElement(By.css('#react-root > section > main > div > div > article > div.eo2As > section.sH9wk._JgwE > div > form > textarea')).click()
            await driver.findElement(By.css('#react-root > section > main > div > div > article > div.eo2As > section.sH9wk._JgwE > div > form > textarea')).sendKeys(message + '\n');
            await driver.findElement(By.css('#react-root > section > main > div > div > article > div.eo2As > section.sH9wk._JgwE > div > form > textarea')).sendKeys(Key.RETURN);
            await sleep(2000)
            resolve()
            //
    })
}

// 페이지 제일 하단으로 스크롤 하는 함수
async function scrollToFooter(driver)
{
    return new Promise(async (resolve, reject) => {
            await sleep(1000)
            let element2 = await driver.findElement(By.css('#react-root > section > footer'));
            await driver.executeScript("arguments[0].scrollIntoView()", element2);
            await sleep(2000)
            resolve()
    })
}

// 인스타에 로그인하는 함수
async function loginToInsta(driver,id,pass)
{
    return new Promise(async (resolve, reject) => {
        await driver.get('https://www.instagram.com/accounts/login/?source=auth_switcher').catch((err) => {
            console.log(err)
        })
        await sleep(3000)
        await driver.findElement(By.css('#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(1) > div > div.f0n8F > input')).sendKeys(id).catch((err) =>{
            console.log(err)
        })
        await driver.findElement(By.css('#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(2) > div > div.f0n8F > input')).sendKeys(pass).catch((err) =>{
            console.log(err)
        })
        await driver.findElement(By.css('#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(3) > button')).click().catch((err) =>{
            console.log(err)
        })
        await sleep(5000)
        resolve()
    })
}

// 특정 유저의 프로필에서 게시글을 긁어오는 함수
async function crawlPostFromUser(driver)
{

    return new Promise(async (resolve, reject) => {
    let posts = [];
    await sleep(3000)

    await scrollToFooter(driver)
    await sleep(1000)
    await scrollToFooter(driver)
    await sleep(1000)

    let rownum = 0;
    for(let k = 1; k<10000;k++)
    {
        let ep = 0;
        await driver.findElement(By.css('#react-root > section > main > div > div._2z6nI > article > div > div > div:nth-child(' + k.toString() + ')')).catch((err) => {
            ep = 1;
        });
        if(ep == 1)
            break
        rownum++;
    }
    console.log(rownum)
    let colnum = 0;
    for(let row = 1; row<=rownum;row++)
    {
        let ep = 0;
        for(let col = 1; col<=3;col++)
        {
            colnum++
            let ep1= 0;
            let post = await driver.findElement(By.css('#react-root > section > main > div > div._2z6nI > article > div > div > div:nth-child(' + row.toString() + ') > div:nth-child(' + col.toString() +') > a')).getAttribute('href').catch((err)=>{
                ep1 = 1;
            });

            if(ep1==1)
                break

            posts.push(post)
            console.log(post)
        }

        if(ep==1)
            break
    }

        resolve(posts)
    })

}

// 해쉬태그 검색에서 글들을 가져오는 함수
async function crawlPostFromHasgTag(driver)
{

    return new Promise(async (resolve, reject) => {
        let posts = [];

        await sleep(1000)

        await scrollToFooter(driver)
        await sleep(1000)
        await scrollToFooter(driver)
        await sleep(1000)
        let rownum = 0;
        for(let k = 1; k<10000;k++)
        {
            let ep = 0;
            await driver.findElement(By.css('#react-root > section > main > article > div.EZdmt > div > div > div:nth-child(' + k.toString() + ')')).catch((err) => {
                ep = 1;
            });
            if(ep == 1)
                break
            rownum++;
        }
        let colnum = 0;
        for(let row = 1; row<=rownum;row++)
        {
            let ep = 0;
            for(let col = 1; col<=3;col++)
            {
                colnum++
                let ep1= 0;
                let post = await driver.findElement(By.css('#react-root > section > main > article > div.EZdmt > div > div > div:nth-child(' + row.toString() + ') > div:nth-child(' + col.toString() +') > a')).getAttribute('href').catch((err)=>{
                    ep1 = 1;
                });

                if(ep1==1)
                    break
                posts.push(post)
                console.log(post)
            }
            if(ep==1)
                break
        }

        for(let k = 1; k<10000;k++)
        {
            let ep = 0;
            await driver.findElement(By.css('#react-root > section > main > article > div:nth-child(3) > div > div:nth-child(' + k.toString() + ')')).catch((err) => {
                ep = 1;
            });
            if(ep == 1)
                break
            rownum++;
        }
        for(let row = 1; row<=rownum;row++)
        {
            let ep = 0;
            for(let col = 1; col<=3;col++)
            {
                colnum++
                let ep1= 0;
                let post = await driver.findElement(By.css('#react-root > section > main > article > div:nth-child(3) > div > div:nth-child(' + row.toString() + ') > div:nth-child(' + col.toString() +') > a')).getAttribute('href').catch((err)=>{
                    ep1 = 1;
                });

                if(ep1==1)
                    break
                posts.push(post)
                console.log(post)
            }
            if(ep==1)
                break
        }
        console.log(colnum)
        resolve(posts)
    })

}

// 특정 게시글에 좋아요를 누르는 함수
async function likeToPost(driver)
{
    return new Promise(async (resolve,reject) => {
        //let element2 = await driver.findElement(By.css('#react-root > section > footer'));
        //await driver.executeScript("arguments[0].scrollIntoView()", element2);
        await sleep(2000)
        let test = await driver.findElement(By.css('#react-root > section > main > div > div > article > div.eo2As > section.ltpMr.Slqrh > span.fr66n > button > span')).getAttribute('class').catch((err) =>{
            console.log(err)
        })
        console.log(test)
        if(test == 'glyphsSpriteHeart__outline__24__grey_9 u-__7')
            console.log("LIKE")
            await driver.findElement(By.css('#react-root > section > main > div > div > article > div.eo2As > section.ltpMr.Slqrh > span.fr66n > button > span')).click().catch((err) => {
            console.log(err)
        })
        await sleep(4000)
        resolve()
    })
}

// 댓글을 모두 펼치는 함수
async function fetchAllComments(driver)
{
    return new Promise(async (resolve,reject)=>{

        let endpoint = 0
        while(endpoint == 0)
        {
            console.log('클릭')
            await driver.findElement(By.css('#react-root > section > main > div > div > article > div.eo2As > div.KlCQn.EtaWk > ul > li.lnrre > button')).click().catch((err)=>{
            endpoint = 1;
        })
            await sleep(1000)
        }
        resolve()
    })
}

// 확률에 따라 배열을 재구성하는 함수
// async function resetArraywithPercent(arr, percent)
// {
//     return new Promise(async (resolve, reject) => {
//
//         let number = parseInt(Math.ceil(((100-percent)/100)*arr.length))
//         let pivot = arr.length
//         console.log("넘버!")
//         console.log(number)
//         for(let i=0;i<number;i++)
//         {
//             let random = Math.floor(Math.random()*pivot)
//             arr.splice(random,1)
//             pivot--
//         }
//         resolve(arr)
//     })
//
// }

async function resetArraywithPercent(arr, percent)
{
    return new Promise(async (resolve, reject) => {

        let number = percent
        let pivot = arr.length
        console.log("넘버!")
        console.log(number)

        console.log(pivot)
        while(pivot > number)
        {
            let random = Math.floor(Math.random()*pivot)
            arr.splice(random,1)
            pivot--
        }
        resolve(arr)
    })

}


async function resetArraywithPercent2(arr, arr2,percent)
{
    return new Promise(async (resolve, reject) => {

        let number = parseInt((Math.ceil(((100-percent)/100)*arr.length)))
        console.log("넘버!")
        console.log(number)
        let pivot = arr.length
        for(let i=0;i<number;i++)
        {
            let random = Math.floor(Math.random()*pivot)
            arr.splice(random,1)
            arr2.splice(random,1)
            pivot--
        }
        resolve(arr,arr2)
    })

}

// 댓글을 쓴사람을 중복을 제거해 모두 가져오는 함수, 댓글의 index번호도 모두 불러옴
async function getAllComments(driver){
    return new Promise(async (resolve,reject) =>{
        let endpoint = 0;
        let url = []
        let index = []
        console.log('겟얼')
        for(let i =2 ;i<10000;i++)
        {
            let str = '#react-root > section > main > div > div > article > div.eo2As > div.KlCQn.EtaWk > ul > li:nth-child(' + i.toString() +
                ') > div > div > div > h3 > a'
            let a = await driver.findElement(By.css(str)).getText().catch((err)=>{
                console.log(err)
                endpoint = 1
            })

            //console.log(a)

            if(endpoint == 1)
            {break}

            await sleep(30)
            index.push(i)
            url.push('https://www.instagram.com/' + a + '/')
        }
        let urls = url.filter( (item, idx, array) => {
            return array.indexOf( item ) === idx ;
        });
        resolve(index)
    })
}

// 특정 index의 댓글에 좋아요룰 누르는 함수
async function likeToComment(driver, idx){

    return new Promise(async (resolve, reject) => {
        let test = await driver.findElement(By.css('#react-root > section > main > div > div > article > div.eo2As > div.KlCQn.G14m-.EtaWk > ul > li:nth-child(' + idx.toString() + ') > div > span > button > span')).getAttribute('class')
        if(test == 'glyphsSpriteComment_like u-__7')
            await driver.findElement(By.css('#react-root > section > main > div > div > article > div.eo2As > div.KlCQn.G14m-.EtaWk > ul > li:nth-child(' + idx.toString() + ') > div > span > button')).click()
            await sleep(1500)
        resolve();
    })

}

// async function AutoFollow(posturl) {
//
//     return new Promise((resolve, reject) => {
//         new webdriver.Builder().forBrowser('chrome').build().then(async (driver) => {
//
//             await loginToInsta(driver)
//             await fetchUrl(driver,'https://www.instagram.com/p/BsmBzvmlxxS/')
//
//             await crawlPostFromHasgTag(driver,'https://www.instagram.com/explore/tags/self/')
//
//             //댓글 더보기 누르는 코드
//           //  await fetchAllComments(driver)
//             let test = await driver.findElement(By.css('#react-root > section > main > div > div > article > div.eo2As > div.KlCQn.G14m-.EtaWk > ul > li:nth-child(5) > div > span > button > span')).getAttribute('class')
//
//             if(test == 'glyphsSpriteComment_like u-__7')
//             await driver.findElement(By.css('#react-root > section > main > div > div > article > div.eo2As > div.KlCQn.G14m-.EtaWk > ul > li:nth-child(5) > div > span > button')).click()
//
//
//
//             let url = []
//                 let urls = url.filter( (item, idx, array) => {
//                     return array.indexOf( item ) === idx ;
//                 });
//                 console.log(urls)
//                 for(let i = 0; i<urls.length;i++) {
//                     await driver.get(url[i])
//                     await sleep(1000)
//                     await driver.findElement(By.css('#react-root > section > main > div > header > section > div.nZSzR > span.BY3EC.bqE32 > span.vBF20._1OSdk > button')).click().catch((err)=>{})
//                     await sleep(1000)
//                     await driver.findElement(By.css('#react-root > section > main > div > header > section > div.nZSzR > button')).click().catch((err)=>{})
//                     await sleep(1000)
//                 }
//                 resolve()
//             }).catch((err) =>{
//                 console.log(err)
//             })
//         })
// }

function sendSlackMessage(message) {

    let msg = message

    let options = {
        uri: 'https://hooks.slack.com/services/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',
        method: "POST",
        body: {
            "text": msg,
        },
        json: true
    }

    rq(options).then((body) => {
        console.log("Sent a slack message: " + body)
    })
        .catch((err) => {
            console.log("Error to send a message " + err)
        })
}


function sendMessageToSlackResponseURL(responseURL, JSONMessage) {
    var postOptions = {
        uri: responseURL,
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        json: JSONMessage
    }

    rq(postOptions).then((body) => {
        console.log("Body Value: " + body)

    })
        .catch((err) => {
            console.log("Error: " + err)

        })
}


async function followUser(driver)
{
    return new Promise(async (resolve,reject) => {

        await sleep(1000)
        await driver.findElement(By.css('#react-root > section > main > div > header > section > div.nZSzR > span.BY3EC.bqE32 > span.vBF20._1OSdk > button')).click().catch((err)=>{})
        await sleep(1000)
        await driver.findElement(By.css('#react-root > section > main > div > header > section > div.nZSzR > button')).click().catch((err)=>{})
        await sleep(1000)
        resolve()

    })
}

// 팔로워들을 펼쳐서 index를 가져오는 함수.
async function fetchFollowerFromModal(driver)
{
    return new Promise(async (resolve,reject) => {

        await driver.findElement(By.css('#react-root > section > main > div > header > section > ul > li:nth-child(2) > a')).click().catch((err)=>{})
        await sleep(1000)
        await driver.findElement(By.css('body > div:nth-child(12) > div > div')).click().catch((err) =>{})
        let element2 = await driver.findElement(By.css('body > div:nth-child(12) > div > div > div.isgrP > ul > div > li:nth-last-child(1)'))
        await driver.executeScript("arguments[0].scrollIntoView()", element2);
        await sleep(2000)
        for(let i=0;i<20;i++)
        {
            element2 = await driver.findElement(By.css('body > div:nth-child(12) > div > div > div.isgrP > ul > div > li:nth-last-child(1)'))
            await driver.executeScript("arguments[0].scrollIntoView()", element2);
            await sleep(500)
        }

        let idx = 1
        let exit = 0

        let arr = []
        while(exit !=1 ){
            arr.push(idx)
            let li = await driver.findElement(By.css('body > div:nth-child(12) > div > div > div.isgrP > ul > div > li:nth-child('+idx + ') > div > div.t2ksc > div.enpQJ > div.d7ByH > a')).getText().catch((err) =>{
                exit = 1
            })
            idx++
        }
        console.log(arr)
        resolve(arr)
    })
}

async function followFromModal(driver,idx){

    return new Promise(async (resolve,reject) =>{

        await driver.findElement(By.css('body > div:nth-child(12) > div > div > div.isgrP > ul > div > li:nth-child(' + idx.toString() + ') > div > div.Pkbci > button')).click().catch((err) => {

        })
        resolve()
    })
}

module.exports.fetchFollowerFromModal = fetchFollowerFromModal
module.exports.followFromModal = followFromModal
module.exports.sendSlackMessage = sendSlackMessage
module.exports.sendMessageToSlackResponseURL = sendMessageToSlackResponseURL
module.exports.getDriver = getDriver
module.exports.fetchUrl = fetchUrl
module.exports.commentToposts = commentToPost
module.exports.loginToInsta = loginToInsta
module.exports.crawlPostFromUser = crawlPostFromUser
module.exports.crawlPostFromHashTag = crawlPostFromHasgTag
module.exports.likeToPost = likeToPost
module.exports.fetchAllComments = fetchAllComments
module.exports.resetArrayWithPercent = resetArraywithPercent
module.exports.resetArrayWithPercent2 = resetArraywithPercent2
module.exports.getAllComments = getAllComments
module.exports.likeToComment = likeToComment
module.exports.followUser = followUser
