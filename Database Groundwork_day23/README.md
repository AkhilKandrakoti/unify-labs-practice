# README — NoSQL Foundation: MongoDB Environment Setup (Day 23)

## Overview

This project documents the successful completion of the NoSQL Foundation task focused on setting up a local MongoDB environment, establishing a connection, and performing basic database operations using MongoDB Compass and MongoDB Shell (mongosh). The objective was to gain hands-on experience with installing MongoDB, connecting to a local instance, creating a database and collection, and inserting sample documents.

---

## Objectives

* Install MongoDB Community Server and MongoDB Compass.
* Verify installation using the MongoDB Shell.
* Establish a connection to the local MongoDB server using the default port (27017).
* Create a database named **unify_labs**.
* Create a collection named **interns**.
* Insert sample documents containing required fields.
* Validate data using MongoDB Shell.

---

## Environment Details

* Operating System: Windows
* MongoDB Version: 8.2.5
* MongoDB Shell (mongosh) Version: 2.7.0
* Connection Type: Localhost (127.0.0.1:27017)

---

## Installation Steps

### 1. MongoDB Community Server Installation

The MongoDB Community Server was downloaded using the official Windows MSI installer. During installation, the complete setup option was selected and MongoDB was configured to run as a Windows service using default settings, including the default port 27017.

### 2. MongoDB Compass Installation

MongoDB Compass was installed to provide a graphical interface for managing databases, creating collections, and inserting documents visually.

### 3. MongoDB Shell Installation

MongoDB Shell (mongosh) was installed separately and verified using the command:

```
mongosh --version
```

Successful output confirmed proper installation.

---

## Connection Setup

MongoDB Compass was used to connect to the local MongoDB server using the connection string:

```
mongodb://localhost:27017
```

Successful connection confirmed that the MongoDB service was running and accessible.

---

## Database Creation

A new database named **unify_labs** was created using MongoDB Compass. During this process, a collection named **interns** was created as part of the database initialization.

---

## Collection Structure

Collection Name: interns

Fields used in documents:

* name (String): Name of the intern.
* role (String): Internship role.
* joinedDate (Date): Date the intern joined.

---

## Sample Documents Inserted

Three documents were inserted via MongoDB Compass GUI to simulate real-world intern records. Each document contained the required fields and used proper date formatting to ensure accurate storage.

---

## Verification Using MongoDB Shell

The following commands were used to verify database creation and data insertion:

```
mongosh
show dbs
use unify_labs
db.interns.find()
```

The output confirmed that:

* The database exists.
* The collection exists.
* Three documents were successfully stored.

---

## Key Learnings

* Understanding the difference between relational databases and NoSQL document databases.
* Installing and configuring MongoDB locally.
* Using MongoDB Compass for visual database operations.
* Working with MongoDB Shell commands.
* Creating databases and collections.
* Inserting and querying JSON-like documents.
* Understanding ObjectId and ISODate data types.
* Verifying database connectivity and operations.

---

## Challenges Encountered

During setup, the MongoDB Shell was not initially recognized in the terminal due to PATH configuration. Installing mongosh and restarting the terminal resolved the issue. This reinforced the importance of environment configuration during software setup.

---

## Outcome

The local MongoDB environment was successfully established, and all project requirements were completed. The database and collection were created correctly, documents were inserted using the GUI, and verification was performed through the shell, confirming successful execution of all tasks.

---

## Conclusion

This task provided practical exposure to setting up a NoSQL database environment and performing foundational operations. The experience strengthened understanding of MongoDB tools, local server configuration, and document-based data management, forming a solid base for more advanced database concepts and real-world application development.

---

## Author

Akhil Kandrakoti

## Project

NoSQL Foundation — MongoDB Environment Setup
