# Persistent Settings Manager

## Overview

The Persistent Settings Manager is a modular web application designed to demonstrate how user preferences can be stored and restored using browser storage mechanisms. The application allows users to configure settings such as theme (Dark or Light mode) and language, and ensures these preferences persist across sessions.

This project highlights best practices in modern frontend development, including the use of ES6 modules, structured code organization, and JSON-based data persistence using localStorage.

---

## Objectives

The primary objectives of this project are:

- To implement persistent user settings using browser localStorage
- To demonstrate JSON serialization and deserialization for storing multiple settings
- To build a modular architecture using ES6 modules
- To create an interactive user interface with real-time updates
- To ensure user preferences are automatically restored on subsequent visits

---

## Features

- Persistent theme selection (Dark and Light mode)
- Language preference storage
- Automatic restoration of settings on page load
- Modular JavaScript architecture
- Clean and responsive user interface
- Reset to default settings functionality
- Cross-session persistence using localStorage
- Real-time UI updates when settings change

---

## Project Structure
persistent-settings-manager/
│
├── index.html # Main application entry point
├── styles.css # Styling and theme definitions
│
└── js/
├── main.js # Application controller and event handling
├── settings.js # Persistence logic (save/load settings)
├── ui.js # UI updates and theme application
└── i18n.js # Language configuration


---

## How It Works

### 1. Settings Storage

User preferences are stored in localStorage as a single JSON object. This ensures multiple settings can be managed together in a structured way.

Example stored object:

```json
{
  "theme": "dark",
  "language": "en"
}

The application uses:

JSON.stringify() to store data

JSON.parse() to retrieve data

2. Application Initialization

When the application loads:

Stored settings are retrieved from localStorage

Defaults are applied if no settings exist

Theme and language preferences are applied

UI elements are updated accordingly

3. Theme Toggle

When the user toggles the theme:

The UI updates immediately

The new preference is saved to localStorage

The selected theme persists across reloads

4. Language Selection

Changing language updates text dynamically and stores the preference for future sessions.

5. Reset Functionality

Users can reset preferences to default values, clearing stored settings.

Technologies Used

HTML5 for structure

CSS3 for styling and theme management

JavaScript (ES6 Modules) for logic

Browser localStorage API for persistence

JSON for structured data storage

Running the Project

Because ES6 modules require a local server, the project should not be opened directly via file explorer.

Using Python Server

Navigate to the project directory and run:

python -m http.server 5500

Then open:

http://localhost:5500
Using VS Code Live Server

Open the project in Visual Studio Code

Install Live Server extension

Right-click index.html

Select "Open with Live Server"

Key Concepts Demonstrated

Client-side persistence

State management in frontend applications

Modular JavaScript design

Separation of concerns

Progressive enhancement

Browser storage APIs

UI synchronization with stored data

Learning Outcomes

Through this project, the following skills were developed:

Understanding how web applications maintain state across sessions

Structuring scalable frontend projects

Working with ES6 import/export syntax

Debugging module loading issues

Implementing real-world user preference systems

Future Enhancements

Potential improvements include:

Adding system theme detection

Supporting additional preferences

Syncing settings across devices

Accessibility enhancements

Animations for smoother transitions

Backend storage integration

User account support

Preference export/import functionality

Conclusion

The Persistent Settings Manager demonstrates a practical approach to building user-centric web applications that remember user preferences. It showcases how modular design and browser storage can be combined to create a seamless and personalized user experience.

This project serves as a strong foundation for understanding state persistence and scalable frontend architecture.
