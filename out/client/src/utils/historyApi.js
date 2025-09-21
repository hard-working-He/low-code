"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHistory = createHistory;
exports.getHistories = getHistories;
exports.getHistoryById = getHistoryById;
exports.updateHistory = updateHistory;
exports.deleteHistory = deleteHistory;
const authApi_1 = require("./authApi");
// API基础URL
const API_BASE_URL = 'http://81.68.224.194:8080/api/v1';
// 通用的带认证的API请求函数
async function authenticatedApiRequest(endpoint, options = {}) {
    const token = (0, authApi_1.getStoredToken)();
    if (!token) {
        throw new Error('用户未登录');
    }
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
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
// 创建历史记录
async function createHistory(historyData) {
    return authenticatedApiRequest('/lowcode/histories', {
        method: 'POST',
        body: JSON.stringify(historyData),
    });
}
// 获取所有历史记录
async function getHistories() {
    return authenticatedApiRequest('/lowcode/histories');
}
// 获取特定历史记录
async function getHistoryById(id) {
    return authenticatedApiRequest(`/lowcode/histories/${id}`);
}
// 更新历史记录
async function updateHistory(id, historyData) {
    return authenticatedApiRequest(`/lowcode/histories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(historyData),
    });
}
// 删除历史记录
async function deleteHistory(id) {
    return authenticatedApiRequest(`/lowcode/histories/${id}`, {
        method: 'DELETE',
    });
}
