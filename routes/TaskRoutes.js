// routes/TaskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task');
const authMiddleware = require('../middlewares/authcompare');
const { validateTask } = require('../middlewares/validation');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// CRUD cơ bản
router.post('/create', validateTask, taskController.createTask);
router.get('/', taskController.getMyTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/search', taskController.searchTasks);
router.get('/status/:status', taskController.getTasksByStatus);
router.get('/priority/:priority', taskController.getTasksByPriority);
router.get('/group/:groupID', taskController.getGroupTasks);
router.get('/:taskid', taskController.getTask);
router.put('/:taskid', validateTask, taskController.updateTask);
router.delete('/:taskid', taskController.deleteTask);

module.exports = router;