// controllers/group.js - FIXED VERSION

const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const Task = require('../models/Task');
const CatchAsync = require('../utils/CatchAsync');
const AppError = require('../utils/AppError');

// Tạo group mới
exports.createGroup = CatchAsync(async (req, res, next) => {
    const { groupName } = req.body;
    const userId = req.user.id;

    // ✅ FIX: Tạo group và lấy kết quả đúng cách
    const newGroup = await Group.create({
        groupName,
        truongnhom: userId
    });

    // ✅ FIX: Kiểm tra newGroup trước khi dùng
    if (!newGroup || !newGroup.groupID) {
        return next(new AppError('Failed to create group', 500));
    }

    // Thêm người tạo vào groupmember
    await GroupMember.add(userId, newGroup.groupID);

    res.status(201).json({
        status: 'success',
        message: 'Group created successfully',
        data: {
            group: newGroup
        }
    });
});

// Lấy tất cả groups của user (cả leader và member)
exports.getMyGroups = CatchAsync(async (req, res, next) => {
    const userId = req.user.id;
    
    // Lấy groups mà user là thành viên
    const groups = await GroupMember.getGroupsByUser(userId);
    
    // ✅ FIX: Thêm thông tin role và số lượng thành viên cho mỗi group
    const groupsWithDetails = await Promise.all(
        groups.map(async (group) => {
            const memberCount = await GroupMember.countMembers(group.groupID);
            const isLeader = group.truongnhom == userId;
            
            return {
                groupID: group.groupID,
                groupName: group.groupName,
                truongnhom: group.truongnhom,
                truongnhom_name: group.truongnhom_name,
                truongnhom_fullname: group.truongnhom_fullname,
                role: isLeader ? 'leader' : 'member',
                memberCount: memberCount || 0 // ✅ Ensure memberCount is always a number
            };
        })
    );

    res.status(200).json({
        status: 'success',
        results: groupsWithDetails.length,
        data: {
            groups: groupsWithDetails
        }
    });
});

// Lấy thông tin chi tiết một group
exports.getGroup = CatchAsync(async (req, res, next) => {
    const { groupID } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupID);

    if (!group) {
        return next(new AppError('Group not found', 404));
    }

    // Kiểm tra user có phải là thành viên không
    const isMember = await GroupMember.isMember(userId, groupID);
    if (!isMember) {
        return next(new AppError('You are not a member of this group', 403));
    }

    // Lấy số lượng thành viên
    const memberCount = await GroupMember.countMembers(groupID);

    res.status(200).json({
        status: 'success',
        data: {
            group: {
                ...group,
                memberCount,
                role: group.truongnhom == userId ? 'leader' : 'member'
            }
        }
    });
});

// Cập nhật thông tin group (chỉ leader)
exports.updateGroup = CatchAsync(async (req, res, next) => {
    const { groupID } = req.params;
    const { groupName } = req.body;
    const userId = req.user.id;

    // Kiểm tra group có tồn tại
    const group = await Group.findById(groupID);
    if (!group) {
        return next(new AppError('Group not found', 404));
    }

    // Kiểm tra quyền leader
    if (group.truongnhom != userId) {
        return next(new AppError('Only group leader can update group information', 403));
    }

    // Cập nhật
    const updated = await Group.update(groupID, { groupName });

    if (!updated) {
        return next(new AppError('Failed to update group', 500));
    }

    const updatedGroup = await Group.findById(groupID);

    res.status(200).json({
        status: 'success',
        message: 'Group updated successfully',
        data: {
            group: updatedGroup
        }
    });
});

