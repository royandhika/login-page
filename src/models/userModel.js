const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {

    // Cek apakah username exist
    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = ?';
        const [users] = await db.executeQuery(query, [username]);
        return users; // [0] karena hanya butuh 1 result
    }

    // Cek apakah email exists
    static async findByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [users] = await db.executeQuery(query, [email]);
        return users;
    }

    // Buat user baru
    static async create(userData) {
        const { username, email, password } = userData;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO users
            (username, email, password_hash)
            VALUES (?, ?, ?)
        `;

        const result = await db.executeQuery(query, [
            username,
            email,
            hashedPassword
        ]);

        return result.insertId;
    }

    // Verify password
    static async verifyPassword(inputPassword, savedPassword) {
        return bcrypt.compare(inputPassword, savedPassword);
    }

    // Write token
    static async writeRefreshToken(username, refreshToken, expired) {
        // State expired time dari req ke microsecond
        const expiredTime = new Date(Date.now() + expired);
        const query = `
            INSERT INTO refresh_tokens
            (username, token, expiry)
            VALUES (?, ?, ?)
        `;

        // Write ke database
        const result = await db.executeQuery(query, [
            username,
            refreshToken,
            expiredTime
        ]);

        return result.insertId;
    }

    // Verify token
    static async validateRefreshToken(refreshToken) {
        const query = `
            SELECT rt.*, u.username
            FROM refresh_tokens rt
            LEFT JOIN users u
                ON rt.username = u.username
            WHERE rt.token = ?
                AND rt.expiry > NOW()
        `
        const [result] = await db.executeQuery(query, [refreshToken]);

        return result;
    }

    // Delete token
    static async deleteRefreshToken(refreshToken) {  
        const query = 'DELETE FROM refresh_tokens WHERE token = ?'
        await db.executeQuery(query, [refreshToken]);  
    }  
    static async deleteAllUserRefreshTokens(username) {  
        const query = 'DELETE FROM refresh_tokens WHERE username = ?'
        await db.executeQuery(query, [username]);  
    }

}

module.exports = UserModel;