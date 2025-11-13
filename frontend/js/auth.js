
class AuthManager {
    static init() {
        console.log('AuthManager initializing...');
        document.getElementById('login-form').addEventListener('submit', this.handleLogin.bind(this));

        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        document.getElementById('logout-btn').addEventListener('click', this.handleLogout.bind(this));
        console.log(' AuthManager initialized');
    }
    static async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            Utils.showNotification('Please fill in all fields', 'error');
            return;
        }

        try {
            Utils.showLoading();
            console.log(' Attempting login:', email);

            const data = await Utils.apiCall(API_ENDPOINTS.AUTH.LOGIN, {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            console.log(' Login successful:', currentUser);
            Utils.showNotification(`Welcome ${currentUser.full_name}!`, 'success');
            
            showDashboard();

        } catch (error) {
            console.error('Login failed:', error);
            Utils.showNotification(error.message || 'Login failed', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    static handleLogout() {
        console.log('Logging out...');
        
        authToken = null;
        currentUser = null;
        cart = [];
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('cart');

        Utils.showNotification('Logged out successfully', 'info');
        showLogin();
    }
    static isAuthenticated() {
        return !!authToken && !!currentUser;
    }
    static hasRole(role) {
        return currentUser && currentUser.user_type === role;
    }
}

function showLogin() {
    console.log('Showing login page');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('customer-dashboard').classList.add('hidden');
    document.getElementById('vendor-dashboard').classList.add('hidden');
    document.getElementById('restaurant-menu').classList.add('hidden');
    document.getElementById('orders-page').classList.add('hidden');
    document.getElementById('profile-page').classList.add('hidden');
    document.getElementById('header').classList.add('hidden');
}

function showDashboard() {
    console.log(' Showing dashboard for:', currentUser.user_type);
    
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('orders-page').classList.add('hidden');
    document.getElementById('profile-page').classList.add('hidden');
    document.getElementById('header').classList.remove('hidden');

    document.getElementById('user-name').textContent = currentUser.full_name;
    document.getElementById('user-avatar').textContent = Utils.getUserInitials(currentUser.full_name);

    if (currentUser.user_type === 'student') {
        showCustomerDashboard();
    } else if (currentUser.user_type === 'vendor') {
        showVendorDashboard();
    }
}

function showCustomerDashboard() {
    console.log(' Showing customer dashboard');
    document.getElementById('vendor-dashboard').classList.add('hidden');
    document.getElementById('restaurant-menu').classList.add('hidden');
    document.getElementById('orders-page').classList.add('hidden');
    document.getElementById('profile-page').classList.add('hidden');
    document.getElementById('customer-dashboard').classList.remove('hidden');
    
    document.getElementById('nav-links').classList.remove('hidden');
    CustomerManager.loadRestaurants();
}

function showVendorDashboard() {
    console.log(' Showing vendor dashboard');
    document.getElementById('customer-dashboard').classList.add('hidden');
    document.getElementById('restaurant-menu').classList.add('hidden');
    document.getElementById('orders-page').classList.add('hidden');
    document.getElementById('profile-page').classList.add('hidden');
    document.getElementById('vendor-dashboard').classList.remove('hidden');

    document.getElementById('nav-links').classList.add('hidden');
    VendorManager.loadVendorData();
}

function showProfile() {
    console.log('👤 Showing profile');
    document.getElementById('customer-dashboard').classList.add('hidden');
    document.getElementById('vendor-dashboard').classList.add('hidden');
    document.getElementById('restaurant-menu').classList.add('hidden');
    document.getElementById('orders-page').classList.add('hidden');
    document.getElementById('profile-page').classList.remove('hidden');
    
    if (currentUser) {
        document.getElementById('profile-name').textContent = currentUser.full_name;
        document.getElementById('profile-email').textContent = currentUser.email;
        document.getElementById('profile-role').textContent = `Role: ${currentUser.user_type}`;
        document.getElementById('profile-avatar').textContent = Utils.getUserInitials(currentUser.full_name);
        document.getElementById('profile-join-date').textContent = `Member since: ${new Date().toLocaleDateString()}`;
    }
}

function showBackToDashboard() {
    console.log('⬅ Going back to dashboard');
    document.getElementById('profile-page').classList.add('hidden');
    document.getElementById('orders-page').classList.add('hidden');
    showDashboard();
}

document.addEventListener('DOMContentLoaded', function() {
    console.log(' CampusCart Application Starting...');
    
    AuthManager.init();
    document.getElementById('home-link').addEventListener('click', function(e) {
        e.preventDefault();
        if (currentUser) {
            showDashboard();
        }
    });
    document.getElementById('orders-link').addEventListener('click', function(e) {
        e.preventDefault();
        if (currentUser && currentUser.user_type === 'student') {
            OrdersManager.showCustomerOrders();
        }
    });

    document.getElementById('profile-link').addEventListener('click', function(e) {
        e.preventDefault();
        if (currentUser) {
            showProfile();
        }
    });
    const savedUser = localStorage.getItem('currentUser');
    if (authToken && savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('Restored session for:', currentUser.email);
            
            Utils.apiCall(API_ENDPOINTS.AUTH.PROFILE)
                .then(data => {
                    currentUser = data.user;
                    showDashboard();
                })
                .catch(error => {
                    console.error('Token verification failed:', error);
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('currentUser');
                    authToken = null;
                    currentUser = null;
                    showLogin();
                });
        } catch (error) {
            console.error('Error parsing saved user:', error);
            showLogin();
        }
    } else {
        showLogin();
    }
    
    console.log(' Application initialized');
});