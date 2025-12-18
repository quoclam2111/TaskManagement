const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const Task = require('../models/Task');
const User = require('../models/User');
const CatchAsync = require('../utils/CatchAsync');
const AppError = require('../utils/AppError');

// Tạo group mới
exports.createGroup = CatchAsync(async (req, res, next) => {
  const { groupName } = req.body;
  const userId = req.user.id;

  if (!groupName) {
    return next(new AppError('Group name is required', 400));
  }

  const groupData = {
    groupName,
    truongnhom: userId
  };

  const newGroup = await Group.create(groupData);

  // Tự động thêm người tạo vào group
  await GroupMember.add(userId, newGroup.groupID);

  res.status(201).json({
    status: 'success',
    data: {
      group: newGroup
    }
  });
});

// Lấy tất cả groups của user (cả leader và member)
exports.getMyGroups = CatchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // Lấy groups mà user là leader
  const leaderGroups = await Group.findByLeader(userId);
  
  // Lấy groups mà user là member
  const memberGroups = await Group.findByMember(userId);

  // Merge và loại bỏ duplicate
  const groupMap = new Map();
  
  leaderGroups.forEach(group => {
    groupMap.set(group.groupID, { ...group, role: 'leader' });
  });
  
  memberGroups.forEach(group => {
    if (!groupMap.has(group.groupID)) {
      groupMap.set(group.groupID, { ...group, role: 'member' });
    }
  });

  const groups = Array.from(groupMap.values());

  res.status(200).json({
    status: 'success',
    results: groups.length,
    data: {
      groups
    }
  });
});

// Lấy thông tin group theo ID
exports.getGroup = CatchAsync(async (req, res, next) => {
  const { groupID } = req.params;
  const userId = req.user.id;

  const group = await Group.findById(groupID);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Kiểm tra quyền truy cập
  const isMember = await GroupMember.isMember(userId, groupID);
  const isLeader = group.truongnhom === userId;

  if (!isMember && !isLeader) {
    return next(new AppError('You do not have permission to access this group', 403));
  }

  // Lấy thêm thông tin members và số lượng
  const members = await Group.getMembers(groupID);
  const memberCount = await Group.getMemberCount(groupID);

  res.status(200).json({
    status: 'success',
    data: {
      group: {
        ...group,
        memberCount,
        members,
        role: isLeader ? 'leader' : 'member'
      }
    }
  });
});

// Cập nhật thông tin group
exports.updateGroup = CatchAsync(async (req, res, next) => {
  const { groupID } = req.params;
  const userId = req.user.id;
  const { groupName, truongnhom } = req.body;

  const group = await Group.findById(groupID);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Chỉ leader mới được cập nhật
  if (group.truongnhom !== userId) {
    return next(new AppError('Only group leader can update group information', 403));
  }

  const groupData = {};
  if (groupName) groupData.groupName = groupName;
  if (truongnhom) {
    // Kiểm tra user mới có tồn tại không
    const newLeader = await User.findById(truongnhom);
    if (!newLeader) {
      return next(new AppError('New leader not found', 404));
    }
    
    // Kiểm tra user mới có phải member không
    const isMember = await GroupMember.isMember(truongnhom, groupID);
    if (!isMember) {
      return next(new AppError('New leader must be a group member', 400));
    }
    
    groupData.truongnhom = truongnhom;
  }

  const updated = await Group.update(groupID, groupData);

  if (!updated) {
    return next(new AppError('No changes made', 400));
  }

  const updatedGroup = await Group.findById(groupID);

  res.status(200).json({
    status: 'success',
    data: {
      group: updatedGroup
    }
  });
});

