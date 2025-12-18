# 🎯 Hướng Dẫn Kiểm Tra Các Chức Năng Mới

## 📋 Danh Sách Chức Năng Được Implement

### ✅ **1. Quản Lý Công Việc (Task Management)**

#### ➕ Thêm Công Việc
- **Vị trí:** Nút "➕ Thêm công việc" ở góc trên phải trang "📝 Công việc"
- **Cách kiểm tra:**
  1. Chuyển đến tab "📝 Công việc"
  2. Click nút "➕ Thêm công việc"
  3. Một modal sẽ hiển thị với các trường:
     - Tên công việc (bắt buộc)
     - Mô tả (tùy chọn)
     - Chọn nhóm (tùy chọn)
     - Trạng thái (Pending/In Progress/Completed)
     - Độ ưu tiên (1-5 sao)
  4. Điền thông tin và click "Lưu"
  5. Task sẽ xuất hiện trong danh sách

#### ✏️ Sửa Công Việc
- **Vị trí:** Nút "✏️" trên mỗi task card
- **Cách kiểm tra:**
  1. Click nút "✏️" trên một task
  2. Modal mở với tiêu đề "✏️ Sửa công việc"
  3. Form điền sẵn thông tin cũ
  4. Chỉnh sửa và click "Lưu"
  5. Task được cập nhật ngay lập tức

#### 🗑️ Xóa Công Việc
- **Vị trí:** Nút "🗑️" trên mỗi task card
- **Cách kiểm tra:**
  1. Click nút "🗑️" trên một task
  2. Một confirm dialog hiển thị: "⚠️ Bạn có chắc muốn xóa công việc này?"
  3. Click "OK" để xác nhận
  4. Task bị xóa khỏi danh sách

#### 👥 Giao Công Việc Cho Thành Viên
- **Vị trí:** Nút "👥" trên task card (chỉ hiển thị khi task thuộc một nhóm)
- **Cách kiểm tra:**
  1. Tạo task và chọn một nhóm
  2. Task card sẽ có nút "👥"
  3. Click "👥" để mở modal "Giao công việc"
  4. Modal hiển thị:
     - Dropdown chọn thành viên
     - Danh sách người đã được giao (với nút "🗑️ Hủy")
  5. Chọn member từ dropdown
  6. Click "Giao việc"
  7. Member sẽ xuất hiện trong danh sách "Đã giao cho"

---

### ✅ **2. Quản Lý Nhóm (Group Management)**

#### ➕ Tạo Nhóm Mới
- **Vị trí:** Nút "➕ Tạo nhóm" ở góc trên phải trang "👥 Nhóm"
- **Cách kiểm tra:**
  1. Chuyển đến tab "👥 Nhóm"
  2. Click "➕ Tạo nhóm"
  3. Modal hiển thị với trường "Tên nhóm"
  4. Nhập tên (ví dụ: "Dự án Marketing")
  5. Click "Lưu"
  6. Nhóm xuất hiện trong danh sách với:
     - Icon "👑" (bạn là trưởng nhóm)
     - Nút "👥 Thành viên", "✏️ Sửa", "🗑️ Xóa"

#### ✏️ Sửa Nhóm
- **Vị trí:** Nút "✏️" trên group card (chỉ cho trưởng nhóm)
- **Cách kiểm tra:**
  1. Click "✏️" trên một nhóm bạn tạo
  2. Modal mở với tiêu đề "✏️ Sửa nhóm"
  3. Tên nhóm điền sẵn
  4. Thay đổi tên
  5. Click "Lưu"
  6. Tên nhóm được cập nhật

#### 🗑️ Xóa Nhóm
- **Vị trí:** Nút "🗑️" trên group card (chỉ cho trưởng nhóm)
- **Cách kiểm tra:**
  1. Click "🗑️" trên một nhóm
  2. Confirm dialog hiển thị: "⚠️ Tất cả tasks trong nhóm cũng sẽ bị xóa!"
  3. Click "OK" để xác nhận
  4. Nhóm bị xóa
  5. Tất cả tasks trong nhóm cũng bị xóa

#### 🚪 Rời Nhỏm (Cho Member)
- **Vị trí:** Nút "🚪 Rời" trên group card (chỉ cho member, không phải leader)
- **Cách kiểm tra:**
  1. Yêu cầu leader thêm bạn vào một nhóm (xem phần "Thêm Thành Viên")
  2. Nhóm sẽ hiển thị với nút "🚪 Rời"
  3. Click "🚪 Rời"
  4. Confirm dialog: "Bạn có chắc muốn rời khỏi nhóm này?"
  5. Click "OK"
  6. Bạn bị loại khỏi nhóm

