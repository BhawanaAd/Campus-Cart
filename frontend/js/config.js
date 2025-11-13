
const API_BASE_URL = 'http://localhost:3000/api';

const API_ENDPOINTS = {
    AUTH: {
        LOGIN: `${API_BASE_URL}/auth/login`,
        REGISTER: `${API_BASE_URL}/auth/register`,
        PROFILE: `${API_BASE_URL}/auth/profile`
    },
    RESTAURANTS: {
        LIST: `${API_BASE_URL}/restaurants`,
        BY_ID: (id) => `${API_BASE_URL}/restaurants/${id}`,
        VENDOR_RESTAURANTS: `${API_BASE_URL}/restaurants/vendor/my-restaurants`,
        UPDATE_STATUS: (id) => `${API_BASE_URL}/restaurants/${id}/status`
    },
    MENU: {
        GET_RESTAURANT_MENU: (id) => `${API_BASE_URL}/menu/restaurant/${id}`,
        VENDOR_MENU: (id) => `${API_BASE_URL}/menu/vendor/restaurant/${id}`
    },
    ORDERS: {
        CREATE: `${API_BASE_URL}/orders`,
        MY_ORDERS: `${API_BASE_URL}/orders/my-orders`,
        VENDOR_ORDERS: `${API_BASE_URL}/orders/vendor/orders`,
        UPDATE_STATUS: (id) => `${API_BASE_URL}/orders/${id}/status`,
        DETAILS: (id) => `${API_BASE_URL}/orders/${id}`
    },
    INVENTORY: {
        VENDOR_INVENTORY: `${API_BASE_URL}/inventory/vendor`,
        LOW_STOCK_ALERTS: `${API_BASE_URL}/inventory/alerts/low-stock`,
        RESTOCK: `${API_BASE_URL}/inventory/restock`,
        ADJUST: `${API_BASE_URL}/inventory/adjust`,
        ITEM_LOGS: (id) => `${API_BASE_URL}/inventory/logs/${id}`
    }
};

let currentUser = null;
let authToken = localStorage.getItem('authToken');
let currentRestaurant = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

console.log('CampusCart Config Loaded');
console.log(' API Base URL:', API_BASE_URL);