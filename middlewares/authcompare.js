const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!authHeader || !token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token không được cung cấp' 
      });
    }

    // ⚠️ Verify token trả về object {valid, decoded} hoặc {valid, error}
    const result = verifyToken(token);
    
    if (!result.valid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token không hợp lệ hoặc đã hết hạn',
        error: result.error?.message || 'Invalid token'
      });
    }

    const decoded = result.decoded;
    
    // ⚠️ Kiểm tra user có tồn tại không (userId giờ là UUID string)
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User không tồn tại' 
      });
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
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Xác thực thất bại',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = authMiddleware;