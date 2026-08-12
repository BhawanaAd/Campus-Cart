SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS
ticket_escalations,
ticket_messages,
support_tickets,
reviews,
payments,
order_items,
orders,
cart_items,
menu_items,
restaurants,
users;

-- Users Table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    user_type ENUM('student', 'vendor', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_user_type (user_type)
);

-- Restaurants Table (Updated with outlet_type)
CREATE TABLE restaurants (
    restaurant_id INT PRIMARY KEY AUTO_INCREMENT,
    vendor_id INT NOT NULL,
    restaurant_name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    contact_number VARCHAR(15),
    opening_time TIME,
    closing_time TIME,
    is_open BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    outlet_type ENUM('food', 'grocery', 'stationary') DEFAULT 'food',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_vendor (vendor_id),
    INDEX idx_is_open (is_open),
    INDEX idx_outlet_type (outlet_type)
);

-- Menu Items Table
CREATE TABLE menu_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    restaurant_id INT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(255),
    current_stock INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_available (is_available),
    INDEX idx_category (category),
    CHECK (price >= 0),
    CHECK (current_stock >= 0)
);

-- Orders Table
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    delivery_location VARCHAR(255),
    special_instructions TEXT,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_status (order_status),
    INDEX idx_date (order_date),
    CHECK (total_amount >= 0)
);

-- Order Items Table
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    price_at_order DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_item (item_id),
    CHECK (quantity > 0),
    CHECK (price_at_order >= 0),
    CHECK (subtotal >= 0)
);

-- Inventory Logs Table
CREATE TABLE inventory_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    change_type ENUM('restock', 'sale', 'adjustment', 'waste') NOT NULL,
    quantity_change INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason VARCHAR(255),
    changed_by INT,
    log_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_item (item_id),
    INDEX idx_type (change_type),
    INDEX idx_timestamp (log_timestamp)
);

-- Payments Table
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'card', 'upi', 'wallet') NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    INDEX idx_order (order_id),
    INDEX idx_status (payment_status),
    INDEX idx_transaction (transaction_id),
    CHECK (amount >= 0)
);

-- Shopping Cart Table
CREATE TABLE shopping_cart (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (student_id, item_id),
    INDEX idx_student (student_id),
    CHECK (quantity > 0)
);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Insert Users
INSERT INTO users (email, password_hash, full_name, phone, user_type) VALUES
-- Student
('student@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Rahul Singh', '9876543210', 'student'),

-- Food Vendors
('spicyhut@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Amit Bohra', '9876543211', 'vendor'),
('devdrestro@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Raj Sharma', '9876543212', 'vendor'),
('campuscafe@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Mohit Singh', '9876543213', 'vendor'),
('nescafe@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Rohan Mehta', '9876543214', 'vendor'),
('letmebake@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Anita Rai', '9876543215', 'vendor'),

-- Grocery Vendors
('dailyessentials@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Suresh Kumar', '9876543216', 'vendor'),
('freshmart@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Mayank Negi', '9876543217', 'vendor'),

-- Stationary Vendors
('campusbooks@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Vikram Singh', '9876543218', 'vendor'),
('studycorner@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Neha Gupta', '9876543219', 'vendor');

-- Insert FOOD Restaurants
INSERT INTO restaurants (vendor_id, restaurant_name, description, location, contact_number, opening_time, closing_time, is_open, rating, outlet_type) VALUES
(2, 'Spicy Hut', 'Fast food hub with momos, noodles, cold drinks, fried rice', 'Food Court outside Gate No. 2', '9876543211', '09:00:00', '22:00:00', TRUE, 4.2, 'food'),
(3, 'Dev D Restro', 'Trendy eatery with drinks, Chinese and Indian cuisine', 'Food Court outside Gate No. 3', '9876543212', '08:00:00', '21:00:00', TRUE, 4.0, 'food'),
(4, 'Campus Cafe', 'Central location for students to eat, socialize, and relax', 'Main Campus Center', '9876543213', '07:00:00', '23:00:00', TRUE, 4.5, 'food'),
(5, 'Nescafe Corner', 'Coffee and quick snacks', 'Campus Center', '9876543214', '08:00:00', '20:00:00', TRUE, 4.3, 'food'),
(6, 'Let Me Bake', 'Fresh bakery items and desserts', 'Campus Center', '9876543215', '10:00:00', '19:00:00', TRUE, 4.7, 'food');

