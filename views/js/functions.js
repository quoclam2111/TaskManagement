// ===== COMPLETE FUNCTION SET FOR TASK MANAGEMENT =====
// File bổ sung các hàm chức năng hoàn chỉnh cho dashboard

// ===== 1. TASK FUNCTIONS =====

/**
 * Mở modal để tạo task mới
 */
function openCreateTaskModal() {
    document.getElementById('editTaskId').value = '';
    document.getElementById('taskForm').reset();
    document.getElementById('taskModalTitle').textContent = '➕ Thêm công việc';
    openModal('taskModal');
}

/**
 * Mở modal để sửa task
 */
async function openEditTaskModal(taskId) {
    const task = currentTasks.find(t => t.taskid === taskId);
    
    if (!task) {
        alert('❌ Không tìm thấy công việc');
        return;
    }
    
    // Điền thông tin vào form
    document.getElementById('editTaskId').value = taskId;
    document.getElementById('taskName').value = task.taskname;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskStatus').value = task.status;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskGroup').value = task.groupID || '';
    document.getElementById('taskModalTitle').textContent = '✏️ Sửa công việc';
    
    await loadGroups();
    populateGroupSelect(currentGroups);
    openModal('taskModal');
}

/**
 * Lưu hoặc cập nhật task
 */
async function saveTask() {
    const taskId = document.getElementById('editTaskId').value;
    const taskData = {
        taskname: document.getElementById('taskName').value.trim(),
        description: document.getElementById('taskDescription').value.trim(),
        status: document.getElementById('taskStatus').value,
        priority: parseInt(document.getElementById('taskPriority').value),
        groupID: document.getElementById('taskGroup').value || null
    };
    
    if (!taskData.taskname) {
        alert('⚠️ Vui lòng nhập tên công việc');
        return;
    }
    
    try {
        let response;
        
        if (taskId) {
            // Cập nhật task
            response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(taskData)
            });
        } else {
            // Tạo task mới
            response = await fetch(`${CONFIG.API_URL}/tasks/create`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(taskData)
            });
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            closeModal('taskModal');
            loadTasks();
            alert(taskId ? '✅ Cập nhật công việc thành công!' : '✅ Thêm công việc thành công!');
        } else {
            alert('❌ ' + (data.message || 'Có lỗi xảy ra'));
        }
    } catch (error) {
        console.error('Error saving task:', error);
        alert('❌ Không thể lưu công việc: ' + error.message);
    }
}

/**
 * Xóa task
 */
async function deleteTask(taskId) {
    if (!confirm('⚠️ Bạn có chắc muốn xóa công việc này?\n❗ Hành động này không thể hoàn tác!')) {
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('✅ Xóa công việc thành công!');
            loadTasks();
        } else {
            alert('❌ ' + (data.message || 'Không thể xóa công việc'));
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('❌ Có lỗi xảy ra: ' + error.message);
    }
}

/**
 * Mở modal cập nhật trạng thái task
 */
function openUpdateStatusModal(taskId) {
    let task = currentTasks.find(t => t.taskid === taskId);
    
    // Nếu không tìm thấy trong currentTasks, tìm trong assigned tasks
    if (!task && window.currentAssignedTasks) {
        task = currentAssignedTasks.find(t => t.taskid === taskId);
    }
    
    if (!task) {
        alert('❌ Không tìm thấy công việc');
        return;
    }
    
    document.getElementById('updateStatusTaskId').value = taskId;
    document.getElementById('updateStatusSelect').value = task.status;
    openModal('updateStatusModal');
}

/**
 * Cập nhật trạng thái task
 */
async function saveStatusUpdate() {
    const taskId = document.getElementById('updateStatusTaskId').value;
    const status = document.getElementById('updateStatusSelect').value;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            closeModal('updateStatusModal');
            loadTasks();
            
            // Nếu đang xem assigned tasks, reload lại
            if (window.currentAssignedTasks) {
                loadAssignedTasks();
            }
            
            alert('✅ Cập nhật trạng thái thành công!');
        } else {
            alert('❌ ' + (data.message || 'Không thể cập nhật'));
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('❌ Có lỗi xảy ra');
    }
}

// ===== 2. GROUP FUNCTIONS =====

/**
 * Mở modal để tạo nhóm mới
 */
function openCreateGroupModal() {
    document.getElementById('groupForm').reset();
    document.getElementById('groupId').value = '';
    document.getElementById('groupModalTitle').textContent = '➕ Tạo nhóm mới';
    openModal('groupModal');
}

/**
 * Mở modal để sửa nhóm
 */
