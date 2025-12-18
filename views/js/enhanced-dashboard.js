// enhanced-dashboard.js - FIXED VERSION
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
            console.log('Loaded tasks:', currentTasks);
            displayTasks(currentTasks);

            // 🔥 đảm bảo group đã load
            if (currentGroups.length === 0) {
                const groups = await loadGroups();
                populateGroupSelect(groups);
            } else {
                populateGroupSelect(currentGroups);
            }

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
                    <button class="btn-icon" onclick="openEditTaskModal('${taskId}')" title="Sửa công việc">✏️</button>
                    <button class="btn-icon" onclick="deleteTask('${taskId}')" title="Xóa công việc">🗑️</button>
                    <button class="btn-icon" onclick="openUpdateStatusModal('${taskId}')" title="Cập nhật trạng thái">🔄</button>
                    ${task.groupID ? `<button class="btn-icon" onclick="openAssignModal('${taskId}')" title="Giao việc">👤</button>` : ''}
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
            window.currentAssignedTasks = data.data.tasks;
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
            ${task.notes ? `<div class="task-notes" style="background: #f0f7ff; padding: 8px; border-left: 3px solid #0066cc; margin: 10px 0; border-radius: 2px;"><strong>📝 Ghi chú:</strong> ${escapeHtml(task.notes)}</div>` : ''}
            <div class="task-meta">
                ${task.groupName ? `<div class="task-meta-item">👥 ${escapeHtml(task.groupName)}</div>` : ''}
                <div class="task-meta-item">👤 Giao bởi: ${escapeHtml(task.assignedBy_fullname || task.assignedBy_name || 'N/A')}</div>
            </div>
            <div class="task-footer">
                <span class="task-status ${statusClass}">${task.status}</span>
                ${task.status !== 'Completed' ? `<button class="btn-icon" onclick="openUpdateStatusModal('${taskId}')" title="Cập nhật trạng thái">🔄 Cập nhật</button>` : ''}
            </div>
        </div>
        `;
    }).join('');
}

// ===== MODAL - FIXED VERSION =====
// ⚠️ CHỈ MỞ MODAL, KHÔNG RESET FORM
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
    assigningTaskId = null;
}

function populateGroupSelect(groups) {
    const select = document.getElementById('taskGroup');
    select.innerHTML = '<option value="">Không thuộc nhóm</option>' +
        groups.filter(g => g.role === 'leader').map(g => 
            `<option value="${g.groupID}">${escapeHtml(g.groupName)}</option>`
        ).join('');
}

async function loadGroups() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/groups`, {
            headers: getAuthHeaders()
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            currentGroups = data.data.groups;
            displayGroups(currentGroups);
            return currentGroups; // ✅ THÊM DÒNG NÀY
        }
        return [];
    } catch (error) {
        console.error('Error loading groups:', error);
        document.getElementById('groupsList').innerHTML = `
            <div class="empty-state">
                <h3>❌ Lỗi tải dữ liệu</h3>
                <p>${error.message}</p>
            </div>
        `;
        return [];
    }
}

function displayGroups(groups) {
    const container = document.getElementById('groupsList');
    
    console.log('📊 Displaying groups:', groups); // ✅ Debug line
    
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
    
    console.log('✅ Groups displayed successfully'); // ✅ Debug line
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

// ===== NAVIGATION =====
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', async (e) => {
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
        
        // Load data - QUAN TRỌNG: Luôn reload từ API
        console.log('📍 Navigating to page:', page);
        if (page === 'tasks') await loadTasks();
        if (page === 'assigned') await loadAssignedTasks();
        if (page === 'groups') {
            console.log('🔄 Loading groups from navigation...');
            await loadGroups();
        }
        if (page === 'profile') await loadProfile();
    });
});