-- Insert GROCERY Stores
INSERT INTO restaurants (vendor_id, restaurant_name, description, location, contact_number, opening_time, closing_time, is_open, rating, outlet_type) VALUES
(7, 'Daily Essentials Store', 'Rice, oil, sugar, salt and daily cooking needs', 'Store outside gate no. 1', '9876543216', '08:00:00', '21:00:00', TRUE, 4.4, 'grocery'),
(8, 'Fresh Mart', 'Milk, eggs, butter, cheese and fresh dairy products', 'Store outside gate no.3', '9876543217', '07:00:00', '22:00:00', TRUE, 4.6, 'grocery');

-- Insert STATIONARY Stores
INSERT INTO restaurants (vendor_id, restaurant_name, description, location, contact_number, opening_time, closing_time, is_open, rating, outlet_type) VALUES
(9, 'Campus Books & Supplies', 'Notebooks, pens, files and all study materials', 'Opposite to gate no. 3', '9876543218', '09:00:00', '20:00:00', TRUE, 4.5, 'stationary'),
(10, 'Study Corner', 'Backpacks, calculators, and premium stationary', 'Near gate no. 1', '9876543219', '09:00:00', '19:00:00', TRUE, 4.3, 'stationary');

-- Insert Menu Items for FOOD Outlets

-- Spicy Hut (restaurant_id = 1)
INSERT INTO menu_items (restaurant_id, item_name, description, price, category, current_stock, low_stock_threshold, is_available) VALUES
(1, 'Veg Momo', 'Steamed dumplings with vegetables and spicy chutney', 80.00, 'Fast Food', 20, 5, TRUE),
(1, 'Noodles', 'Stir-fried noodles with vegetables', 50.00, 'Fast Food', 15, 3, TRUE),
(1, 'Veg Biryani', 'Aromatic basmati rice with vegetables', 150.00, 'Rice', 12, 4, TRUE),
(1, 'Spring Roll', 'Crispy rolls with vegetable filling', 200.00, 'Fast Food', 40, 3, TRUE),
(1, 'Fried Rice', 'Fragrant rice with mixed vegetables', 60.00, 'Rice', 25, 8, TRUE),
(1, 'Mango Lassi', 'Refreshing yogurt drink', 60.00, 'Beverages', 30, 10, TRUE);

-- Dev D Restro (restaurant_id = 2)
INSERT INTO menu_items (restaurant_id, item_name, description, price, category, current_stock, low_stock_threshold, is_available) VALUES
(2, 'Butter Chicken', 'Creamy butter chicken with rich gravy', 220.00, 'Main Course', 15, 5, TRUE),
(2, 'Chicken Biryani', 'Flavorful rice with chicken', 200.00, 'Rice', 10, 3, TRUE),
(2, 'Paneer Butter Masala', 'Cottage cheese in tomato butter sauce', 180.00, 'Main Course', 8, 3, TRUE),
(2, 'Filter Coffee', 'Traditional South Indian coffee', 40.00, 'Beverages', 50, 15, TRUE);

-- Campus Cafe (restaurant_id = 3)
INSERT INTO menu_items (restaurant_id, item_name, description, price, category, current_stock, low_stock_threshold, is_available) VALUES
(3, 'Rajma Chawal', 'Classic North Indian comfort meal', 80.00, 'Rice', 30, 8, TRUE),
(3, 'Samosa', 'Crispy pastry with potato filling', 20.00, 'Snacks', 30, 8, TRUE),
(3, 'Sandwich', 'Layered vegetable sandwich', 120.00, 'Sandwiches', 10, 3, TRUE),
(3, 'French Fries', 'Crispy golden fries', 60.00, 'Snacks', 20, 6, TRUE);

-- Nescafe Corner (restaurant_id = 4)
INSERT INTO menu_items (restaurant_id, item_name, description, price, category, current_stock, low_stock_threshold, is_available) VALUES
(4, 'Espresso', 'Strong black coffee shot', 60.00, 'Coffee', 35, 10, TRUE),
(4, 'Iced Tea', 'Refreshing chilled tea', 50.00, 'Beverages', 25, 7, TRUE),
(4, 'Cheese Sandwich', 'Grilled sandwich with cheese', 80.00, 'Sandwiches', 12, 4, TRUE),
(4, 'Cold Coffee', 'Chilled blend of coffee, milk and sugar', 40.00, 'Coffee', 30, 8, TRUE);

