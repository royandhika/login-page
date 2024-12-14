const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { validateRegister, validateToken } = require('../middleware/validationMiddleware');

// Endpoint registrasi
router.post(
    '/register',
    validateRegister, // Middleware
    AuthController.register // Controller
);

// Endpoint login
router.post(
    '/login',
    AuthController.login // Controller
);

// Endpoint logout
router.post(
    '/logout',
    AuthController.logout // Controller
);

// Endpoint refresh
router.post(
    '/refresh',
    AuthController.refresh // Controller
);

// Endpoint protected
router.get(
    '/profile',
    validateToken, // Middleware
    (req, res) => {
        res.status(200).json({
            message: 'Verified', 
            username: req.user.username,
            detail: req.user
        })
    }
)

module.exports = router;