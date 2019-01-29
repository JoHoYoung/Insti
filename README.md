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