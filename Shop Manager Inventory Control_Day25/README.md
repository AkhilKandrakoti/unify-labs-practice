# Advanced CRUD — Shop Manager: Inventory Control (Day 25)

## Overview
This task focuses on enhancing the shop inventory system using advanced MongoDB CRUD operations. The goal is to perform bulk updates, manage product attributes, handle tags, and clean up data to maintain an efficient inventory.

## Objectives
- Use `$inc` to update values.
- Update fields using `$set` with `updateMany()`.
- Manage tags using `$push`.
- Delete records using `deleteMany()`.
- Verify results using `countDocuments()`.

## Technologies Used
- MongoDB
- MongoDB Shell (mongosh)
- Command Prompt

## Steps Performed

### Increase price of Electronics by 10
```js
db.products.updateMany(
  { category: "Electronics" },
  { $inc: { price: 10 } }
)
Set featured flag for items priced above 500
db.products.updateMany(
  { price: { $gt: 500 } },
  { $set: { featured: true } }
)
Update category name
db.products.updateMany(
  { category: "Electronics" },
  { $set: { category: "Electronic Devices" } }
)
Add new-arrival tag to selected products
db.products.updateMany(
  { name: { $in: ["Wooden Dining Table", "Smartphone Pro"] } },
  { $push: { tags: "new-arrival" } }
)
Set one product stock to zero for cleanup demonstration
db.products.updateOne(
  { name: "Denim Jacket" },
  { $set: { stock: 0 } }
)
Delete products with zero stock
db.products.deleteMany({ stock: 0 })
Verify remaining documents count
db.products.countDocuments()
Key Learnings

Applying bulk updates with MongoDB operators.

Managing product metadata and flags.

Working with array fields for tagging.

Performing cleanup operations safely.

Verifying database changes.

Conclusion

This task strengthened my understanding of advanced CRUD operations in MongoDB by applying updates, managing inventory attributes, and ensuring data consistency through verification.

Author

Akhil Kandrakoti