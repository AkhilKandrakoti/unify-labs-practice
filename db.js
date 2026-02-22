const { MongoClient } = require("mongodb");

const URI = "mongodb://localhost:27017";
const DB_NAME = "unify_labs";
const COLLECTION = "products";

async function run() {
  const client = new MongoClient(URI);

  try {
    // Handshake / connect
    await client.connect();
    console.log("Database connected successfully");

    // Fetch all products
    const db = client.db(DB_NAME);
    const products = await db.collection(COLLECTION).find({}).toArray();

    console.log(`Fetched ${products.length} products from ${DB_NAME}.${COLLECTION}`);
    console.log(products);
  } catch (error) {
    console.error("Connection failed or query error:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();