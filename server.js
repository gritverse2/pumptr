// Backend pentru Pump Trends - Colectează cuvintele trending de pe Pump.fun
// Salvează datele și oferă un API pentru frontend

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const cors = require("cors");
const cron = require("node-cron");

const app = express();
const PORT = 3001;

app.use(cors());

const DATA_FILE = "trending.json";

// Funcție care face scraping pe Pump.fun
async function fetchTrendingWords() {
  try {
    console.log("Fetching trending words...");
    const { data } = await axios.get("https://pump.fun/");
    const $ = cheerio.load(data);
    const words = [];

    $(".trending-word").each((index, element) => {
      words.push($(element).text().trim());
    });

    if (words.length > 0) {
      const timestamp = new Date().toISOString();
      let history = [];

      if (fs.existsSync(DATA_FILE)) {
        history = JSON.parse(fs.readFileSync(DATA_FILE));
      }

      history.unshift({ time: timestamp, words });
      fs.writeFileSync(DATA_FILE, JSON.stringify(history.slice(0, 100), null, 2));

      console.log("Updated trending words:", words);
    }
  } catch (error) {
    console.error("Error fetching trending words:", error);
  }
}

// Rulează scraping-ul la fiecare 10 minute
cron.schedule("*/10 * * * *", fetchTrendingWords);

// Endpoint API pentru frontend
app.get("/api/trending", (req, res) => {
  if (fs.existsSync(DATA_FILE)) {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json({ current: data[0].words, history: data });
  } else {
    res.json({ current: [], history: [] });
  }
});

// Pornim serverul
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  fetchTrendingWords(); // Primul update la pornire
});
