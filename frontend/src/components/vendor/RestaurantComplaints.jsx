import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileText, Star, Clock, CheckCircle, X, Loader, RefreshCw, User, Mail, Phone } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function RestaurantComplaints() {
  const { apiCall, showNotification } = useApp();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching restaurant complaints...');
      const data = await apiCall('/support/complaints/restaurant');
      console.log('✅ Complaints loaded:', data.complaints?.length || 0);
      setComplaints(data.complaints || []);
    } catch (error) {
      console.error('❌ Error loading complaints:', error);
      showNotification('Failed to load complaints: ' + error.message, 'error');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadComplaints();
    showNotification('Complaints refreshed', 'success');
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      escalated: 'bg-orange-100 text-orange-800 border-orange-300',
      resolved: 'bg-green-100 text-green-800 border-green-300',
      closed: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || colors.open;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      urgent: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: '🔴' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', icon: '🟠' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: '🟡' },
      low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: '🟢' }
    };
    return badges[priority] || badges.medium;
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: '⏳',
      in_progress: '⏸️',
      escalated: '🚀',
      resolved: '✅',
      closed: '🔒'
    };
    return icons[status] || '📋';
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16">
        <Loader size={48} className="text-blue-600 mb-4 animate-spin" />
        <p className="text-gray-600 font-medium">Loading complaints...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="text-orange-600" size={28} />
            Customer Complaints & Feedback
          </h2>
          <p className="text-gray-600 mt-1">
            View complaints related to your restaurant
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2 font-semibold"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <AlertTriangle className="text-blue-600 flex-shrink-0" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">📌 Information Dashboard (Read-Only)</p>
            <p>
              This dashboard shows complaints logged against your restaurant. The support team handles all customer communication. 
              Use this information to improve service quality and respond to feedback constructively.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-3xl font-bold text-gray-900">{complaints.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Complaints</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-3xl font-bold text-orange-600">
            {complaints.filter(c => ['open', 'in_progress'].includes(c.resolution_status)).length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Active</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-3xl font-bold text-green-600">
            {complaints.filter(c => c.resolution_status === 'resolved').length}
          </div>
          <div className="text-sm text-gray-600 mt-1">Resolved</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="text-3xl font-bold text-purple-600">
            {complaints.length > 0 
              ? (complaints.reduce((acc, c) => acc + (c.customer_rating || 0), 0) / complaints.filter(c => c.customer_rating).length).toFixed(1)
              : 'N/A'
            }
          </div>
          <div className="text-sm text-gray-600 mt-1">Avg Rating</div>
        </div>
      </div>

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Complaints!</h3>
          <p className="text-gray-600">Great job! No customer complaints have been recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => {
            const priorityBadge = getPriorityBadge(complaint.priority);
            const statusColor = getStatusColor(complaint.status);
            
            return (
              <div key={complaint.complaint_id} className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">Ticket #{complaint.ticket_id}</h3>
                        <span className={`${priorityBadge.bg} ${priorityBadge.text} px-3 py-1 rounded-full text-xs font-semibold border`}>
                          {priorityBadge.icon} {complaint.priority?.toUpperCase()}
                        </span>
                        <span className={`${statusColor} px-3 py-1 rounded-full text-xs font-semibold border`}>
                          {getStatusIcon(complaint.status)} {complaint.status}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {complaint.complaint_type?.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                    
                    {complaint.customer_rating && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
                        <Star size={18} fill="currentColor" className="text-yellow-500" />
                        <span className="font-bold text-yellow-700">{complaint.customer_rating}/5</span>
                      </div>
                    )}
                  </div>

                  {/* Complaint Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-2">📝 Complaint Summary:</p>
                    <p className="text-gray-800">{complaint.complaint_summary}</p>
                  </div>

                  {/* Support Notes */}
                  {complaint.support_notes && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <FileText size={16} />
                        Support Team Notes:
                      </p>
                      <p className="text-blue-800 text-sm">{complaint.support_notes}</p>
                    </div>
                  )}

                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-700 mb-3">👤 Customer Information:</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-500" />
                        <span className="text-gray-700">{complaint.customer_name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-500" />
                        <span className="text-gray-700">{complaint.customer_email || 'N/A'}</span>
                      </div>
                      {complaint.customer_phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-500" />
                          <span className="text-gray-700">{complaint.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meta Information */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>Created: {new Date(complaint.created_at).toLocaleDateString()}</span>
                    </div>
                    {complaint.order_id && (
                      <div>
                        <span className="font-semibold">Order:</span> #{complaint.order_id}
                      </div>
                    )}
                    {complaint.resolved_at && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={14} />
                        <span>Resolved: {new Date(complaint.resolved_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedComplaint(complaint)}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                  >
                    View Full Details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedComplaint && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setSelectedComplaint(null)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Complaint Details</h2>
                  <p className="text-gray-600">Ticket #{selectedComplaint.ticket_id}</p>
                </div>
                <button onClick={() => setSelectedComplaint(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Type */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Type</p>
                  <p className="text-lg">{selectedComplaint.complaint_type?.replace('_', ' ')}</p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block border ${getStatusColor(selectedComplaint.status)}`}>
                    {getStatusIcon(selectedComplaint.status)} {selectedComplaint.status}
                  </span>
                </div>

                {/* Priority */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Priority</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block border ${getPriorityBadge(selectedComplaint.priority).bg} ${getPriorityBadge(selectedComplaint.priority).text} ${getPriorityBadge(selectedComplaint.priority).border}`}>
                    {getPriorityBadge(selectedComplaint.priority).icon} {selectedComplaint.priority}
                  </span>
                </div>

                {/* Rating */}
                {selectedComplaint.customer_rating && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Customer Rating</p>
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          fill={i < selectedComplaint.customer_rating ? 'currentColor' : 'none'}
                          className={i < selectedComplaint.customer_rating ? 'text-yellow-500' : 'text-gray-300'}
                        />
                      ))}
                      <span className="ml-2 font-semibold">{selectedComplaint.customer_rating}/5</span>
                    </div>
                  </div>
                )}

                {/* Complaint Summary */}
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Complaint Summary</p>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p>{selectedComplaint.complaint_summary}</p>
                  </div>
                </div>

                {/* Support Notes */}
                {selectedComplaint.support_notes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Support Team Notes</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800">{selectedComplaint.support_notes}</p>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Created</p>
                    <p>{new Date(selectedComplaint.created_at).toLocaleString()}</p>
                  </div>
                  {selectedComplaint.resolved_at && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Resolved</p>
                      <p>{new Date(selectedComplaint.resolved_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedComplaint(null)}
                className="mt-6 w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}