# Instagram_Auto_Follow for marketing

Nodejs + Selenium + Mysql Project  // 조호영

#### 제공하는 기능
1. 인스타그램 특정 게시글의 url을 입력하면, 그 게시글에 댓글을 단 사람들을 팔로우 한다.
2. 특정 해시태그와 퍼센트를 입력하면, 특정해시태그의 검색결과로 나오는 게시글들 중 입력한 퍼센트 만큼의 글에 like를 누르고, 유저가 지정한 내용의 댓글을  자동으로 입력한다.
3. 특정 사람의 프로필 url과 퍼센트를 입력하면, 그 사람의 게시글들 중 입력한 퍼센트 만큼의 글에 like를 누르고, 유저가 지정한 내용의 댓글을 자동입력한다.
4. 특정 게시글의 url과 퍼센트를 입력하면, 그 게시글의 댓글중 입력한 퍼센트 만큼의 댓글에 like를 누른다.

### Required
1. Nodejs
2. Google Chorme | Firefox

자동화 대상의 CRUD 구현
1. 기능에따라 테이블은 ADMIN, USER, POSTS, HASHTAG가 있다.
2. ADMIN에는 인스타그램 계정정보, USER에는 특정비율로 좋아요를 누르고 정해진 댓글을 달 특정 유저프로필의 url.
3. POSTS에는 댓글단 사람을 follow할 게시글의 url, HASHTAG에는 특정 hashtag검색결과 게시글중 일부분을 좋아요, 자동댓글을 달 tag를 저장한다.

동작
1. 기본적으로 chromedriver를 이용해 chrome으로 동작하며, geckodriver를 통해 firefox도 가능하다.
2. ec2 ubuntu에 배포하여 로컬에서 돌리지 않아도 사용할수 있다.
3. ec2에서는 xvfb를 사용한다.
4. 로컬에서 동작하기 위해선 브라우저에 맞는 driver를 다운로드, 폴더에 포함시켜야 한다.
```
$ sudo apt-get install xvfb
$ Xvfb :10 -ac &
$ export DISPLAY=:10
```
