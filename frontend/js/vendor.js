
class VendorManager {
    static init() {
        console.log(' VendorManager initializing...');
        
        // Dashboard tabs
        document.querySelectorAll('.dashboard-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
        const refreshOrdersBtn = document.getElementById('refresh-orders');
        const refreshInventoryBtn = document.getElementById('refresh-inventory');
        
        if (refreshOrdersBtn) {
            refreshOrdersBtn.addEventListener('click', () => this.loadVendorOrders());
        }
        
        if (refreshInventoryBtn) {
            refreshInventoryBtn.addEventListener('click', () => {
                if (window.inventoryManager) {
                    window.inventoryManager.loadInventoryDataInstance();
                }
            });
        }

        // Initialize vendor data
        this.loadVendorData();
    }

    // Load all vendor data
    static async loadVendorData() {
        console.log('📊 Loading vendor data...');
        try {
            await Promise.all([
                this.loadVendorRestaurants(),
                this.loadVendorOrders()
            ]);
            
            // Initialize inventory manager
            if (!window.inventoryManager) {
                window.inventoryManager = new InventoryManager();
            } else {
                window.inventoryManager.loadInventoryDataInstance();
            }
            
            console.log(' Vendor data loaded successfully');
        } catch (error) {
            console.error('Vendor data load error:', error);
        }
    }

 
    static switchTab(tabName) {
        console.log(' Switching to tab:', tabName);
        
        document.querySelectorAll('.dashboard-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            }
        });

        document.querySelectorAll('.dashboard-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.remove('hidden');
        } else {
            console.error('Tab not found:', tabName);
        }

        switch(tabName) {
            case 'orders':
                this.loadVendorOrders();
                break;
            case 'restaurants':
                this.loadVendorRestaurants();
                break;
            case 'inventory':
                if (window.inventoryManager) {
                    window.inventoryManager.loadInventoryDataInstance();
                }
                break;
        }
    }

    // Load vendor's restaurants
    static async loadVendorRestaurants() {
        try {
            console.log('Loading vendor restaurants...');
            Utils.showLoading();
            
            const data = await Utils.apiCall(API_ENDPOINTS.RESTAURANTS.VENDOR_RESTAURANTS);
            const restaurants = data.restaurants || [];
            console.log(' API restaurants loaded:', restaurants.length);
            
            this.renderVendorRestaurants(restaurants);

        } catch (error) {
            console.error(' Load vendor restaurants error:', error);
            Utils.showNotification('Failed to load restaurants', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // Render vendor restaurants
    static renderVendorRestaurants(restaurants) {
        const container = document.getElementById('vendor-restaurants-list');
        if (!container) {
            console.error(' vendor-restaurants-list container not found');
            return;
        }
        
        console.log(' Rendering restaurants:', restaurants.length);
        
        if (!restaurants || restaurants.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🪧</div>
                    <h3>No Restaurants</h3>
                    <p>You don't have any restaurants yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="restaurants-header" style="margin-bottom: 20px;">
                <h4>Your Restaurants (${restaurants.length})</h4>
                <p style="color: var(--gray);">Manage your campus food outlet</p>
            </div>
            <div class="restaurants-grid">
                ${restaurants.map(restaurant => `
                    <div class="vendor-restaurant-card card">
                        <div class="restaurant-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                            <div>
                                <h3 style="margin: 0 0 5px 0;">${restaurant.restaurant_name}</h3>
                                <div class="restaurant-status ${restaurant.is_open ? 'status-open' : 'status-closed'}" style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; display: inline-block;">
                                    ${restaurant.is_open ? '✅ OPEN' : '🔴 CLOSED'}
                                </div>
                            </div>
                            <div class="restaurant-rating" style="background: var(--secondary); color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px; font-weight: 600;">
                                ⭐ ${restaurant.rating || '4.0'}
                            </div>
                        </div>
                        
                        <p class="restaurant-description" style="color: var(--gray); margin-bottom: 10px;">${restaurant.description || 'Campus dining outlet'}</p>
                        
                        <div class="restaurant-details" style="font-size: 14px; margin-bottom: 15px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                <span style="color: var(--gray);">📍</span>
                                <span>${restaurant.location}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                <span style="color: var(--gray);">🕒</span>
                                <span>${restaurant.opening_time || '09:00'} - ${restaurant.closing_time || '22:00'}</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                <span style="color: var(--gray);">📞</span>
                                <span>${restaurant.contact_number || 'Not provided'}</span>
                            </div>
                        </div>
                        
                        <div class="restaurant-actions" style="display: flex; gap: 10px; margin-top: 15px;">
                            <button class="btn ${restaurant.is_open ? 'btn-warning' : 'btn-success'}" 
                                    onclick="VendorManager.toggleRestaurantStatus(${restaurant.restaurant_id}, ${!restaurant.is_open})">
                                ${restaurant.is_open ? '🔴 Close' : '✅ Open'} Restaurant
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        console.log('Restaurants rendered successfully');
    }

    // Toggle restaurant status
    static async toggleRestaurantStatus(restaurantId, isOpen) {
        try {
            Utils.showLoading();
            Utils.showNotification(`Restaurant ${isOpen ? 'opened' : 'closed'} successfully!`, 'success');
            this.loadVendorRestaurants();
        } catch (error) {
            Utils.showNotification('Failed to update restaurant status', 'error');
            console.error('Toggle restaurant status error:', error);
        } finally {
            Utils.hideLoading();
        }
    }

    // Load vendor orders
    static async loadVendorOrders() {
        try {
            console.log(' Loading vendor orders...');
            Utils.showLoading();
            
            const data = await Utils.apiCall(API_ENDPOINTS.ORDERS.VENDOR_ORDERS);
            const orders = data.orders || [];
            console.log('API orders loaded:', orders.length);
            
            OrdersManager.renderVendorOrders(orders);
            
        } catch (error) {
            console.error(' Load vendor orders error:', error);
            Utils.showNotification('Failed to load orders', 'error');
            // Show empty state on error
            OrdersManager.renderVendorOrders([]);
        } finally {
            Utils.hideLoading();
        }
    }
}

// Initialize vendor manager
document.addEventListener('DOMContentLoaded', function() {
    console.log('Vendor manager DOM loaded');
    if (currentUser && currentUser.user_type === 'vendor') {
        VendorManager.init();
    }
});