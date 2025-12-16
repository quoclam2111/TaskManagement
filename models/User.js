const db = require('../configs/database');

class User {
  // Tìm user theo ID
  static async findById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT id, username, fullname, email FROM user WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm user theo username (dùng cho login)
  static async findByUsername(username) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM user WHERE username = ?',
        [username]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm user theo email
  static async findByEmail(email) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM user WHERE email = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Tạo user mới
  static async create(userData) {
    try {
      const { username, fullname, password, email } = userData;
      const [result] = await db.execute(
        'INSERT INTO user (username, fullname, password, email) VALUES (?, ?, ?, ?)',
        [username, fullname, password, email]
      );
      
      // Lấy ID vừa tạo
      const [newUser] = await db.execute(
        'SELECT id, username, fullname, email FROM user WHERE id = LAST_INSERT_ID()'
      );
      return newUser[0];
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thông tin user
  static async update(id, userData) {
    try {
      const fields = [];
      const values = [];
      
      if (userData.fullname) {
        fields.push('fullname = ?');
        values.push(userData.fullname);
      }
      if (userData.email) {
        fields.push('email = ?');
        values.push(userData.email);
      }
      if (userData.password) {
        fields.push('password = ?');
        values.push(userData.password);
      }
      
      if (fields.length === 0) {
        return false;
      }
      
      values.push(id);
      
      const [result] = await db.execute(
        `UPDATE user SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa user
  static async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM user WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

// models/User.js - Fixed findAll() method

// Lấy tất cả users (dùng cho admin hoặc tìm kiếm)
static async findAll(limit = 50, offset = 0) {
  try {
    // ✅ FIX: Dùng query() thay vì execute() cho LIMIT/OFFSET
    // Vì mysql2 có issue với placeholders cho LIMIT/OFFSET trong execute()
    const parsedLimit = parseInt(limit) || 50;
    const parsedOffset = parseInt(offset) || 0;
    
    const [rows] = await db.query(
      `SELECT id, username, fullname, email FROM user LIMIT ${parsedLimit} OFFSET ${parsedOffset}`
    );
    return rows;
  } catch (error) {
    throw error;
  }
}


  // Tìm kiếm user theo tên hoặc email
  static async search(keyword) {
    try {
      const searchTerm = `%${keyword}%`;
      const [rows] = await db.execute(
        'SELECT id, username, fullname, email FROM user WHERE username LIKE ? OR fullname LIKE ? OR email LIKE ? LIMIT 20',
        [searchTerm, searchTerm, searchTerm]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;