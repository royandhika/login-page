const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const UserModel = require('../models/userModel');

class AuthController {

    // Handle registrasi
    static async register(req, res) {
        try {
            const { username, email, password } = req.body;

            // Cek username exists
            const existingUsername = await UserModel.findByUsername(username);
            if (existingUsername) {
                return res.status(409).json({
                    error: 'Username sudah digunakan'
                });
            }

            // Cek email exists
            const existingEmail = await UserModel.findByEmail(email);
            if (existingEmail) {
                return res.status(409).json({
                    error: 'Email sudah digunakan'
                });
            }

            // Buat user baru
            const userId = await UserModel.create({
                username,
                email,
                password
            });

            // Respond berhasil
            res.status(201).json({
                message: 'Registrasi berhasil',
                userId
            });

        } catch (error) {
            console.error('Registrasi error:', error);
            res.status(500).json({
                error: 'Terjadi kesalahan saat registrasi'
            });
        }
    }


    // Handle login
    static async login(req, res) {
        try {
            const { username, password } = req.body;

            // Cek username exists
            const user = await UserModel.findByUsername(username);
            if (!user || !(await UserModel.verifyPassword(password, user.password_hash))) {
                return res.status(401).json({
                    error: 'Username atau password salah'
                });
            }

            // Kalau benar buat token
            const accessToken = jwt.sign(
                {id: user.id, username: user.username}, 
                process.env.SECRET_KEY,
                {expiresIn: "10m",} // Expired 10m di jwt
            ); 
            const refreshToken = jwt.sign(
                {id: user.id, username: user.username}, 
                process.env.REFRESH_SECRET_KEY,
                {expiresIn: "1h",} // Expired 1 jam di jwt
            ); 

            // Write refreshToken ke db
            await UserModel.writeRefreshToken(
                user.username,
                refreshToken,
                60 * 60 * 1000 // Expired 1 jam di db
            )

            // Feedback refreshToken ke HTTP only cookie
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                // secure: process.env.NODE_ENV === 'production',
                secure: true,
                sameSite: 'Strict',
                maxAge: 60 * 60 * 1000, // Expired 1 jam di cookie
            });

            // Feedback accessToken supaya disimpan di browser
            res.status(200).json({
                message: 'Login berhasil',
                accessToken,
                // refreshToken,
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                error: 'Terjadi kesalahan saat login'
            });
        }

    };


    // Handle refresh
    static async refresh(req, res) {
        try {
            // Ambil refreshToken dari cookie
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({
                    error: 'Refresh token tidak ada di cookie' 
                });
            }

            // Validasi refreshToken di database
            const tokenData = await UserModel.validateRefreshToken(refreshToken);
            if (!tokenData) {
                return res.status(403).json({
                    error: 'Refresh token tidak valid di db'
                });
            }

            // Verifikasi refreshToken dengan jwt
            const user = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

            // Feedback accessToken baru
            const accessToken = jwt.sign(
                {id: user.id, username: user.username}, 
                process.env.SECRET_KEY,
                {expiresIn: "10m",} // Expired 10m di jwt
            ); 

            return res.json({
                accessToken
            });

        } catch (error) {
            console.error('Refresh token error:', error);
            return res.status(403).json({
                error: 'Refresh token tidak valid'
            });
        }
    };


    // Handle logout
    static async logout(req, res) {
        try {
            const refreshToken = req.cookies.refreshToken;
            // Hapus refreshToken dari db
            if (refreshToken) {
                await UserModel.deleteRefreshToken(refreshToken);
            }

            // Hapus cookie
            res.clearCookie('refreshToken');

            return res.json({
                message: 'Log out berhasil dan refresh token dihapus'
            });
            
        } catch (error) {
            console.error('Log out error:', error) 
            res.status(500).json({
                error: 'internal error'
            });
        }
    }

}

module.exports = AuthController;