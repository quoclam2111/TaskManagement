const db = require('../configs/database');
const { hashPassword, comparePassword } = require('../utils/hashing');
const { generateToken } = require('../utils/jwt');
const {
    validateEmail,
    validatePassword,
    validateUsername,
    validateFullname
} = require('../utils/validator');

exports.register = async (req, res, next) => {
    const connection = await db.getConnection();
    
    try {
        const { username, fullname, email, password } = req.body;
        console.log('REGISTER BODY:', req.body);

        // Validation
        if (!username || !fullname || !email || !password) {
            const err =     new Error();
            err.statusCode = 400;
            err.msg = 'Vui lòng điền đầy đủ thông tin';
            return next(err);
        }

        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
            const err = new Error();
            err.statusCode = 400;
            err.msg = usernameValidation.message;
            return next(err);
        }

        const fullnameValidation = validateFullname(fullname);
        if (!fullnameValidation.valid) {
            const err = new Error();
            err.statusCode = 400;
            err.msg = fullnameValidation.message;
            return next(err);
        }

        if (!validateEmail(email)) {
            const err = new Error();
            err.statusCode = 400;
            err.msg = 'Email không hợp lệ';
            return next(err);
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            const err = new Error();
            err.statusCode = 400;
            err.msg = passwordValidation.message;
            return next(err);
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
        error.statusCode = error.statusCode || 500;
        error.msg = error.msg || 'Đã xảy ra lỗi, vui lòng thử lại sau';
        next(error);
    } finally {
        connection.release();
    }
};

exports.login = async (req, res, next) => {
    const connection = await db.getConnection();
    
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            const err = new Error('Vui lòng nhập username và mật khẩu');
            err.statusCode = 400;
            return next(err);
        }

        // Tìm user
        const [users] = await connection.query(
            'SELECT * FROM user WHERE username = ? OR email = ?',
            [username, username.toLowerCase()]
        );

        if (users.length === 0) {
            const err = new Error('Tên đăng nhập hoặc mật khẩu không đúng');
            err.statusCode = 401;
            return next(err);
        }

        const user = users[0];

        // So sánh mật khẩu
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            const err = new Error('Tên đăng nhập hoặc mật khẩu không đúng');
            err.statusCode = 401;
            return next(err);
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
        error.statusCode = error.statusCode || 500;
        error.msg = error.msg || 'Đã xảy ra lỗi, vui lòng thử lại sau';
        next(error);
    } finally {
        connection.release();
    }
};

exports.getMe = async (req, res, next) => {
    const connection = await db.getConnection();
    
    try {
        const [users] = await connection.query(
            'SELECT id, username, fullname, email FROM user WHERE id = ?',
            [req.userId]
        );

        if (users.length === 0) {
            const err = new Error('Không tìm thấy thông tin người dùng');
            err.statusCode = 404;
            return next(err);
        }

        res.json({
            success: true,
            data: {
                user: users[0]
            }
        });

    } catch (error) {
        error.statusCode = error.statusCode || 500;
        error.msg = error.msg || 'Đã xảy ra lỗi';
        next(error);
    } finally {
        connection.release();
    }
};

exports.updateProfile = async (req, res, next) => {
    const connection = await db.getConnection();
    
    try {
        const { fullname, email } = req.body;
        const userId = req.userId;

        const updates = [];
        const params = [];

        if (fullname) {
            const validation = validateFullname(fullname);
            if (!validation.valid) {
                const err = new Error(validation.message);
                err.statusCode = 400;
                return next(err);
            }
            updates.push('fullname = ?');
            params.push(fullname.trim());
        }

        if (email) {
            if (!validateEmail(email)) {
                const err = new Error('Email không hợp lệ');
                err.statusCode = 400;
                return next(err);
            }

            const [existingUsers] = await connection.query(
                'SELECT id FROM user WHERE email = ? AND id != ?',
                [email.toLowerCase(), userId]
            );

            if (existingUsers.length > 0) {
                const err = new Error('Email đã được sử dụng');
                err.statusCode = 400;
                return next(err);
            }

            updates.push('email = ?');
            params.push(email.toLowerCase());
        }

        if (updates.length === 0) {
              const err = new Error('Không có dữ liệu để cập nhật');
            err.statusCode = 400;
            return next(err);
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
          error.statusCode = error.statusCode || 500;
        error.msg = error.msg || 'Đã xảy ra lỗi';
        next(error);
    } finally {
        connection.release();
    }
};

exports.changePassword = async (req, res, next) => {
    const connection = await db.getConnection();
    
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId;

        if (!currentPassword || !newPassword) {
           const err = new Error('Vui lòng điền đầy đủ thông tin');
            err.statusCode = 400;
            return next(err);
        }

        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            const err = new Error(validation.message);
            err.statusCode = 400;
            return next(err);
        }

        const [users] = await connection.query(
            'SELECT password FROM user WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            const err = new Error('Không tìm thấy người dùng');
            err.statusCode = 404;
            return next(err);
        }

        const isPasswordValid = await comparePassword(currentPassword, users[0].password);

        if (!isPasswordValid) {
            const err = new Error('Mật khẩu hiện tại không đúng');
            err.statusCode = 401;
            return next(err);
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
        error.statusCode = error.statusCode || 500;
        error.msg = error.msg || 'Đã xảy ra lỗi';
        next(error);
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