async function openEditGroupModal(groupId) {
    const group = currentGroups.find(g => g.groupID == groupId);
    if (!group) {
        alert('❌ Không tìm thấy nhóm');
        return;
    }
    
    // Check quyền
    if (group.role !== 'leader') {
        alert('❌ Chỉ trưởng nhóm mới có quyền sửa');
        return;
    }
    
    // Điền thông tin vào form
    document.getElementById('groupId').value = groupId;
    document.getElementById('groupName').value = group.groupName;
    document.getElementById('groupModalTitle').textContent = '✏️ Sửa nhóm';
    
    openModal('groupModal');
}

/**
 * Lưu hoặc cập nhật nhóm
 */
async function saveGroup() {
    const groupId = document.getElementById('groupId').value;
    const groupName = document.getElementById('groupName').value.trim();
    
    if (!groupName) {
        alert('⚠️ Vui lòng nhập tên nhóm');
        return;
    }
    
    try {
        let response;
        
        if (groupId) {
            // Cập nhật group
            response = await fetch(`${CONFIG.API_URL}/groups/${groupId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ groupName })
            });
        } else {
            // Tạo group mới
            response = await fetch(`${CONFIG.API_URL}/groups`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ groupName })
            });
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            closeModal('groupModal');
            loadGroups();
            alert(groupId ? '✅ Cập nhật nhóm thành công!' : '✅ Tạo nhóm thành công!');
        } else {
            alert('❌ ' + (data.message || 'Có lỗi xảy ra'));
        }
    } catch (error) {
        console.error('Error saving group:', error);
        alert('❌ Không thể lưu nhóm: ' + error.message);
    }
}

/**
 * Xóa nhóm
 */
async function deleteGroup(groupId) {
    if (!confirm('⚠️ Bạn có chắc muốn xóa nhóm này?\n\n❗ Tất cả tasks trong nhóm cũng sẽ bị xóa!\n❗ Hành động này không thể hoàn tác!')) {
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/groups/${groupId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('✅ Xóa nhóm thành công!');
            await loadGroups();
            await loadTasks(); // Reload tasks vì tasks trong group cũng bị xóa
        } else {
            alert('❌ ' + (data.message || 'Không thể xóa nhóm'));
        }
    } catch (error) {
        console.error('Error deleting group:', error);
        alert('❌ Có lỗi xảy ra: ' + error.message);
    }
}

/**
 * Rời khỏi nhóm (cho member)
 */
async function leaveGroup(groupId) {
    if (!confirm('Bạn có chắc muốn rời khỏi nhóm này?')) return;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/groups/${groupId}/leave`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('✅ Đã rời nhóm thành công!');
            await loadGroups();
        } else {
            alert('❌ ' + (data.message || 'Không thể rời nhóm'));
        }
    } catch (error) {
        console.error('Error leaving group:', error);
        alert('❌ Có lỗi xảy ra');
    }
}

// ===== 3. MEMBER FUNCTIONS =====

/**
 * Mở modal quản lý thành viên
 */
async function openMembersModal(groupId) {
    document.getElementById('currentGroupId').value = groupId;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/groups/${groupId}/members`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            currentGroupMembers = data.data.members;
            displayMembers(currentGroupMembers, groupId);
            openModal('membersModal');
            
            // Setup search
            setupMemberSearch(groupId);
        }
    } catch (error) {
        console.error('Error loading members:', error);
        alert('❌ Không thể tải danh sách thành viên');
    }
}

/**
 * Hiển thị danh sách thành viên
 */
function displayMembers(members, groupId) {
    const container = document.getElementById('membersList');
    const group = currentGroups.find(g => g.groupID == groupId);
    const isLeader = group && group.role === 'leader';
    
    if (members.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>👤 Chưa có thành viên</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = members.map(member => {
        const isGroupLeader = group && group.truongnhom == member.id;
        return `
        <div class="member-item">
            <div class="member-info">
                <div class="member-avatar">${member.fullname.charAt(0).toUpperCase()}</div>
                <div class="member-details">
                    <div class="member-name">${escapeHtml(member.fullname)}</div>
                    <div class="member-username">@${escapeHtml(member.username)}</div>
                </div>
                ${isGroupLeader ? '<span class="member-badge">Trưởng nhóm</span>' : ''}
            </div>
            ${isLeader && !isGroupLeader ? `
                <button class="btn-remove" onclick="removeMember('${groupId}', '${member.id}')">Xóa</button>
            ` : ''}
        </div>
        `;
    }).join('');
}

/**
 * Cài đặt tìm kiếm thành viên
 */
function setupMemberSearch(groupId) {
    const searchInput = document.getElementById('searchMember');
    const resultsDiv = document.getElementById('searchResults');
    
    searchInput.value = '';
    
    searchInput.oninput = (e) => {
        const keyword = e.target.value.toLowerCase().trim();
        
        if (!keyword) {
            resultsDiv.style.display = 'none';
            return;
        }
        
        // Filter users - loại bỏ members hiện tại
        const filtered = allUsers.filter(u => {
            const isCurrentMember = currentGroupMembers.find(m => m.id === u.id);
            const matchesSearch = u.username.toLowerCase().includes(keyword) || 
                                  u.fullname.toLowerCase().includes(keyword);
            return !isCurrentMember && matchesSearch;
        });
        
        if (filtered.length === 0) {
            resultsDiv.innerHTML = '<div style="padding:10px; color:#95a5a6;">Không tìm thấy</div>';
            resultsDiv.style.display = 'block';
            return;
        }
        
        resultsDiv.innerHTML = filtered.map(user => `
            <div class="search-result-item" onclick="addMemberToGroup('${groupId}', '${user.id}')">
                <div class="member-avatar" style="width:30px; height:30px; font-size:14px;">
                    ${user.fullname.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style="font-weight:600; font-size:13px;">${escapeHtml(user.fullname)}</div>
                    <div style="font-size:11px; color:#7f8c8d;">@${escapeHtml(user.username)}</div>
                </div>
            </div>
        `).join('');
        
        resultsDiv.style.display = 'block';
    };
}

/**
 * Thêm thành viên vào nhóm
 */
async function addMemberToGroup(groupId, userId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/groups/${groupId}/members`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ userID: userId })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            document.getElementById('searchMember').value = '';
            document.getElementById('searchResults').style.display = 'none';
            await openMembersModal(groupId); // Reload
            alert('✅ Thêm thành viên thành công!');
        } else {
            alert('❌ ' + (data.message || 'Không thể thêm thành viên'));
        }
    } catch (error) {
        console.error('Error adding member:', error);
        alert('❌ Có lỗi xảy ra: ' + error.message);
    }
}

