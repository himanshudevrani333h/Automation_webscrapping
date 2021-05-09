const cheerio = require("cheerio");
const pup = require("puppeteer");
const fs = require("fs");
const request = require("request");

let work = 1;
let nifty50 = [];

if (work == 1) {
    work++;
    request("https://blog.investyadnya.in/latest-nifty-50-stocks-their-weights/", marketindices);
    function marketindices(err, res, html) {
        if (!err) {
            let $ = cheerio.load(html);

            let mkt = $(".wp-block-table  tr");

            for (let i = 1; i < mkt.length; i++) {
                let company_name = $($(mkt[i]).find("td")[1]).text();
                nifty50.push(company_name);
            }
        }
    }
}

if (work == 2) {
    async function main() {
        let browser = await pup.launch({
            headless: false,
            defaultViewport: false,
        });

        let tabs = await browser.pages();
        let tab = tabs[0];
        await tab.goto('https://www.investing.com/', {
            waitUntil: 'load',
            timeout: 0
        });

        for (let k = 0; k < nifty50.length; k++) {
            await tab.waitForSelector(".searchBoxContainer.topBarSearch.topBarInputSelected", { visible: true });
            await tab.type(".searchText.arial_12.lightgrayFont.js-main-search-bar", nifty50[k]);
            await tab.keyboard.press("Enter");
            await tab.waitForSelector(".js-inner-all-results-quote-item.row span+span+span+span", { visible: true });
            let stock_market_name = await tab.$$(".js-inner-all-results-quote-item.row span+span+span+span");
            await tab.waitForSelector(".js-inner-all-results-quote-item.row", { visible: true });
            let company_link = await tab.$$(".js-inner-all-results-quote-item.row");
            let link = [];
            for (let j = 0; j < company_link.length; j++) {
                let Url = await tab.evaluate(function (ele) {
                    return ele.getAttribute("href");
                }, company_link[j]);
                link.push(Url);
            }
            let flag = true;
            let idx = -1;
            for (let i = 0; i < stock_market_name.length; i++) {
                if (flag) {
                    let element = stock_market_name[i];
                    const name = await tab.evaluate(element => element.textContent, element);
                    if (name == "Stock - NSE equities") {
                        flag = false;
                        idx = i;
                    }
                }
            }
            if (flag) {
                await tab.goto("https://www.investing.com" + link[0]);
                continue;
            }
            await tab.goto("https://www.investing.com" + link[idx]);
            await tab.waitForSelector(".list_list__item__1kZYS.navbar_navbar-item__1Z2Tn", { visible: true });
            let technical = await tab.$$(".list_list__item__1kZYS.navbar_navbar-item__1Z2Tn a");
            let tech = [];

            let Url = await tab.evaluate(function (ele) {
                return ele.getAttribute("href");
            }, technical[18]);
            tech.push(Url);


            await tab.goto("https://www.investing.com" + tech[0]);
            await tab.waitForSelector(".inlineblock", { visible: true });
            let indicator = await tab.$$(".inlineblock span");
            let element = indicator[53];
            const indication = await tab.evaluate(element => element.textContent, element);

            let ele = indicator[55];
            const candle = await tab.evaluate(ele => ele.textContent, ele);

            if (candle == "Post also to:") {
                console.log(nifty50[k] + " unable to indicate 'No data found!'");
            } else {
                console.log(nifty50[k] + " is indicating " + indication);
            }
        }
        browser.close();
    }

    main();
}