---

### ✅ **3. Quản Lý Thành Viên (Member Management)**

#### ➕ Thêm Thành Viên
- **Vị trí:** Click "👥 Thành viên" trên group card để mở modal
- **Cách kiểm tra:**
  1. Click "👥 Thành viên" trên một nhóm (bạn phải là leader)
  2. Modal "Thành viên nhóm" mở với:
     - Ô tìm kiếm "🔍 Tìm thành viên để thêm..."
     - Danh sách thành viên hiện tại
  3. Gõ username hoặc tên đầy đủ trong ô tìm kiếm
  4. Danh sách kết quả xuất hiện dưới
  5. Click trên user muốn thêm
  6. Alert "✅ Thêm thành viên thành công!"
  7. User xuất hiện trong danh sách "Danh sách thành viên"

#### 🗑️ Xóa Thành Viên
- **Vị trí:** Nút "🗑️" cạnh mỗi thành viên (chỉ cho leader)
- **Cách kiểm tra:**
  1. Mở modal "Thành viên nhóm" (xem trên)
  2. Nhìn danh sách thành viên
  3. Click "🗑️" cạnh một member
  4. Confirm: "Bạn có chắc muốn xóa thành viên này khỏi nhóm?"
  5. Click "OK"
  6. Alert "✅ Đã xóa thành viên!"
  7. Member bị loại khỏi danh sách

---

## 🧪 Test Scenarios (Kịch Bản Kiểm Tra)

### **Scenario 1: Tạo Nhóm + Thêm Member + Tạo Task + Giao Task**

**Bước 1:** Tạo Nhóm
```
1. Chuyển tab "👥 Nhóm"
2. Click "➕ Tạo nhóm"
3. Nhập tên: "Team Marketing"
4. Click "Lưu"
✓ Nhóm "Team Marketing" xuất hiện
```

**Bước 2:** Thêm Thành Viên
```
1. Click "👥 Thành viên" trên nhóm vừa tạo
2. Tìm kiếm user khác (ví dụ: "john")
3. Click user để thêm
✓ User được thêm vào nhóm
```

**Bước 3:** Tạo Task trong Nhóm
```
1. Chuyển tab "📝 Công việc"
2. Click "➕ Thêm công việc"
3. Nhập:
   - Tên: "Tạo banner marketing"
   - Mô tả: "Banner cho campaign tháng 5"
   - Chọn nhóm: "Team Marketing"
   - Priority: ⭐⭐⭐⭐
4. Click "Lưu"
✓ Task xuất hiện trong danh sách, có nút "👥"
```

**Bước 4:** Giao Task
```
1. Click "👥" trên task vừa tạo
2. Modal "Giao công việc" mở
3. Dropdown chọn: "John Doe"
4. Click "Giao việc"
✓ "John Doe" xuất hiện trong "Đã giao cho"
```

**Bước 5:** Hủy Giao Task
```
1. Vẫn trong modal "Giao công việc"
2. Click "🗑️ Hủy" cạnh "John Doe"
✓ John Doe bị loại khỏi danh sách
```

---

### **Scenario 2: Sửa Task + Cập Nhật Priority**

```
1. Chuyển tab "📝 Công việc"
2. Click "✏️" trên một task
3. Modal "✏️ Sửa công việc" mở
4. Thay đổi:
   - Tên task
   - Mô tả
   - Priority (chọn số sao khác)
5. Click "Lưu"
✓ Task được cập nhật ngay lập tức
```

---

### **Scenario 3: Kiểm Tra Quyền Truy Cập (Permission)**

#### Kịch Bản A: Leader
```
✓ Thấy nút "✏️ Sửa" trên group
✓ Thấy nút "🗑️ Xóa" trên group
✓ Thấy nút "🗑️" cạnh members (để xóa members)
✓ Có thể thêm members vào group
```

#### Kịch Bản B: Member
```
✓ Thấy "👤 Thành viên" thay vì "👑 Bạn là trưởng nhóm"
✓ Thấy nút "🚪 Rời" thay vì "✏️ Sửa" và "🗑️ Xóa"
✓ Không thấy nút "🗑️" cạnh members
✓ Có thể click "👥 Thành viên" để xem danh sách
```

---

### **Scenario 4: Error Handling**

#### Test 1: Tên trống
```
1. Click "➕ Thêm công việc"
2. Không nhập tên
3. Click "Lưu"
✓ Alert: "⚠️ Vui lòng nhập tên công việc"
```

#### Test 2: Xóa item cần xác nhận
```
1. Click "🗑️" trên task/group
2. Popup xác nhận hiển thị
3. Click "Cancel"
✓ Item không bị xóa
```

