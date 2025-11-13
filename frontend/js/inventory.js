
class InventoryManager {
    constructor() {
        this.currentInventory = [];
        console.log('InventoryManager instance created');
        this.init();
    }

    init() {
        console.log('InventoryManager initializing...');
        this.setupEventListeners();
        this.loadInventoryDataInstance();
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'refresh-inventory' || e.target.classList.contains('refresh-inventory')) {
                this.loadInventoryDataInstance();
            }
        });
    }

    static async loadInventoryData() {
        console.log('InventoryManager.loadInventoryData() called statically');
        if (!window.inventoryManager) {
            window.inventoryManager = new InventoryManager();
        }
        return await window.inventoryManager.loadInventoryDataInstance();
    }

    async loadInventoryDataInstance() {
        try {
            Utils.showLoading();
            console.log('Loading inventory data from API...');
            
            // Load vendor inventory from real API
            const data = await Utils.apiCall(API_ENDPOINTS.INVENTORY.VENDOR_INVENTORY);
            console.log('Inventory data received:', data.inventory.length, 'items');
            
            this.currentInventory = data.inventory;
            this.renderLowStockAlerts(data.inventory);
            this.renderInventoryGrid(data.inventory);

            console.log('Inventory data loaded and rendered successfully');

        } catch (error) {
            console.error('Inventory load error:', error);
            Utils.showNotification('Failed to load inventory: ' + error.message, 'error');
            this.renderInventoryGrid([]);
        } finally {
            Utils.hideLoading();
        }
    }

    // Render low stock alerts
    renderLowStockAlerts(inventory) {
        const container = document.getElementById('inventory-alerts');
        if (!container) {
            console.error('inventory-alerts container not found');
            return;
        }
        
        const lowStockItems = inventory.filter(item => 
            item.current_stock <= item.low_stock_threshold
        );
        
        if (lowStockItems.length === 0) {
            container.innerHTML = `
                <div class="alert-card success">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.2em;"></span>
                        <div>
                            <strong>All Stock Levels Good!</strong>
                            <div>No low stock items at the moment.</div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        console.log('⚠️Found', lowStockItems.length, 'low stock items');

        container.innerHTML = lowStockItems.map(item => {
            const isOutOfStock = item.current_stock === 0;
            
            return `
                <div class="alert-card ${isOutOfStock ? 'error' : 'warning'}">
                    <div>
                        <strong>${isOutOfStock ? '🚨 OUT OF STOCK' : '⚠️ LOW STOCK'}</strong>
                        <div>${item.item_name} - ${item.restaurant_name}</div>
                        <div>Current: ${item.current_stock} | Threshold: ${item.low_stock_threshold}</div>
                        <small>${isOutOfStock ? 'Item is unavailable for orders' : 'Stock is running low'}</small>
                    </div>
                    <button class="btn btn-primary" onclick="window.inventoryManager.showRestockModal(${item.item_id}, '${item.item_name.replace(/'/g, "\\'")}', ${item.current_stock})">
                        ${isOutOfStock ? '📦 Restock Now' : '➕ Add Stock'}
                    </button>
                </div>
            `;
        }).join('');
    }

    // Render inventory grid
    renderInventoryGrid(inventory) {
        this.currentInventory = inventory;
        const container = document.getElementById('inventory-grid');
        if (!container) {
            console.error(' inventory-grid container not found');
            return;
        }

        if (!inventory || inventory.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📊</div>
                    <h3>No Inventory Items</h3>
                    <p>Add menu items to manage inventory.</p>
                </div>
            `;
            return;
        }

        console.log('🎨 Rendering', inventory.length, 'inventory items');

        container.innerHTML = `
            <div class="inventory-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Menu Items Inventory (${inventory.length})</h3>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <span style="background: linear-gradient(45deg, #28a745, #20c997); color: white; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">LIVE DATA</span>
                    <button class="btn btn-outline refresh-inventory">🔄 Refresh</button>
                </div>
            </div>
            <div class="inventory-items-grid">
                ${inventory.map(item => `
                    <div class="inventory-item card">
                        <div class="inventory-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                            <div>
                                <div class="inventory-name" style="font-weight: 600; font-size: 16px;">${item.item_name}</div>
                                <div style="font-size: 14px; color: var(--gray);">${item.restaurant_name}</div>
                            </div>
                            <div class="inventory-stock ${this.getStockStatusClass(item)}" style="font-weight: 600; padding: 6px 12px; border-radius: 6px; background: ${this.getStockStatusColor(item)}20; color: ${this.getStockStatusColor(item)}; font-size: 14px;">
                                ${item.current_stock} in stock
                            </div>
                        </div>
                        
                        <div class="inventory-details">
                            <div><strong>Category:</strong> ${item.category}</div>
                            <div><strong>Price:</strong> ₹${item.price}</div>
                            <div><strong>Low Stock Threshold:</strong> ${item.low_stock_threshold}</div>
                            <div><strong>Status:</strong> 
                                <span class="status-${this.getStockStatusClass(item)}" style="font-weight: 600; color: ${this.getStockStatusColor(item)};">
                                    ${this.getStockStatusText(item)}
                                </span>
                            </div>
                            <div><strong>Availability:</strong> 
                                <span style="color: ${item.is_available ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
                                    ${item.is_available ? '✅ Available' : '❌ Unavailable'}
                                </span>
                            </div>
                            ${item.description ? `<div style="margin-top: 8px; font-style: italic; color: var(--gray);">${item.description}</div>` : ''}
                        </div>
                        
                        <div class="inventory-actions" style="display: flex; gap: 8px; margin-top: 15px;">
                            <button class="btn btn-primary" onclick="window.inventoryManager.showRestockModal(${item.item_id}, '${item.item_name.replace(/'/g, "\\'")}', ${item.current_stock})">
                                📦 Restock
                            </button>
                            <button class="btn btn-outline" onclick="window.inventoryManager.showStockAdjustmentModal(${item.item_id}, '${item.item_name.replace(/'/g, "\\'")}', ${item.current_stock})">
                                🔧 Adjust
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div style="text-align: center; margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;">
                <p style="margin: 0; font-weight: 600; font-size: 16px;">📊 Real-Time Inventory Management</p>
                <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Stock updates automatically when orders are placed</p>
            </div>
        `;
    }

    getStockStatusClass(item) {
        if (item.current_stock === 0) return 'out-of-stock';
        if (item.current_stock <= item.low_stock_threshold) return 'low-stock';
        return 'good-stock';
    }

    getStockStatusColor(item) {
        if (item.current_stock === 0) return '#dc3545';
        if (item.current_stock <= item.low_stock_threshold) return '#ffc107';
        return '#28a745';
    }

    getStockStatusText(item) {
        if (item.current_stock === 0) return '🚫 Out of Stock';
        if (item.current_stock <= item.low_stock_threshold) return '⚠️ Low Stock';
        return '✅ Good Stock';
    }

    // Show restock modal
    showRestockModal(itemId, itemName, currentStock) {
        const modalHTML = `
            <div class="modal active" id="restock-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>📦 Restock ${itemName}</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <form id="restock-form">
                        <input type="hidden" id="restock-item-id" value="${itemId}">
                        <div class="form-group">
                            <label for="restock-quantity">Quantity to Add</label>
                            <input type="number" id="restock-quantity" class="form-control" min="1" value="10" required>
                            <small style="color: var(--gray);">Current stock: ${currentStock}</small>
                        </div>
                        <div class="form-group">
                            <label for="restock-reason">Reason (Optional)</label>
                            <input type="text" id="restock-reason" class="form-control" placeholder="e.g., Weekly restock, New shipment">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="document.getElementById('restock-modal').remove()">Cancel</button>
                            <button type="submit" class="btn btn-primary">📦 Restock Item</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('restock-form').addEventListener('submit', (e) => this.handleRestock(e));
    }

    // Handle restock
    async handleRestock(e) {
        e.preventDefault();
        
        const itemId = document.getElementById('restock-item-id').value;
        const quantity = parseInt(document.getElementById('restock-quantity').value);
        const reason = document.getElementById('restock-reason').value;

        try {
            Utils.showLoading();
            console.log('📦 Restocking item:', itemId, 'quantity:', quantity);
            
            const data = await Utils.apiCall(API_ENDPOINTS.INVENTORY.RESTOCK, {
                method: 'POST',
                body: JSON.stringify({
                    item_id: itemId,
                    quantity: quantity,
                    reason: reason || 'Manual restock'
                })
            });
            
            console.log('✅ Restock successful:', data);
            Utils.showNotification(`✅ ${data.item_name} restocked with ${quantity} units! New stock: ${data.new_stock}`, 'success');
            document.getElementById('restock-modal').remove();
            
            await this.loadInventoryDataInstance();

        } catch (error) {
            console.error(' Restock failed:', error);
            Utils.showNotification('Failed to restock item: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // Show stock adjustment modal
    showStockAdjustmentModal(itemId, itemName, currentStock) {
        const modalHTML = `
            <div class="modal active" id="adjustment-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🔧 Adjust Stock for ${itemName}</h3>
                        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
                    </div>
                    <form id="adjustment-form">
                        <input type="hidden" id="adjustment-item-id" value="${itemId}">
                        <div class="form-group">
                            <label for="adjustment-type">Adjustment Type</label>
                            <select id="adjustment-type" class="form-control" required>
                                <option value="restock">📦 Restock (Add)</option>
                                <option value="waste">🗑️ Waste (Remove)</option>
                                <option value="adjustment">🔧 Manual Adjustment (Remove)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="adjustment-quantity">Quantity</label>
                            <input type="number" id="adjustment-quantity" class="form-control" min="1" required>
                            <small style="color: var(--gray);">Current stock: ${currentStock}</small>
                        </div>
                        <div class="form-group">
                            <label for="adjustment-reason">Reason</label>
                            <input type="text" id="adjustment-reason" class="form-control" placeholder="e.g., Spoiled items, count discrepancy" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-outline" onclick="document.getElementById('adjustment-modal').remove()">Cancel</button>
                            <button type="submit" class="btn btn-primary">🔧 Update Stock</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('adjustment-form').addEventListener('submit', (e) => this.handleStockAdjustment(e));
    }

    // Handle stock adjustment
    async handleStockAdjustment(e) {
        e.preventDefault();
        
        const itemId = document.getElementById('adjustment-item-id').value;
        const type = document.getElementById('adjustment-type').value;
        const quantity = parseInt(document.getElementById('adjustment-quantity').value);
        const reason = document.getElementById('adjustment-reason').value;

        try {
            Utils.showLoading();
            console.log('🔧 Adjusting stock:', { itemId, type, quantity, reason });
            
            const data = await Utils.apiCall(API_ENDPOINTS.INVENTORY.ADJUST, {
                method: 'POST',
                body: JSON.stringify({
                    item_id: itemId,
                    adjustment_type: type,
                    quantity: quantity,
                    reason: reason
                })
            });
            
            console.log('Adjustment successful:', data);
            Utils.showNotification(`✅ ${data.item_name} stock updated! New quantity: ${data.new_stock}`, 'success');
            document.getElementById('adjustment-modal').remove();
            
            await this.loadInventoryDataInstance();

        } catch (error) {
            console.error('Adjustment failed:', error);
            Utils.showNotification('Failed to adjust stock: ' + error.message, 'error');
        } finally {
            Utils.hideLoading();
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('📦 Inventory manager DOM loaded');
});