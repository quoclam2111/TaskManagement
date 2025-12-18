const db = require('../configs/database');

class TaskAssignment {
  // Giao task cho user
  static async assign(taskID, assignedTo, assignedBy, notes = null) {
    try {
      const [result] = await db.execute(
        'INSERT INTO task_assignment (taskID, assignedTo, assignedBy, notes) VALUES (?, ?, ?, ?)',
        [taskID, assignedTo, assignedBy, notes]
      );
      return result.affectedRows > 0;
    } catch (error) {
      // Nếu đã assign rồi (duplicate key)
      if (error.code === 'ER_DUP_ENTRY') {
        return false;
      }
      throw error;
    }
  }

  // Hủy assignment
  static async unassign(taskID, assignedTo) {
    try {
      const [result] = await db.execute(
        'DELETE FROM task_assignment WHERE taskID = ? AND assignedTo = ?',
        [taskID, assignedTo]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Lấy danh sách users được assign cho task
  static async getAssignees(taskID) {
    try {
      const [rows] = await db.execute(
        `SELECT u.id, u.username, u.fullname, u.email, ta.assignedAt, ta.notes,
                ab.username as assignedBy_name, ab.fullname as assignedBy_fullname
         FROM task_assignment ta
         INNER JOIN user u ON ta.assignedTo = u.id
         LEFT JOIN user ab ON ta.assignedBy = ab.id
         WHERE ta.taskID = ?`,
        [taskID]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tasks được assign cho user
  static async getTasksAssignedTo(userID) {
    try {
      const [rows] = await db.execute(
        `SELECT t.*, g.groupName, ta.assignedAt, ta.notes,
                ab.username as assignedBy_name, ab.fullname as assignedBy_fullname
         FROM task_assignment ta
         INNER JOIN task t ON ta.taskID = t.taskid
         LEFT JOIN \`group\` g ON t.groupID = g.groupID
         LEFT JOIN user ab ON ta.assignedBy = ab.id
         WHERE ta.assignedTo = ?
         ORDER BY t.priority DESC, ta.assignedAt DESC`,
        [userID]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Lấy tasks mà user đã assign cho người khác
  static async getTasksAssignedBy(userID) {
    try {
      const [rows] = await db.execute(
        `SELECT t.*, g.groupName, ta.assignedAt,
                u.username as assignedTo_name, u.fullname as assignedTo_fullname
         FROM task_assignment ta
         INNER JOIN task t ON ta.taskID = t.taskid
         LEFT JOIN \`group\` g ON t.groupID = g.groupID
         LEFT JOIN user u ON ta.assignedTo = u.id
         WHERE ta.assignedBy = ?
         ORDER BY t.priority DESC, ta.assignedAt DESC`,
        [userID]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Xóa tất cả assignments của task (khi xóa task)
  static async removeAllByTask(taskID) {
    try {
      const [result] = await db.execute(
        'DELETE FROM task_assignment WHERE taskID = ?',
        [taskID]
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Kiểm tra user có được assign task này không
  static async isAssigned(taskID, userID) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM task_assignment WHERE taskID = ? AND assignedTo = ?',
        [taskID, userID]
      );
      return rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Assign cho nhiều users cùng lúc
  static async assignMultiple(taskID, userIDs, assignedBy) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const results = [];
      for (const userID of userIDs) {
        try {
          await connection.execute(
            'INSERT INTO task_assignment (taskID, assignedTo, assignedBy) VALUES (?, ?, ?)',
            [taskID, userID, assignedBy]
          );
          results.push({ userID, success: true });
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            results.push({ userID, success: false, reason: 'Đã được assign' });
          } else {
            throw error;
          }
        }
      }
      
      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Đếm số tasks được assign cho user
  static async countAssignedTasks(userID) {
    try {
      const [rows] = await db.execute(
        'SELECT COUNT(*) as count FROM task_assignment WHERE assignedTo = ?',
        [userID]
      );
      return rows[0].count;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TaskAssignment;