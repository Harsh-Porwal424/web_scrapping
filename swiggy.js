import puppeteer from "puppeteer";

export const scrapeSwiggy = async (address, dish) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ],
      timeout: 60000
    });
    const website = "swiggy: ";
    const page = await browser.newPage();

    await page.goto("https://www.swiggy.com");
    console.log(website, "site opened");
    await page.waitForTimeout(2000);

    console.log(website, "entering delivery location");
    await page.waitForSelector(
      'input[placeholder="Enter your delivery location"]'
    );
    await page.click('input[placeholder="Enter your delivery location"]');

    console.log(website, "typing address");
    await page.type(
      'input[placeholder="Enter your delivery location"]',
      address,
      { delay: 100 }
    );

    console.log(website, "typed address");
    await page.waitForTimeout(2000);

    console.log(website, "clicking on the 1st address");
    await page.click('span[class="_2OORn"]');
    await page.waitForTimeout(3000);

    console.log(website, "open new search page");
    await page.goto("https://www.swiggy.com/search?query=" + dish);
    await page.waitForTimeout(5000);

    await page.waitForSelector('span[data-testid="DISH-nav-tab-pl"]');
    console.log(website, "dish appeared");
    await page.click('span[data-testid="DISH-nav-tab-pl"]');

    console.log(website, "clicked on dish");
    await page.waitForTimeout(10000);

    console.log(website, "reading pg data");
    const productData = await page.evaluate(() => {
      const dishes = Array.from(
        document.querySelectorAll('div[data-testid="normal-dish-item"]')
      );
      const images = Array.from(
        document.querySelectorAll('img[class="styles_itemImage__DHHqs"]')
      );

      let index = 0;
      return dishes
        .map((dish) => {
          try {
            const title =
              dish?.childNodes[0].childNodes[1].childNodes[1].textContent;
            const price =
              dish?.childNodes[0].childNodes[1].childNodes[2].innerText;
            const pic = images[index]?.src;
            index += 1;
            return { title, price, pic };
          } catch (e) {
            console.error("Error processing dish:", e);
            return null;
          }
        })
        .filter((item) => item !== null);
    });

    await browser.close();
    return { data: productData };
  } catch (error) {
    let screenshot = null;
    if (browser) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          screenshot = await pages[0].screenshot({
            encoding: "base64",
            fullPage: true,
          });
        }
      } catch (screenshotError) {
        console.error("Failed to capture screenshot:", screenshotError);
      } finally {
        await browser.close();
      }
    }
    return {
      error: error.message,
      screenshot,
      stack: error.stack,
    };
  }
};

(async () => {
  const result = await scrapeSwiggy("Kasmanda Regent Apartments", "tunday");
  if (result.data) {
    console.log("Success:", result.data);
  } else {
    console.error("Error:", result.error);
    console.log("Screenshot available:", !!result.screenshot);
  }
})();
