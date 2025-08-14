import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Download, Package, Calendar,
  TrendingUp, AlertTriangle, CheckCircle, Clock, MapPin,
  Mail, Phone, ExternalLink, RefreshCw
} from 'lucide-react';
import { packOrderService, PackOrder } from '../../services/packOrderService';

interface PackOrderWithCampaign extends PackOrder {
  campaign_title: string;
  organizer_name: string;
}

export default function PackOrderManagement() {
  const [packOrders, setPackOrders] = useState<PackOrderWithCampaign[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PackOrderWithCampaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<PackOrderWithCampaign | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackOrders();
    
    // Set up real-time subscription for pack order changes
    const subscription = supabase
      .channel('pack_orders')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'pack_orders' },
        () => {
          console.log('Pack order change detected, reloading...');
          loadPackOrders();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadPackOrders = async () => {
    try {
      setLoading(true);
      const result = await packOrderService.getAllPackOrders();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setPackOrders(result.data || []);
      setFilteredOrders(result.data || []);
    } catch (error) {
      console.error('Error loading pack orders:', error);
      // Show error toast
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-100 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg z-50';
      errorToast.innerHTML = `❌ Failed to load pack orders: ${error instanceof Error ? error.message : 'Unknown error'}`;
      document.body.appendChild(errorToast);
      setTimeout(() => {
        if (document.body.contains(errorToast)) {
          document.body.removeChild(errorToast);
        }
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders based on search and filters
  useEffect(() => {
    let filtered = packOrders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.campaign_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.organizer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shipping_address.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [packOrders, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Paid</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Pending</span>;
      case 'failed':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Failed</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">Unknown</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatAddress = (address: any) => {
    const parts = [
      address.address_line_1,
      address.address_line_2,
      address.city,
      address.county,
      address.eircode
    ].filter(Boolean);
    return parts.join(', ');
  };

  const pendingOrders = filteredOrders.filter(o => o.payment_status === 'pending');
  const completedOrders = filteredOrders.filter(o => o.payment_status === 'completed');
  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search pack orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Payment</option>
            <option value="completed">Paid</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <button 
            onClick={loadPackOrders}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading pack orders...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
                  <p className="text-gray-600 text-sm">Total Orders</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingOrders.length}</p>
                  <p className="text-gray-600 text-sm">Pending Payment</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{completedOrders.length}</p>
                  <p className="text-gray-600 text-sm">Completed</p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">€{(totalRevenue / 100).toFixed(0)}</p>
                  <p className="text-gray-600 text-sm">Postage Revenue</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Outstanding Orders Alert */}
          {pendingOrders.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <h4 className="font-medium text-orange-900">Outstanding Pack Payments</h4>
                  <p className="text-orange-800 text-sm">
                    {pendingOrders.length} pack orders are awaiting payment. These campaigns cannot be approved until payment is completed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pack Orders Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 min-w-[200px]">Order</th>
                    <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden sm:table-cell">Campaign</th>
                    <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden md:table-cell">Organizer</th>
                    <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700">Status</th>
                    <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden lg:table-cell">Created</th>
                    <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-3 sm:px-6">
                        <div>
                          <p className="font-medium text-gray-900">#{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-500">€10.00 postage</p>
                          <div className="sm:hidden mt-1 space-y-1">
                            <p className="text-xs text-gray-600 truncate">{order.campaign_title}</p>
                            <p className="text-xs text-gray-600">{order.organizer_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-3 sm:px-6 hidden sm:table-cell">
                        <p className="font-medium text-gray-900 truncate max-w-xs">{order.campaign_title}</p>
                      </td>
                      <td className="py-4 px-3 sm:px-6 hidden md:table-cell">
                        <div>
                          <p className="font-medium text-gray-900">{order.organizer_name}</p>
                          <p className="text-sm text-gray-500">{order.shipping_address.county}</p>
                        </div>
                      </td>
                      <td className="py-4 px-3 sm:px-6">
                        {getStatusBadge(order.payment_status)}
                        <div className="lg:hidden mt-1">
                          <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                        </div>
                      </td>
                      <td className="py-4 px-3 sm:px-6 hidden lg:table-cell">
                        <span className="text-gray-600 text-sm">{formatDate(order.created_at)}</span>
                      </td>
                      <td className="py-4 px-3 sm:px-6">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetails(true);
                            }}
                            className="bg-blue-100 text-blue-700 p-1.5 sm:p-2 rounded-lg hover:bg-blue-200 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                          
                          {order.stripe_payment_link_id && order.payment_status === 'pending' && (
                            <button
                              onClick={() => {
                                window.open(`https://buy.stripe.com/test_${order.stripe_payment_link_id}`, '_blank');
                              }}
                              className="bg-green-100 text-green-700 p-1.5 sm:p-2 rounded-lg hover:bg-green-200 transition-colors"
                              title="View payment link"
                            >
                              <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pack Order Details Modal */}
          {showDetails && selectedOrder && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Pack Order Details</h2>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="h-6 w-6 text-gray-700" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Order Information</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Order ID</p>
                            <p className="text-sm text-gray-600">#{selectedOrder.id}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Amount</p>
                            <p className="text-lg font-bold text-gray-900">€{(selectedOrder.amount / 100).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Status</p>
                            {getStatusBadge(selectedOrder.payment_status)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Created</p>
                            <p className="text-sm text-gray-600">{formatDate(selectedOrder.created_at)}</p>
                          </div>
                          {selectedOrder.paid_at && (
                            <div>
                              <p className="text-sm font-medium text-gray-900">Paid</p>
                              <p className="text-sm text-gray-600">{formatDate(selectedOrder.paid_at)}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Campaign</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Title</p>
                            <p className="text-sm text-gray-600">{selectedOrder.campaign_title}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Organizer</p>
                            <p className="text-sm text-gray-600">{selectedOrder.organizer_name}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Shipping Address</h3>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="space-y-1 text-sm text-gray-700">
                          <p className="font-medium">{selectedOrder.shipping_address.name}</p>
                          <p>{selectedOrder.shipping_address.address_line_1}</p>
                          {selectedOrder.shipping_address.address_line_2 && (
                            <p>{selectedOrder.shipping_address.address_line_2}</p>
                          )}
                          <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.county}</p>
                          <p>{selectedOrder.shipping_address.eircode}</p>
                          <p>{selectedOrder.shipping_address.country}</p>
                          <div className="pt-2 border-t border-gray-200 mt-2">
                            <p className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{selectedOrder.mobile_number}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedOrder.stripe_payment_link_id && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Payment Information</h3>
                        <div className="bg-blue-50 rounded-xl p-4">
                          <p className="text-sm text-blue-800 mb-2">
                            Stripe Payment Link ID: {selectedOrder.stripe_payment_link_id}
                          </p>
                          {selectedOrder.payment_status === 'pending' && (
                            <a
                              href={`https://buy.stripe.com/test_${selectedOrder.stripe_payment_link_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                            >
                              <ExternalLink className="h-4 w-4" />
                              <span>View Payment Link</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setShowDetails(false)}
                        className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}