const callbackRequest = require('request')
const cheerio = require('cheerio')
const fs = require('fs')
const _ = require('lodash')

const storeData = (data, path) => {
    try {
        fs.writeFileSync(path, JSON.stringify(data))
    } catch (err) {
        console.error(err)
    }
}

const request = url => {
    return new Promise((resolve, reject) => {
        callbackRequest(url, (error, response, html) => {
            if (error) {
                reject(error)
            } else {
                resolve(html)
            }
        })
    })
}

const queryForUrls = html => {
    const $ = cheerio.load(html)
    return Array.from($('td.td_title_card > a')).map(e => $(e).attr('href'))
}

const queryForCardInfo = html => {
    const $ = cheerio.load(html)
    return Array.from(
        $('tr', $(
            'div > div.panel-body > div > div:nth-child(2) > div > table > tbody'
        ).get(0)))
        .map((tr) => Array.from($('td', tr)))
        .map(([a, b]) => {
          const aText = $(a).text().trim();
          const bText = $(b).text().trim();
            if (aText === 'Attributes') {
                return {
                    key: 'Attributes',
                    value: Array.from($('img', b)).map(c => $(c).attr('alt')),
                }
            }
            return { key: aText, value: bText }
        })
        .reduce((prev, { key, value }) => ({ ...prev, [key]: value }), {})
}

const readFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, {encoding: 'utf8'}, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(JSON.parse(data));
    })
  })
}

const sleep = (s) => {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, s*1000);
  })
}

const downloadCardsToJson = async () => {
    // const cardsUrl = n =>
    //     `https://www.legends-decks.com/cards/all/mana-up/${n}/list`
    // const requests = _.range(1, 26)
    //     .map(cardsUrl)
    //     .map(request)

    // const pages = await Promise.all(requests)
    const origUrls = JSON.parse(fs.readFileSync('./urls.json'));
    const filenames = fs.readdirSync('./cards');
    console.log(`urls: ${origUrls.length}`)
    const cardsWeDefGot = filenames
      .map((s) => s.replace('.json', ''))
      .filter((s) => {
        const b = s.toLowerCase() !== s;
        return b;
      })
      .map((s) => s.replace(/[^a-zA-Z/]/ig, '').toLowerCase());
    console.log(`cards we got: ${cardsWeDefGot.length}`);
    const cardsWeMightHaveGot = origUrls
      .map((s) => s.split('/').pop())
    console.log(`cards we might have got: ${cardsWeMightHaveGot.length}`)

    const cardsWeHaventGot = cardsWeMightHaveGot.filter((u) =>
      !cardsWeDefGot.includes(u));

    const urlsWeHaventGot = JSON.parse(fs.readFileSync('./urls.json')).filter((u) => 
      cardsWeHaventGot.includes(u.split('/').pop()))

    console.log(`cards we havent got: ${urlsWeHaventGot.length}`)
    // console.log(urlsWeHaventGot)
    
    const removeOldFiles = () => {
      const filesMaybeDelete = filenames.filter(s => s.toLowerCase() === s)
      filesMaybeDelete.forEach(name => {
        const path = `./cards/${name}`;
        fs.unlinkSync(path)
      })
    }
    // removeOldFiles()
    
    const getTheCards = (urls) => {
      let wait = 0;
      urls.forEach(async (url) => {
        wait += 2;
        await sleep(wait);
        const html = await request(url);
        const cardInfo = queryForCardInfo(html);
        const fileName = cardInfo.Name ? cardInfo.Name.replace('/', '&') : url.split('/').pop();

        storeData(cardInfo, `./cards/${fileName}.json`);
      });
    }
    // getTheCards(urlsWeHaventGot);
}

module.exports = {
  readFile
}