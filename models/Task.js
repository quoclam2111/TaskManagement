const db = require('../configs/database');

class Task {
  // Tạo task mới
  static async create(taskData) {
    try {
      const { taskname, description, status, priority, id, groupID } = taskData;
      const [result] = await db.execute(
        'INSERT INTO task (taskname, description, status, priority, id, groupID) VALUES (?, ?, ?, ?, ?, ?)',
        [taskname, description, status || 'Pending', priority, id, groupID]
      );
      
      // Lấy task vừa tạo
      const taskId = result.insertId;
      const [newTask] = await db.execute(
        'SELECT * FROM task WHERE taskid = ?',
        [taskId]
      );
      return newTask[0];
    } catch (error) {
      throw error;
    }
  }

  // Tìm task theo ID
  static async findById(taskid) {
    try {
      const [rows] = await db.execute(
        `SELECT t.*, u.username, u.fullname, g.groupName 
         FROM task t 
         LEFT JOIN user u ON t.id = u.id 
         LEFT JOIN \`group\` g ON t.groupID = g.groupID 
         WHERE t.taskid = ?`,
        [taskid]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Lấy tất cả tasks của một user
  static async findByUserId(userId) {
    try {
      const [rows] = await db.execute(
        `SELECT t.*, g.groupName 
         FROM task t 
         LEFT JOIN \`group\` g ON t.groupID = g.groupID 
         WHERE t.id = ? 
         ORDER BY t.priority DESC, t.taskid`,
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tasks theo groupID
  static async findByGroupId(groupId) {
    try {
      const [rows] = await db.execute(
        `SELECT t.*, u.username, u.fullname 
         FROM task t 
         LEFT JOIN user u ON t.id = u.id 
         WHERE t.groupID = ? 
         ORDER BY t.priority DESC, t.taskid`,
        [groupId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tasks theo status
  static async findByStatus(userId, status) {
    try {
      const [rows] = await db.execute(
        `SELECT t.*, g.groupName 
         FROM task t 
         LEFT JOIN \`group\` g ON t.groupID = g.groupID 
         WHERE t.id = ? AND t.status = ? 
         ORDER BY t.priority DESC, t.taskid`,
        [userId, status]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tasks theo priority
  static async findByPriority(userId, priority) {
    try {
      const [rows] = await db.execute(
        `SELECT t.*, g.groupName 
         FROM task t 
         LEFT JOIN \`group\` g ON t.groupID = g.groupID 
         WHERE t.id = ? AND t.priority = ? 
         ORDER BY t.taskid`,
        [userId, priority]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Cập nhật task
  static async update(taskid, taskData) {
    try {
      const fields = [];
      const values = [];
      
      if (taskData.taskname) {
        fields.push('taskname = ?');
        values.push(taskData.taskname);
      }
      if (taskData.description !== undefined) {
        fields.push('description = ?');
        values.push(taskData.description);
      }
      if (taskData.status) {
        fields.push('status = ?');
        values.push(taskData.status);
      }
      if (taskData.priority) {
        fields.push('priority = ?');
        values.push(taskData.priority);
      }
      
      if (fields.length === 0) {
        return false;
      }
      
      values.push(taskid);
      
      const [result] = await db.execute(
        `UPDATE task SET ${fields.join(', ')} WHERE taskid = ?`,
        values
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Xóa task
  static async delete(taskid) {
    try {
      const [result] = await db.execute('DELETE FROM task WHERE taskid = ?', [taskid]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra user có phải owner của task không
  static async checkOwnership(taskid, userId) {
    try {
      const [rows] = await db.execute(
        'SELECT id FROM task WHERE taskid = ?',
        [taskid]
      );
      return rows[0] && rows[0].id === userId;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra user có quyền truy cập task trong group không
  static async checkGroupAccess(taskid, userId) {
    try {
      const [rows] = await db.execute(
        `SELECT t.groupID, gm.userID, g.truongnhom 
         FROM task t 
         LEFT JOIN groupmember gm ON t.groupID = gm.groupID AND gm.userID = ?
         LEFT JOIN \`group\` g ON t.groupID = g.groupID
         WHERE t.taskid = ?`,
        [userId, taskid]
      );
      
      if (!rows[0]) return false;
      
      // Nếu task không thuộc group nào
      if (!rows[0].groupID) return false;
      
      // User có quyền nếu là thành viên nhóm hoặc là trưởng nhóm
      return rows[0].userID === userId || rows[0].truongnhom === userId;
    } catch (error) {
      throw error;
    }
  }

  // Đếm số task theo status của user
  static async countByStatus(userId) {
    try {
      const [rows] = await db.execute(
        `SELECT status, COUNT(*) as count 
         FROM task 
         WHERE id = ? 
         GROUP BY status`,
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Xóa tất cả tasks của một group (khi xóa group)
  static async deleteByGroupId(groupId) {
    try {
      const [result] = await db.execute(
        'DELETE FROM task WHERE groupID = ?',
        [groupId]
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Tìm kiếm task theo keyword
  static async search(userId, keyword) {
    try {
      const searchTerm = `%${keyword}%`;
      const [rows] = await db.execute(
        `SELECT t.*, g.groupName 
         FROM task t 
         LEFT JOIN \`group\` g ON t.groupID = g.groupID 
         WHERE t.id = ? AND (t.taskname LIKE ? OR t.description LIKE ?)
         ORDER BY t.priority DESC, t.taskid`,
        [userId, searchTerm, searchTerm]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
  // Cập nhật status của task
  static async updateStatus(taskid, status) {
    try {
      const [result] = await db.execute(
        'UPDATE task SET status = ? WHERE taskid = ?',
        [status, taskid]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
  
  // Lọc tasks theo nhiều điều kiện
  // filter = { userId, status, priority, groupID }
  static async filterTasks(filter) {
    try {
      const conditions = [];
      const values = [];
  
      if (filter.userId) {
        conditions.push('t.id = ?');
        values.push(filter.userId);
      }
      if (filter.status) {
        conditions.push('t.status = ?');
        values.push(filter.status);
      }
      if (filter.priority) {
        conditions.push('t.priority = ?');
        values.push(filter.priority);
      }
      if (filter.groupID) {
        conditions.push('t.groupID = ?');
        values.push(filter.groupID);
      }
  
      let query = `SELECT t.*, g.groupName 
                   FROM task t 
                   LEFT JOIN \`group\` g ON t.groupID = g.groupID`;
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      query += ' ORDER BY t.priority DESC, t.taskid';
  
      const [rows] = await db.execute(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}



module.exports = Task;