---

## 📝 Chi Tiết File Code

### **File Chứa Tất Cả Hàm Chức Năng**
📍 `views/js/functions.js` (NEW FILE)

**Các hàm chính:**

#### Task Functions
```javascript
✓ openCreateTaskModal()        - Mở modal tạo task
✓ openEditTaskModal(taskId)    - Mở modal sửa task
✓ saveTask()                   - Lưu/cập nhật task
✓ deleteTask(taskId)           - Xóa task
✓ saveStatusUpdate()           - Cập nhật status task
```

#### Group Functions
```javascript
✓ openCreateGroupModal()       - Mở modal tạo group
✓ openEditGroupModal(groupId)  - Mở modal sửa group
✓ saveGroup()                  - Lưu/cập nhật group
✓ deleteGroup(groupId)         - Xóa group
✓ leaveGroup(groupId)          - Rời khỏi group
```

#### Member Functions
```javascript
✓ addMemberToGroup()           - Thêm member
✓ removeMember()               - Xóa member
```

#### Assignment Functions
```javascript
✓ openAssignModal()            - Mở modal giao task
✓ assignTaskToUser()           - Giao task cho user
✓ unassignUser()               - Hủy giao task
✓ loadTaskAssignees()          - Load danh sách người được giao
✓ displayAssignees()           - Hiển thị danh sách
```

#### Display Functions
```javascript
✓ displayGroups()              - Hiển thị danh sách group
✓ displayTasks()               - Hiển thị danh sách task
```

---

## 🔗 Kết Nối Backend API

### **Task APIs**
```
✓ POST   /api/tasks/create            ← saveTask()
✓ GET    /api/tasks                   ← loadTasks()
✓ PUT    /api/tasks/:taskId           ← openEditTaskModal() + saveTask()
✓ DELETE /api/tasks/:taskId           ← deleteTask()
✓ GET    /api/tasks/:taskId/assignees ← loadTaskAssignees()
✓ POST   /api/tasks/:taskId/assign    ← assignTaskToUser()
✓ DELETE /api/tasks/:taskId/assign    ← unassignUser()
```

### **Group APIs**
```
✓ POST   /api/groups                  ← saveGroup()
✓ GET    /api/groups                  ← loadGroups()
✓ PUT    /api/groups/:groupId         ← openEditGroupModal() + saveGroup()
✓ DELETE /api/groups/:groupId         ← deleteGroup()
✓ POST   /api/groups/:groupId/leave   ← leaveGroup()
```

### **Member APIs**
```
✓ GET    /api/groups/:groupId/members ← openMembersModal()
✓ POST   /api/groups/:groupId/members ← addMemberToGroup()
✓ DELETE /api/groups/:groupId/members/:userId ← removeMember()
```

---

## 🎨 UI/UX Elements

### **Modals Được Sử Dụng**
- `#taskModal` - Tạo/Sửa task
- `#groupModal` - Tạo/Sửa group
- `#membersModal` - Quản lý members
- `#assignModal` - Giao task
- `#updateStatusModal` - Cập nhật status task

### **Button Styles**
- `.btn-icon` - Icon buttons (✏️, 🗑️, 👥)
- `.btn-primary` - Primary buttons (xanh dương)
- `.btn-secondary` - Secondary buttons (xám)
- `.btn-group-action` - Group action buttons
- `.btn-edit` - Edit buttons (cam)
- `.btn-delete` - Delete buttons (đỏ)
- `.btn-remove` - Remove buttons (loại bỏ)

---

## ✅ Verification Checklist

Khi test xong mỗi tính năng, đánh dấu ✓:

### **Task Management**
- [ ] ✓ Thêm công việc
- [ ] ✓ Sửa công việc
- [ ] ✓ Xóa công việc
- [ ] ✓ Giao công việc cho member

### **Group Management**
- [ ] ✓ Tạo nhóm
- [ ] ✓ Sửa nhóm (leader)
- [ ] ✓ Xóa nhóm (leader)
- [ ] ✓ Rời nhóm (member)

### **Member Management**
- [ ] ✓ Thêm thành viên
- [ ] ✓ Xóa thành viên (leader)
- [ ] ✓ Xem danh sách member

### **Permissions**
- [ ] ✓ Leader có nút sửa/xóa group
- [ ] ✓ Member thấy nút rời
- [ ] ✓ Leader thấy nút xóa member

### **Error Handling**
- [ ] ✓ Xác nhận trước xóa
- [ ] ✓ Validation input
- [ ] ✓ Alert thông báo

---

**Hết! Tất cả các chức năng đã sẵn sàng để kiểm tra. 🎉**
