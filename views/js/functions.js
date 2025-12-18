// ===== COMPLETE FUNCTION SET FOR TASK MANAGEMENT =====
// File bổ sung các hàm chức năng hoàn chỉnh cho dashboard

// ===== 1. TASK FUNCTIONS =====

/**
 * Mở modal để tạo task mới - FIXED VERSION
 */
function openCreateTaskModal() {
    console.log('➕ Opening create task modal');
    
    // RESET FORM HOÀN TOÀN
    document.getElementById('taskForm').reset();
    document.getElementById('editTaskId').value = ''; // Clear hidden field
    document.getElementById('taskModalTitle').textContent = '➕ Thêm công việc';
    
    // Load groups và populate select
    loadGroups().then(() => populateGroupSelect(currentGroups));
    
    // Mở modal
    openModal('taskModal');
}

/**
 * Mở modal để sửa task - FIXED VERSION
 */
async function openEditTaskModal(taskId) {
    console.log('🔧 Opening edit modal for task:', taskId);
    
    // Tìm task trong currentTasks
    const task = currentTasks.find(t => {
        const id = t.taskid || t.taskID || t.task_id;
        return id == taskId;
    });
    
    if (!task) {
        console.error('❌ Task not found:', taskId);
        alert('❌ Không tìm thấy công việc');
        return;
    }
    
    console.log('✅ Found task:', task);
    
    // QUAN TRỌNG: Load groups trước khi điền dữ liệu
    await loadGroups();
    populateGroupSelect(currentGroups);
    
    // Điền dữ liệu vào form
    document.getElementById('editTaskId').value = taskId;
    document.getElementById('taskName').value = task.taskname || '';
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskStatus').value = task.status || 'Pending';
    document.getElementById('taskPriority').value = task.priority || 3;
    document.getElementById('taskGroup').value = task.groupID || '';
    
    // Đổi tiêu đề modal
    document.getElementById('taskModalTitle').textContent = '✏️ Sửa công việc';
    
    // Mở modal
    openModal('taskModal');
    
    console.log('✅ Modal opened with data:', {
        taskId,
        taskname: task.taskname,
        status: task.status,
        priority: task.priority,
        groupID: task.groupID
    });
}

/**
 * Lưu hoặc cập nhật task - FIXED VERSION
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
    
    console.log('💾 Saving task:', { taskId, taskData });
    
    try {
        let response;
        let successMessage;
        
        if (taskId) {
            // CẬP NHẬT task hiện có
            console.log('📝 Updating task:', taskId);
            response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(taskData)
            });
            successMessage = '✅ Cập nhật công việc thành công!';
        } else {
            // TẠO MỚI task
            console.log('➕ Creating new task');
            response = await fetch(`${CONFIG.API_URL}/tasks/create`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(taskData)
            });
            successMessage = '✅ Thêm công việc thành công!';
        }
        
        const data = await response.json();
        console.log('📥 Response:', data);
        
        if (data.status === 'success') {
            closeModal('taskModal');
            await loadTasks(); // Reload tasks
            alert(successMessage);
        } else {
            alert('❌ ' + (data.message || 'Có lỗi xảy ra'));
        }
    } catch (error) {
        console.error('❌ Error saving task:', error);
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
            await loadTasks();
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
            await loadTasks();
            
            // Nếu đang xem assigned tasks, reload lại
            if (window.currentAssignedTasks) {
                await loadAssignedTasks();
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
 * Mở modal để tạo nhóm mới - FIXED VERSION
 */
function openCreateGroupModal() {
    console.log('➕ Opening create group modal');
    
    // RESET FORM HOÀN TOÀN
    document.getElementById('groupForm').reset();
    document.getElementById('groupId').value = ''; // Clear hidden field
    document.getElementById('groupModalTitle').textContent = '➕ Tạo nhóm mới';
    
    // Mở modal
    openModal('groupModal');
}

/**
 * Mở modal để sửa nhóm - FIXED VERSION
 */
