

const express = require("express");
const { MongoClient, ServerApiVersion } = require("mongodb");
const cron = require("node-cron");
const fs = require("fs");

const { specialDateConfig, itemPrefixes, specialDateTheme, maxrotationcounter } = require('./shopconfig.js');

const app = express();
exports.app = app;

const port = process.env.PORT || 3001;

process.on("SIGINT", function () {
  mongoose.connection.close(function () {
    console.log("Mongoose disconnected on app termination");
    process.exit(0);
  });
});

process.on("SIGINT", function () {
  mongoose.connection.close(function () {
    console.log("Mongoose disconnected on app termination");
    process.exit(0);
  });
});


const password = process.env.DB_KEY || "8RLj5Vr3F6DRBAYc"
const encodedPassword = encodeURIComponent(password);

const uri = `mongodb+srv://Liquem:${encodedPassword}@cluster0.ed4zami.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    socketTimeoutMS: 30000,
 //   maxConnecting: 2,
   // maxIdleTimeMS: 300000,
   // maxPoolSize: 100,
    //minPoolSize: 0,
  },
});

async function startServer() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log("Connected to MongoDB");
    // Start the express server
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

startServer();

// MongoDB User Schema
const db = client.db("Cluster0");
const itemDataCollection = db.collection("item_data");
const PackItemsCollection = db.collection("packitems");
const shopcollection = db.collection("ShopCollection");






async function getitemdata() {
  const itemsData = fs.readFileSync("items.txt", "utf8");
  const lines = itemsData.split("\n");

  try {
    await itemDataCollection.deleteMany({}); // Delete existing items

    const itemsToInsert = lines
      .map((line) => {
        const [itemId, itemPrice] = line.split(":");
        const parsedItemPrice = parseInt(itemPrice);

        if (!isNaN(parsedItemPrice)) {
          return {
              _id: itemId,
              id: itemId, // Assuming itemId is unique
            price: parsedItemPrice,
          };
        } else {
          console.error(`Invalid item price for item ${itemId}: ${itemPrice}`);
          return null;
        }
      })
      .filter((item) => item !== null);

    await itemDataCollection.insertMany(itemsToInsert);

    console.log("Items initialized successfully.");
  } catch (error) {
    console.error("Error initializing items:", error);
  }
}

// Call the asynchronous function




async function getitemdata2() {
  const itemsData = fs.readFileSync("packitems.txt", "utf8");
  const lines = itemsData.split("\n");

  try {
    await PackItemsCollection.deleteMany({}); // Delete existing items

    const itemsToInsert = lines
      .map((line) => {
        const [itemId, itemPrice] = line.split(":");
        const parsedItemPrice = parseInt(itemPrice);

        if (!isNaN(parsedItemPrice)) {
          return {
              id: itemId, // Assuming itemId is unique
            price: parsedItemPrice,
          };
        } else {
          console.error(`Invalid item price for item ${itemId}: ${itemPrice}`);
          return null;
        }
      })
      .filter((item) => item !== null);

    await PackItemsCollection.insertMany(itemsToInsert);

    console.log("Items initialized successfully.");
  } catch (error) {
    console.error("Error initializing items:", error);
  }
}
//getitemdata2();
//getitemdata();

const itemsFilePath = "shopitems.txt";
// Pfad zur Datei, in der die vorherige tägliche Rotation gespeichert wird
const previousRotationFilePath = "previous-rotation.txt";

const lastUpdateTimestampFilePath = "last-update-timestamp.txt";
let lastUpdateTimestamp = null; // Zeitstempel der letzten Aktualisierung

function loadLastUpdateTimestamp() {
  try {
    const timestampData = fs.readFileSync(lastUpdateTimestampFilePath, "utf8");
    lastUpdateTimestamp = parseInt(timestampData);
  } catch (err) {
    console.error(
      "Fehler beim Lesen des letzten Aktualisierungszeitstempels:",
      err,
    );
  }
}

function saveLastUpdateTimestamp() {
  try {
    fs.writeFileSync(lastUpdateTimestampFilePath, Date.now().toString()); // Aktuellen Zeitstempel speichern
  } catch (err) {
    console.error(
      "Fehler beim Speichern des Zeitstempels der letzten Aktualisierung:",
      err,
    );
  }
}

function shouldUpdateDailyRotation() {
  // Überprüfen, ob der Server nach Mitternacht gestartet wurde
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);

  return now > midnight && lastUpdateTimestamp < midnight.getTime();
}

let availableItems = []; // Definiere availableItems im globalen Geltungsbereich
let dailyItems = []; // Liste der täglich verfügbaren Gegenstände

// Funktion zum Lesen der Gegenstände aus der Datei und Hinzufügen zu availableItems
function loadAvailableItems() {
  try {
    const fileData = fs.readFileSync(itemsFilePath, "utf8");
    availableItems = fileData
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    console.log("Verfügbare Gegenstände wurden aktualisiert.");
  } catch (err) {
    console.error("Fehler beim Lesen der Gegenstände aus der Datei:", err);
  }
}

// Funktion zum Lesen der vorherigen täglichen Rotation aus der Datei
function loadPreviousRotation() {
  try {
    const fileData = fs.readFileSync(previousRotationFilePath, "utf8");
    const lines = fileData.split("\n").filter((item) => item.trim() !== "");

    dailyItems = {};
    lines.forEach((line, index) => {
      dailyItems[(index + 1).toString()] = line.trim();
    });

    console.log("Vorherige tägliche Rotation wurde geladen.");
  } catch (err) {
    console.error(
      "Fehler beim Lesen der vorherigen täglichen Rotation aus der Datei:",
      err,
    );
  }
}

function load1PreviousRotation() {
  try {
    const data = fs.readFileSync("previous-rotation.txt", "utf8");
    return data.split("\n").map((item) => item.trim());
  } catch (error) {
    console.error("Error reading previous rotation file:", error.message);
    return [];
  }
}

function saveDailyRotation() {
  try {
    const lines = Object.values(dailyItems);
    fs.writeFileSync(previousRotationFilePath, lines.join("\n"));

    
  } catch (err) {
    console.error(
      "Fehler beim Speichern der täglichen Rotation in der Datei:",
      err,
    );
  }
}

// Funktion zum Zufälligen Auswählen von 4 Gegenständen für die Tagesrotation

const itemsUsedInLastDaysFilePath = "items-used-in-last-days.json";
const shopUpdateCounterFilePath = "shop-update-counter.json";

function getItemsUsedInLastDays() {
  try {
    const data = fs.readFileSync(itemsUsedInLastDaysFilePath, "utf8");
    return new Map(JSON.parse(data));
  } catch (error) {
    console.error("Error reading items used in last days file:", error.message);
    return new Map();
  }
}

function saveItemsUsedInLastDays(itemsUsedInLastDaysMap) {
  try {
    const data = JSON.stringify(Array.from(itemsUsedInLastDaysMap.entries()));
    fs.writeFileSync(itemsUsedInLastDaysFilePath, data);
  } catch (error) {
    console.error("Error saving items used in last days:", error.message);
  }
}

function getShopUpdateCounter() {
  try {
    const data = fs.readFileSync(shopUpdateCounterFilePath, "utf8");
    return parseInt(data) || 0;
  } catch (error) {
    console.error("Error reading shop update counter file:", error.message);
    return 0;
  }
}

const pricefile = "items.txt";
function loadItemPrices() {
  try {
    const fileData = fs.readFileSync(pricefile, "utf8");
    const items = fileData
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    // Assuming prices are formatted as "A018:item:100", extract the item ID and price
    const itemPrices = new Map();
    items.forEach((item) => {
      const { itemId, price } = parseItem(item);
      itemPrices.set(itemId, parseInt(price)); // assuming prices are integers
    });

    return itemPrices;
  } catch (err) {
    console.error(
      "Fehler beim Lesen der Gegenstandspreise aus der Datei:",
      err,
    );
    return new Map();
  }
}

function parseItem(item) {
  const [itemId, price] = item.split(":");
  return { itemId, price };
}

function processDailyItemsAndSaveToServer() {

   const itemPrices = loadItemPrices(); // You need to implement this function

  // Combine daily items with prices
  const dailyItemsWithPrices = Object.keys(dailyItems).reduce((result, key) => {
    const item = dailyItems[key];
    const { itemId } = parseItem(item);
    const price = itemPrices.get(itemId);
    result[key] = { itemId, price };
    return result;
  }, {});
   date = new Date();
   const month = date.getMonth() + 1; // Adding 1 because getMonth() returns 0-indexed month
  const day = date.getDate();
  const dateString = `${month}-${day}`;

  // Retrieve the special date theme for the given date
  const theme = specialDateTheme[dateString] || undefined;



shop_items = dailyItemsWithPrices;
shop_theme = theme;

const document = {
  //  name: "dailyitems",  // This can be the specific name or key
    items: shop_items,
    theme: shop_theme,
  };
  
  // Using updateOne with upsert: true to avoid duplicates
  shopcollection.updateOne(
    { _id: "dailyItems" },   // Filter to find document by name
    { $set: document },        // Update the document if found, or insert if not
    { upsert: true }    
  );

  }

function processSpecialItemsAndSaveToServer() {

   const itemPrices = loadItemPrices(); // You need to implement this function

  // Combine daily items with prices
  const dailyItemsWithPrices = Object.keys(dailyItems).reduce((result, key) => {
    const item = dailyItems[key];
    const { itemId } = parseItem(item);
    const price = itemPrices.get(itemId);
    result[key] = { itemId, price };
    return result;
  }, {});
   date = new Date();
   const month = date.getMonth() + 1; // Adding 1 because getMonth() returns 0-indexed month
  const day = date.getDate();
  const dateString = `${month}-${day}`;

  // Retrieve the special date theme for the given date
  const theme = specialDateTheme[dateString] || undefined;

shop_items = dailyItemsWithPrices;
shop_theme = theme;

}



function incrementShopUpdateCounter() {
  const counter = getShopUpdateCounter() + 1;
  try {
    fs.writeFileSync(shopUpdateCounterFilePath, counter.toString());
  } catch (error) {
    console.error("Error incrementing shop update counter:", error.message);
  }
}

function selectDailyItems() {
  let shuffledItems = [...availableItems];
  dailyItems = {};

  const selectedItemsSet = new Set();

  // Load the previous rotation from the file
  const previousRotationMap = getItemsUsedInLastDays();

  // Convert the Map keys to an array for easier checking
  const previousRotation = Array.from(previousRotationMap.keys());

  // Filter out items from the previous rotation
  shuffledItems = shuffledItems.filter(
    (item) => !previousRotation.includes(item),
  );

  // Load the shop update counter
  const shopUpdateCounter = getShopUpdateCounter();

  // If the shop has updated more than 4 times, clear the items used in the last 4 days
  if (shopUpdateCounter > maxrotationcounter) {
    const itemsUsedInLastDaysMap = new Map();
    saveItemsUsedInLastDays(itemsUsedInLastDaysMap);
    fs.writeFileSync(shopUpdateCounterFilePath, "0");
  }

  const now = new Date();

  for (let i = 0; i < itemPrefixes.length; i++) {
    const prefix = itemPrefixes[i];

    const validItems = shuffledItems.filter(
      (item) => item.startsWith(prefix) && !selectedItemsSet.has(item),
    );

    if (validItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * validItems.length);
      let selectedItem = validItems[randomIndex];
      selectedItem = cleanUpItem(selectedItem);

      dailyItems[(i + 1).toString()] = selectedItem;
      selectedItemsSet.add(selectedItem);

      const indexToRemove = shuffledItems.indexOf(selectedItem);
      if (indexToRemove !== -1) {
        shuffledItems.splice(indexToRemove, 1);
      }

      const itemsUsedInLastDaysMap = getItemsUsedInLastDays();
      itemsUsedInLastDaysMap.set(selectedItem, now.getTime());
      saveItemsUsedInLastDays(itemsUsedInLastDaysMap);
    } else {
      console.error(`Not enough available items with prefix ${prefix}.`);
      return;
    }
  }

  // Save the current daily rotation to the file
  saveDailyRotation();

  // Increment the shop update counter
  incrementShopUpdateCounter();
  processDailyItemsAndSaveToServer();
}

function cleanUpItem(item) {
  // Remove carriage return characters from the item
  return item.replace(/\r/g, "");
}

// Funktion zum Überprüfen, ob heute ein besonderes Datum ist (z.B. Valentinstag, Halloween oder Weihnachten)


function isSpecialDate() {
  const today = new Date();
  const month = today.getMonth() + 1; // Note: Months are 0-based
  const day = today.getDate();

  return specialDateConfig[`${month}-${day}`] !== undefined;
}

// Funktion zum Festlegen der täglichen Rotation für besondere Tage
function setSpecialDailyItems() {
  if (isSpecialDate()) {
    const today = new Date();
    const month = today.getMonth() + 1; // Note: Months are 0-based
    const day = today.getDate();

    const specialItems = specialDateConfig[`${month}-${day}`];

    if (specialItems) {
      dailyItems = createKeyedItems(specialItems);
      saveDailyRotation(dailyItems);
      return;
      
    }
    
  }
console.log("today is no special date");
  // If not a special date or no special items defined, select daily items using the default logic
  selectDailyItems();
}

function createKeyedItems(items) {
  const keyedItems = {};
  items.forEach((item, index) => {
    keyedItems[index + 1] = item;
  });
  return keyedItems;
}

function initializeItems() {
  loadAvailableItems();
  loadPreviousRotation();
  loadLastUpdateTimestamp();

  if (shouldUpdateDailyRotation()) {
    setSpecialDailyItems();
    saveLastUpdateTimestamp();
    processDailyItemsAndSaveToServer();
  }
}

// Initialisieren der Gegenstände beim Serverstart
initializeItems();

cron.schedule(
  "0 0 * * *",
  () => {
    setSpecialDailyItems();
    saveLastUpdateTimestamp();
    console.log("Daily rotation updated.");
  },
  {
    scheduled: true,
    timezone: "UTC",
  },
);

const currentTimestamp = new Date().getTime();
console.log(currentTimestamp);

// Route zum Abrufen der aktuellen Tagesrotation

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  const t0am = currentDate.getTime();
 //dailyItems: shop_items, shoptheme: shop_theme, server_nexttime: t0am





app.use((err, req, res, next) => {
  console.error('An error occurred:', err);

  // Send an appropriate response based on the error
  res.status(500).json({ error: 'Unexpected server error' });
    });

  app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  

