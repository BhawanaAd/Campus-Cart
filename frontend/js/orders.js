
class OrdersManager {
    static init() {
        console.log(' OrdersManager initializing...');

        const backToDashboardBtn = document.getElementById('back-to-dashboard');
        if (backToDashboardBtn) {
            backToDashboardBtn.addEventListener('click', showBackToDashboard);
        }

        const backToDashboardProfile = document.getElementById('back-to-dashboard-profile');
        if (backToDashboardProfile) {
            backToDashboardProfile.addEventListener('click', showBackToDashboard);
        }
        
        console.log(' OrdersManager initialized');
    }

    static async showCustomerOrders() {
        try {
            console.log(' Loading customer orders...');
            Utils.showLoading();
            
            document.getElementById('customer-dashboard').classList.add('hidden');
            document.getElementById('vendor-dashboard').classList.add('hidden');
            document.getElementById('restaurant-menu').classList.add('hidden');
            document.getElementById('profile-page').classList.add('hidden');
            document.getElementById('orders-page').classList.remove('hidden');

            // Load customer orders
            const data = await Utils.apiCall(API_ENDPOINTS.ORDERS.MY_ORDERS);
            this.renderCustomerOrders(data.orders || []);

        } catch (error) {
            console.error(' Load customer orders error:', error);
            Utils.showNotification('Failed to load orders', 'error');
            this.renderCustomerOrders([]);
        } finally {
            Utils.hideLoading();
        }
    }

