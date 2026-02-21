# CRUD Operations — Data Architect: Building the Shop (Day 24)

## Overview
This project demonstrates the implementation of basic CRUD-related operations in MongoDB as part of the internship task. The objective was to design the data layer for a modern e-commerce shop by creating product documents, modeling nested data structures, and performing queries to retrieve and analyze product information.

The exercise focuses on document modeling, bulk insertion, filtering, sorting, and limiting results to simulate real-world database operations.

---

## Objectives
- Use `insertMany()` to insert multiple product documents.
- Implement nested objects to store product specifications.
- Retrieve products based on category.
- Sort products by price to identify the most expensive items.
- Limit query results to a specified number.

---

## Technologies Used
- MongoDB
- MongoDB Shell (mongosh)
- Windows Command Prompt

---

## Database Setup

### Step 1: Start MongoDB Shell
```bash
mongosh
Step 2: Switch to Database
use shopDB
Data Insertion

Five products were inserted using insertMany() with different categories: Electronics, Clothing, and Furniture. Each document includes price, stock, and a nested specifications object.

db.products.insertMany([
  {
    name: "Smartphone Pro",
    category: "Electronics",
    price: 850,
    stock: 25,
    specs: { color: "Black", weight: "180g" }
  },
  {
    name: "Wireless Headphones",
    category: "Electronics",
    price: 200,
    stock: 50,
    specs: { color: "White", weight: "250g" }
  },
  {
    name: "Denim Jacket",
    category: "Clothing",
    price: 120,
    stock: 40,
    specs: { color: "Blue", weight: "500g" }
  },
  {
    name: "Office Chair",
    category: "Furniture",
    price: 300,
    stock: 15,
    specs: { color: "Gray", weight: "7kg" }
  },
  {
    name: "Wooden Dining Table",
    category: "Furniture",
    price: 950,
    stock: 10,
    specs: { color: "Brown", weight: "25kg" }
  }
])
Queries Performed
1. Retrieve Electronics Products
db.products.find({ category: "Electronics" })

This query filters and returns all products belonging to the Electronics category.

2. Find Top 2 Most Expensive Products
db.products.find().sort({ price: -1 }).limit(2)

sort({ price: -1 }) sorts products in descending order by price.

limit(2) returns only the top two most expensive products.

3. Projection (Optional Enhancement)
db.products.find(
  {},
  { name: 1, price: 1, category: 1, _id: 0 }
).sort({ price: -1 }).limit(2)

Displays only selected fields for cleaner output.

Key Learnings

Understanding MongoDB collections and documents.

Modeling nested data using embedded objects.

Performing bulk insert operations efficiently.

Writing queries for filtering and sorting datasets.

Limiting results to extract meaningful insights.

Conclusion

The task successfully demonstrated how MongoDB can be used to design a flexible data model for an e-commerce application. By inserting structured product data and executing targeted queries, the exercise provided practical experience in managing and retrieving data effectively.

Author

Akhil Kandrakoti