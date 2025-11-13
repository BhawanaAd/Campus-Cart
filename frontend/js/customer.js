
class CustomerManager {
    static init() {
        const searchInput = document.getElementById('restaurant-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(this.handleSearch.bind(this), 300));
        }

        document.getElementById('back-to-restaurants').addEventListener('click', this.showRestaurantList);

        const viewCartBtn = document.getElementById('view-cart-btn');
        const closeCartBtn = document.getElementById('close-cart');
        const cartOverlay = document.getElementById('cart-overlay');
        const checkoutBtn = document.getElementById('checkout-btn');

        if (viewCartBtn) viewCartBtn.addEventListener('click', this.openCart.bind(this));
        if (closeCartBtn) closeCartBtn.addEventListener('click', this.closeCart.bind(this));
        if (cartOverlay) cartOverlay.addEventListener('click', this.closeCart.bind(this));
        if (checkoutBtn) checkoutBtn.addEventListener('click', this.handleCheckout.bind(this));

        this.loadCartFromStorage();
        this.updateCartButton();

        console.log('CustomerManager initialized, cart items:', cart.length);
    }

    static loadCartFromStorage() {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            cart = JSON.parse(savedCart);
            console.log('Loaded cart from storage:', cart);
        }
    }

    static async loadRestaurants() {
        try {
            Utils.showLoading();
            const data = await Utils.apiCall(API_ENDPOINTS.RESTAURANTS.LIST);
            this.renderRestaurants(data.restaurants);
        } catch (error) {
            Utils.showNotification('Failed to load restaurants', 'error');
            console.error('Load restaurants error:', error);
        } finally {
            Utils.hideLoading();
        }
    }

    static renderRestaurants(restaurants) {
        const grid = document.getElementById('restaurant-grid');
        
        if (!restaurants || restaurants.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🪧</div>
                    <h3>No Restaurants Available</h3>
                    <p>Check back later for campus dining options.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = restaurants.map(restaurant => `
            <div class="restaurant-card card" data-id="${restaurant.restaurant_id}">
                <div class="restaurant-image" style="background-color: #ddd; display: flex; align-items: center; justify-content: center; color: #666; font-size: 14px;">
                    ${restaurant.restaurant_name}
                </div>
                <div class="restaurant-info">
                    <div class="restaurant-name">${restaurant.restaurant_name}</div>
                    <div class="restaurant-cuisine">${restaurant.description || 'Campus Dining'}</div>
                    <div class="restaurant-location" style="color: var(--gray); font-size: 14px; margin-bottom: 8px;">
                        📍 ${restaurant.location}
                    </div>
                    <div class="restaurant-rating">
                        ⭐ ${restaurant.rating || '4.0'}
                    </div>
                    <div class="restaurant-status" style="margin-top: 8px;">
                        ${restaurant.is_open ? 
                            '<span style="color: var(--success); font-size: 12px;">● Open</span>' : 
                            '<span style="color: var(--danger); font-size: 12px;">● Closed</span>'
                        }
                    </div>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.restaurant-card').forEach(card => {
            card.addEventListener('click', () => {
                const restaurantId = card.getAttribute('data-id');
                const restaurant = restaurants.find(r => r.restaurant_id == restaurantId);
                this.showRestaurantMenu(restaurant);
            });
        });
    }

    static async showRestaurantMenu(restaurant) {
        if (!restaurant.is_open) {
            Utils.showNotification('This restaurant is currently closed', 'warning');
            return;
        }

        try {
            Utils.showLoading();
            currentRestaurant = restaurant;

            document.getElementById('customer-dashboard').classList.add('hidden');
            document.getElementById('restaurant-menu').classList.remove('hidden');
            document.getElementById('restaurant-name').textContent = restaurant.restaurant_name;

    
            document.querySelector('.cart-fab').style.display = 'block';

            const data = await Utils.apiCall(API_ENDPOINTS.MENU.GET_RESTAURANT_MENU(restaurant.restaurant_id));
            this.renderMenu(data.menu);

        } catch (error) {
            Utils.showNotification('Failed to load menu', 'error');
            console.error('Load menu error:', error);
        } finally {
            Utils.hideLoading();
        }
    }


    static renderMenu(menuItems) {
        const menuContainer = document.getElementById('menu-container');
        
        if (!menuItems || menuItems.length === 0) {
            menuContainer.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🍽️</div>
                    <h3>No Items Available</h3>
                    <p>This restaurant currently has no items in stock.</p>
                </div>
            `;
            return;
        }

        const categories = {};
        menuItems.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = [];
            }
            categories[item.category].push(item);
        });

        menuContainer.innerHTML = Object.keys(categories).map(category => `
            <div class="menu-category">
                <div class="category-title">${category}</div>
                ${categories[category].map(item => {
                    const cartItem = cart.find(ci => ci.item_id === item.item_id);
                    const currentQuantity = cartItem ? cartItem.quantity : 0;
                    
                    return `
                    <div class="menu-item">
                        <div class="item-info">
                            <div class="item-name">${item.item_name}</div>
                            <div class="item-description">${item.description || 'Delicious food item'}</div>
                            <div class="item-price">${Utils.formatCurrency(item.price)}</div>
                            ${item.current_stock <= item.low_stock_threshold ? 
                                '<div style="color: var(--warning); font-size: 12px;">⚠️ Only ' + item.current_stock + ' left!</div>' : ''
                            }
                        </div>
                        <div class="item-actions">
                            <div class="quantity-controls">
                                <button class="quantity-btn" data-action="decrease" data-id="${item.item_id}" data-stock="${item.current_stock}" ${currentQuantity === 0 ? 'disabled' : ''}>-</button>
                                <span class="quantity-display" id="quantity-${item.item_id}">${currentQuantity}</span>
                                <button class="quantity-btn" data-action="increase" data-id="${item.item_id}" data-stock="${item.current_stock}" ${item.current_stock <= currentQuantity ? 'disabled' : ''}>+</button>
                            </div>
                        </div>
                    </div>
                `}).join('')}
            </div>
        `).join('');

        menuContainer.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', this.handleQuantityChange.bind(this));
        });

        console.log('Menu rendered with', menuItems.length, 'items');
    }

   
    static handleQuantityChange(e) {
        const action = e.target.getAttribute('data-action');
        const itemId = parseInt(e.target.getAttribute('data-id'));
        const maxStock = parseInt(e.target.getAttribute('data-stock'));
        const quantityElement = document.getElementById(`quantity-${itemId}`);
        let quantity = parseInt(quantityElement.textContent);
        
        console.log('Quantity change:', action, 'for item', itemId, 'current:', quantity, 'max:', maxStock);
        
        if (action === 'increase' && quantity < maxStock) {
            quantity++;
        } else if (action === 'decrease' && quantity > 0) {
            quantity--;
        }
        
        quantityElement.textContent = quantity;
        
       
        const decreaseBtn = e.target.parentElement.querySelector('[data-action="decrease"]');
        const increaseBtn = e.target.parentElement.querySelector('[data-action="increase"]');
        
        if (decreaseBtn) {
            decreaseBtn.disabled = quantity === 0;
        }
        
        if (increaseBtn) {
            increaseBtn.disabled = quantity >= maxStock;
        }
        
        this.updateCart(itemId, quantity);
        this.updateCartButton();
    }

   
    static updateCart(itemId, quantity) {
        console.log('Updating cart for item', itemId, 'quantity:', quantity);
        
   
        const menuContainer = document.getElementById('menu-container');
        const menuItemElement = menuContainer.querySelector(`[data-id="${itemId}"]`);
        if (!menuItemElement) {
            console.error('Menu item element not found for ID:', itemId);
            return;
        }

        const menuItemCard = menuItemElement.closest('.menu-item');
        const itemName = menuItemCard.querySelector('.item-name').textContent;
        const itemPriceText = menuItemCard.querySelector('.item-price').textContent;
        const itemPrice = parseFloat(itemPriceText.replace(/[^0-9.]/g, ''));

        console.log(' Item details:', { itemName, itemPrice, quantity });

        if (quantity === 0) {
            cart = cart.filter(item => item.item_id !== itemId);
            console.log(' Removed item from cart');
        } else {
        
            const existingItemIndex = cart.findIndex(item => item.item_id === itemId);
            
            if (existingItemIndex !== -1) {
                
                cart[existingItemIndex].quantity = quantity;
                console.log(' Updated existing cart item');
            } else {
    
                cart.push({
                    item_id: itemId,
                    name: itemName,
                    price: itemPrice,
                    quantity: quantity,
                    restaurant_id: currentRestaurant.restaurant_id,
                    restaurant_name: currentRestaurant.restaurant_name
                });
                console.log('Added new item to cart');
            }
        }
    
        localStorage.setItem('cart', JSON.stringify(cart));
        console.log('Saved cart to localStorage:', cart);
        
        if (document.getElementById('cart-sidebar').classList.contains('open')) {
            this.renderCartItems();
        }
    }

    static updateCartButton() {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cart-count').textContent = totalItems;
        console.log('Cart button updated:', totalItems, 'items');
    }

    static openCart() {
        console.log('Opening cart, items:', cart.length);
        this.renderCartItems();
        document.getElementById('cart-sidebar').classList.add('open');
        document.getElementById('cart-overlay').classList.add('active');
    }

    static closeCart() {
        document.getElementById('cart-sidebar').classList.remove('open');
        document.getElementById('cart-overlay').classList.remove('active');
    }

    
    static renderCartItems() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        console.log(' Rendering cart items:', cart);
        
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-state">
                    <div class="icon">🛒</div>
                    <h3>Your Cart is Empty</h3>
                    <p>Add some delicious items from the menu!</p>
                </div>
            `;
            cartTotal.textContent = Utils.formatCurrency(0);
            return;
        }
        
        let total = 0;
        cartItems.innerHTML = '';
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${Utils.formatCurrency(item.price)} each</div>
                    <div class="cart-item-restaurant" style="font-size: 12px; color: var(--gray);">${item.restaurant_name}</div>
                </div>
                <div class="cart-item-quantity">
                    <span style="font-weight: 600;">${item.quantity}x</span>
                    <span style="font-weight: 600; margin-left: 10px;">${Utils.formatCurrency(itemTotal)}</span>
                    <button class="cart-item-remove" data-id="${item.item_id}" title="Remove item">🗑️</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
        
        cartTotal.textContent = Utils.formatCurrency(total);
        
        cartItems.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = parseInt(e.target.getAttribute('data-id'));
                this.removeFromCart(itemId);
            });
        });

        console.log('Cart total:', total);
    }

    static removeFromCart(itemId) {
        console.log('Removing item from cart:', itemId);
        
        cart = cart.filter(item => item.item_id !== itemId);
        localStorage.setItem('cart', JSON.stringify(cart));
    
        const quantityElement = document.getElementById(`quantity-${itemId}`);
        if (quantityElement) {
            quantityElement.textContent = '0';
            const decreaseBtn = quantityElement.parentElement.querySelector('[data-action="decrease"]');
            const increaseBtn = quantityElement.parentElement.querySelector('[data-action="increase"]');
            if (decreaseBtn) {
                decreaseBtn.disabled = true;
            }
            if (increaseBtn) {
                increaseBtn.disabled = false;
            }
        }
        
        this.updateCartButton();
        this.renderCartItems();
        
        Utils.showNotification('Item removed from cart', 'info');
    }
    static async handleCheckout() {
        if (cart.length === 0) {
            Utils.showNotification('Your cart is empty!', 'warning');
            return;
        }

        if (!currentRestaurant) {
            Utils.showNotification('Please select a restaurant first', 'error');
            return;
        }
        const differentRestaurant = cart.find(item => item.restaurant_id !== currentRestaurant.restaurant_id);
        if (differentRestaurant) {
            Utils.showNotification('All items in cart must be from the same restaurant', 'error');
            return;
        }
        const deliveryLocation = prompt('Enter your delivery location (e.g., Hostel Block A, Room 101):', 'Campus Hostel');
        if (!deliveryLocation) {
            Utils.showNotification('Delivery location is required', 'warning');
            return;
        }

        const specialInstructions = prompt('Any special instructions? (Optional):', '');

        try {
            Utils.showLoading();

            const orderData = {
                restaurant_id: currentRestaurant.restaurant_id,
                items: cart.map(item => ({
                    item_id: item.item_id,
                    quantity: item.quantity
                })),
                delivery_location: deliveryLocation,
                special_instructions: specialInstructions || '',
                payment_method: 'cash'
            };

            console.log('Placing order:', orderData);

            const data = await Utils.apiCall(API_ENDPOINTS.ORDERS.CREATE, {
                method: 'POST',
                body: JSON.stringify(orderData)
            });

            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            this.updateCartButton();
            this.closeCart();

            Utils.showNotification(`Order placed successfully! Order #${data.order_id}`, 'success');
            
            setTimeout(() => {
                this.showRestaurantList();
            }, 2000);

        } catch (error) {
            Utils.showNotification(error.message || 'Failed to place order', 'error');
            console.error('Checkout error:', error);
        } finally {
            Utils.hideLoading();
        }
    }

    static showRestaurantList() {
        document.getElementById('restaurant-menu').classList.add('hidden');
        document.getElementById('customer-dashboard').classList.remove('hidden');
        document.querySelector('.cart-fab').style.display = 'none';
        currentRestaurant = null;
    }

    static handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const restaurantCards = document.querySelectorAll('.restaurant-card');
        
        restaurantCards.forEach(card => {
            const name = card.querySelector('.restaurant-name').textContent.toLowerCase();
            const cuisine = card.querySelector('.restaurant-cuisine').textContent.toLowerCase();
            const location = card.querySelector('.restaurant-location').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || cuisine.includes(searchTerm) || location.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
}
document.addEventListener('DOMContentLoaded', function() {
    CustomerManager.init();
});