// Xóa group (chỉ leader)
exports.deleteGroup = CatchAsync(async (req, res, next) => {
    const { groupID } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupID);
    if (!group) {
        return next(new AppError('Group not found', 404));
    }

    // Kiểm tra quyền leader
    if (group.truongnhom != userId) {
        return next(new AppError('Only group leader can delete the group', 403));
    }

    // Xóa tất cả tasks của group
    await Task.deleteByGroup(groupID);

    // Xóa tất cả thành viên
    await GroupMember.removeAllByGroup(groupID);

    // Xóa group
    await Group.delete(groupID);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Lấy danh sách thành viên
exports.getMembers = CatchAsync(async (req, res, next) => {
    const { groupID } = req.params;
    const userId = req.user.id;

    // Kiểm tra group tồn tại
    const group = await Group.findById(groupID);
    if (!group) {
        return next(new AppError('Group not found', 404));
    }

    // Kiểm tra user có phải thành viên không
    const isMember = await GroupMember.isMember(userId, groupID);
    if (!isMember) {
        return next(new AppError('You are not a member of this group', 403));
    }

    const members = await GroupMember.getMembersByGroup(groupID);

    res.status(200).json({
        status: 'success',
        results: members.length,
        data: {
            members
        }
    });
});

// Thêm thành viên (chỉ leader)
exports.addMember = CatchAsync(async (req, res, next) => {
    const { groupID } = req.params;
    const { userID } = req.body;
    const userId = req.user.id;

    if (!userID) {
        return next(new AppError('userID is required', 400));
    }

    // Kiểm tra group
    const group = await Group.findById(groupID);
    if (!group) {
        return next(new AppError('Group not found', 404));
    }

    // Kiểm tra quyền leader
    if (group.truongnhom != userId) {
        return next(new AppError('Only group leader can add members', 403));
    }

    // Kiểm tra xem đã là thành viên chưa
    const isMember = await GroupMember.isMember(userID, groupID);
    if (isMember) {
        return next(new AppError('User is already a member', 400));
    }

    // Thêm thành viên
    const added = await GroupMember.add(userID, groupID);

    if (!added) {
        return next(new AppError('Failed to add member', 500));
    }

    res.status(201).json({
        status: 'success',
        message: 'Member added successfully'
    });
});

// Thêm nhiều thành viên cùng lúc
exports.addMultipleMembers = CatchAsync(async (req, res, next) => {
    const { groupID } = req.params;
    const { userIDs } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(userIDs) || userIDs.length === 0) {
        return next(new AppError('userIDs must be a non-empty array', 400));
    }

    const group = await Group.findById(groupID);
    if (!group) {
        return next(new AppError('Group not found', 404));
    }

    if (group.truongnhom != userId) {
        return next(new AppError('Only group leader can add members', 403));
    }

    const results = await GroupMember.addMultiple(userIDs, groupID);

    res.status(201).json({
        status: 'success',
        message: 'Members added',
        data: {
            results
        }
    });
});

// Xóa thành viên (leader hoặc tự xóa mình)
exports.removeMember = CatchAsync(async (req, res, next) => {
    const { groupID, userID } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupID);
    if (!group) {
        return next(new AppError('Group not found', 404));
    }

    // Không cho xóa trưởng nhóm
    if (group.truongnhom == userID) {
        return next(new AppError('Cannot remove group leader', 400));
    }

    // Kiểm tra quyền: phải là leader hoặc tự xóa mình
    if (group.truongnhom != userId && userID != userId) {
        return next(new AppError('You do not have permission to remove this member', 403));
    }

    const removed = await GroupMember.remove(userID, groupID);

    if (!removed) {
        return next(new AppError('Member not found or already removed', 404));
    }

    res.status(200).json({
        status: 'success',
        message: 'Member removed successfully'
    });
});

// Rời khỏi group (member tự rời)
exports.leaveGroup = CatchAsync(async (req, res, next) => {
    const { groupID } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupID);
    if (!group) {
        return next(new AppError('Group not found', 404));
    }

    // Leader không thể rời, phải xóa group
    if (group.truongnhom == userId) {
        return next(new AppError('Group leader cannot leave. Please delete the group or transfer leadership', 400));
    }

    const removed = await GroupMember.remove(userId, groupID);

    if (!removed) {
        return next(new AppError('You are not a member of this group', 404));
    }

    res.status(200).json({
        status: 'success',
        message: 'Left group successfully'
    });
});