import React, { useState, useEffect } from 'react';
import { ChevronRight, Package, Clock, MapPin, FileText, X, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function MyOrders() {
  const { setCurrentView, apiCall, setLoading, showNotification } = useApp();
  const [orders, setOrders] = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null); // order being confirmed for cancellation
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/orders/my-orders');
      setOrders(data.orders || []);
    } catch (error) {
      showNotification('Failed to load orders', 'error');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      preparing: 'bg-purple-100 text-purple-800 border-purple-300',
      ready: 'bg-green-100 text-green-800 border-green-300',
      delivered: 'bg-gray-100 text-gray-800 border-gray-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '👨‍🍳',
      ready: '🎉',
      delivered: '📦',
      cancelled: '❌'
    };
    return icons[status] || '📋';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const confirmCancelOrder = async () => {
    if (!cancelTarget) return;

    setCancelling(true);
    try {
      await apiCall(`/orders/${cancelTarget.order_id}/cancel`, { method: 'PATCH' });

      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === cancelTarget.order_id ? { ...o, order_status: 'cancelled' } : o
        )
      );

      showNotification(`Order #${cancelTarget.order_id} cancelled`, 'success');
      setCancelTarget(null);
    } catch (error) {
      showNotification(error.message || 'Failed to cancel order', 'error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={() => setCurrentView('outlets')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ChevronRight size={20} className="rotate-180" />
        <span className="font-medium">Back to Home</span>
      </button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">My Orders</h1>
        <p className="text-gray-600">Track and manage your orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
          <Package size={80} className="mx-auto text-gray-300 mb-6" />
          <h3 className="text-2xl font-semibold mb-2">No Orders Yet</h3>
          <p className="text-gray-600 mb-8">Your order history will appear here</p>
          <button
            onClick={() => setCurrentView('outlets')}
            className="bg-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Browse Stores
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.order_id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                      <FileText size={20} />
                      Order #{order.order_id}
                    </h3>
                    <p className="text-gray-600 mt-1">{order.restaurant_name}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${getStatusColor(order.order_status)}`}>
                    {getStatusIcon(order.order_status)} {order.order_status.toUpperCase()}
                  </span>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="font-semibold">{formatDate(order.order_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Package size={20} className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-bold text-red-600 text-lg">₹{order.total_amount}</p>
                    </div>
                  </div>

                  {order.delivery_location && (
                    <div className="flex items-start gap-3">
                      <MapPin size={20} className="text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Delivery Location</p>
                        <p className="font-semibold">{order.delivery_location}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Special Instructions */}
                {order.special_instructions && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Special Instructions:</span> {order.special_instructions}
                    </p>
                  </div>
                )}

                {/* Payment Status */}
                <div className="mt-4 flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 font-medium">Payment Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      order.payment_status === 'completed'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : order.payment_status === 'failed'
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                    }`}>
                      {order.payment_status === 'completed' ? '✓ PAID (Online)' : order.payment_status.toUpperCase()}
                    </span>
                  </div>
                  {order.order_status === 'pending' && (
                    <button
                      onClick={() => setCancelTarget(order)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium hover:underline"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[60]"
            onClick={() => !cancelling && setCancelTarget(null)}
          ></div>
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 w-auto sm:w-full sm:max-w-sm bg-white rounded-2xl shadow-2xl z-[70] p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Cancel this order?</h3>
              </div>
              <button
                onClick={() => !cancelling && setCancelTarget(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Order #{cancelTarget.order_id} from{' '}
              <span className="font-semibold">{cancelTarget.restaurant_name}</span> will be cancelled.
              This can't be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Keep Order
              </button>
              <button
                onClick={confirmCancelOrder}
                disabled={cancelling}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}