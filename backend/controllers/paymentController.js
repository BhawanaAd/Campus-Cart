const Razorpay = require('razorpay');
const crypto = require('crypto');
const { pool } = require('../config/database');

// Lazy-initialize Razorpay instance to ensure env vars are loaded
const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error('Razorpay Key ID or Secret missing in environment configuration.');
    }

    return new Razorpay({
        key_id,
        key_secret
    });
};

const paymentController = {
    // Create Razorpay Order
    // Request payload: { amount (in paise or INR), currency, receipt }
    createOrder: async (req, res) => {
        try {
            let { amount, currency = 'INR', receipt } = req.body;

            if (!amount) {
                return res.status(400).json({ error: 'Amount is required' });
            }

            // Ensure amount is an integer (in paise)
            let amountInPaise = parseInt(amount, 10);
            
            // Validate minimum amount: 100 paise (1 INR)
            if (isNaN(amountInPaise) || amountInPaise < 100) {
                return res.status(400).json({ 
                    error: 'Invalid amount. Minimum amount must be at least 100 paise (₹1)' 
                });
            }

            const razorpay = getRazorpayInstance();
            const options = {
                amount: amountInPaise,
                currency: currency || 'INR',
                receipt: receipt || `rcpt_${Date.now()}`
            };

            const order = await razorpay.orders.create(options);
            console.log('✅ Razorpay order created:', order.id);

            return res.status(200).json({
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            });

        } catch (error) {
            console.error('❌ Create Razorpay order error:', error);
            return res.status(500).json({ 
                error: 'Failed to create Razorpay order',
                message: error.message 
            });
        }
    },

    // Verify Payment Signature
    // Request payload: { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id }
    verifyPayment: async (req, res) => {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

            // Validate missing fields
            if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
                return res.status(400).json({ 
                    error: 'Missing required payment verification parameters (razorpay_order_id, razorpay_payment_id, razorpay_signature)' 
                });
            }

            const key_secret = process.env.RAZORPAY_KEY_SECRET;
            if (!key_secret) {
                return res.status(500).json({ error: 'Razorpay secret key not configured' });
            }

            // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
            const generatedSignature = crypto
                .createHmac('sha256', key_secret)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            const isSignatureValid = crypto.timingSafeEqual(
                Buffer.from(generatedSignature),
                Buffer.from(razorpay_signature)
            );

            if (!isSignatureValid) {
                console.warn('⚠️ Razorpay signature mismatch!');
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid payment signature. Signature mismatch.' 
                });
            }

            console.log('✅ Razorpay payment signature verified successfully:', razorpay_payment_id);

            // Update database status if order_id from CampusCart is provided
            if (order_id) {
                try {
                    await pool.execute(
                        `UPDATE orders SET payment_status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`,
                        [order_id]
                    );

                    await pool.execute(
                        `UPDATE payments SET payment_status = 'completed', transaction_id = ? WHERE order_id = ?`,
                        [razorpay_payment_id, order_id]
                    );

                    console.log(`✅ Order #${order_id} payment status updated to completed in DB.`);
                } catch (dbErr) {
                    console.error(`⚠️ Failed to update DB for order #${order_id}:`, dbErr.message);
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                payment_id: razorpay_payment_id,
                order_id: order_id || null
            });

        } catch (error) {
            console.error('❌ Verify payment error:', error);
            return res.status(500).json({ 
                error: 'Internal server error during payment verification',
                message: error.message 
            });
        }
    }
};

module.exports = paymentController;
