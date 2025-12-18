# 📋 Hướng dẫn Sử Dụng Các Chức Năng Task Management

## ✅ Các Chức Năng Đã Implement

### 1️⃣ **QUẢN LÝ CÔNG VIỆC (TASK)**

#### ➕ **Thêm Công Việc Mới**
- **Nút:** "➕ Thêm công việc" (góc trên phải trang Tasks)
- **Chức năng:**
  - Mở modal nhập thông tin task
  - Nhập tên công việc (bắt buộc)
  - Nhập mô tả (tùy chọn)
  - Chọn nhóm (tùy chọn - để trống nếu công việc cá nhân)
  - Chọn trạng thái (Pending, In Progress, Completed)
  - Chọn độ ưu tiên (1-5 sao)
  - Click "Lưu" để tạo mới
- **API:** POST `/api/tasks/create`

#### ✏️ **Sửa Công Việc**
- **Nút:** ✏️ (trên mỗi task card)
- **Chức năng:**
  - Click nút sửa để mở modal với thông tin task cũ
  - Chỉnh sửa bất kỳ thông tin nào
  - Click "Lưu" để cập nhật
- **API:** PUT `/api/tasks/{taskId}`

#### 🗑️ **Xóa Công Việc**
- **Nút:** 🗑️ (trên mỗi task card)
- **Chức năng:**
  - Click nút xóa
  - Xác nhận xóa (không thể hoàn tác)
  - Task bị xóa vĩnh viễn
- **API:** DELETE `/api/tasks/{taskId}`

#### 👥 **Giao Công Việc Cho Thành Viên**
- **Nút:** 👥 (chỉ hiển thị với tasks thuộc nhóm)
- **Chức năng:**
  - Click nút giao việc
  - Chọn thành viên từ dropdown
  - Click "Giao việc" để gán
  - Xem danh sách người đã được giao
  - Click "🗑️ Hủy" để hủy giao việc
- **API:** 
  - POST `/api/tasks/{taskId}/assign`
  - DELETE `/api/tasks/{taskId}/assign/{userId}`

---

### 2️⃣ **QUẢN LÝ NHÓM (GROUP)**

#### ➕ **Tạo Nhóm Mới**
- **Nút:** "➕ Tạo nhóm" (góc trên phải trang Groups)
- **Chức năng:**
  - Mở modal nhập tên nhóm
  - Nhập tên nhóm (bắt buộc)
  - Click "Lưu" để tạo
  - Bạn sẽ tự động trở thành trưởng nhóm
- **API:** POST `/api/groups`

#### ✏️ **Sửa Nhóm**
- **Nút:** ✏️ (chỉ hiển thị cho trưởng nhóm)
- **Chức năng:**
  - Click nút sửa
  - Thay đổi tên nhóm
  - Click "Lưu" để cập nhật
- **API:** PUT `/api/groups/{groupId}`

#### 🗑️ **Xóa Nhóm**
- **Nút:** 🗑️ (chỉ hiển thị cho trưởng nhóm)
- **Chức năng:**
  - Click nút xóa
  - Xác nhận (⚠️ Sẽ xóa tất cả tasks trong nhóm)
  - Nhóm bị xóa vĩnh viễn
- **API:** DELETE `/api/groups/{groupId}`

#### 🚪 **Rời Khỏi Nhóm**
- **Nút:** 🚪 Rời (chỉ hiển thị cho thành viên bình thường)
- **Chức năng:**
  - Click nút rời
  - Xác nhận
  - Bạn sẽ được loại khỏi nhóm
- **API:** POST `/api/groups/{groupId}/leave`

---

### 3️⃣ **QUẢN LÝ THÀNH VIÊN (MEMBERS)**

#### ➕ **Thêm Thành Viên Vào Nhóm**
- **Nút:** "👥 Thành viên" (trên mỗi group card)
- **Chức năng:**
  - Click nút để mở modal quản lý thành viên
  - Nhập username hoặc tên đầy đủ trong ô tìm kiếm
  - Chọn user từ danh sách kết quả
  - Thành viên sẽ được thêm vào nhóm
- **API:** POST `/api/groups/{groupId}/members`

