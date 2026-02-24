const { MongoClient } = require("mongodb");

const URI =
  "mongodb+srv://akhil_kandrakoti:%40Khil2006@cluster0.z8unohc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const DB_NAME = "unify_labs";
const COLLECTION = "products";

async function run() {
  const client = new MongoClient(URI);

  try {
    await client.connect();
    console.log("Database connected successfully (Atlas)");

    const db = client.db(DB_NAME);
    const products = await db.collection(COLLECTION).find({}).toArray();

    console.log(`Fetched ${products.length} products from ${DB_NAME}.${COLLECTION}`);
    console.log(products);
  } catch (error) {
    console.error("Connection failed or query error:");
    console.error(error.message);
  } finally {
    await client.close();
  }
}

run();