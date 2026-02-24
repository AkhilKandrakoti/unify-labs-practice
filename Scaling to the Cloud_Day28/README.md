# Day 28 Report — Cloud Deployment with MongoDB Atlas

## Data Architect: Scaling to the Cloud

---

## Executive Summary

On Day 28, the objective was to migrate the application’s data layer from a local MongoDB instance to MongoDB Atlas, a fully managed cloud database platform. This involved setting up a cloud cluster, configuring security settings, creating a database user, updating the application’s connection string, and verifying successful data flow between the Node.js application and the cloud database.

The successful completion of this task demonstrates the ability to deploy and operate backend systems in a cloud environment, which is a critical skill in modern software engineering.

---

## Objectives

* Create a MongoDB Atlas free tier cluster.
* Configure network access to allow application connectivity.
* Create a database user with appropriate privileges.
* Insert product data into the cloud database.
* Update application configuration to use the Atlas SRV connection string.
* Verify successful connection by fetching data from the cloud.

---

## Tools and Technologies Used

* MongoDB Atlas (Cloud Database Platform)
* Node.js
* MongoDB Node Driver
* Command Prompt
* MongoDB Atlas Data Explorer

---

## Implementation Steps

### 1. Atlas Account and Cluster Setup

A MongoDB Atlas account was created, and a free tier (M0) shared cluster was provisioned. The cluster serves as the cloud environment for storing and managing application data.

---

### 2. Network Access Configuration

Network access rules were configured by adding an IP allowlist entry (0.0.0.0/0), enabling the application to securely connect to the Atlas cluster from any network.

This step ensures that the database accepts connections from authorized sources.

---

### 3. Database User Creation

A database user was created with read and write permissions. Authentication credentials were securely stored and used in the application’s connection string.

This provides controlled access to the database.

---

### 4. Data Insertion into Cloud Database

Using MongoDB Atlas Data Explorer:

* Database `unify_labs` was created.
* Collection `products` was created.
* Multiple product documents were inserted manually.

Example document:

{
"name": "USB-C Charger",
"price": 499,
"stock": 30
}

This ensures the database contains test data for validation.

---

### 5. Application Configuration Update

The Node.js application was updated to replace the local MongoDB connection string:

mongodb://localhost:27017

with the Atlas SRV connection string:

mongodb+srv://username:password@cluster.mongodb.net/

This allows the application to connect to the cloud database.

---

### 6. Verification of Data Flow

The application was executed using:

node db.js

The terminal output confirmed:

* Successful connection to MongoDB Atlas.
* Retrieval of product documents from the cloud database.

This verified end-to-end connectivity.

---

## Results

The application successfully established a secure connection with the MongoDB Atlas cluster and retrieved product data stored in the cloud.

This confirms that the data layer migration was completed successfully.

---

## Key Learnings

* Understanding cloud database architecture.
* Configuring secure access controls.
* Managing connection strings.
* Verifying cloud connectivity.
* Performing database operations in a distributed environment.

---

## Challenges Encountered

* Ensuring password encoding in the connection string.
* Configuring network access correctly.
* Verifying database permissions.

These were resolved through proper configuration.

---

## Security Considerations

* Credentials handled securely.
* Database access controlled via authentication.
* Network rules configured to restrict unauthorized access.

---

## Real-World Significance

Cloud deployment enables applications to scale globally, improve reliability, and support distributed systems. Migrating to MongoDB Atlas reflects industry practices where backend services rely on managed cloud databases.

---

## Conclusion

Day 28 successfully completed the migration of the application’s database layer to MongoDB Atlas. The system now operates using a cloud database, demonstrating readiness to deploy backend services in real-world environments.

---

## Author

Akhil Kandrakoti
