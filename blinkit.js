import puppeteer, { devices } from "puppeteer";

export const scrapeBlinkit = async (address, product) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // changed to headless mode
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled" // optional: helps bypass bot detection
      ],
    });
    const page = await browser.newPage();
    const motoG4 = devices["Moto G4"];
    await page.emulate(motoG4);

    product = encodeURIComponent(product);
    const website = "blinkit: ";

    // Navigation and interaction logic
    console.log(website, "opening site");
    await page.goto("https://www.blinkit.com", { waitUntil: "networkidle2" });

    // Handle potential modal
    try {
      await Promise.race([
        page.waitForSelector(".DownloadAppModal__ContinueLink-sc-1wef47t-12", {
          timeout: 5000,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Modal timeout")), 5000)
        ),
      ]);
      await page.click(".DownloadAppModal__ContinueLink-sc-1wef47t-12");
    } catch (modalError) {
      console.log("Modal handling skipped:", modalError.message);
    }

    console.log(website, "selecting location");
    await page.waitForSelector(".GetLocationModal__SelectManually-sc-jc7b49-7");
    await page.click(".GetLocationModal__SelectManually-sc-jc7b49-7");

    console.log(website, "entering address");
    await page.waitForSelector('input[name="select-locality"]');
    await page.type('input[name="select-locality"]', address, { delay: 300 });

    console.log(website, "selecting location");
    await page.waitForSelector(
      ".LocationSearchList__LocationListContainer-sc-93rfr7-0"
    );
    await page.evaluate(() => {
      document
        .querySelector(".LocationSearchList__LocationListContainer-sc-93rfr7-0")
        ?.click();
    });

    console.log(website, "searching");
    const newTab = await browser.newPage();
    // Emulate the same mobile device on the new tab
    await newTab.emulate(motoG4);
    await newTab.goto(`https://blinkit.com/s/?q=${product}`, {
      waitUntil: "networkidle2",
    });

    console.log(website, "gathering product details");
    const productDetails = await newTab.evaluate(() => {
      return Array.from(
        document.querySelectorAll('div[role="button"][id]')
      ).map((product) => ({
        title: product
          .querySelector("div.tw-text-300.tw-font-semibold")
          ?.textContent.trim(),
        quantity: product
          .querySelector("div.tw-text-200.tw-font-medium")
          ?.textContent.trim(),
        price: product
          .querySelector("div.tw-text-200.tw-font-semibold")
          ?.textContent.trim(),
        pic: product.querySelector("img.tw-h-full.tw-w-full")?.src,
      }));
    });

    await browser.close();
    return { data: productDetails };
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

// Test the function
(async () => {
  const result = await scrapeBlinkit(
    "Kasmanda Regent Apartments",
    "amul fullcream"
  );
  if (result.data) {
    console.log("Success:", result.data);
  } else {
    console.error("Error:", result.error);
    console.log("Screenshot (base64):", result.screenshot);
  }
})();
