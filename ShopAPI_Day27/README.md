# Shop API — RESTful Product Management Service (Day 27)

## Overview

This project implements a production-style RESTful API using Node.js, Express, and MongoDB to manage product inventory for a shop system. The service exposes endpoints that allow clients to create, view, update, and delete product records through HTTP requests, simulating a real-world backend service architecture.

The API demonstrates proper server setup, database connectivity, middleware usage, request validation, and resource manipulation through standard REST principles.

---

## Objectives

- Build an Express-based web service.
- Establish a MongoDB connection within the application.
- Implement CRUD operations through REST endpoints.
- Handle JSON requests using middleware.
- Perform database operations safely and asynchronously.
- Verify functionality using Postman.

---

## Technology Stack

- Node.js — Runtime environment
- Express.js — Web framework
- MongoDB — NoSQL database
- MongoDB Node Driver — Database connectivity
- Postman — API testing tool

---

## System Architecture


Client (Postman / Browser)
│
▼
Express Server (API Layer)
│
▼
MongoDB Driver
│
▼
MongoDB Database (unify_labs)
│
▼
Products Collection


The Express server acts as the application layer, handling HTTP requests and delegating data operations to MongoDB.

---

## Features

- Create new product records.
- Retrieve product inventory.
- Update product stock levels.
- Delete products by identifier.
- Structured error handling.
- Clean request-response lifecycle.

---

## API Endpoints

### 1. GET /products — Retrieve all products

Returns a list of product documents stored in the database.

**Response Example**

```json
[
  {
    "_id": "...",
    "name": "USB-C Charger",
    "price": 499,
    "stock": 30
  }
]
2. POST /products — Create a product

Creates a new product record.

Request Body

{
  "name": "USB-C Charger",
  "price": 499,
  "stock": 30
}

Response

{
  "message": "Product created",
  "id": "..."
}
3. PATCH /products/:id — Update stock

Updates only the stock field of a product.

Request Body

{
  "stock": 99
}

Response

{
  "message": "Stock updated"
}
4. DELETE /products/:id — Delete product

Removes a product by MongoDB ObjectId.

Response

{
  "message": "Product deleted"
}
Setup Instructions
1. Navigate to project directory
cd ShopAPI_Day27
2. Initialize project
npm init -y
3. Install dependencies
npm install express mongodb
4. Run server
node app.js

Server will start at:

http://localhost:3000
Middleware

The application uses Express JSON middleware:

Parses incoming JSON requests.

Makes request body available via req.body.

Database Connection

The MongoDB connection is initialized during server startup to ensure:

Successful handshake.

Reliable data operations.

Controlled connection lifecycle.

Error Handling Strategy

The API handles:

Invalid request bodies.

Missing resources.

Database failures.

Invalid ObjectId inputs.

Responses follow consistent status codes and structured messages.

Testing Strategy

Endpoints were validated using Postman by:

Creating a product.

Updating stock.

Deleting the product.

Verifying changes via GET requests.

Key Learnings

Designing REST APIs with Express.

Managing MongoDB connections in backend services.

Handling asynchronous operations.

Validating incoming data.

Understanding request lifecycle.

Implementing route-based logic.

Production Considerations

Use environment variables for configuration.

Implement authentication and authorization.

Add request logging.

Enable schema validation.

Use connection pooling.

Introduce rate limiting.

Deploy behind reverse proxy.

Future Enhancements

Add authentication middleware.

Implement pagination.

Introduce product categories.

Add input validation library.

Create API documentation (Swagger).

Deploy to cloud environment.

Integrate frontend client.

Conclusion

The Shop API successfully demonstrates a full backend service capable of managing product inventory through RESTful operations. It reflects fundamental backend engineering practices including structured routing, database interaction, and reliable request handling, providing a strong foundation for building scalable web services.

Author

Akhil Kandrakoti