-- Let Me Bake (restaurant_id = 5)
INSERT INTO menu_items (restaurant_id, item_name, description, price, category, current_stock, low_stock_threshold, is_available) VALUES
(5, 'Chocolate Cake', 'Rich chocolate layered cake', 120.00, 'Cakes', 8, 2, TRUE),
(5, 'Red Velvet Cake', 'Classic red velvet with cream cheese', 140.00, 'Cakes', 6, 2, TRUE),
(5, 'Croissant', 'Buttery French croissant', 50.00, 'Bakery', 15, 5, TRUE),
(5, 'Brownie', 'Chocolate walnut brownie', 70.00, 'Desserts', 10, 3, TRUE);

-- Insert Menu Items for GROCERY Outlets

-- Daily Essentials Store (restaurant_id = 6)
INSERT INTO menu_items (restaurant_id, item_name, description, price, category, current_stock, low_stock_threshold, is_available) VALUES
(6, 'Rice (1kg)', 'Premium quality basmati rice', 60.00, 'Grains', 50, 10, TRUE),
(6, 'Cooking Oil (1L)', 'Refined sunflower cooking oil', 150.00, 'Cooking Essentials', 30, 8, TRUE),
(6, 'Sugar (1kg)', 'Pure white crystalline sugar', 45.00, 'Sweeteners', 40, 10, TRUE),
(6, 'Salt (1kg)', 'Iodized table salt', 20.00, 'Spices', 60, 15, TRUE),
(6, 'Pasta', 'Italian pasta - penne variety', 80.00, 'Dry Foods', 25, 8, TRUE),
(6, 'Bread', 'Whole wheat bread loaf', 35.00, 'Bakery', 20, 5, TRUE);

-- Fresh Mart (restaurant_id = 7)
INSERT INTO menu_items (restaurant_id, item_name, description, price, category, current_stock, low_stock_threshold, is_available) VALUES
(7, 'Milk (1L)', 'Fresh full cream milk', 55.00, 'Dairy', 40, 10, TRUE),
(7, 'Eggs (12pcs)', 'Farm fresh eggs dozen pack', 84.00, 'Dairy', 30, 8, TRUE),
(7, 'Butter', 'Amul butter 500g pack', 120.00, 'Dairy', 25, 5, TRUE),
(7, 'Cheese', 'Cheddar cheese slice pack', 180.00, 'Dairy', 20, 5, TRUE),
(7, 'Yogurt', 'Fresh curd 500g', 40.00, 'Dairy', 35, 10, TRUE);

-- Insert Menu Items for STATIONARY Outlets

-- Campus Books & Supplies (restaurant_id = 8)
INSERT INTO menu_items (restaurant_id, item_name, description, price, category, current_stock, low_stock_threshold, is_available) VALUES
(8, 'Notebook (200 pages)', 'Ruled notebook A4 size', 80.00, 'Writing', 50, 10, TRUE),
(8, 'Pen Set (5 pcs)', 'Blue ballpoint pen pack', 50.00, 'Writing', 60, 15, TRUE),
(8, 'Pencil Box', 'Plastic compartment pencil box', 120.00, 'Storage', 30, 8, TRUE),
(8, 'Highlighter Set', 'Assorted color highlighters', 90.00, 'Writing', 40, 10, TRUE),
(8, 'A4 Paper Ream', '500 sheets premium quality', 250.00, 'Paper Products', 25, 5, TRUE),
(8, 'Calculator', 'Scientific calculator', 350.00, 'Electronics', 20, 5, TRUE);

-- Study Corner (restaurant_id = 9)
INSERT INTO menu_items (restaurant_id, item_name, description, price, category, current_stock, low_stock_threshold, is_available) VALUES
(9, 'Backpack', 'Laptop backpack with multiple compartments', 800.00, 'Bags', 15, 3, TRUE),
(9, 'File Folder', 'Plastic file folder A4 size', 30.00, 'Storage', 50, 10, TRUE),
(9, 'Stapler', 'Heavy duty stapler', 60.00, 'Office Supplies', 35, 8, TRUE),
(9, 'Glue Stick', 'Non-toxic glue stick', 25.00, 'Art Supplies', 45, 10, TRUE),
(9, 'Scissors', 'Stainless steel scissors', 40.00, 'Cutting Tools', 30, 8, TRUE),
(9, 'Ruler Set', 'Geometry box with rulers', 45.00, 'Measuring Tools', 40, 10, TRUE);

-- ============================================
-- SUPPORT CHAT SYSTEM DATABASE SCHEMA
-- ============================================

