# Instagram_Auto_Follow for marketing

Nodejs + Selenium + Mysql Project  // 조호영

#### 제공하는 기능
1. 인스타그램 특정 게시글의 url을 입력하면, 그 게시글에 댓글을 단 사람들을 팔로우 한다.
2. 특정 해시태그와 갯수를 입력하면, 특정해시태그의 검색결과로 나오는 게시글들 중 입력한 갯수 만큼의 글에 like를 누르고, 유저가 지정한 내용의 댓글목록 중 하나를 랜덤선택, 자동으로 입력한다.
3. 특정 사람의 프로필 url과 갯수를 입력하면, 그 사람의 게시글들 중 입력한 갯수 만큼의 글에 like를 누르고, 유저가 지정한 내용의 댓글목록 중 하나를 랜덤선택, 자동으로 입력한다.
4. 특정 게시글의 url과 갯수를 입력하면, 그 게시글의 댓글중 입력한 갯수 만큼의 댓글에 like를 누른다.
5. 특정 사람의 프로필 url과 갯수를 입력하면, 그사람을 Follow하는 사람들 중 입력받은 수 만큼의 사람을 Follow한다

### 환경
|Envrionment |
* OS :AWS Ec2 Ubuntu 18.0.4
* DB : mysql5.7, redis
* Backend : Nodejs 10.0.3
* FrontEnd : EJS View Template

### 환경 셋팅(Firebase)

1. AWS Ec2 Ubuntu에서 Firefox browser의 headless모드를 사용한다.
```
const webdriver = require('selenium-webdriver')
const By = webdriver.By
const Key = webdriver.Key
var firefox = require('selenium-webdriver/firefox')
var options = new firefox.Options().setBinary(firefox.Channel.NIGHTLY)
options.addArguments("-headless")

- 드라이버를 실행하는 Promise구현 함수

async function getDriver() {

    return new Promise((resolve, reject) => {
        new webdriver.Builder().forBrowser('firefox').setFirefoxOptions(options).build().then(async (driver) => {
            resolve(driver)
        })
    })
}
```
> reference | https://developer.mozilla.org/ko/docs/Mozilla/Firefox/Headless_mode
2. Firefox를 실행시키기 위한 xvfb 설정
```
$ sudo apt-add-repository ppa:mozillateam/firefox-next
$ sudo apt-get update
$ sudo apt-get install firefox xvfb
$ Xvfb :10 -ac &
$ export DISPLAY=:10
```
3. geckdriver for linux install
```
$ wget https://github.com/mozilla/geckodriver/releases/download/v0.23.0/geckodriver-v0.18.0-linux64.tar.gz
$ sudo chmod +x geckodriver
$ mv geckodrver insta
```

자동화 대상의 CRUD 구현
1. 기능에따라 테이블은 ADMIN, USER, POSTS, HASHTAG, ACCOUNT가 있다.
2. ADMIN에는 인스타그램 계정정보를 저장한다.
3. USER에는 특정비율로 좋아요를 누르고 정해진 댓글을 달 특정 유저프로필의 URL을 저장한다.
4. MSG에는 댓글목록을 저장한다.
5. POSTS에는 댓글단 사람을 follow할 게시글의 url을 저장한다.
6. HASHTAG에는 특정 hashtag검색결과 게시글중 일부분을 좋아요, 자동댓글을 달 tag를 저장한다.
7. ACCOUNT에는 특정 사람의 게시글중 일부분을 좋아요 댓글을달 특정사람의 url을 저장한다.
8. 데이터 삭제시 따로 state를 변경하는 것이 아닌 해당 튜플을 delete 처리한다.

모든 함수 Promise 를 통해 async로 제어한다.
```
async function getDriver() {

    return new Promise((resolve, reject) => {
        new webdriver.Builder().forBrowser('firefox').build().then(async (driver) => {
            resolve(driver)
        })
    })
}                               // 드라이버를 가져오는 async 함수
```



