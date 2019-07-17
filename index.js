const puppeteer = require('puppeteer')

const argv = require('yargs')
  .example('$0 --url=https://example.com')
  .option('url')
  .option('width', {
    describe: 'Width of viewport'
  })
  .option('height', {
    describe: 'Height of viewport'
  })
  .option('out', {
    default: '-',
    describe: 'File path to save. If `-` specified, outputs to console in base64-encoded'
  })
  .option('out_format', {
    default: 'pdf',
    describe: 'Output format html or pdf'
  })
  .option('delay', {
    describe: 'Delay to save screenshot after loading CSS. Milliseconds'
  })
  .option('css', {
    describe: 'Additional CSS URL to load'
  })
  .option('style', {
    describe: 'Additional style to apply to body'
  })
  .option('user_agent', {
    default: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36',
    describe: 'Puppeteer UserAgent'
  })
  .demandOption(['url'])
  .argv

const { url, user_agent, out, out_format, delay, css, style, width, height } = argv

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

(async () => {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  })
  const page = await browser.newPage()
  await page.setUserAgent(user_agent);
  if (width && height) {
    await page.setViewport({ width, height })
  }
  await page.goto(url)
  if (css || style) {
    await page.evaluate((css, style) => {
      if (css) {
        const head = document.head
        const link = document.createElement('link')
        link.href = css
        link.rel = 'stylesheet'
        head.appendChild(link)
      }
      if (style) {
        document.body.setAttribute('style', style)
      }
    }, css, style)
  }
  if (delay) {
    await sleep(delay)
  }
  if (out_format === 'pdf') {
    if (out === '-') {
      const screenshot = await page.screenshot()
      console.log(screenshot.toString('base64'))
    } else {
      await page.screenshot({ path: out })
    }
  } else {
    let bodyHTML = await page.evaluate(() => document.body.innerHTML);
    if (out === '-') {
      console.log(bodyHTML)
    } else {
      const fs = require('fs');
      fs.writeFile(out, bodyHTML, function (err) {
        if (err) {
          return console.log(err);
        }
      });
    }
  }

  browser.close()
})()
