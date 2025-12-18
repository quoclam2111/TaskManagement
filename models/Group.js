const db = require('../configs/database');

class Group {
  // ✅ FIXED: Tạo group mới - MySQL tự động tạo UUID
  static async create(groupData) {
    try {
      const { groupName, truongnhom } = groupData;
      
      console.log('🔧 Creating group:', { groupName, truongnhom });
      
      // ✅ Không cần truyền groupID, MySQL tự động tạo với DEFAULT (UUID())
      const [result] = await db.execute(
        'INSERT INTO `group` (groupName, truongnhom) VALUES (?, ?)',
        [groupName, truongnhom]
      );
      
      console.log('📊 Insert result:', result);
      
      // ✅ CRITICAL: Kiểm tra insert có thành công không
      if (result.affectedRows === 0) {
        console.error('❌ No rows inserted');
        return null;
      }
      
      // ✅ QUAN TRỌNG: Lấy group vừa tạo bằng groupName và truongnhom
      // Vì UUID được tạo tự động, ta không biết trước giá trị
      // Cách an toàn nhất: query bằng groupName + truongnhom + ORDER BY (lấy cái mới nhất)
      const [newGroup] = await db.execute(
        `SELECT * FROM \`group\` 
         WHERE groupName = ? AND truongnhom = ? 
         ORDER BY groupID DESC 
         LIMIT 1`,
        [groupName, truongnhom]
      );
      
      if (!newGroup || newGroup.length === 0) {
        console.error('❌ Failed to retrieve newly created group');
        return null;
      }
      
      console.log('✅ New group created:', newGroup[0]);
      
      return newGroup[0];
    } catch (error) {
      console.error('❌ Error in Group.create:', error);
      throw error;
    }
  }

  // Tìm group theo ID
  static async findById(groupID) {
    try {
      const [rows] = await db.execute(
        `SELECT g.*, u.username as truongnhom_name, u.fullname as truongnhom_fullname
         FROM \`group\` g
         LEFT JOIN user u ON g.truongnhom = u.id
         WHERE g.groupID = ?`,
        [groupID]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả groups mà user là trưởng nhóm
  static async findByLeader(userId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM `group` WHERE truongnhom = ?',
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả groups mà user là thành viên
  static async findByMember(userId) {
    try {
      const [rows] = await db.execute(
        `SELECT g.*, u.username as truongnhom_name, u.fullname as truongnhom_fullname
         FROM \`group\` g
         INNER JOIN groupmember gm ON g.groupID = gm.groupID
         LEFT JOIN user u ON g.truongnhom = u.id
         WHERE gm.userID = ?`,
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật thông tin group
  static async update(groupID, groupData) {
    try {
      const fields = [];
      const values = [];
      
      if (groupData.groupName) {
        fields.push('groupName = ?');
        values.push(groupData.groupName);
      }
      if (groupData.truongnhom) {
        fields.push('truongnhom = ?');
        values.push(groupData.truongnhom);
      }
      
      if (fields.length === 0) {
        return false;
      }
      
      values.push(groupID);
      
      const [result] = await db.execute(
        `UPDATE \`group\` SET ${fields.join(', ')} WHERE groupID = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa group
  static async delete(groupID) {
    try {
      const [result] = await db.execute(
        'DELETE FROM `group` WHERE groupID = ?',
        [groupID]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra user có phải là trưởng nhóm không
  static async isLeader(groupID, userId) {
    try {
      const [rows] = await db.execute(
        'SELECT truongnhom FROM `group` WHERE groupID = ?',
        [groupID]
      );
      return rows[0] && rows[0].truongnhom === userId;
    } catch (error) {
      throw error;
    }
  }

  // Lấy số lượng thành viên trong group
  static async getMemberCount(groupID) {
    try {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM groupmember WHERE groupID = ?',
        [groupID]
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả thành viên trong group
  static async getMembers(groupID) {
    try {
      const [rows] = await db.execute(
        `SELECT u.id, u.username, u.fullname, u.email
         FROM user u
         INNER JOIN groupmember gm ON u.id = gm.userID
         WHERE gm.groupID = ?`,
        [groupID]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Group;