// views/js/config.js
// Configuration với auto-detect environment

// ===== AUTO-DETECT API URL =====
function getApiUrl() {
    const hostname = window.location.hostname;
    
    // Development (localhost)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3000/api';
    }
    
    // Production - Thay đổi URL này khi deploy
    // Ví dụ: return 'https://api.yourdomain.com/api';
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
    
    // Debug mode (tự động bật ở localhost)
    DEBUG: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
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
    if (CONFIG.DEBUG) console.log('🔐 Token saved');
}

/**
 * Xóa token và user info (logout)
 */
function removeToken() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    if (CONFIG.DEBUG) console.log('🚪 Token removed');
}

/**
 * Lưu thông tin user
 */
function saveUser(user) {
    localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(user));
    if (CONFIG.DEBUG) console.log('👤 User saved:', user);
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
 */
function getAuthHeaders() {
    const token = getToken();
    
    if (CONFIG.DEBUG) {
        console.log('🔐 Token từ localStorage:', token ? token.substring(0, 20) + '...' : 'KHÔNG CÓ');
    }
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // CHỈ thêm Authorization header nếu có token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (CONFIG.DEBUG) {
        console.log('📤 Headers được gửi:', headers);
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
    // Parse JSON
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
 */
async function apiRequest(url, options = {}) {
    try {
        if (CONFIG.DEBUG) {
            console.log('📡 API Request:', {
                url,
                method: options.method || 'GET',
                body: options.body ? JSON.parse(options.body) : null
            });
        }
        
        const response = await fetch(url, {
            ...options,
            headers: {
                ...getAuthHeaders(),
                ...options.headers
            }
        });
        
        const data = await handleApiResponse(response);
        
        if (CONFIG.DEBUG) {
            console.log('✅ API Response:', data);
        }
        
        return data;
    } catch (error) {
        if (CONFIG.DEBUG) {
            console.error('❌ API Error:', error);
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
        // Fallback to console if no alert div
        console.log(`[${type.toUpperCase()}]`, message);
    }
}

// ===== LOG CONFIG ON LOAD =====
if (CONFIG.DEBUG) {
    console.log('🔧 Configuration loaded:', {
        API_URL: CONFIG.API_URL,
        Environment: CONFIG.ENV,
        Hostname: window.location.hostname,
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