// views/js/config.js
// Configuration với auto-detect environment - SECURED VERSION

// ===== AUTO-DETECT API URL =====
function getApiUrl() {
    const hostname = window.location.hostname;
    
    // Development (localhost)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    
    // Production - Thay đổi URL này khi deploy
    return `${window.location.origin}/api`;
}

// ===== CONFIG OBJECT =====
const CONFIG = {
    // API URL tự động detect
    API_URL: getApiUrl(),
    
    // LocalStorage keys
    TOKEN_KEY: 'token',
    USER_KEY: 'user',
    
    // Request timeout (30 seconds)
    TIMEOUT: 30000,
    
    // App info
    APP_NAME: 'Task Manager',
    VERSION: '1.0.0',
    
    // ✅ QUAN TRỌNG: CHỈ BẬT DEBUG Ở LOCALHOST
    // Trong production sẽ tự động TẮT
    DEBUG: false, // ⚠️ ĐỔI THÀNH false ĐỂ TẮT HOÀN TOÀN
    
    // Environment
    ENV: window.location.hostname === 'localhost' ? 'development' : 'production'
};

// ===== HELPER FUNCTIONS =====

/**
 * Lấy token từ localStorage
 */
function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
}

/**
 * Lưu token vào localStorage
 */
function saveToken(token) {
    localStorage.setItem(CONFIG.TOKEN_KEY, token);
    // ✅ Đã XÓA console.log để không lộ thông tin
}

/**
 * Xóa token và user info (logout)
 */
function removeToken() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    // ✅ Đã XÓA console.log
}

/**
 * Lưu thông tin user
 */
function saveUser(user) {
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    // ✅ Đã XÓA console.log để không lộ user info
}

/**
 * Lấy thông tin user
 */
function getUser() {
    const user = localStorage.getItem(CONFIG.USER_KEY);
    return user ? JSON.parse(user) : null;
}

/**
 * Lấy headers với token cho API requests
 * ✅ ĐÃ XÓA TẤT CẢ console.log ĐỂ KHÔNG LỘ TOKEN
 */
function getAuthHeaders() {
    const token = getToken();
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // CHỈ thêm Authorization header nếu có token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

/**
 * Kiểm tra đã đăng nhập chưa
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Redirect về login nếu chưa đăng nhập
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

/**
 * Handle API response và errors
 */
async function handleApiResponse(response) {
    const data = await response.json();
    
    // Xử lý 401 Unauthorized
    if (response.status === 401) {
        removeToken();
        window.location.href = 'login.html';
        throw new Error('Session expired. Please login again.');
    }
    
    // Xử lý errors khác
    if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
}

/**
 * Fetch wrapper với error handling
 * ✅ CHỈ LOG ERROR, KHÔNG LOG SENSITIVE DATA
 */
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...options.headers
            }
        });
        
        const data = await handleApiResponse(response);
        
        return data;
    } catch (error) {
        if (CONFIG.DEBUG) {
            console.error('❌ API Error:', error.message); // Chỉ log message, không log chi tiết
        }
        throw error;
    }
}

/**
 * Show alert/notification
 */
function showAlert(message, type = 'info') {
    const alertDiv = document.getElementById('alert');
    if (alertDiv) {
        alertDiv.textContent = message;
        alertDiv.className = `alert alert-${type} show`;
        
        setTimeout(() => {
            alertDiv.classList.remove('show');
        }, 5000);
    } else {
        console.log(`[${type.toUpperCase()}]`, message);
    }
}

// ===== LOG CONFIG ON LOAD (CHỈ KHI DEBUG = TRUE) =====
if (CONFIG.DEBUG) {
    console.log('🔧 Configuration loaded:', {
        API_URL: CONFIG.API_URL,
        Environment: CONFIG.ENV,
        Debug: CONFIG.DEBUG
    });
}

// ===== EXPORT (nếu dùng modules) =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        getToken,
        saveToken,
        removeToken,
        saveUser,
        getUser,
        getAuthHeaders,
        isAuthenticated,
        requireAuth,
        apiRequest,
        showAlert
    };
}