/**
 * Xóa thành viên khỏi nhóm
 */
async function removeMember(groupId, userId) {
    if (!confirm('Bạn có chắc muốn xóa thành viên này khỏi nhóm?')) {
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/groups/${groupId}/members/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('✅ Đã xóa thành viên!');
            await openMembersModal(groupId); // Reload
        } else {
            alert('❌ ' + (data.message || 'Không thể xóa thành viên'));
        }
    } catch (error) {
        console.error('Error removing member:', error);
        alert('❌ Có lỗi xảy ra: ' + error.message);
    }
}

// ===== 4. TASK ASSIGNMENT FUNCTIONS =====

/**
 * Mở modal để giao task cho thành viên
 */
async function openAssignModal(taskId) {
    assigningTaskId = taskId;
    const task = currentTasks.find(t => t.taskid === taskId);
    
    if (!task || !task.groupID) {
        alert('❌ Task phải thuộc một nhóm mới có thể giao cho thành viên');
        return;
    }
    
    document.getElementById('assignTaskId').value = taskId;
    
    try {
        // Load danh sách thành viên trong group
        const membersResponse = await fetch(`${CONFIG.API_URL}/groups/${task.groupID}/members`, {
            headers: getAuthHeaders()
        });
        const membersData = await membersResponse.json();
        
        if (membersData.status === 'success') {
            const members = membersData.data.members;
            
            // Populate select
            const select = document.getElementById('assignUserSelect');
            select.innerHTML = '<option value="">-- Chọn thành viên --</option>' +
                members.map(m => 
                    `<option value="${m.id}">${escapeHtml(m.fullname)} (@${escapeHtml(m.username)})</option>`
                ).join('');
        }
        
        // Load danh sách người đã được giao
        await loadTaskAssignees(taskId);
        
        openModal('assignModal');
    } catch (error) {
        console.error('Error opening assign modal:', error);
        alert('❌ Không thể tải thông tin: ' + error.message);
    }
}

/**
 * Giao task cho thành viên
 */
async function assignTaskToUser() {
    const taskId = assigningTaskId;
    const userId = document.getElementById('assignUserSelect').value;
    const notes = document.getElementById('assignNotes').value.trim();
    
    if (!userId) {
        alert('⚠️ Vui lòng chọn thành viên');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}/assign`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ assignedTo: userId, notes: notes || null })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('✅ Giao việc thành công!');
            await loadTaskAssignees(taskId);
            document.getElementById('assignUserSelect').value = '';
            document.getElementById('assignNotes').value = '';
        } else {
            alert('❌ ' + (data.message || 'Không thể giao việc'));
        }
    } catch (error) {
        console.error('Error assigning task:', error);
        alert('❌ Có lỗi xảy ra: ' + error.message);
    }
}

/**
 * Hủy giao task cho thành viên
 */
async function unassignUser(taskId, userId) {
    if (!confirm('Bạn có chắc muốn hủy giao việc này?')) return;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}/assign/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('✅ Đã hủy giao việc');
            await loadTaskAssignees(taskId);
        } else {
            alert('❌ ' + (data.message || 'Không thể hủy'));
        }
    } catch (error) {
        console.error('Error unassigning:', error);
        alert('❌ Có lỗi xảy ra');
    }
}

/**
 * Load danh sách người được giao task
 */
async function loadTaskAssignees(taskId) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}/assignees`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            displayAssignees(data.data.assignees);
        }
    } catch (error) {
        console.error('Error loading assignees:', error);
        document.getElementById('assigneesList').innerHTML = `
            <div class="empty-state">
                <p>❌ Không thể tải danh sách</p>
            </div>
        `;
    }
}