-- Support Tickets Table
CREATE TABLE support_tickets (
    ticket_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    order_id INT NULL,
    restaurant_id INT NULL,
    ticket_type ENUM('order_issue', 'payment_issue', 'delivery_delay', 'quality_complaint', 'refund_request', 'other') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('open', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed') DEFAULT 'open',
    assigned_to INT NULL COMMENT 'Support agent user_id',
    escalated_to INT NULL COMMENT 'Senior support user_id',
    rating INT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (escalated_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at)
);

-- Chat Messages Table
CREATE TABLE chat_messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    sender_id INT NULL COMMENT 'NULL for AI bot',
    sender_type ENUM('customer', 'ai_bot', 'support_agent', 'senior_support') NOT NULL,
    message_text TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence_score DECIMAL(3,2) NULL COMMENT 'AI confidence 0-1',
    attachments JSON NULL COMMENT 'Array of attachment URLs',
    is_internal_note BOOLEAN DEFAULT FALSE COMMENT 'Visible only to support team',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_ticket (ticket_id),
    INDEX idx_created_at (created_at)
);

-- Support Team Notes (Backend Dashboard)
CREATE TABLE support_notes (
    note_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    restaurant_id INT NULL COMMENT 'For restaurant dashboard',
    created_by INT NOT NULL COMMENT 'Support agent user_id',
    note_type ENUM('internal', 'restaurant_visible', 'resolution') NOT NULL,
    note_text TEXT NOT NULL,
    action_taken VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id),
    INDEX idx_restaurant (restaurant_id)
);

-- Ticket Escalations Log
CREATE TABLE ticket_escalations (
    escalation_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    escalated_from INT NULL COMMENT 'Previous assignee',
    escalated_to INT NULL COMMENT 'New assignee',
    escalation_reason TEXT NOT NULL,
    escalation_level ENUM('agent', 'senior', 'manager') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (escalated_from) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (escalated_to) REFERENCES users(user_id) ON DELETE SET NULL,
    INDEX idx_ticket (ticket_id)
);

-- AI Bot Interactions Log
CREATE TABLE ai_bot_logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    user_query TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    intent_detected VARCHAR(100) NULL,
    confidence_score DECIMAL(3,2) NULL,
    was_helpful BOOLEAN NULL COMMENT 'User feedback',
    escalated_to_human BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    INDEX idx_ticket (ticket_id),
    INDEX idx_escalated (escalated_to_human)
);

-- Restaurant Complaint View (Read-only for vendors)
CREATE TABLE restaurant_complaints (
    complaint_id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    complaint_type VARCHAR(100) NOT NULL,
    order_id INT NULL,
    customer_rating INT NULL,
    complaint_summary TEXT NOT NULL,
    support_notes TEXT NULL COMMENT 'Visible to restaurant',
    resolution_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL,
    INDEX idx_restaurant (restaurant_id),
    INDEX idx_ticket (ticket_id)
);

-- Add support user types to existing users table
ALTER TABLE users 
MODIFY COLUMN user_type ENUM('student', 'vendor', 'admin', 'support_agent', 'senior_support') NOT NULL;

