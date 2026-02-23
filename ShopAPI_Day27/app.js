const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = 3000;

//  Express middleware for JSON
app.use(express.json());

//  MongoDB connection inside the app
const URI = "mongodb://localhost:27017";
const DB_NAME = "unify_labs";
const COLLECTION_NAME = "products";

let productsCollection;

async function startServer() {
  const client = new MongoClient(URI);

  try {
    await client.connect(); // handshake
    console.log("Database connected successfully");

    const db = client.db(DB_NAME);
    productsCollection = db.collection(COLLECTION_NAME);

    // ---------------------------
    // (Optional but useful) GET /products to view items
    // ---------------------------
    app.get("/products", async (req, res) => {
      try {
        const products = await productsCollection.find({}).toArray();
        res.status(200).json(products);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch products" });
      }
    });

    // ---------------------------
    //  POST /products (Create)
    // Takes { name, price, stock }
    // ---------------------------
    app.post("/products", async (req, res) => {
      try {
        const { name, price, stock } = req.body;

        if (!name || typeof price !== "number" || typeof stock !== "number") {
          return res.status(400).json({
            error: "Invalid body. Required: { name (string), price (number), stock (number) }",
          });
        }

        const newProduct = { name, price, stock };
        const result = await productsCollection.insertOne(newProduct);

        res.status(201).json({
          message: "Product created",
          id: result.insertedId,
          product: newProduct,
        });
      } catch (err) {
        res.status(500).json({ error: "Failed to create product" });
      }
    });

    // ---------------------------
    //  PATCH /products/:id (Update ONLY stock)
    // Takes { stock }
    // ---------------------------
    app.patch("/products/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { stock } = req.body;

        if (typeof stock !== "number") {
          return res.status(400).json({ error: "Invalid body. Required: { stock (number) }" });
        }

        const result = await productsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { stock } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Product not found" });
        }

        res.status(200).json({
          message: "Stock updated",
          modifiedCount: result.modifiedCount,
        });
      } catch (err) {
        res.status(400).json({ error: "Invalid product id" });
      }
    });

    // ---------------------------
    //  DELETE /products/:id (Delete by ID)
    // ---------------------------
    app.delete("/products/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Product not found" });
        }

        res.status(200).json({ message: "Product deleted" });
      } catch (err) {
        res.status(400).json({ error: "Invalid product id" });
      }
    });

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to DB:", err.message);
    process.exit(1);
  }
}

startServer();