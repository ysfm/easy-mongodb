# MongoDB Management Panel

![Screenshot](screenshots.gif)


This project is a small web application designed to manage MongoDB users and databases. The frontend is built with Vue.js.

## Installation and Startup

Follow these steps to run the application:

### 1. Install Dependencies

    npm install

### 2. Start the Web Server

    node server.js

These commands will compile the Vue.js files and start the web server.

## Important

Example connection URI: 'mongodb://username:password@hostname:27017/database?authSource=admin'

authSource=admin

This prefix must be used because all user operations are performed in the admin database.

## Features

With this application, you can:

- **Create databases**
- **Create users** (Set permissions for databases)
- **Edit user passwords and roles**
- **List users and databases**
- **Delete users**

## Technologies
- **Frontend:** Vue.js
- **Backend:** Node.js
- **Database:** MongoDB

## Contribution
If you would like to contribute to the project, please submit a **pull request** or open an **issue** for feedback.

## License
This project is licensed under the **GPLv3 License**.