#### 🗑️ **Xóa Thành Viên Khỏi Nhóm**
- **Nút:** 🗑️ (cạnh mỗi thành viên, chỉ trưởng nhóm)
- **Chức năng:**
  - Click nút xóa
  - Xác nhận
  - Thành viên bị loại khỏi nhóm
- **API:** DELETE `/api/groups/{groupId}/members/{userId}`

---

## 📍 **Vị Trí Các Nút Trên Giao Diện**

### Trang **Công Việc (Tasks)**
```
┌─────────────────────────────────────────┐
│  📝 Công việc của tôi   [➕ Thêm việc]   │
├─────────────────────────────────────────┤
│ [Bộ lọc Status] [Bộ lọc Priority] [🔍]  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Task 1: ...                      │  │
│  │ ⭐⭐⭐                            │  │
│  │ 👥 Giao việc ✏️ Sửa 🗑️ Xóa     │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ Task 2: ...                      │  │
│  │ ⭐⭐                              │  │
│  │ 👥 Giao việc ✏️ Sửa 🗑️ Xóa     │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Trang **Nhóm (Groups)**
```
┌─────────────────────────────────────────┐
│  👥 Nhóm của tôi   [➕ Tạo nhóm]        │
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │ Nhóm 1: "Dự án A"               │  │
│  │ 👑 Bạn là trưởng nhóm           │  │
│  │ 👨‍👩‍👧‍👦 5 thành viên               │  │
│  │                                  │  │
│  │ [👥 Thành viên] [✏️ Sửa] [🗑️ Xóa]│  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ Nhóm 2: "Dự án B"               │  │
│  │ 👤 Thành viên                    │  │
│  │ 👨‍👩‍👧‍👦 3 thành viên               │  │
│  │                                  │  │
│  │ [👥 Thành viên] [🚪 Rời]        │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Modal **Quản Lý Thành Viên**
```
┌─────────────────────────────────────────┐
│ ✕ Thành viên nhóm                      │
├─────────────────────────────────────────┤
│ 🔍 Tìm thành viên để thêm...           │
│ ┌─────────────────────────────────┐   │
│ │ User 1 - Tên Đầy Đủ 1           │   │
│ │ @username1                       │   │
│ └─────────────────────────────────┘   │
│                                         │
│ Danh sách thành viên:                   │
│ ┌─────────────────────────────────┐   │
│ │ Nguyễn Văn A (👑 Trưởng nhóm)   │   │
│ │ Trần Thị B                       │   │
│ │ [🗑️ Xóa]                         │   │
│ │                                   │   │
│ │ Lê Văn C                          │   │
│ │ [🗑️ Xóa]                         │   │
│ └─────────────────────────────────┘   │
│                                         │
│ [Đóng]                                  │
└─────────────────────────────────────────┘
```

### Modal **Giao Công Việc**
```
┌─────────────────────────────────────────┐
│ ✕ Giao công việc                       │
├─────────────────────────────────────────┤
│ Chọn thành viên:                        │
│ [▼ -- Chọn thành viên --]              │
│   - Nguyễn Văn A (@nvan_a)             │
│   - Trần Thị B (@tthi_b)               │
│   - Lê Văn C (@lvan_c)                 │
│                                         │
│ Đã giao cho:                            │
│ ┌─────────────────────────────────┐   │
│ │ Nguyễn Văn A                     │   │
│ │ @nvan_a                          │   │
│ │                    [🗑️ Hủy]      │   │
│ │                                   │   │
│ │ Trần Thị B                       │   │
│ │ @tthi_b                          │   │
│ │                    [🗑️ Hủy]      │   │
│ └─────────────────────────────────┘   │
│                                         │
│ [Đóng] [Giao việc]                     │
└─────────────────────────────────────────┘
```

---

## 🔧 **Chi Tiết Kỹ Thuật**

### File Chính
- **Frontend:**
  - `views/dashboard.html` - HTML structure
  - `views/js/config.js` - Configuration
  - `views/js/functions.js` - **TẤT CẢ CÁC HÀM CHỨC NĂNG**
  - `views/js/enhanced-dashboard.js` - Core logic
  - `views/css/enhanced-dashboard.css` - Styling

