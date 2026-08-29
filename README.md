# 📦 Campus Cart – Campus Delivery, Support & Payment System

**Campus Cart** is a comprehensive multi-outlet food, grocery, and stationery ordering platform tailored for university campuses where off-campus delivery services (like Zomato, Swiggy, Zepto, or Blinkit) are unavailable or restricted.

The system connects **Students**, **Vendors**, and **Support/Admin Teams** through a real-time web portal, featuring automated inventory tracking, live ticket support, and **Razorpay Standard Checkout** payment gateway integration.

---

## 🚀 Key Features

### 💳 **Razorpay Payment Gateway Integration**
- **Seamless Online Checkout**: Built-in Razorpay Standard Web Checkout Modal for card, UPI, and netbanking payments.
- **Backend Order Creation**: Server endpoint `POST /api/create-order` generates Razorpay orders securely.
- **HMAC-SHA256 Signature Verification**: Server endpoint `POST /api/verify-payment` verifies Razorpay signatures before updating order/payment status in MySQL.
- **Flexible Options**: Students can switch between **💳 Razorpay Online Payment** and **💵 Cash on Delivery**.

### 🎓 **Student Features**
- **JWT Authentication**: Secure user registration and login.
- **Multi-Outlet Discovery**: Browse stores by category (*Food*, *Grocery*, *Stationery*).
- **Interactive Store Menus**: Dynamic item thumbnails, real-time stock indicators, and availability status.
- **Smart Cart & Checkout**: Add/remove items with instant total calculations and delivery instructions.
- **Real-Time Order Tracking**: Monitor order status from `pending` → `preparing` → `ready` → `delivered`.
- **Order History & Cancellation**: View past orders and cancel pending orders.
- **Support & Ticketing**: Live chat with AI bot assistance, support agents, and complaint tracking.

### 🛍️ **Vendor Features**
- **Vendor Dashboard**: Real-time order queue with instant status updates.
- **Inventory & Menu Control**: Add/edit menu items, set prices, and toggle item availability on the fly.
- **Stock Management & Alerts**: Automatic inventory deduct on order placement with low-stock warnings.
- **Restaurant Complaints**: View and respond to customer feedback directly.

### 🛠️ **Support & Admin Features**
- **Omnichannel Support Desk**: AI-assisted automated responses with escalation to human agents and senior support.
- **Restaurant Analytics**: Monitor system health, support ticket resolution times, and vendor metrics.

---

## 💳 Razorpay Credentials & Testing

### **Environment Setup**

#### **Backend (`backend/.env`)**
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=campuscart1
JWT_SECRET=campuscart_secret_jwt_key_2026
CORS_ORIGIN=http://localhost:3001

RAZORPAY_KEY_ID=rzp_test_TVbOC34BmBwl5F
RAZORPAY_KEY_SECRET=MYCfgtCwJEwYxUxAsfyyQ3gy
```

#### **Frontend (`frontend/.env`)**
```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_RAZORPAY_KEY_ID=rzp_test_TVbOC34BmBwl5F
```

### 🧪 **Test Payment Credentials**
- **Test Card**: `4100 2800 0000 1007` | Expiry: `12/26` | CVV: `123` | OTP: Any 6 digits
- **Test UPI**: `test@razorpay` or `success@razorpay`

---

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS, Lucide React Icons, Razorpay Standard Checkout JS SDK (`checkout.js`)
- **Backend**: Node.js, Express.js, `razorpay` SDK, JWT (`jsonwebtoken`), `bcryptjs`, CORS, `mysql2`
- **Database**: MySQL 8.0+
- **Tools**: Git, GitHub, Postman

---

## 📁 Repository Structure

```
Campus-Cart/
├── backend/
│   ├── config/             # Database connection setup
│   ├── controllers/        # Order, Payment, Menu, Auth, Support controllers
│   ├── middleware/         # Auth & Role verification middleware
│   ├── routes/             # API routes (payment, orders, auth, menu, support)
│   ├── .env                # Backend environment variables
│   ├── package.json        # Node.js backend configuration & dependencies
│   └── server.js           # Main Express server entry point
├── frontend/
│   ├── public/             # HTML template with Razorpay Checkout script
│   ├── src/
│   │   ├── components/     # React UI components (StoreMenu, MyOrders, Vendor, Support)
│   │   ├── context/        # React Context API (AppContext)
│   │   ├── App.jsx         # Main App entry component
│   │   └── index.js        # React DOM render script
│   ├── .env                # Frontend environment variables
│   └── package.json        # Frontend React configuration & dependencies
├── campuscart.sql          # Primary MySQL database schema & sample data
├── campuscart_railway_final.sql # Production database setup script
└── README.md               # Project documentation
```

---

## 🔌 API Endpoints Reference

### **Payments (`/api/payment` & `/api`)**
- `POST /api/create-order` - Create Razorpay order (`amount`, `currency`, `receipt`)
- `POST /api/verify-payment` - Verify payment signature (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `order_id`)

### **Orders (`/api/orders`)**
- `POST /api/orders` - Place new order (Cash or Online)
- `GET /api/orders/my-orders` - Fetch customer orders
- `PATCH /api/orders/:order_id/cancel` - Cancel pending order
- `GET /api/orders/vendor/orders` - Fetch vendor restaurant orders
- `PATCH /api/orders/:order_id/status` - Update order status (`confirmed`, `preparing`, `ready`, `delivered`)

### **Authentication (`/api/auth`)**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Session logout

---

## 💻 Getting Started

### 1. **Clone the Repository**
```bash
git clone https://github.com/0ke1vce/Campus-Cart.git
cd Campus-Cart
```

### 2. **Backend Setup**
```bash
cd backend
npm install
npm run dev
```
*(Backend server runs at `http://localhost:3000`)*

### 3. **Frontend Setup**
```bash
cd ../frontend
npm install
npm start
```
*(Frontend app runs at `http://localhost:3001`)*

### 4. **Database Import**
Import `campuscart.sql` or `campuscart_railway_final.sql` into your local MySQL server or Cloud database instance.

---

## 📜 License
ISC License © CampusCart Team