-- Insert Support Team Users
INSERT INTO users (email, password_hash, full_name, phone, user_type) VALUES
('support1@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Support Agent 1', '9876543301', 'support_agent'),
('support2@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Support Agent 2', '9876543302', 'support_agent'),
('senior.support@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'Senior Support', '9876543303', 'senior_support'),
('admin@gmail.com', '$2a$10$8K1p/a0dRTphA6W3c9Sdsu4b3p1E1f/W2e6bLb6q5z5b5Q2b5K5W', 'System Admin', '9876543304', 'admin');

-- Create Views for Better Queries

-- Active Tickets View
CREATE VIEW active_tickets_view AS
SELECT 
    st.ticket_id,
    st.subject,
    st.ticket_type,
    st.priority,
    st.status,
    u.full_name as customer_name,
    u.email as customer_email,
    u.phone as customer_phone,
    r.restaurant_name,
    o.order_id,
    o.total_amount,
    agent.full_name as assigned_agent,
    st.created_at,
    st.updated_at,
    TIMESTAMPDIFF(HOUR, st.created_at, NOW()) as hours_open
FROM support_tickets st
JOIN users u ON st.user_id = u.user_id
LEFT JOIN restaurants r ON st.restaurant_id = r.restaurant_id
LEFT JOIN orders o ON st.order_id = o.order_id
LEFT JOIN users agent ON st.assigned_to = agent.user_id
WHERE st.status NOT IN ('resolved', 'closed');

-- Restaurant Complaints Dashboard View
CREATE VIEW restaurant_complaints_view AS
SELECT 
    rc.complaint_id,
    rc.ticket_id,
    rc.restaurant_id,
    r.restaurant_name,
    rc.complaint_type,
    rc.customer_rating,
    rc.complaint_summary,
    rc.support_notes,
    rc.resolution_status,
    rc.created_at,
    rc.resolved_at,
    o.order_id,
    o.total_amount,
    st.priority,
    st.status
FROM restaurant_complaints rc
JOIN restaurants r ON rc.restaurant_id = r.restaurant_id
JOIN support_tickets st ON rc.ticket_id = st.ticket_id
LEFT JOIN orders o ON rc.order_id = o.order_id
ORDER BY rc.created_at DESC;

-- Support Agent Performance View
CREATE VIEW support_performance_view AS
SELECT 
    u.user_id,
    u.full_name as agent_name,
    COUNT(st.ticket_id) as total_tickets,
    SUM(CASE WHEN st.status = 'resolved' THEN 1 ELSE 0 END) as resolved_tickets,
    SUM(CASE WHEN st.status = 'closed' THEN 1 ELSE 0 END) as closed_tickets,
    AVG(TIMESTAMPDIFF(HOUR, st.created_at, st.resolved_at)) as avg_resolution_hours,
    AVG(st.rating) as avg_rating
FROM users u
LEFT JOIN support_tickets st ON u.user_id = st.assigned_to
WHERE u.user_type IN ('support_agent', 'senior_support')
GROUP BY u.user_id, u.full_name;

-- Sample Data: Create some test tickets
INSERT INTO support_tickets (user_id, order_id, restaurant_id, ticket_type, subject, description, priority, status) VALUES
(1, NULL, 1, 'order_issue', 'Wrong item delivered', 'I ordered veg momo but received spring rolls', 'high', 'open'),
(1, NULL, 2, 'quality_complaint', 'Food was cold', 'Butter chicken was served cold and not fresh', 'medium', 'open'),
(1, NULL, 3, 'delivery_delay', 'Order taking too long', 'My order has been in preparing status for 2 hours', 'urgent', 'open');

-- Sample chat messages (AI bot responses)
INSERT INTO chat_messages (ticket_id, sender_id, sender_type, message_text, is_ai_generated, ai_confidence_score) VALUES
(1, 1, 'customer', 'I received wrong item in my order', FALSE, NULL),
(1, NULL, 'ai_bot', 'I understand you received the wrong item. Let me help you with that. Can you please tell me what you ordered and what you received?', TRUE, 0.95),
(1, 1, 'customer', 'I ordered veg momo but got spring rolls', FALSE, NULL),
(1, NULL, 'ai_bot', 'Thank you for clarifying. This seems like a serious issue. I''m connecting you with a human support agent who can help resolve this immediately.', TRUE, 0.88);

-- Indexes for performance
CREATE INDEX idx_ticket_status_priority ON support_tickets(status, priority);
CREATE INDEX idx_messages_ticket_created ON chat_messages(ticket_id, created_at);
CREATE INDEX idx_restaurant_complaints ON restaurant_complaints(restaurant_id, resolution_status);

-- Success message
SELECT 'Support Chat System Database Setup Complete!' as status;

-- Views for better queries
CREATE VIEW restaurant_menu_view AS
SELECT 
    r.restaurant_id,
    r.restaurant_name,
    r.outlet_type,
    r.is_open,
    m.item_id,
    m.item_name,
    m.description,
    m.price,
    m.category,
    m.current_stock,
    m.low_stock_threshold,
    m.is_available,
    CASE
        WHEN m.current_stock = 0 THEN 'Out of Stock'
        WHEN m.current_stock <= m.low_stock_threshold THEN 'Low Stock'
        ELSE 'Available'
    END AS stock_status
FROM restaurants r
JOIN menu_items m ON r.restaurant_id = m.restaurant_id;

CREATE VIEW low_stock_alert AS
SELECT 
    r.restaurant_name,
    r.outlet_type,
    r.vendor_id,
    m.item_id,
    m.item_name,
    m.current_stock,
    m.low_stock_threshold,
    m.category
FROM menu_items m
JOIN restaurants r ON m.restaurant_id = r.restaurant_id
WHERE m.current_stock <= m.low_stock_threshold
ORDER BY m.current_stock ASC;

-- Verify setup
SELECT 'Database setup complete!' as status;
SELECT user_id, email, user_type, full_name FROM users;
SELECT restaurant_id, restaurant_name, outlet_type, vendor_id FROM restaurants;
SELECT COUNT(*) as total_menu_items FROM menu_items;
SELECT outlet_type, COUNT(*) as store_count FROM restaurants GROUP BY outlet_type;

SET FOREIGN_KEY_CHECKS=1;