### Backend API Endpoints
```
TASKS:
- POST   /api/tasks/create            (Tạo task)
- GET    /api/tasks                   (Lấy danh sách tasks)
- GET    /api/tasks/:taskId           (Lấy task theo ID)
- PUT    /api/tasks/:taskId           (Sửa task)
- DELETE /api/tasks/:taskId           (Xóa task)
- GET    /api/tasks/:taskId/assignees (Lấy danh sách người được giao)
- POST   /api/tasks/:taskId/assign    (Giao task)
- DELETE /api/tasks/:taskId/assign/:userId (Hủy giao task)

GROUPS:
- POST   /api/groups                  (Tạo group)
- GET    /api/groups                  (Lấy danh sách groups)
- GET    /api/groups/:groupId         (Lấy group theo ID)
- PUT    /api/groups/:groupId         (Sửa group)
- DELETE /api/groups/:groupId         (Xóa group)
- POST   /api/groups/:groupId/leave   (Rời khỏi group)

MEMBERS:
- GET    /api/groups/:groupId/members (Lấy danh sách members)
- POST   /api/groups/:groupId/members (Thêm member)
- DELETE /api/groups/:groupId/members/:userId (Xóa member)
```

---

## 📝 **Các Hàm JavaScript Chính**

### Task Functions (trong `views/js/functions.js`)
- `openCreateTaskModal()` - Mở modal tạo task
- `openEditTaskModal(taskId)` - Mở modal sửa task
- `saveTask()` - Lưu/cập nhật task
- `deleteTask(taskId)` - Xóa task
- `saveStatusUpdate()` - Cập nhật trạng thái task

### Group Functions
- `openCreateGroupModal()` - Mở modal tạo group
- `openEditGroupModal(groupId)` - Mở modal sửa group
- `saveGroup()` - Lưu/cập nhật group
- `deleteGroup(groupId)` - Xóa group
- `leaveGroup(groupId)` - Rời khỏi group

### Member Functions
- `addMemberToGroup(groupId, userId)` - Thêm thành viên
- `removeMember(groupId, userId)` - Xóa thành viên
- `openMembersModal(groupId)` - Mở modal quản lý thành viên

### Assignment Functions
- `openAssignModal(taskId)` - Mở modal giao task
- `assignTaskToUser()` - Giao task cho user
- `unassignUser(taskId, userId)` - Hủy giao task
- `loadTaskAssignees(taskId)` - Load danh sách người được giao
- `displayAssignees(assignees)` - Hiển thị danh sách người được giao

---

## ✨ **Lưu Ý Quan Trọng**

1. **Quyền truy cập:**
   - Chỉ trưởng nhóm mới có thể sửa/xóa nhóm
   - Chỉ trưởng nhóm mới có thể thêm/xóa thành viên
   - Bất kỳ ai cũng có thể giao task cho thành viên trong group của họ

2. **Validation:**
   - Tên task/group bắt buộc không được để trống
   - Priority: 1-5 (⭐⭐⭐⭐⭐)
   - Status: Pending, In Progress, Completed

3. **Xóa dữ liệu:**
   - Xóa group sẽ xóa tất cả tasks trong group đó
   - Hành động xóa không thể hoàn tác
   - Luôn có xác nhận trước khi xóa

4. **UX/UI:**
   - Các nút action có icon emoji để dễ nhận biết
   - Modal tự động đóng sau khi lưu thành công
   - Alert thông báo kết quả của mỗi hành động
   - Danh sách tự động cập nhật sau thay đổi

---

## 🚀 **Cách Sử Dụng**

### Bước 1: Tạo Nhóm
1. Chuyển đến tab "👥 Nhóm"
2. Click "➕ Tạo nhóm"
3. Nhập tên nhóm
4. Click "Lưu"

### Bước 2: Thêm Thành Viên
1. Click "👥 Thành viên" trên group card
2. Tìm kiếm user (nhập username hoặc tên)
3. Click user muốn thêm
4. Thành viên được thêm vào danh sách

### Bước 3: Tạo Task
1. Chuyển đến tab "📝 Công việc"
2. Click "➕ Thêm công việc"
3. Điền thông tin task
4. (Nếu muốn giao) Chọn nhóm
5. Click "Lưu"

### Bước 4: Giao Task
1. Click nút "👥" trên task card
2. Chọn thành viên từ dropdown
3. Click "Giao việc"
4. Thành viên sẽ thấy task trong "Công việc được giao"

---

**Chúc bạn sử dụng hiệu quả! 🎉**
