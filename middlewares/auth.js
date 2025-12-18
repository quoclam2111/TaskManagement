const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const err = new Error();
            err.statusCode = 401;
            err.msg = 'Vui lòng đăng nhập để tiếp tục';
            return next(err);
        }

        const token = authHeader.split(' ')[1];
        const result = verifyToken(token);

        if (!result.valid) {
            let message = 'Token không hợp lệ';
            if (result.error?.includes('expired')) {
                message = 'Phiên đăng nhập đã hết hạn';
            }

            const err = new Error();
            err.statusCode = 401;
            err.msg = message;
            return next(err);
        }

        req.userId = result.decoded.userId;
        req.username = result.decoded.username;
        req.user = result.decoded;
        
        next();
    } catch (error) {
        error.statusCode = 500;
        error.msg = 'Lỗi xác thực';
        next(error);
    }
};

// Middleware kiểm tra optional auth (không bắt buộc đăng nhập)
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const result = verifyToken(token);
            
            if (result.valid) {
                req.userId = result.decoded.userId;
                req.username = result.decoded.username;
                req.user = result.decoded;
            }
        }
        
        next();
    } catch (error) {
        next();
    }
};

module.exports = { authMiddleware, optionalAuth };