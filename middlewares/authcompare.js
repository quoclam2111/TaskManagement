const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!authHeader || !token) {
      const err = new Error();
      err.statusCode = 401;
      err.msg = 'Token không được cung cấp';
      return next(err);
    }

    // ⚠️ Verify token trả về object {valid, decoded} hoặc {valid, error}
    const result = verifyToken(token);
    
    if (!result.valid) {
      const err = new Error(result.error?.message || 'Invalid token');
      err.statusCode = 401;
      err.msg = 'Token không hợp lệ hoặc đã hết hạn';
      return next(err);
    }

    const decoded = result.decoded;
    
    // ⚠️ Kiểm tra user có tồn tại không (userId giờ là UUID string)
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      const err = new Error();
      err.statusCode = 401;
      err.msg = 'User không tồn tại';
      return next(err);
    }

    // ⚠️ Set req.user với UUID
    req.user = {
      id: user.id, // UUID string
      username: user.username,
      email: user.email
    };
    
    // Backward compatibility
    req.userId = user.id;
    req.username = user.username;
    
    next();
  } catch (error) {
    error.statusCode = 401;
    error.msg = 'Xác thực thất bại';
    next(error);
  }
};

module.exports = authMiddleware;