    // Render customer orders
    static renderCustomerOrders(orders) {
        const container = document.getElementById('customer-orders-list');
        if (!container) return;

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📦</div>
                    <h3>No Orders Yet</h3>
                    <p>Your order history will appear here.</p>
                    <button class="btn btn-primary" onclick="showDashboard()">Browse Restaurants</button>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card card">
                <div class="order-header">
                    <div class="order-id">Order #${order.order_id}</div>
                    <div class="order-status status-${order.order_status}">
                        ${order.order_status.replace('-', ' ').toUpperCase()}
                    </div>
                </div>
                <div class="order-info">
                    <div><strong>Restaurant:</strong> ${order.restaurant_name}</div>
                    <div><strong>Order Date:</strong> ${Utils.formatDate(order.order_date)}</div>
                    <div><strong>Total Amount:</strong> ${Utils.formatCurrency(order.total_amount)}</div>
                    ${order.delivery_location ? `<div><strong>Delivery To:</strong> ${order.delivery_location}</div>` : ''}
                    ${order.special_instructions ? `<div><strong>Instructions:</strong> ${order.special_instructions}</div>` : ''}
                </div>
                <div class="order-actions">
                    <button class="btn btn-outline" onclick="OrdersManager.viewOrderDetails(${order.order_id})">
                        View Details
                    </button>
                    ${order.order_status === 'pending' ? `
                        <button class="btn btn-danger" onclick="OrdersManager.cancelOrder(${order.order_id})">
                            Cancel Order
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // View order details
    static async viewOrderDetails(orderId) {
        try {
            Utils.showLoading();
            const data = await Utils.apiCall(API_ENDPOINTS.ORDERS.DETAILS(orderId));
            this.showOrderDetailsModal(data);
        } catch (error) {
            Utils.showNotification('Failed to load order details', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // Cancel order
    static async cancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        try {
            Utils.showLoading();
            await Utils.apiCall(API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
                method: 'PATCH',
                body: JSON.stringify({ order_status: 'cancelled' })
            });
            
            Utils.showNotification('Order cancelled successfully', 'success');
            this.showCustomerOrders(); // Refresh the list
        } catch (error) {
            Utils.showNotification('Failed to cancel order', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    static showOrderDetailsModal(orderData) {
        const { order, items } = orderData;
        
        const modalHTML = `
            <div class="modal active" id="order-details-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Order #${order.order_id} Details</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <div class="order-details">
                        <div class="detail-section">
                            <h4>Order Information</h4>
                            <p><strong>Restaurant:</strong> ${order.restaurant_name}</p>
                            <p><strong>Order Date:</strong> ${Utils.formatDate(order.order_date)}</p>
                            <p><strong>Status:</strong> 
                                <span class="order-status status-${order.order_status}">
                                    ${order.order_status.replace('-', ' ').toUpperCase()}
                                </span>
                            </p>
                            <p><strong>Total Amount:</strong> ${Utils.formatCurrency(order.total_amount)}</p>
                        </div>
                        
                        <div class="detail-section">
                            <h4>Delivery Information</h4>
                            <p><strong>Delivery Location:</strong> ${order.delivery_location}</p>
                            ${order.special_instructions ? `<p><strong>Instructions:</strong> ${order.special_instructions}</p>` : ''}
                        </div>
                        
                        <div class="detail-section">
                            <h4>Order Items</h4>
                            <div class="order-items-list">
                                ${items.map(item => `
                                    <div class="order-item-detail" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border);">
                                        <div>
                                            <div style="font-weight: 600;">${item.item_name}</div>
                                            <div style="font-size: 14px; color: var(--gray);">${item.quantity} x ${Utils.formatCurrency(item.price_at_order)}</div>
                                        </div>
                                        <div style="font-weight: 600;">${Utils.formatCurrency(item.subtotal)}</div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="order-total-detail" style="display: flex; justify-content: space-between; font-weight: 600; font-size: 18px; margin-top: 15px; padding-top: 15px; border-top: 2px solid var(--border);">
                                <span>Total:</span>
                                <span>${Utils.formatCurrency(order.total_amount)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions" style="display: flex; justify-content: flex-end; margin-top: 20px;">
                        <button class="btn btn-outline" onclick="document.getElementById('order-details-modal').remove()">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    static renderVendorOrders(orders) {
        const container = document.getElementById('vendor-orders-list');
        
        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📦</div>
                    <h3>No Orders Yet</h3>
                    <p>Orders from customers will appear here.</p>
                </div>
            `;
            return;
        }

        console.log('Rendering', orders.length, 'vendor orders');

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">Order #${order.order_id}</div>
                    <div class="order-status status-${order.order_status}">
                        ${order.order_status.replace('-', ' ').toUpperCase()}
                    </div>
                </div>
                <div class="order-customer">
                    <strong>Customer:</strong> ${order.student_name} • ${order.student_phone || 'No phone'}
                </div>
                <div class="order-info">
                    <div><strong>Order Date:</strong> ${Utils.formatDate(order.order_date)}</div>
                    <div><strong>Total:</strong> ${Utils.formatCurrency(order.total_amount)}</div>
                    ${order.delivery_location ? `<div><strong>Delivery:</strong> ${order.delivery_location}</div>` : ''}
                    ${order.special_instructions ? `<div><strong>Instructions:</strong> ${order.special_instructions}</div>` : ''}
                </div>
                <div class="order-actions">
                    ${this.getOrderActionButtons(order.order_id, order.order_status)}
                </div>
            </div>
        `).join('');

        this.addOrderActionListeners();
    }

    static getOrderActionButtons(orderId, status) {
        const buttons = [];
        
        switch(status) {
            case 'pending':
                buttons.push(
                    `<button class="btn btn-success" data-action="confirm" data-order="${orderId}">✅ Confirm</button>`,
                    `<button class="btn btn-danger" data-action="cancel" data-order="${orderId}">❌ Cancel</button>`
                );
                break;
            case 'confirmed':
                buttons.push(
                    `<button class="btn btn-primary" data-action="preparing" data-order="${orderId}">👨‍🍳 Start Preparing</button>`
                );
                break;
            case 'preparing':
                buttons.push(
                    `<button class="btn btn-warning" data-action="ready" data-order="${orderId}">✅ Mark Ready</button>`
                );
                break;
            case 'ready':
                buttons.push(
                    `<button class="btn btn-success" data-action="delivered" data-order="${orderId}">🚚 Mark Delivered</button>`
                );
                break;
            case 'delivered':
                buttons.push(
                    `<button class="btn btn-outline" disabled>✅ Completed</button>`
                );
                break;
            case 'cancelled':
                buttons.push(
                    `<button class="btn btn-outline" disabled>❌ Cancelled</button>`
                );
                break;
        }

        buttons.push(`<button class="btn btn-outline" data-action="details" data-order="${orderId}">👁️ View Details</button>`);

        return buttons.join('');
    }

    static addOrderActionListeners() {
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                const orderId = e.target.getAttribute('data-order');
                
                switch(action) {
                    case 'confirm':
                        this.updateOrderStatus(orderId, 'confirmed');
                        break;
                    case 'preparing':
                        this.updateOrderStatus(orderId, 'preparing');
                        break;
                    case 'ready':
                        this.updateOrderStatus(orderId, 'ready');
                        break;
                    case 'delivered':
                        this.updateOrderStatus(orderId, 'delivered');
                        break;
                    case 'cancel':
                        this.updateOrderStatus(orderId, 'cancelled');
                        break;
                    case 'details':
                        this.viewOrderDetails(orderId);
                        break;
                }
            });
        });
    }

    // Update order status
    static async updateOrderStatus(orderId, newStatus) {
        try {
            Utils.showLoading();
            await Utils.apiCall(API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
                method: 'PATCH',
                body: JSON.stringify({ order_status: newStatus })
            });

            Utils.showNotification(`Order #${orderId} status updated to ${newStatus}`, 'success');
            VendorManager.loadVendorOrders();
        } catch (error) {
            Utils.showNotification('Failed to update order status', 'error');
            console.error('Update order status error:', error);
        } finally {
            Utils.hideLoading();
        }
    }
}

// Initialize orders manager
document.addEventListener('DOMContentLoaded', function() {
    OrdersManager.init();
});