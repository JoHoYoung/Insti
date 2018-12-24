const webdriver = require('selenium-webdriver')
const By = webdriver.By
const sleep = require('sleep')
const chrome = require('selenium-webdriver/chrome');

require('chromedriver')

async function AutoFollow(posturl,id,password) {

    return new Promise((resolve, reject) => {
        new webdriver.Builder().forBrowser('chrome').build().then(async (driver) => {
            await driver.get('https://www.instagram.com/accounts/login/?source=auth_switcher').catch((err) => {
                console.log(err)
            })
                sleep.sleep(1)
                await driver.findElement(By.css('#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(1) > div > div.f0n8F > input')).sendKeys(id).catch((err) =>{
                    console.log(err)
                })
                await driver.findElement(By.css('#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(2) > div > div.f0n8F > input')).sendKeys(password).catch((err) =>{
                    console.log(err)
                })
                await driver.findElement(By.css('#react-root > section > main > div > article > div > div:nth-child(1) > div > form > div:nth-child(3) > button')).click().catch((err) =>{
                    console.log(err)
                })
                sleep.sleep(2)
                let url = [];

                var endpoint = 0

                await driver.get(posturl)
                while(endpoint == 0)
                {
                    await driver.findElement(By.css('#react-root > section > main > div > div > article > div.eo2As > div.KlCQn.EtaWk > ul > li.lnrre > button')).click().catch((err)=>{
                        endpoint = 1;
                    })
                    sleep.sleep(1)
                }
                let endpoint2 = 0;
                for(let i =4 ;i<10000;i++)
                {
                    let str = '#react-root > section > main > div > div > article > div.eo2As > div.KlCQn.EtaWk > ul > li:nth-child(' + i.toString() +
                        ') > div > div > div > h3 > a'

                    let a = await driver.findElement(By.css(str)).getText().catch((err)=>{
                        endpoint2 = 1
                    })

                    console.log(a)

                    if(endpoint2 == 1)
                    {break}

                    sleep.sleep(1)
                    url.push('https://www.instagram.com/' + a + '/')
                }

                let urls = url.filter( (item, idx, array) => {
                    return array.indexOf( item ) === idx ;
                });
                console.log(urls)
                for(let i = 0; i<urls.length;i++) {
                    await driver.get(url[i])
                    sleep.sleep(1)
                    await driver.findElement(By.css('#react-root > section > main > div > header > section > div.nZSzR > span.BY3EC.bqE32 > span.vBF20._1OSdk > button')).click().catch((err)=>{})
                    sleep.sleep(1)
                    await driver.findElement(By.css('#react-root > section > main > div > header > section > div.nZSzR > button')).click().catch((err)=>{})
                    sleep.sleep(1)
                }
                resolve()

            }).catch((err) =>{
                console.log(err)
            })
        })
}

module.exports.AutoFollow = AutoFollow