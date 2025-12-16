// enhanced-dashboard.js
requireAuth();

// ===== STATE =====
let currentTasks = [];
let currentGroups = [];
let currentGroupMembers = [];
let allUsers = [];
let assigningTaskId = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    loadTasks();
    loadAllUsers();
    
    if (CONFIG.DEBUG) {
        console.log('📊 Dashboard loaded');
    }
});

// ===== USER INFO =====
async function loadUserInfo() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/auth/me`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('userName').textContent = data.data.user.fullname;
            saveUser(data.data.user);
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

function logout() {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
        removeToken();
        window.location.href = 'login.html';
    }
}

// ===== NAVIGATION =====
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        item.classList.add('active');
        document.getElementById(page + 'Page').classList.add('active');
        
        const titles = {
            tasks: 'Công việc của tôi',
            assigned: 'Công việc được giao',
            groups: 'Nhóm của tôi',
            profile: 'Hồ sơ cá nhân'
        };
        document.getElementById('pageTitle').textContent = titles[page];
        
        // Show/hide buttons
        document.getElementById('btnCreateTask').style.display = (page === 'tasks') ? 'flex' : 'none';
        document.getElementById('btnCreateGroup').style.display = (page === 'groups') ? 'flex' : 'none';
        
        // Load data
        if (page === 'tasks') loadTasks();
        if (page === 'assigned') loadAssignedTasks();
        if (page === 'groups') loadGroups();
        if (page === 'profile') loadProfile();
    });
});

// ===== LOAD ALL USERS (for search) =====
async function loadAllUsers() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/users/all`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            allUsers = data.data.users;
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// ===== TASKS =====
async function loadTasks() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/tasks`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            currentTasks = data.data.tasks;
            displayTasks(currentTasks);
            populateGroupSelect(currentGroups);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        document.getElementById('tasksList').innerHTML = `
            <div class="empty-state">
                <h3>❌ Lỗi tải dữ liệu</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

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
                    ${task.groupID ? `<button class="btn-icon" onclick="openAssignModal(${task.taskid})" title="Giao việc">👤</button>` : ''}
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function filterTasks() {
    const status = document.getElementById('filterStatus').value;
    const priority = document.getElementById('filterPriority').value;
    
    let filtered = currentTasks;
    
    if (status) filtered = filtered.filter(t => t.status === status);
    if (priority) filtered = filtered.filter(t => t.priority == priority);
    
    displayTasks(filtered);
}

function searchTasks() {
    const keyword = document.getElementById('searchTask').value.toLowerCase();
    
    if (!keyword) {
        displayTasks(currentTasks);
        return;
    }
    
    const filtered = currentTasks.filter(t => 
        t.taskname.toLowerCase().includes(keyword) || 
        (t.description && t.description.toLowerCase().includes(keyword))
    );
    
    displayTasks(filtered);
}

// ===== ASSIGNED TASKS =====
async function loadAssignedTasks() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/tasks/assigned-to-me`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            displayAssignedTasks(data.data.tasks);
        }
    } catch (error) {
        console.error('Error loading assigned tasks:', error);
        document.getElementById('assignedTasksList').innerHTML = `
            <div class="empty-state">
                <h3>❌ Lỗi tải dữ liệu</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function displayAssignedTasks(tasks) {
    const container = document.getElementById('assignedTasksList');
    
    if (tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>📭 Chưa có công việc được giao</h3>
                <p>Bạn chưa được giao công việc nào</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = tasks.map(task => {
        let statusClass = 'status-pending';
        if (task.status === 'In Progress') statusClass = 'status-progress';
        if (task.status === 'Completed') statusClass = 'status-completed';
        
        return `
        <div class="task-card">
            <div class="task-header">
                <div>
                    <div class="task-title">${escapeHtml(task.taskname)}</div>
                    <div class="task-priority">${'⭐'.repeat(task.priority)}</div>
                </div>
            </div>
            <div class="task-description">${escapeHtml(task.description) || 'Không có mô tả'}</div>
            <div class="task-meta">
                ${task.groupName ? `<div class="task-meta-item">👥 ${escapeHtml(task.groupName)}</div>` : ''}
                <div class="task-meta-item">👤 Giao bởi: ${escapeHtml(task.assignedBy_fullname || task.assignedBy_name || 'N/A')}</div>
            </div>
            <div class="task-footer">
                <span class="task-status ${statusClass}">${task.status}</span>
            </div>
        </div>
        `;
    }).join('');
}

// ===== TASK MODAL =====
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
    
    if (modalId === 'taskModal') {
        document.getElementById('taskForm').reset();
        loadGroups().then(() => populateGroupSelect(currentGroups));
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
    assigningTaskId = null;
}

async function saveTask() {
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
        const response = await fetch(`${CONFIG.API_URL}/tasks/create`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(taskData)
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            closeModal('taskModal');
            loadTasks();
            alert('✅ Thêm công việc thành công!');
        } else {
            alert('❌ ' + (data.message || 'Có lỗi xảy ra'));
        }
    } catch (error) {
        console.error('Error saving task:', error);
        alert('❌ Không thể lưu công việc');
    }
}

