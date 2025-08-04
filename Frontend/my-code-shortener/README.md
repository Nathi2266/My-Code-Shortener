# Frontend README

## Table of Contents
- [Introduction](#introduction)
- [Technologies Used](#technologies-used)
- [Setup and Installation](#setup-and-installation)
- [Project Structure](#project-structure)
- [Key Features](#key-features)

## Introduction
This directory contains the frontend application for My-Code-Shortener, built with React.js. It provides a user-friendly interface for interacting with the backend services, allowing users to shorten code, view analytics, manage profiles, and access documentation.

## Technologies Used
- **React.js**: A JavaScript library for building user interfaces.
- **React Router**: For declarative routing within the single-page application.
- **React Context API**: For efficient state management across components (e.g., authentication state).
- **Material-UI (MUI)**: A popular React UI framework for fast and easy web development, providing a set of pre-built, customizable UI components. (Inferred from `theme.js` and `Layout.jsx`)
- **Axios**: A promise-based HTTP client for the browser and node.js, used for making API requests to the backend.
- **Vite (or Create React App)**: For fast development and optimized builds. (Commonly used with React projects, assuming one of these)

## Setup and Installation

1.  **Navigate to the Frontend application directory:**
    ```bash
    cd Frontend/my-code-shortner
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Start the development server:**
    ```bash
    npm start
    # or
    yarn start
    ```
    The frontend application will typically open in your browser at `http://localhost:3000`.

## Project Structure

```
my-code-shortner/
├── public/                 # Static assets (e.g., index.html, manifest.json)
├── src/
│   ├── App.js              # Main application component, often containing global layout or routing.
│   ├── components/         # Reusable UI components (e.g., buttons, forms, layout components).
│   │   └── Layout.jsx
│   ├── context/            # React Context providers for global state management.
│   │   └── AuthContext.jsx # Manages user authentication state and related functions.
│   ├── index.js            # Entry point for the React application, renders the root component.
│   ├── pages/              # Top-level components representing different views or pages of the application.
│   │   ├── Analysis.jsx    # Page for displaying code analysis and statistics.
│   │   ├── Docs.jsx        # Page for documentation or API guides.
│   │   ├── Home.jsx        # The main landing page.
│   │   ├── Login.jsx       # User login page.
│   │   ├── Profile.jsx     # User profile management page.
│   │   ├── Register.jsx    # User registration page.
│   │   └── Sessions.jsx    # Page for managing user sessions or viewing session history.
│   ├── routes/             # Defines the application's routing logic.
│   │   └── Routes.jsx      # Centralized route definitions using React Router.
│   └── theme.js            # Configuration for UI theme, colors, and typography (e.g., Material-UI theme).
├── package.json            # Project metadata and dependencies for the frontend.
├── package-lock.json       # Records the exact versions of dependencies.
└── README.md               # This README file.
```

## Key Features

-   **Responsive Layout:** Utilizes `Layout.jsx` and potentially Material-UI for a consistent and responsive user interface across devices.
-   **Authentication Flow:** Manages user login, registration, and session persistence via `AuthContext.jsx` and integration with backend authentication endpoints.
-   **Dynamic Routing:** Handles navigation between different application pages (`Home`, `Login`, `Profile`, `Analysis`, `Docs`, `Sessions`, `Register`) using `Routes.jsx`.
-   **Code Shortening Interface:** Provides a user interface to input code, select compression options, and display shortened results.
-   **Code Analysis & Visualization:** (Assumed based on `Analysis.jsx`) Presents statistics and insights about original and shortened code.
-   **User Profile Management:** Allows users to view and update their profile information.
-   **Theming:** Centralized theme management via `theme.js` for consistent styling.
