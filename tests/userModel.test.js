// tests/userModel.test.js  
const UserModel = require('../src/models/userModel');  
const mysql = require('mysql2/promise');  
require('dotenv').config();  

describe('UserModel Tests', () => {  
    let testDb;  

    // Setup - Dijalankan sebelum semua test  
    beforeAll(async () => {  
        // Buat koneksi database test  
        testDb = await mysql.createConnection({  
            host: process.env.DB_HOST,  
            user: process.env.DB_USER,  
            password: process.env.DB_PASSWORD,  
            database: process.env.DB_NAME_TEST, // Gunakan database test yang berbeda  
            port: process.env.PORT 
        });  

        // Setup tabel untuk testing  
        await testDb.execute(`  
        CREATE TABLE IF NOT EXISTS users (
            id int NOT NULL AUTO_INCREMENT,
            username varchar(50) NOT NULL,
            email varchar(100) NOT NULL,
            password_hash varchar(255) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY username (username),
            UNIQUE KEY email (email)
          )
        `);  

        await testDb.execute(`  
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id int NOT NULL AUTO_INCREMENT,
            username varchar(255) NOT NULL,
            token text NOT NULL,
            expiry datetime NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
          ) 
        `);  
    });  

    // Cleanup - Dijalankan setelah setiap test  
    afterEach(async () => {  
        // Bersihkan data test  
        await testDb.execute('DELETE FROM refresh_tokens');  
        await testDb.execute('DELETE FROM users');  
    });  

    // Cleanup - Dijalankan setelah semua test selesai  
    afterAll(async () => {  
        await testDb.end();  
    });  

    // Test Cases  
    describe('User Management', () => {  
        test('findByUsername should return null for non-existent user', async () => {  
            const user = await UserModel.findByUsername('nonexistent');  
            expect(user).toBeNull();  
        });  

        test('findByUsername should return user data for existing user', async () => {  
            // Insert test user  
            await testDb.execute(  
                'INSERT INTO users (username, password) VALUES (?, ?)',  
                ['testuser', 'hashedpassword']  
            );  

            const user = await UserModel.findByUsername('testuser');  
            expect(user).toBeDefined();  
            expect(user.username).toBe('testuser');  
        });  
    });  

    describe('Refresh Token Management', () => {  
        test('saveRefreshToken should store token in database', async () => {  
            // Insert test user first  
            const [userResult] = await testDb.execute(  
                'INSERT INTO users (username, password) VALUES (?, ?)',  
                ['testuser', 'hashedpassword']  
            );  
            const userId = userResult.insertId;  

            // Test saving refresh token  
            const testToken = 'test_refresh_token';  
            const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds  

            await UserModel.saveRefreshToken(userId, testToken, expiresIn);  

            // Verify token was saved  
            const [tokens] = await testDb.execute(  
                'SELECT * FROM refresh_tokens WHERE user_id = ? AND token = ?',  
                [userId, testToken]  
            );  

            expect(tokens.length).toBe(1);  
            expect(tokens[0].token).toBe(testToken);  
        });  

        test('validateRefreshToken should return token data for valid token', async () => {  
            // Insert test user and token  
            const [userResult] = await testDb.execute(  
                'INSERT INTO users (username, password) VALUES (?, ?)',  
                ['testuser', 'hashedpassword']  
            );  
            const userId = userResult.insertId;  

            const testToken = 'valid_refresh_token';  
            const futureDate = new Date();  
            futureDate.setDate(futureDate.getDate() + 7);  

            await testDb.execute(  
                'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',  
                [userId, testToken, futureDate]  
            );  

            const result = await UserModel.validateRefreshToken(testToken);  
            expect(result).toBeDefined();  
            expect(result.token).toBe(testToken);  
        });  

        test('deleteRefreshToken should remove token from database', async () => {  
            // Setup: Insert test user and token  
            const [userResult] = await testDb.execute(  
                'INSERT INTO users (username, password) VALUES (?, ?)',  
                ['testuser', 'hashedpassword']  
            );  
            const userId = userResult.insertId;  

            const testToken = 'token_to_delete';  
            const futureDate = new Date();  
            futureDate.setDate(futureDate.getDate() + 7);  

            await testDb.execute(  
                'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',  
                [userId, testToken, futureDate]  
            );  

            // Test deletion  
            await UserModel.deleteRefreshToken(testToken);  

            // Verify token was deleted  
            const [tokens] = await testDb.execute(  
                'SELECT * FROM refresh_tokens WHERE token = ?',  
                [testToken]  
            );  

            expect(tokens.length).toBe(0);  
        });  
    });  
});