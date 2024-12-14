const mysql = require('mysql2/promise');
require('dotenv').config();

// Config database
const dbConfig = {
    host: process.env.DB_HOST,  
    user: process.env.DB_USER,  
    password: process.env.DB_PASSWORD,  
    database: process.env.DB_NAME,  
    port: process.env.DB_PORT,  
    connectionLimit: 10, // Connection pooling  
    waitForConnections: true,  
    queueLimit: 0  
};

// Buat connection pool
const pool = mysql.createPool(dbConfig);

// Fungsi untuk buat koneksi
const getConnection = async() => {
    try {
        const connection = await pool.getConnection();
        return connection;
    } catch (error) {
        console.error('Database Connection Error:', error);
        throw error;
    }
};

// Fungsi untuk lempar query
const executeQuery = async(query, params = []) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(query, params);
        return result;
    } catch (error) {
        console.error('Query Execution Error:', error);
        throw error;
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    pool,
    getConnection,
    executeQuery
};