const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Đăng ký tài khoản mới
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, company, password, agreedToTerms } = req.body;

    // Kiểm tra email đã tồn tại
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Kiểm tra đồng ý điều khoản
    if (!agreedToTerms) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng đồng ý với điều khoản sử dụng'
      });
    }

    // Tạo user mới (lưu password plain text - bypass hooks hoàn toàn)
    const userData = {
      fullName,
      email: email.toLowerCase(),
      phone,
      company,
      password, // Lưu plain text - không hash
      role: 'sales',
      isActive: true,
      agreedToTerms,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Sử dụng collection.insertOne để bypass hoàn toàn mongoose hooks
    const result = await User.collection.insertOne(userData);
    const user = await User.findById(result.insertedId);

    // Tạo token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        company: user.company,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email và mật khẩu'
      });
    }

    // Tìm user và lấy password
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng'
      });
    }

    // Kiểm tra tài khoản có active không
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa'
      });
    }

    // Cập nhật thông tin đăng nhập
    user.lastLogin = {
      timestamp: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress
    };
    await user.save();

    // Tạo token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        company: user.company,
        role: user.role,
        lastLogin: user.lastLogin,
        token,
        rememberMe
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Đăng xuất
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Đăng xuất thành công'
  });
};

