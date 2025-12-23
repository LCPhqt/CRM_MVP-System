// Authentication Controller (In-Memory Version - No Database Required)

// Temporary in-memory storage for users
let users = [
    {
        id: 1,
        fullName: 'Admin User',
        email: 'admin@crm.com',
        phone: '0901234567',
        company: 'CRM Company',
        password: 'admin123',
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        agreedToTerms: true
    }
];

// Helper function to generate simple token
const generateToken = (userId) => {
    // Simple token: base64 encode of userId and timestamp
    const tokenData = JSON.stringify({
        userId,
        timestamp: Date.now(),
        expiresIn: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    });
    return Buffer.from(tokenData).toString('base64');
};

// @desc    Đăng ký tài khoản mới
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { fullName, email, phone, company, password, agreedToTerms } = req.body;

        // Validate required fields
        if (!fullName || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        // Validate phone format
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Kiểm tra email đã tồn tại
        const userExists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
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

        // Tạo user mới
        const newUser = {
            id: users.length + 1,
            fullName,
            email: email.toLowerCase(),
            phone,
            company: company || null,
            password, // In production, this should be hashed!
            role: 'sales',
            isActive: true,
            agreedToTerms: true,
            createdAt: new Date(),
            lastLogin: null
        };

        users.push(newUser);

        // Tạo token
        const token = generateToken(newUser.id);

        // Return user data without password
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công',
            data: {
                ...userWithoutPassword,
                token
            }
        });

        console.log(`✅ New user registered: ${email}`);
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.'
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

        // Tìm user
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Kiểm tra password (plain text comparison - in production use bcrypt!)
        if (user.password !== password) {
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
            ipAddress: req.ip || req.connection?.remoteAddress || 'unknown'
        };

        // Tạo token
        const token = generateToken(user.id);

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                ...userWithoutPassword,
                token,
                rememberMe
            }
        });

        console.log(`✅ User logged in: ${email}`);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại.'
        });
    }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private (but simplified for this demo)
exports.getCurrentUser = async (req, res) => {
    try {
        // Simple token verification
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        // Decode token
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
        const user = users.find(u => u.id === tokenData.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        // Return user data without password
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            success: true,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra'
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

// Helper function to get all users (for debugging)
exports.getAllUsers = (req, res) => {
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.status(200).json({
        success: true,
        count: users.length,
        data: usersWithoutPasswords
    });
};

module.exports = exports;
