import React, { useState } from 'react';
import { Package, AlertTriangle, X, Plus, Trash2, Tag, DollarSign, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function VendorInventory({ inventory, restockItem, restaurants = [], onRefresh }) {
  const { apiCall, showNotification, setLoading } = useApp();

  // Restock Modal State
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState(10);
  const [restockReason, setRestockReason] = useState('');

  // Add New Item Modal State
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Fast Food');
  const [price, setPrice] = useState('');
  const [currentStock, setCurrentStock] = useState(20);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStockStatus = (item) => {
    if (item.current_stock === 0) {
      return { label: '🚨 Out of Stock', color: 'bg-red-100 text-red-800', badge: 'bg-red-600' };
    }
    if (item.current_stock <= item.low_stock_threshold) {
      return { label: '⚠️ Low Stock', color: 'bg-yellow-100 text-yellow-800', badge: 'bg-yellow-600' };
    }
    return { label: '✅ Good Stock', color: 'bg-green-100 text-green-800', badge: 'bg-green-600' };
  };

  const lowStockItems = inventory.filter((item) => item.current_stock <= item.low_stock_threshold);

  const handleRestock = () => {
    if (restockModal && restockQty > 0) {
      restockItem(restockModal.item_id, restockQty, restockReason || 'Manual restock');
      setRestockModal(null);
      setRestockQty(10);
      setRestockReason('');
    }
  };

  const handleOpenAddItem = () => {
    const defaultResId = (restaurants && restaurants.length > 0 && restaurants[0].restaurant_id) 
      || (inventory && inventory.length > 0 && inventory[0].restaurant_id)
      || '';
    setSelectedRestaurantId(defaultResId);
    setIsAddItemOpen(true);
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();

    let targetRestId = selectedRestaurantId;
    if (!targetRestId && restaurants && restaurants.length > 0) {
      targetRestId = restaurants[0].restaurant_id;
    }
    if (!targetRestId && inventory && inventory.length > 0) {
      targetRestId = inventory[0].restaurant_id;
    }

    if (!targetRestId) {
      try {
        const myRes = await apiCall('/restaurants/vendor/my-restaurants');
        if (myRes && myRes.restaurants && myRes.restaurants.length > 0) {
          targetRestId = myRes.restaurants[0].restaurant_id;
        }
      } catch (err) {
        console.error('Error auto-detecting restaurant:', err);
      }
    }

    if (!targetRestId) {
      showNotification('Could not detect Store ID. Please refresh page and try again.', 'error');
      return;
    }

    if (!itemName || !price) {
      showNotification('Please fill in Item Name and Price', 'error');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    try {
      await apiCall('/menu/vendor/item', {
        method: 'POST',
        body: JSON.stringify({
          restaurant_id: targetRestId,
          item_name: itemName,
          category,
          price: parseFloat(price),
          current_stock: parseInt(currentStock) || 0,
          low_stock_threshold: parseInt(lowStockThreshold) || 5,
          description
        })
      });

      showNotification(`Item "${itemName}" added successfully!`, 'success');
      setIsAddItemOpen(false);
      // Reset form
      setItemName('');
      setPrice('');
      setDescription('');
      setCurrentStock(20);

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to add item:', err);
      showNotification(err.message || 'Failed to add item', 'error');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.item_name}" from inventory?`)) return;

    setLoading(true);
    try {
      await apiCall(`/menu/vendor/item/${item.item_id}`, { method: 'DELETE' });
      showNotification(`Item "${item.item_name}" deleted`, 'info');
      if (onRefresh) onRefresh();
    } catch (err) {
      showNotification(err.message || 'Failed to delete item', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header with Add Item Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-600">Track and manage your stock levels & menu items</p>
        </div>
        <button
          onClick={handleOpenAddItem}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-red-200 flex items-center gap-2"
        >
          <Plus size={20} />
          <span>Add New Item</span>
        </button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-600" size={24} />
            Low Stock Alerts ({lowStockItems.length})
          </h3>
          <div className="space-y-3">
            {lowStockItems.map((item) => {
              const status = getStockStatus(item);
              return (
                <div
                  key={item.item_id}
                  className={`${status.color} border-l-4 border-current p-4 rounded-lg flex justify-between items-center`}
                >
                  <div>
                    <p className="font-bold text-lg">{item.item_name}</p>
                    <p className="text-sm opacity-90">{item.restaurant_name}</p>
                    <p className="text-sm mt-1">
                      Current: <span className="font-bold">{item.current_stock}</span> | 
                      Threshold: <span className="font-bold">{item.low_stock_threshold}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setRestockModal(item)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Restock
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Inventory Items */}
      <div>
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Package size={24} />
          All Items ({inventory.length})
        </h3>

        {inventory.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <Package size={80} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Inventory Items Yet</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">Add menu items and products to start tracking inventory and selling to campus students.</p>
            <button
              onClick={handleOpenAddItem}
              className="bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition-all shadow-lg inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item) => {
              const status = getStockStatus(item);
              return (
                <div key={item.item_id} className="border rounded-xl p-5 hover:shadow-lg transition-shadow relative bg-white">
                  {/* Item Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                      <h4 className="font-bold text-lg line-clamp-1">{item.item_name}</h4>
                      <p className="text-xs font-medium text-gray-500">{item.restaurant_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`${status.badge} text-white px-2.5 py-1 rounded-full text-xs font-bold`}>
                        Qty: {item.current_stock}
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-md"
                        title="Delete Item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-semibold">{item.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-bold text-red-600">₹{item.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Threshold:</span>
                      <span className="font-semibold">{item.low_stock_threshold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`${status.color} px-2 py-0.5 rounded text-xs font-bold`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Restock Button */}
                  <button
                    onClick={() => setRestockModal(item)}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-2 rounded-lg hover:from-red-700 hover:to-orange-700 transition-all font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <Package size={16} />
                    Restock Item
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Restock Modal */}
      {restockModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setRestockModal(null)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Package className="text-red-600" size={28} />
                    Restock Item
                  </h3>
                  <p className="text-gray-600 mt-1">{restockModal.item_name}</p>
                </div>
                <button
                  onClick={() => setRestockModal(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Current Stock Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                    <p className="text-2xl font-bold text-red-600">{restockModal.current_stock}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">After Restock</p>
                    <p className="text-2xl font-bold text-green-600">{restockModal.current_stock + restockQty}</p>
                  </div>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Quantity to Add <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg font-semibold"
                  placeholder="Enter quantity"
                />
              </div>

              {/* Reason Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={restockReason}
                  onChange={(e) => setRestockReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="e.g., Weekly restock, New shipment"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setRestockModal(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestock}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all font-bold shadow-lg"
                >
                  Restock Now
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add New Item Modal */}
      {isAddItemOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsAddItemOpen(false)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Add New Item to Inventory</h3>
                    <p className="text-xs text-gray-500">Add a product or dish to your store</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddItemOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="space-y-4">

                {/* Select Store if multiple */}
                {restaurants && restaurants.length > 1 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Select Store / Outlet *</label>
                    <select
                      value={selectedRestaurantId}
                      onChange={(e) => setSelectedRestaurantId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 bg-white"
                      required
                    >
                      {restaurants.map((r) => (
                        <option key={r.restaurant_id} value={r.restaurant_id}>
                          {r.restaurant_name} ({r.outlet_type?.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Item Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    placeholder="e.g. Veg Cheese Burger, A4 Spiral Notebook, Cold Coffee"
                    required
                  />
                </div>

                {/* Category & Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                      placeholder="e.g. Snacks, Beverages, Writing"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 font-bold"
                      placeholder="80.00"
                      required
                    />
                  </div>
                </div>

                {/* Initial Stock & Low Stock Threshold */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Initial Stock Qty</label>
                    <input
                      type="number"
                      min="0"
                      value={currentStock}
                      onChange={(e) => setCurrentStock(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                      placeholder="20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Low Stock Alert Threshold</label>
                    <input
                      type="number"
                      min="1"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                      placeholder="5"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500"
                    placeholder="Item details, ingredients, or specifications..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddItemOpen(false)}
                    className="flex-1 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-bold text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition-all shadow-lg hover:shadow-red-200 disabled:bg-gray-400"
                  >
                    {isSubmitting ? 'Saving Item...' : 'Save & Add to Store'}
                  </button>
                </div>

              </form>

            </div>
          </div>
        </>
      )}
    </div>
  );
}