require('dotenv').config();
const jwt = require('jsonwebtoken');

const validateRegister = (req, res, next) => {
    const { username, email, password } = req.body;

    // Validasi username
    if (!username || username.length < 3) {
        return res.status(400).json({
            error: 'Username minimal 3 karakter'
        });
    }

    // Validasi email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
            error: 'Format email tidak valid'
        });
    }

    // Validasi password
    if (!password || password.length < 8) {
        return res.status(400).json({
            error: 'Password minimal 8 karakter'
        });
    }
    
    next();
};

const validateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Token tidak ada'
        });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({
                error: 'Token tidak valid'
            });
        }
        req.user = user;
        next();
    })
};

module.exports = { validateRegister, validateToken };