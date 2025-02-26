import puppeteer from "puppeteer";

export const scrapeZepto = async (address, product) => {
  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true, // or "new" if you prefer Puppeteer v19+ headless mode
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920x1080",
    ],
    timeout: 60000,
  });

  try {
    const page = await browser.newPage();
    await page.goto("https://www.zeptonow.com", { waitUntil: "networkidle2" });

    console.log("Opening Zepto website...");

    // 1. Select and enter the address
    await page.waitForSelector('span[data-testid="user-address"]');
    await page.click('span[data-testid="user-address"]');

    await page.waitForSelector('input[placeholder="Search a new address"]');
    await page.type('input[placeholder="Search a new address"]', address, {
      delay: 100,
    });

    await page.waitForSelector('div[data-testid="address-search-item"]');
    await page.evaluate(() => {
      const firstAddress = document.querySelector(
        'div[data-testid="address-search-item"]'
      );
      if (firstAddress) firstAddress.click();
    });

    await page.waitForSelector('button[data-testid="location-confirm-btn"]');
    await page.click('button[data-testid="location-confirm-btn"]');

    // 2. Handle any modal if it appears
    try {
      await Promise.race([
        page.waitForSelector('button[data-testid="manual-address-btn"]', {
          timeout: 5000,
        }),
        page.waitForTimeout(5000),
      ]);
      await page.click('button[data-testid="manual-address-btn"]');
    } catch (error) {
      console.log("No modal detected, proceeding...");
    }

    // 3. Perform the product search
    await page.waitForSelector('a[data-testid="search-bar-icon"]');
    await page.click('a[data-testid="search-bar-icon"]');

    // Use XPath for the search input
    await page.waitForXPath('//input[@placeholder="Search for over 5000 products"]');
    const searchInput = (await page.$x('//input[@placeholder="Search for over 5000 products"]'))[0];

    await searchInput.click();
    await searchInput.type(product, { delay: 100 });
    await page.keyboard.press("Enter");

    // 4. Collect product data
    await page.waitForSelector('a[data-testid="product-card"]', { timeout: 10000 });

    const productData = await page.evaluate(() => {
      const products = Array.from(
        document.querySelectorAll('a[data-testid="product-card"]')
      );

      return products.map((product) => {
        const title = product.querySelector("h5.font-subtitle")?.textContent.trim();
        const pic = product.querySelector('img[data-testid="product-card-image"]')?.src;
        // Updated selector for quantity: select the <h5> inside the span with data-testid="product-card-quantity"
        const quantity = product.querySelector('span[data-testid="product-card-quantity"] h5')?.textContent.trim();
        const price = product.querySelector('h4[data-testid="product-card-price"]')?.textContent.trim();

        return { title, quantity, price, pic };
      });
    });

    // 5. Debug screenshot if no products found
    if (productData.length === 0) {
      console.error("No products found. Taking a screenshot...");
      await page.screenshot({ path: "debug_zepto.png" });
    }

    return productData;
  } catch (err) {
    console.error("Zepto scraping error:", err);
    throw err; // re-throw to handle upstream
  } finally {
    await browser.close();
  }
};

// Test the function directly (optional)
(async () => {
  const result = await scrapeZepto("Kasmanda Regent Apartments", "amul fullcream");
  console.log("Scraped Data:", result);
})();
