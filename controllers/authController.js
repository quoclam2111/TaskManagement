const db = require('../configs/database');
const { hashPassword, comparePassword } = require('../utils/hashing');
const { generateToken } = require('../utils/jwt');
const {
    validateEmail,
    validatePassword,
    validateUsername,
    validateFullname
} = require('../utils/validator');

exports.register = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { username, fullname, email, password } = req.body;

        // Validation
        if (!username || !fullname || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            return res.status(400).json({
                success: false,
                message: usernameValidation.message
            });
        }

        const fullnameValidation = validateFullname(fullname);
        if (!fullnameValidation.valid) {
            return res.status(400).json({
                success: false,
                message: fullnameValidation.message
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message
            });
        }

        // Kiểm tra user đã tồn tại
        const [existingUsers] = await connection.query(
            'SELECT id FROM user WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username hoặc email đã được sử dụng'
            });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // ⚠️ QUAN TRỌNG: Với UUID, không cần chỉ định id, MySQL tự generate
        const [result] = await connection.query(
            'INSERT INTO user (username, fullname, email, password) VALUES (?, ?, ?, ?)',
            [username, fullname.trim(), email.toLowerCase(), hashedPassword]
        );

        console.log('Insert result:', result);

        // ⚠️ Với UUID, insertId không hoạt động, phải query bằng username
        const [newUsers] = await connection.query(
            'SELECT id, username, fullname, email FROM user WHERE username = ?',
            [username]
        );

        if (!newUsers || newUsers.length === 0) {
            throw new Error('Không thể lấy thông tin người dùng sau khi tạo');
        }

        const user = newUsers[0];

        // Tạo JWT token - userId giờ là UUID string
        const token = generateToken({
            userId: user.id, // UUID string
            username: user.username,
            email: user.email
        });

        res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công',
            data: {
                token,
                user: user
            }
        });

    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, vui lòng thử lại sau',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

exports.login = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập username và mật khẩu'
            });
        }

        // Tìm user
        const [users] = await connection.query(
            'SELECT * FROM user WHERE username = ? OR email = ?',
            [username, username.toLowerCase()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không đúng'
            });
        }

        const user = users[0];

        // So sánh mật khẩu
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không đúng'
            });
        }

        // Tạo JWT token
        const token = generateToken({
            userId: user.id, // UUID string
            username: user.username,
            email: user.email
        }, '7d');

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    fullname: user.fullname,
                    email: user.email
                }
            }
        });

    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, vui lòng thử lại sau',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
};

exports.getMe = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const [users] = await connection.query(
            'SELECT id, username, fullname, email FROM user WHERE id = ?',
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        res.json({
            success: true,
            data: {
                user: users[0]
            }
        });

    } catch (error) {
        console.error('Lỗi lấy thông tin user:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi'
        });
    } finally {
        connection.release();
    }
};

exports.updateProfile = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { fullname, email } = req.body;
        const userId = req.userId;

        const updates = [];
        const params = [];

        if (fullname) {
            const validation = validateFullname(fullname);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    message: validation.message
                });
            }
            updates.push('fullname = ?');
            params.push(fullname.trim());
        }

        if (email) {
            if (!validateEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Email không hợp lệ'
                });
            }

            const [existingUsers] = await connection.query(
                'SELECT id FROM user WHERE email = ? AND id != ?',
                [email.toLowerCase(), userId]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email đã được sử dụng'
                });
            }

            updates.push('email = ?');
            params.push(email.toLowerCase());
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có dữ liệu để cập nhật'
            });
        }

        params.push(userId);

        await connection.query(
            `UPDATE user SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const [updatedUser] = await connection.query(
            'SELECT id, username, fullname, email FROM user WHERE id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: {
                user: updatedUser[0]
            }
        });

    } catch (error) {
        console.error('Lỗi cập nhật profile:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi'
        });
    } finally {
        connection.release();
    }
};

exports.changePassword = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: validation.message
            });
        }

        const [users] = await connection.query(
            'SELECT password FROM user WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const isPasswordValid = await comparePassword(currentPassword, users[0].password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        const hashedPassword = await hashPassword(newPassword);

        await connection.query(
            'UPDATE user SET password = ? WHERE id = ?',
            [hashedPassword, userId]
        );

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });

    } catch (error) {
        console.error('Lỗi đổi mật khẩu:', error);
        res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi'
        });
    } finally {
        connection.release();
    }
};

exports.logout = (req, res) => {
    res.json({
        success: true,
        message: 'Đăng xuất thành công'
    });
};