async function openEditGroupModal(groupId) {
    console.log('🔧 Opening edit modal for group:', groupId);
    
    // Tìm group trong currentGroups
    const group = currentGroups.find(g => g.groupID == groupId);
    
    if (!group) {
        console.error('❌ Group not found:', groupId);
        alert('❌ Không tìm thấy nhóm');
        return;
    }
    
    console.log('✅ Found group:', group);
    
    // Kiểm tra quyền
    if (group.role !== 'leader') {
        alert('❌ Chỉ trưởng nhóm mới có quyền sửa');
        return;
    }
    
    // Điền dữ liệu vào form
    document.getElementById('groupId').value = groupId;
    document.getElementById('groupName').value = group.groupName || '';
    
    // Đổi tiêu đề modal
    document.getElementById('groupModalTitle').textContent = '✏️ Sửa nhóm';
    
    // Mở modal
    openModal('groupModal');
    
    console.log('✅ Modal opened with data:', {
        groupId,
        groupName: group.groupName
    });
}

/**
 * Lưu hoặc cập nhật nhóm - FIXED VERSION
 */
async function saveGroup() {
    const groupId = document.getElementById('groupId').value;
    const groupName = document.getElementById('groupName').value.trim();
    
    if (!groupName) {
        alert('⚠️ Vui lòng nhập tên nhóm');
        return;
    }
    
    console.log('💾 Saving group:', { groupId, groupName });
    
    try {
        let response;
        let successMessage;
        
        if (groupId) {
            // CẬP NHẬT group hiện có
            console.log('📝 Updating group:', groupId);
            response = await fetch(`${CONFIG.API_URL}/groups/${groupId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ groupName })
            });
            successMessage = '✅ Cập nhật nhóm thành công!';
        } else {
            // TẠO MỚI group
            console.log('➕ Creating new group');
            console.log('🌐 API URL:', `${CONFIG.API_URL}/groups`);
            console.log('📦 Request body:', JSON.stringify({ groupName }));
            
            response = await fetch(`${CONFIG.API_URL}/groups`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ groupName })
            });
            
            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);
            
            successMessage = '✅ Tạo nhóm thành công!';
        }
        
        // Parse response
        const responseText = await response.text();
        console.log('📥 Raw response:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
            console.log('📥 Parsed response:', data);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            alert('❌ Server trả về dữ liệu không hợp lệ');
            return;
        }
        
        if (data.status === 'success') {
            console.log('✅ API success, new group data:', data.data);
            
            // ✅ 1. Đóng modal
            closeModal('groupModal');
            
            // ✅ 2. Kiểm tra xem đang ở trang nào
            const groupsTab = document.querySelector('.nav-item[data-page="groups"]');
            const isOnGroupsPage = groupsTab && groupsTab.classList.contains('active');
            
            if (!isOnGroupsPage) {
                // Nếu KHÔNG ở trang Groups → Chuyển sang trang Groups
                console.log('📍 Switching to Groups page...');
                groupsTab.click();
                // Navigation handler sẽ tự động load groups
            } else {
                // Nếu ĐÃ Ở trang Groups → Chỉ cần reload
                console.log('🔄 Already on Groups page, reloading...');
                await loadGroups();
            }
            
            // ✅ 3. Hiển thị thông báo
            alert(successMessage);
            
            console.log('✅ Group saved and displayed successfully');
        } else {
            console.error('❌ API Error:', data);
            alert('❌ ' + (data.message || 'Có lỗi xảy ra'));
        }
    } catch (error) {
        console.error('❌ Error saving group:', error);
        console.error('❌ Error stack:', error.stack);
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
 * Mở modal quản lý thành viên - FIXED
 */
async function openMembersModal(groupId) {
    document.getElementById('currentGroupId').value = groupId;
    
    try {
        // Load members của group
        const response = await fetch(`${CONFIG.API_URL}/groups/${groupId}/members`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            currentGroupMembers = data.data.members;
            
            // Tìm thông tin group để biết ai là leader
            const group = currentGroups.find(g => g.groupID == groupId);
            
            displayMembers(currentGroupMembers, groupId, group);
            openModal('membersModal');
            
            // Setup dropdown select thay vì search
            setupMemberDropdown(groupId);
        }
    } catch (error) {
        console.error('Error loading members:', error);
        alert('❌ Không thể tải danh sách thành viên');
    }
}

/**
 * Hiển thị danh sách thành viên - FIXED WITH LEADER BADGE
 */
function displayMembers(members, groupId, group) {
    const container = document.getElementById('membersList');
    const isLeader = group && group.role === 'leader';
    const currentUser = getUser();
    
    if (members.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>👤 Chưa có thành viên</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = members.map(member => {
        // ✅ FIX: Kiểm tra xem member có phải là trưởng nhóm không
        // Trưởng nhóm là người có truongnhom == member.id HOẶC createdBy == member.id
        const isGroupLeader = group && (
            group.truongnhom == member.id || 
            group.createdBy == member.id
        );
        
        // Không được xóa bản thân hoặc nhóm trưởng
        const canRemove = isLeader && !isGroupLeader && (member.id !== currentUser.id);
        
        return `
        <div class="member-item">
            <div class="member-info">
                <div class="member-avatar">${member.fullname.charAt(0).toUpperCase()}</div>
                <div class="member-details">
                    <div class="member-name">${escapeHtml(member.fullname)}</div>
                    <div class="member-username">@${escapeHtml(member.username)}</div>
                </div>
                ${isGroupLeader ? '<span class="member-badge">👑 Trưởng nhóm</span>' : ''}
            </div>
            ${canRemove ? `
                <button class="btn-remove" onclick="removeMember('${groupId}', '${member.id}')">🗑️ Xóa</button>
            ` : ''}
        </div>
        `;
    }).join('');
}

/**
 * Setup dropdown select để thêm member
 */
function setupMemberDropdown(groupId) {
    const searchDiv = document.querySelector('.search-member');
    
    // Lấy danh sách users chưa có trong group
    const availableUsers = allUsers.filter(u => {
        const isCurrentMember = currentGroupMembers.find(m => m.id === u.id);
        return !isCurrentMember;
    });
    
    // Tạo dropdown select thay vì search input
    searchDiv.innerHTML = `
        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50;">
            ➕ Thêm thành viên mới:
        </label>
        <select id="addMemberSelect" class="form-control" style="margin-bottom: 15px;">
            <option value="">-- Chọn người dùng để thêm --</option>
            ${availableUsers.map(user => `
                <option value="${user.id}">
                    ${escapeHtml(user.fullname)} (@${escapeHtml(user.username)})
                </option>
            `).join('')}
        </select>
        <button 
            class="btn-primary" 
            style="width: 100%; padding: 12px;" 
            onclick="addMemberFromDropdown('${groupId}')"
        >
            ➕ Thêm thành viên
        </button>
    `;
    
    if (availableUsers.length === 0) {
        searchDiv.innerHTML = `
            <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center; color: #7f8c8d;">
                ✅ Đã thêm tất cả người dùng vào nhóm
            </div>
        `;
    }
}

/**
 * Thêm member từ dropdown
 */
async function addMemberFromDropdown(groupId) {
    const select = document.getElementById('addMemberSelect');
    const userId = select.value;
    
    if (!userId) {
        alert('⚠️ Vui lòng chọn người dùng');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/groups/${groupId}/members`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ userID: userId })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('✅ Thêm thành viên thành công!');
            await openMembersModal(groupId); // Reload modal
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
 * Mở modal để giao task cho thành viên - FIXED: Loại bỏ nhóm trưởng
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
            const currentUser = getUser();
            
            // ✅ FIX: Lọc bỏ nhóm trưởng (người đang đăng nhập) khỏi danh sách
            const membersExceptLeader = members.filter(m => m.id != currentUser.id);
            
            // Populate select
            const select = document.getElementById('assignUserSelect');
            
            if (membersExceptLeader.length === 0) {
                select.innerHTML = '<option value="">-- Không có thành viên để giao --</option>';
            } else {
                select.innerHTML = '<option value="">-- Chọn thành viên --</option>' +
                    membersExceptLeader.map(m => 
                        `<option value="${m.id}">${escapeHtml(m.fullname)} (@${escapeHtml(m.username)})</option>`
                    ).join('');
            }
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