function populateGroupSelect(groups) {
    const select = document.getElementById('taskGroup');
    select.innerHTML = '<option value="">Không thuộc nhóm</option>' +
        groups.filter(g => g.role === 'leader').map(g => 
            `<option value="${g.groupID}">${escapeHtml(g.groupName)}</option>`
        ).join('');
}

// ===== GROUPS =====
async function loadGroups() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/groups`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            currentGroups = data.data.groups;
            displayGroups(currentGroups);
        }
    } catch (error) {
        console.error('Error loading groups:', error);
        document.getElementById('groupsList').innerHTML = `
            <div class="empty-state">
                <h3>❌ Lỗi tải dữ liệu</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

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
                <button class="btn-group-action btn-members" onclick="openMembersModal('${group.groupID}')">
                    👥 Thành viên
                </button>
            </div>
        </div>
    `).join('');
}

async function saveGroup() {
    const groupName = document.getElementById('groupName').value.trim();
    
    if (!groupName) {
        alert('⚠️ Vui lòng nhập tên nhóm');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/groups`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ groupName })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            closeModal('groupModal');
            loadGroups();
            alert('✅ Tạo nhóm thành công!');
        } else {
            alert('❌ ' + (data.message || 'Có lỗi xảy ra'));
        }
    } catch (error) {
        console.error('Error saving group:', error);
        alert('❌ Không thể tạo nhóm');
    }
}

// ===== MEMBERS MODAL =====
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

// views/js/enhanced-dashboard.js - Phần member search đã fix

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
        
        // ✅ Filter users - loại bỏ members hiện tại
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

async function addMemberToGroup(groupId, userId) {
    try {
        console.log('Adding member:', { groupId, userId }); // Debug
        
        const response = await fetch(`${CONFIG.API_URL}/groups/${groupId}/members`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ userID: userId })
        });
        
        const data = await response.json();
        console.log('Add member response:', data); // Debug
        
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

// ✅ Fix cho openMembersModal - đảm bảo load lại currentGroupMembers
async function openMembersModal(groupId) {
    document.getElementById('currentGroupId').value = groupId;
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/groups/${groupId}/members`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            currentGroupMembers = data.data.members; // ✅ Cập nhật lại
            displayMembers(currentGroupMembers, groupId);
            openModal('membersModal');
            
            // Setup search SAU KHI đã load members
            setupMemberSearch(groupId);
        }
    } catch (error) {
        console.error('Error loading members:', error);
        alert('❌ Không thể tải danh sách thành viên');
    }
}

// ===== ASSIGN TASK =====
async function openAssignModal(taskId) {
    assigningTaskId = taskId;
    const task = currentTasks.find(t => t.taskid === taskId);
    
    if (!task || !task.groupID) {
        alert('❌ Task không thuộc nhóm nào');
        return;
    }
    
    try {
        const membersResponse = await fetch(`${CONFIG.API_URL}/groups/${task.groupID}/members`, {
            headers: getAuthHeaders()
        });
        const membersData = await membersResponse.json();
        
        if (membersData.status === 'success') {
            const members = membersData.data.members;
            
            const select = document.getElementById('assignUserSelect');
            select.innerHTML = '<option value="">-- Chọn thành viên --</option>' +
                members.map(m => 
                    `<option value="${m.id}">${escapeHtml(m.fullname)} (@${escapeHtml(m.username)})</option>`
                ).join('');
        }
        
        await loadTaskAssignees(taskId);
        
        document.getElementById('assignTaskId').value = taskId;
        openModal('assignModal');
    } catch (error) {
        console.error('Error opening assign modal:', error);
        alert('❌ Không thể tải thông tin nhóm');
    }
}

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
    }
}

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
                </div>
            </div>
            <button class="btn-remove" onclick="unassignUser(${assigningTaskId}, '${assignee.id}')">Hủy</button>
        </div>
    `).join('');
}

async function assignTaskToUser() {
    const taskId = assigningTaskId;
    const userId = document.getElementById('assignUserSelect').value;
    
    if (!userId) {
        alert('⚠️ Vui lòng chọn thành viên');
        return;
    }
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/tasks/${taskId}/assign`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ assignedTo: userId })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            alert('✅ Giao việc thành công!');
            await loadTaskAssignees(taskId);
            document.getElementById('assignUserSelect').value = '';
        } else {
            alert('❌ ' + (data.message || 'Không thể giao việc'));
        }
    } catch (error) {
        console.error('Error assigning task:', error);
        alert('❌ Có lỗi xảy ra');
    }
}

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

// ===== PROFILE =====
async function loadProfile() {
    const user = getUser();
    if (user) {
        document.getElementById('profileUsername').value = user.username;
        document.getElementById('profileFullname').value = user.fullname;
        document.getElementById('profileEmail').value = user.email;
    }
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const profileData = {
        fullname: document.getElementById('profileFullname').value.trim(),
        email: document.getElementById('profileEmail').value.trim()
    };
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/auth/profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(profileData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            saveUser(data.data.user);
            loadUserInfo();
            alert('✅ Cập nhật thành công!');
        } else {
            alert('❌ ' + (data.message || 'Có lỗi xảy ra'));
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('❌ Không thể cập nhật thông tin');
    }
});

// ===== UTILITIES =====
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}