네트워크 환경을 통해 html을 제대로 가져와야 selenium을 제대로 사용할 수 있으므로 html내용을 제대로 가져온 후 작동하도록 sleep 함수를 구현하여 제어한다.
```
async function sleep(timeinterval)
{
    return new Promise((resolve,reject) => {

        setTimeout((function(){
            resolve(true)
        }),timeinterval)
})
}
```

각 기능에 필요한 함수들을 모듈화 하여 코드 가독성, 재사용성을 높여 효율적으로 구현한다.
```
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
```

인스타 그램 규정
1. Like 는 1시간에 30개를 초과하면 Like가 일시정지 된다.
2. 댓글작성은 1시간에 30개를 초과하면 Like가 일시정지 된다.
3. 댓글 Like는 1시간에 30개를 초과하면 일시정지 된다.
4. Follow는 1시간에 30개를 초과하면 일시정지 된다.


해당 규정을 지키기 위해 Queue 사용.
1. First In First Out(FIFO)으로 제약조건을 관리한다.
2. 예를들어 하나의 게시물에 Like를 하면 Queue에 Push, 한시간후에 pop한다.
3. 해당 로직으로 한시간에 30개를 초과하지 않도록 관리 할 수 있다.
4. 해당기능은 Redis의 expire 기능으로 구현한다.
5. 특정 기능을 수행할때마다 지정한 패턴으로 키를 생성하고, Redis에 특정패턴의 키가 몇개가 있는지 체크 하고, 30 - key 갯수 만큼 작업을 수행할 수 있게한다.
6. 그 특정키는 1시간 후에 자동 소멸되도록 expire타임을 설정하여 관리한다.
7. 프론트단에서 Ajax로 api를 호출하여 redis에 key 값을 체크하여 서버 call을 막는다
8. 서버단에서는 프론트단에서 받은 값으로 로직을 처리하며, redis에 key를 설정한다.
> Ajax로 Redis값을 가져오는 API
```
// redisPromise.js
...
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
...

// app.js
const redis = require("/helper/redisPromise.js")

app.get('/number2', helper.asyncWrapper(async (req,res) => {   // Ajax로 프론트단에서 해당 API호출하여 서버 call 관리.

    let pivot = await redis.getLikeNum()
    let pivot2 = await redis.getCommentLikeNum()
    let responseData = {likeNum:pivot, commentlikeNum: pivot2}

    res.send(responseData);
    res.end();

}))
```
서버단에서 redis 에 key 셋팅 및 처리하는 예시.
```
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
```

Redis
1. 자주 사용하는 데이터 및, Queue 자료구조의 사용을 위해 Redis를 사용한다.
2. Redis에 접근하는 함수는 Promise로 구현하여 제어한다.
3. 해당 함수는 모듈화 하여 재사용, 관리한다.

> redisPromise.js

```
module.exports.redisClient = redisClient
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
```
<img width="558" alt="2019-02-02 3 26 24" src="https://user-images.githubusercontent.com/37579650/52193281-cdd26f00-2891-11e9-8cca-e52594cce1da.png">

* * *
<img width="400" alt="2019-02-05 5 56 33" src="https://user-images.githubusercontent.com/37579650/52264186-ee99d380-2928-11e9-9684-8888a6ec3301.png">  <img width="400" alt="2019-02-05 5 57 47" src="https://user-images.githubusercontent.com/37579650/52264187-ee99d380-2928-11e9-9da0-fd56f0f06e45.png">
<img width="400" alt="2019-02-05 5 57 58" src="https://user-images.githubusercontent.com/37579650/52264188-ef326a00-2928-11e9-8265-137d81ef2dc3.png">  <img width="400" alt="2019-02-04 2 28 38" src="https://user-images.githubusercontent.com/37579650/52264189-ef326a00-2928-11e9-83f5-b6d9e7a3dae6.png">
