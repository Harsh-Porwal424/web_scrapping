import express from "express";
import puppeteer from "puppeteer";
import { scrapeBlinkit } from "./blinkit.js";
import { scrapeZepto } from "./zepto.js";
// import { scrapeSwiggy } from "./swiggy.js";
// import { scrapeZomato } from "./zomato.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json()); // To parse JSON request bodies

// Use environment variable for port if set, otherwise default to 80
const port = process.env.PORT || 3000;

// Get the current directory using import.meta.url and fileURLToPath
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Zepto API
app.post("/zepto", async (req, res) => {
  const { address, product } = req.body;
  console.log(address);
  console.log(product);
  try {
    const result = await scrapeZepto(address, product);
    res.json(result);
  } catch (error) {
    res.status(500).send("Error scraping Zepto" + error);
  }
});

// Blinkit API
app.post("/blinkit", async (req, res) => {
  const { address, product } = req.body;
  console.log(address);
  console.log(product);
  try {
    const result = await scrapeBlinkit(address, product);
    res.json(result);
  } catch (error) {
    res.status(500).send("Error scraping Blinkit" + error);
  }
});

// swiggy api -wip

// app.post("/swiggy", async (req, res) => {
//   const { address, dish } = req.body;
//   try {
//     const result = await scrapeSwiggy(address, dish);
//     res.json(result);
//   } catch (error) {
//     res.status(500).send("Error scraping Swiggy" + error);
//   }
// });

// zomato wip

// app.post("/zomato", async (req, res) => {
//   const { address, dish } = req.body;
//   try {
//     const result = await scrapeZomato(address, dish);
//     res.json(result);
//   } catch (error) {
//     res.status(500).send("Error scraping Zomato" + error);
//   }
// });

// app.listen(8080, () => {
//     console.log('Server is running on port 8080');
//   });

// Serve the HTML file for the frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Health Check API
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is healthy" });
});

// Start the server on port 80 (or the port defined by the environment)
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
