const puppeteer = require('puppeteer');


(async () => {
    const browser = await puppeteer.launch({headless: false});
  try{
    const page = await browser.newPage();
    await page.goto('https://newsquawk.com/home');
  
  //   await page.click(".remote.button.login.highlight")
  
    let usernameSelector = "input.email.string"
    let passwordSelector = "input.required.password"
  
    await page.$eval('.remote.button.login.highlight', el => el.click());
    await page.$eval(usernameSelector, el => el.value = "gordon.yk.lee@gmail.com");
    await page.$eval(passwordSelector, el => el.value = "Jeff1234a");
    await page.$eval("input.highlight.button.login", el => el.click())

    await page.waitForNavigation({ waitUntil: 'networkidle2' })

    await page.$eval("a.introjs-button.introjs-skipbutton", el => el.click())

    // Go to headline
    await page.goto("https://newsquawk.com/headlines/list")
    await page.waitForNavigation({ waitUntil: 'networkidle2' })

    // Select correct date
    let dateStr = "2020-06-18"
    await page.$eval("input.published_before", el => el.value = dateStr)
    await page.$eval("input.submit", el => el.click())

    await page.waitForNavigation({ waitUntil: 'networkidle2' })

    const headlines = await page.$$("div.headline.item")

    for(let headlineElem of headlines){
        let date = await page.evaluate(el => el.getAttribute("data-published"), headlineElem)
        let content = await headlineElem.$eval('a', el => el.innerHTML)
        console.log(new Date(date * 1000), content)
    }
  
  }catch(e){
      console.log(e)
  }finally{
    await browser.close();
  }
})();