/**
 * Hiển thị danh sách người được giao task
 */
/**
 * Hiển thị danh sách người được giao task
 */
function displayAssignees(assignees) {
    const container = document.getElementById('assigneesList');
    
    if (assignees.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>👤 Chưa giao cho ai</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = assignees.map(assignee => `
        <div class="member-item">
            <div class="member-info">
                <div class="member-avatar">${assignee.fullname.charAt(0).toUpperCase()}</div>
                <div class="member-details">
                    <div class="member-name">${escapeHtml(assignee.fullname)}</div>
                    <div class="member-username">@${escapeHtml(assignee.username)}</div>
                    ${assignee.notes ? `<div class="member-notes" style="font-size: 12px; color: #666; margin-top: 5px; font-style: italic;">📝 ${escapeHtml(assignee.notes)}</div>` : ''}
                </div>
            </div>
            <button class="btn-remove" onclick="unassignUser(${assigningTaskId}, '${assignee.id}')">🗑️ Hủy</button>
        </div>
    `).join('');
}

// ===== DISPLAY FUNCTIONS =====

/**
 * Hiển thị danh sách nhóm với các nút action
 */
function displayGroups(groups) {
    const container = document.getElementById('groupsList');
    
    if (groups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>👥 Chưa có nhóm</h3>
                <p>Tạo nhóm mới để làm việc nhóm!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = groups.map(group => `
        <div class="group-card">
            <div class="group-name">${escapeHtml(group.groupName)}</div>
            <div class="group-info">
                ${group.role === 'leader' ? '👑' : '👤'} 
                ${group.role === 'leader' ? 'Bạn là trưởng nhóm' : 'Thành viên'}
            </div>
            ${group.memberCount ? `<div class="group-info">👨‍👩‍👧‍👦 ${group.memberCount} thành viên</div>` : ''}
            
            <div class="group-actions">
                <button class="btn-group-action btn-members" onclick="openMembersModal('${group.groupID}')" title="Quản lý thành viên">
                    👥 Thành viên
                </button>
                
                ${group.role === 'leader' ? `
                    <button class="btn-group-action btn-edit" onclick="openEditGroupModal('${group.groupID}')" title="Sửa nhóm">
                        ✏️ Sửa
                    </button>
                    <button class="btn-group-action btn-delete" onclick="deleteGroup('${group.groupID}')" title="Xóa nhóm">
                        🗑️ Xóa
                    </button>
                ` : `
                    <button class="btn-group-action btn-leave" onclick="leaveGroup('${group.groupID}')" title="Rời khỏi nhóm">
                        🚪 Rời
                    </button>
                `}
            </div>
        </div>
    `).join('');
}

/**
 * Hiển thị danh sách task với các nút action
 */
function displayTasks(tasks) {
    const container = document.getElementById('tasksList');
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📝 Chưa có công việc</h3>
                <p>Thêm công việc đầu tiên của bạn!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tasks.map(task => {
        let statusClass = 'status-pending';
        if (task.status === 'In Progress') statusClass = 'status-progress';
        if (task.status === 'Completed') statusClass = 'status-completed';
        
        // Fallback cho taskid - có thể là taskid, taskID, id, task_id
        const taskId = task.taskid || task.taskID || task.task_id;
        
        return `
        <div class="task-card">
            <div class="task-header">
                <div>
                    <div class="task-title">${escapeHtml(task.taskname)}</div>
                    <div class="task-priority">${'⭐'.repeat(task.priority)}</div>
                </div>
            </div>
            <div class="task-description">${escapeHtml(task.description) || 'Không có mô tả'}</div>
            ${task.groupName ? `<div class="task-meta">
                <div class="task-meta-item">👥 ${escapeHtml(task.groupName)}</div>
            </div>` : ''}
            <div class="task-footer">
                <span class="task-status ${statusClass}">${task.status}</span>
                <div class="task-actions">
                    ${task.groupID ? `
                        <button class="btn-icon" onclick="openAssignModal('${taskId}')" title="Giao việc cho thành viên">
                            👥
                        </button>
                    ` : ''}
                    <button class="btn-icon" onclick="openEditTaskModal('${taskId}')" title="Sửa">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="deleteTask('${taskId}')" title="Xóa">
                        🗑️
                    </button>
                    <button class="btn-icon" onclick="openUpdateStatusModal('${taskId}')" title="Cập nhật trạng thái">
                        🔄
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}