// Hàm deleteGroup 
exports.deleteGroup = CatchAsync(async (req, res, next) => {
  const { groupID } = req.params;
  const userId = req.user.id;

  // 1. Tìm group TRƯỚC khi xóa
  const group = await Group.findById(groupID);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // 2. Kiểm tra quyền
  if (group.truongnhom !== userId) {
    return next(new AppError('Only group leader can delete the group', 403));
  }

  try {
    // 3. Xóa tất cả tasks của group trước
    await Task.deleteByGroupId(groupID);
    
    // 4. Xóa tất cả members
    await GroupMember.removeAllByGroup(groupID);
    
    // 5. Cuối cùng mới xóa group
    await Group.delete(groupID);

    // 6. Trả về success
    return res.status(200).json({
      status: 'success',
      message: 'Group deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return next(new AppError('Failed to delete group', 500));
  }
});

// Thêm thành viên vào group
exports.addMember = CatchAsync(async (req, res, next) => {
  const { groupID } = req.params;
  const { userID } = req.body;
  const currentUserId = req.user.id;

  if (!userID) {
    return next(new AppError('User ID is required', 400));
  }

  const group = await Group.findById(groupID);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Chỉ leader mới được thêm member
  if (group.truongnhom !== currentUserId) {
    return next(new AppError('Only group leader can add members', 403));
  }

  // Kiểm tra user có tồn tại không
  const user = await User.findById(userID);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Thêm member
  const added = await GroupMember.add(userID, groupID);

  if (!added) {
    return next(new AppError('User is already a member of this group', 400));
  }

  res.status(201).json({
    status: 'success',
    message: 'Member added successfully',
    data: {
      member: user
    }
  });
});

// Xóa thành viên khỏi group
exports.removeMember = CatchAsync(async (req, res, next) => {
  const { groupID, userID } = req.params;
  const currentUserId = req.user.id;

  const group = await Group.findById(groupID);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Leader không thể tự xóa mình
  if (group.truongnhom === userID) {
    return next(new AppError('Group leader cannot be removed. Transfer leadership first', 400));
  }

  // Chỉ leader hoặc chính user đó mới được xóa
  const isLeader = group.truongnhom === currentUserId;
  const isSelf = currentUserId === userID;

  if (!isLeader && !isSelf) {
    return next(new AppError('You do not have permission to remove this member', 403));
  }

  const removed = await GroupMember.remove(userID, groupID);

  if (!removed) {
    return next(new AppError('User is not a member of this group', 400));
  }

  res.status(200).json({
    status: 'success',
    message: 'Member removed successfully'
  });
});

// Lấy danh sách thành viên
exports.getMembers = CatchAsync(async (req, res, next) => {
  const { groupID } = req.params;
  const userId = req.user.id;

  const group = await Group.findById(groupID);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Kiểm tra quyền truy cập
  const isMember = await GroupMember.isMember(userId, groupID);
  const isLeader = group.truongnhom === userId;

  if (!isMember && !isLeader) {
    return next(new AppError('You do not have permission to view members', 403));
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

// Thêm nhiều thành viên cùng lúc
exports.addMultipleMembers = CatchAsync(async (req, res, next) => {
  const { groupID } = req.params;
  const { userIDs } = req.body;
  const currentUserId = req.user.id;

  if (!userIDs || !Array.isArray(userIDs) || userIDs.length === 0) {
    return next(new AppError('User IDs array is required', 400));
  }

  const group = await Group.findById(groupID);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Chỉ leader mới được thêm members
  if (group.truongnhom !== currentUserId) {
    return next(new AppError('Only group leader can add members', 403));
  }

  const results = await GroupMember.addMultiple(userIDs, groupID);

  res.status(201).json({
    status: 'success',
    data: {
      results
    }
  });
});

// Rời khỏi group (tự xóa mình)
exports.leaveGroup = CatchAsync(async (req, res, next) => {
  const { groupID } = req.params;
  const userId = req.user.id;

  const group = await Group.findById(groupID);

  if (!group) {
    return next(new AppError('Group not found', 404));
  }

  // Leader không thể rời group
  if (group.truongnhom === userId) {
    return next(new AppError('Group leader cannot leave. Transfer leadership or delete the group', 400));
  }

  const removed = await GroupMember.remove(userId, groupID);

  if (!removed) {
    return next(new AppError('You are not a member of this group', 400));
  }

  res.status(200).json({
    status: 'success',
    message: 'You have left the group successfully'
  });
});