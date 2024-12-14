// Import dependencies
const express = require("express");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config(); // Load .env file

// Create an Express app
const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.static(path.join(__dirname, "public"))); // Serve static files (HTML, CSS, JS)

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.stack);
        return;
    }
    console.log("Connected to the MySQL database.");
});

// Register endpoint
app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert user into the database
        const query = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
        db.execute(query, [username, email, passwordHash], (err, results) => {
            if (err) {
                console.error("Error inserting user:", err);
                return res.status(500).json({ message: "Database error" });
            }
            res.status(201).json({ message: "User registered successfully!" });
        });
    } catch (err) {
        console.error("Error hashing password:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Login endpoint
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Check user in database
    const query = "SELECT * FROM users WHERE username = ?";
    db.execute(query, [username], async (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: "Database error" });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = results[0];

        // Compare password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Buat JWT
        const accessToken = jwt.sign({ username: user.username }, process.env.SECRET_KEY, {
            expiresIn: "15m", // accessToken berlaku selama 15 menit
        });
        const refreshToken = jwt.sign({ username: user.username }, process.env.REFRESH_SECRET_KEY, {
            expiresIn: "7d", // refreshToken berlaku selama 7 hari
        });

        // Simpan refresh token ke database
        const saveQuery = "INSERT INTO refresh_tokens (username, token, expiry) VALUES (?, ?, ?)";
        db.execute(saveQuery, [user.username, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)], (err) => {
            if (err) return res.status(500).json({ message: "Failed to save refresh token" });
            res.status(200).json({ accessToken, refreshToken });
        });

    });
});

// Endpoint logout untuk hapus token 
app.post("/logout", (req, res) => {

})


// Middleware untuk memverifikasi JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired access token." });
        }
        req.user = user; // Simpan data user dari token
        next();
    });
};

// Endpoint untuk refresh token
app.post("/refresh", (req, res) => {
    const { token } = req.body;

    if (!token) return res.status(401).json({ message: "Refresh token is required" });

    // Cek refresh token di database
    const query = "SELECT * FROM refresh_tokens WHERE token = ?";
    db.execute(query, [token], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });

        if (results.length === 0) return res.status(403).json({ message: "Invalid refresh token" });

        const storedToken = results[0];

        // Verifikasi refresh token
        jwt.verify(token, process.env.REFRESH_SECRET_KEY, (err, user) => {
            if (err) return res.status(403).json({ message: "Expired refresh token" });

            // Buat access token baru
            const accessToken = jwt.sign({ username: user.username }, process.env.SECRET_KEY, {
                expiresIn: "15m",
            });

            res.status(200).json({ accessToken });
        });
    });
});

// Endpoint: Protected Resource
app.get("/protected", authenticateToken, (req, res) => {
    res.status(200).json({ message: `Hello, ${req.user.username}. This is a protected route!` });
});

// Endpoint untuk profile.html
app.get("/profile", authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, "private", "profile.html"));
});

// Endpoint untuk API username di profile
app.get("/api/user", authenticateToken, (req, res) => {
    res.json({ username: req.user.username });
});


// Open port
const PORT = process.env.PORT || 3000;
// console.log('DB_HOST:', process.env.DB_HOST);  
// console.log('DB_USER:', process.env.DB_USER);  
// console.log('DB_PASSWORD:', process.env.DB_PASSWORD);  
// console.log('DB_NAME:', process.env.DB_NAME);  
// console.log('DB_PORT:', process.env.DB_PORT);
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
