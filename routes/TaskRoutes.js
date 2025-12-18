// routes/TaskRoutes.js - CẬP NHẬT
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task');
const authMiddleware = require('../middlewares/authcompare');
const { validateTask } = require('../middlewares/validation');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// ===== STATIC ROUTES (ĐẶT TRƯỚC) =====
// Lấy tasks được assign cho tôi
router.get('/assigned-to-me', taskController.getMyAssignedTasks);

// Lấy tasks tôi đã assign
router.get('/assigned-by-me', taskController.getTasksIAssigned);

// Thống kê
router.get('/stats', taskController.getTaskStats);

// Tìm kiếm
router.get('/search', taskController.searchTasks);

// Lọc
router.get('/filter', taskController.filterTasks);

// ===== PARAMETERIZED STATIC ROUTES =====
// Lấy theo status
router.get('/status/:status', taskController.getTasksByStatus);

// Lấy theo priority
router.get('/priority/:priority', taskController.getTasksByPriority);

// Lấy theo group
router.get('/group/:groupID', taskController.getGroupTasks);

// ===== CRUD BASIC ROUTES =====
// Tạo task
router.post('/create', validateTask, taskController.createTask);

// Lấy danh sách tasks của tôi
router.get('/', taskController.getMyTasks);

// ===== DYNAMIC ROUTES WITH :taskid (ĐẶT CUỐI CÙNG) =====
// Lấy assignees của task
router.get('/:taskid/assignees', taskController.getTaskAssignees);

// Assign task cho user
router.post('/:taskid/assign', taskController.assignTask);

// Assign task cho nhiều users
router.post('/:taskid/assign-multiple', taskController.assignMultipleUsers);

// Unassign task
router.delete('/:taskid/assign/:userId', taskController.unassignTask);

// Chi tiết task
router.get('/:taskid', taskController.getTask);

// Cập nhật task
router.put('/:taskid', validateTask, taskController.updateTask);

// Cập nhật status
router.patch('/:taskid/status', taskController.updateStatus);

// Xóa task
router.delete('/:taskid', taskController.deleteTask);

module.exports = router;