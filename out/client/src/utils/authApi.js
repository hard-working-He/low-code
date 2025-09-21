"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoredToken = getStoredToken;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.logoutUser = logoutUser;
// API基础URL，您可以根据实际情况修改
const API_BASE_URL = 'https://81.68.224.194:8080/api/v1'; // 假设后端服务运行在3001端口
// 通用的API请求函数
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    const finalOptions = { ...defaultOptions, ...options };
    try {
        const response = await fetch(url, finalOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}
// 获取存储的token
function getStoredToken() {
    try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
            const parsed = JSON.parse(authStorage);
            return parsed.state?.token || null;
        }
    }
    catch (error) {
        console.error('Error getting stored token:', error);
    }
    return null;
}
// 用户注册
async function registerUser(userData) {
    return apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
}
// 用户登录
async function loginUser(credentials) {
    return apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
}
// 用户登出
async function logoutUser() {
    const token = getStoredToken();
    if (!token) {
        throw new Error('No token found');
    }
    return apiRequest('/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
}
