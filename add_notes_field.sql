-- Thêm trường notes vào bảng task_assignment
ALTER TABLE task_assignment 
ADD COLUMN notes TEXT DEFAULT NULL AFTER assignedAt;

-- Kiểm tra cấu trúc bảng
DESCRIBE task_assignment;
