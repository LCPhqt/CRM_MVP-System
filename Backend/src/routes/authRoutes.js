// Authentication Routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register - Đăng ký tài khoản mới
router.post('/register', authController.register);

// POST /api/auth/login - Đăng nhập
router.post('/login', authController.login);

// GET /api/auth/me - Lấy thông tin user hiện tại (cần token)
router.get('/me', authController.getCurrentUser);

module.exports = router;

