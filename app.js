// Import dependencies
const express = require("express");
// const mysql = require("mysql2");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
const path = require("path");
const cookieParser = require('cookie-parser');
require("dotenv").config();

const app = express();
const PORT = process.env.port || 3000;

// Import routes
const authRoutes = require('./src/routes/authRoute');

// Middleware untuk parsing json
app.use(express.json());
app.use(cookieParser());

// Gunakan routes
app.use('/api/auth', authRoutes);


// Serve static file
app.use(express.static(path.join(__dirname, 'public')));

// Star
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});