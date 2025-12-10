// controllers/task.js
const Task = require('../models/Task');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const CatchAsync = require('../utils/CatchAsync');
const AppError = require('../utils/AppError');

// Tạo task mới
exports.createTask = CatchAsync(async (req, res, next) => {
  const { taskname, description, status, priority, groupID } = req.body;
  const userId = req.user.id;

  // Validate required fields
  if (!taskname) {
    return next(new AppError('Task name is required', 400));
  }

  // Nếu có groupID, kiểm tra quyền
  if (groupID) {
    const isMember = await GroupMember.isMember(userId, groupID);
    const isLeader = await Group.isLeader(groupID, userId);
    
    if (!isMember && !isLeader) {
      return next(new AppError('You are not a member of this group', 403));
    }
  }

  const taskData = {
    taskname,
    description: description || '',
    status: status || 'Pending',
    priority: priority || 3,
    id: userId,
    groupID: groupID || null
  };

  const newTask = await Task.create(taskData);

  res.status(201).json({
    status: 'success',
    data: {
      task: newTask
    }
  });
});

// Lấy tất cả tasks của user
exports.getMyTasks = CatchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const tasks = await Task.findByUserId(userId);

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks
    }
  });
});

// Lấy task theo ID
exports.getTask = CatchAsync(async (req, res, next) => {
  const { taskid } = req.params;
  const userId = req.user.id;

  const task = await Task.findById(taskid);

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  // Kiểm tra quyền truy cập
  const isOwner = task.id === userId;
  const hasGroupAccess = task.groupID ? await Task.checkGroupAccess(taskid, userId) : false;

  if (!isOwner && !hasGroupAccess) {
    return next(new AppError('You do not have permission to access this task', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      task
    }
  });
});

// Cập nhật task
exports.updateTask = CatchAsync(async (req, res, next) => {
  const { taskid } = req.params;
  const userId = req.user.id;
  const { taskname, description, status, priority } = req.body;

  const task = await Task.findById(taskid);

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  // Kiểm tra quyền: chỉ owner hoặc group leader mới được sửa
  const isOwner = task.id === userId;
  let isLeader = false;
  
  if (task.groupID) {
    isLeader = await Group.isLeader(task.groupID, userId);
  }

  if (!isOwner && !isLeader) {
    return next(new AppError('You do not have permission to update this task', 403));
  }

  const taskData = {};
  if (taskname) taskData.taskname = taskname;
  if (description !== undefined) taskData.description = description;
  if (status) taskData.status = status;
  if (priority) taskData.priority = priority;

  const updated = await Task.update(taskid, taskData);

  if (!updated) {
    return next(new AppError('No changes made', 400));
  }

  const updatedTask = await Task.findById(taskid);

  res.status(200).json({
    status: 'success',
    data: {
      task: updatedTask
    }
  });
});

// Xóa task
exports.deleteTask = CatchAsync(async (req, res, next) => {
  const { taskid } = req.params;
  const userId = req.user.id;

  const task = await Task.findById(taskid);

  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  // Kiểm tra quyền: chỉ owner hoặc group leader mới được xóa
  const isOwner = task.id === userId;
  let isLeader = false;
  
  if (task.groupID) {
    isLeader = await Group.isLeader(task.groupID, userId);
  }

  if (!isOwner && !isLeader) {
    return next(new AppError('You do not have permission to delete this task', 403));
  }

  await Task.delete(taskid);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Lấy tasks theo status
exports.getTasksByStatus = CatchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { status } = req.params;

  const validStatuses = ['Pending', 'In Progress', 'Completed'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const tasks = await Task.findByStatus(userId, status);

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks
    }
  });
});

// Lấy tasks theo priority
exports.getTasksByPriority = CatchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { priority } = req.params;

  if (priority < 1 || priority > 5) {
    return next(new AppError('Priority must be between 1 and 5', 400));
  }

  const tasks = await Task.findByPriority(userId, parseInt(priority));

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks
    }
  });
});

// Lấy tasks theo group
exports.getGroupTasks = CatchAsync(async (req, res, next) => {
  const { groupID } = req.params;
  const userId = req.user.id;

  // Kiểm tra quyền truy cập group
  const isMember = await GroupMember.isMember(userId, groupID);
  const isLeader = await Group.isLeader(groupID, userId);

  if (!isMember && !isLeader) {
    return next(new AppError('You are not a member of this group', 403));
  }

  const tasks = await Task.findByGroupId(groupID);

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks
    }
  });
});

// Tìm kiếm tasks
exports.searchTasks = CatchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { keyword } = req.query;

  if (!keyword) {
    return next(new AppError('Keyword is required', 400));
  }

  const tasks = await Task.search(userId, keyword);

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks
    }
  });
});

// Thống kê tasks theo status
exports.getTaskStats = CatchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const stats = await Task.countByStatus(userId);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

// Cập nhật status của task
exports.updateStatus = CatchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { taskid } = req.params;
  const { status } = req.body;

  // 1. Validate status
  const validStatuses = ['Pending', 'In Progress', 'Completed'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  // 2. Lấy task
  const task = await Task.findById(taskid);
  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  // 3. Kiểm tra quyền: chỉ owner hoặc group leader mới được cập nhật
  const isOwner = task.id === userId;
  let isLeader = false;
  if (task.groupID) {
    isLeader = await Group.isLeader(task.groupID, userId);
  }

  if (!isOwner && !isLeader) {
    return next(new AppError('You do not have permission to update this task', 403));
  }

  // 4. Cập nhật status
  const updated = await Task.updateStatus(taskid, status );
  if (!updated) {
    return next(new AppError('No changes made', 400));
  }

  const updatedTask = await Task.findById(taskid);

  // 5. Trả về kết quả
  res.status(200).json({
    status: 'success',
    data: {
      task: updatedTask
    }
  });
});

// Lọc tasks theo nhiều điều kiện: status, priority, groupID, keyword
exports.filterTasks = CatchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { status, priority, groupID, keyword } = req.query;

  // 1. Validate các giá trị nếu có
  const validStatuses = ['Pending', 'In Progress', 'Completed'];
  if (status && !validStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }
  if (priority && (priority < 1 || priority > 5)) {
    return next(new AppError('Priority must be between 1 and 5', 400));
  }

  let tasks = [];

  // 2. Nếu có groupID, kiểm tra quyền truy cập
  if (groupID) {
    const isMember = await GroupMember.isMember(userId, groupID);
    const isLeader = await Group.isLeader(groupID, userId);
    if (!isMember && !isLeader) {
      return next(new AppError('You are not a member of this group', 403));
    }
  }

  // 3. Lấy tất cả tasks của user
  tasks = await Task.findByUserId(userId);

  // 4. Filter theo status
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }

  // 5. Filter theo priority
  if (priority) {
    tasks = tasks.filter(t => t.priority === parseInt(priority));
  }

  // 6. Filter theo groupID
  if (groupID) {
    tasks = tasks.filter(t => t.groupID == groupID); // == để so sánh string và number
  }

  // 7. Filter theo keyword
  if (keyword) {
    const key = keyword.toLowerCase();
    tasks = tasks.filter(
      t => t.taskname.toLowerCase().includes(key) || t.description.toLowerCase().includes(key)
    );
  }

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: {
      tasks
    }
  });
});
