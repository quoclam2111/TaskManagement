// routes/GroupRouter.js
const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group');
const authMiddleware = require('../middlewares/authcompare');
const { validateGroup } = require('../middlewares/validation');

// Tất cả routes đều cần authentication
router.use(authMiddleware);

// ========== CRUD Group - STATIC ROUTES (ĐẶT TRƯỚC) ==========

// Tạo group mới
router.post('/', validateGroup, groupController.createGroup);

// Lấy tất cả groups của user (leader + member)
router.get('/', groupController.getMyGroups);


// ========== DYNAMIC ROUTES (ĐẶT CUỐI) ==========

// Lấy thông tin group theo ID
router.get('/:groupID', groupController.getGroup);

// Cập nhật thông tin group (chỉ leader)
router.put('/:groupID', validateGroup, groupController.updateGroup);

// Xóa group (chỉ leader)
router.delete('/:groupID', groupController.deleteGroup);

// Lấy danh sách thành viên
router.get('/:groupID/members', groupController.getMembers);

// Thêm 1 thành viên (chỉ leader)
router.post('/:groupID/members', groupController.addMember);

// Thêm nhiều thành viên cùng lúc (chỉ leader)
router.post('/:groupID/members/bulk', groupController.addMultipleMembers);

// Xóa thành viên (leader hoặc tự xóa mình)
router.delete('/:groupID/members/:userID', groupController.removeMember);

// Rời khỏi group (member tự rời, không phải leader)
router.post('/:groupID/leave', groupController.leaveGroup);

module.exports = router;