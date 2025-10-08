import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, Package, Printer,
  TrendingUp, CheckCircle, Clock, MapPin,
  Phone, RefreshCw, Truck, Edit2, X, Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PackOrder {
  id: string;
  campaign_id: string;
  user_id: string | null;
  amount: number;
  pack_type: 'free' | 'medium' | 'large';
  tshirt_sizes: {
    shirt_1?: string;
    shirt_2?: string;
    shirt_3?: string;
    shirt_4?: string;
  } | null;
  payment_status: 'pending' | 'completed' | 'failed';
  tracking_number: string | null;
  shipping_address: {
    name: string;
    address_line_1: string;
    address_line_2?: string;
    city: string;
    county: string;
    eircode: string;
    country: string;
  };
  mobile_number: string;
  created_at: string;
  paid_at: string | null;
  campaign_title: string;
  organizer_name: string;
}

export default function PackManagement() {
  const [packOrders, setPackOrders] = useState<PackOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PackOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<PackOrder | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingTracking, setEditingTracking] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackOrders();

    const subscription = supabase
      .channel('pack_orders_management')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'pack_orders' },
        () => {
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
      const { data, error } = await supabase
        .from('pack_orders')
        .select(`
          *,
          campaigns!pack_orders_campaign_id_fkey(title, organizer)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        campaign_id: item.campaign_id,
        user_id: item.user_id,
        amount: item.amount,
        pack_type: item.pack_type,
        tshirt_sizes: item.tshirt_sizes,
        payment_status: item.payment_status,
        tracking_number: item.tracking_number,
        shipping_address: item.shipping_address,
        mobile_number: item.mobile_number,
        created_at: item.created_at,
        paid_at: item.paid_at,
        campaign_title: item.campaigns?.title || 'Unknown Campaign',
        organizer_name: item.campaigns?.organizer || 'Unknown Organizer'
      })) || [];

      setPackOrders(formattedData);
      setFilteredOrders(formattedData);
    } catch (error) {
      console.error('Error loading pack orders:', error);
      setPackOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = packOrders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.campaign_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.organizer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shipping_address.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.tracking_number && order.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [packOrders, searchTerm, statusFilter]);

  const updateTrackingNumber = async (orderId: string, tracking: string) => {
    try {
      const { error } = await supabase
        .from('pack_orders')
        .update({ tracking_number: tracking })
        .eq('id', orderId);

      if (error) throw error;

      setPackOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, tracking_number: tracking } : order
      ));

      setEditingTracking(null);
      setTrackingNumber('');
    } catch (error) {
      console.error('Error updating tracking number:', error);
      alert('Failed to update tracking number');
    }
  };

  const printPackingList = (order: PackOrder) => {
    const tshirtsList = order.tshirt_sizes
      ? Object.entries(order.tshirt_sizes)
          .filter(([_, size]) => size)
          .map(([key, size]) => `${key.replace('shirt_', 'T-Shirt ')}: ${size}`)
          .join('<br>')
      : 'No t-shirts ordered';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Packing List - ${order.campaign_title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section h2 {
              font-size: 18px;
              margin-bottom: 10px;
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 150px 1fr;
              gap: 8px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .info-value {
              color: #000;
            }
            .pack-type {
              display: inline-block;
              padding: 5px 15px;
              background: #f0f0f0;
              border-radius: 5px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .address-box {
              border: 2px solid #000;
              padding: 15px;
              margin-top: 10px;
              background: #f9f9f9;
            }
            .tracking-box {
              border: 2px dashed #666;
              padding: 15px;
              margin-top: 10px;
              background: #fff;
              min-height: 50px;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PACKING LIST</h1>
            <p style="margin: 5px 0 0 0; color: #666;">Order ID: ${order.id}</p>
          </div>

          <div class="section">
            <h2>Campaign Information</h2>
            <div class="info-grid">
              <div class="info-label">Campaign:</div>
              <div class="info-value">${order.campaign_title}</div>
              <div class="info-label">Organizer:</div>
              <div class="info-value">${order.organizer_name}</div>
              <div class="info-label">Order Date:</div>
              <div class="info-value">${new Date(order.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          <div class="section">
            <h2>Pack Details</h2>
            <div class="info-grid">
              <div class="info-label">Pack Type:</div>
              <div class="info-value"><span class="pack-type">${order.pack_type}</span></div>
              <div class="info-label">Payment Status:</div>
              <div class="info-value" style="color: ${order.payment_status === 'completed' ? 'green' : 'orange'}; font-weight: bold;">
                ${order.payment_status.toUpperCase()}
              </div>
              ${order.paid_at ? `
                <div class="info-label">Paid On:</div>
                <div class="info-value">${new Date(order.paid_at).toLocaleDateString()}</div>
              ` : ''}
            </div>
          </div>

          <div class="section">
            <h2>T-Shirt Sizes</h2>
            <div style="padding: 10px; background: #f9f9f9; border-radius: 5px;">
              ${tshirtsList}
            </div>
          </div>

          <div class="section">
            <h2>Shipping Address</h2>
            <div class="address-box">
              <div style="font-weight: bold; font-size: 18px; margin-bottom: 10px;">
                ${order.shipping_address.name}
              </div>
              <div>${order.shipping_address.address_line_1}</div>
              ${order.shipping_address.address_line_2 ? `<div>${order.shipping_address.address_line_2}</div>` : ''}
              <div>${order.shipping_address.city}, ${order.shipping_address.county}</div>
              <div style="font-weight: bold; margin-top: 5px;">${order.shipping_address.eircode}</div>
              <div>${order.shipping_address.country}</div>
              <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
                <strong>Phone:</strong> ${order.mobile_number}
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Tracking Information</h2>
            <div class="tracking-box">
              ${order.tracking_number
                ? `<strong>Tracking Number:</strong> ${order.tracking_number}`
                : '<em>Tracking number not yet assigned</em>'}
            </div>
          </div>

          <div class="section" style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
            <div class="info-grid">
              <div class="info-label">Packed By:</div>
              <div class="info-value">_____________________</div>
              <div class="info-label">Date:</div>
              <div class="info-value">_____________________</div>
              <div class="info-label">Checked By:</div>
              <div class="info-value">_____________________</div>
            </div>
          </div>

          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; cursor: pointer;">
              Print Packing List
            </button>
            <button onclick="window.close()" style="padding: 10px 30px; font-size: 16px; cursor: pointer; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to print packing lists. Or try using the print button in your browser menu.');
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
    };
  };

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

  const getPackTypeBadge = (packType: string) => {
    const colors = {
      free: 'bg-blue-100 text-blue-800',
      medium: 'bg-purple-100 text-purple-800',
      large: 'bg-orange-100 text-orange-800'
    };
    return (
      <span className={`${colors[packType as keyof typeof colors]} px-2 py-1 rounded-full text-xs font-medium uppercase`}>
        {packType}
      </span>
    );
  };

  const completedOrders = filteredOrders.filter(o => o.payment_status === 'completed');
  const shippedOrders = completedOrders.filter(o => o.tracking_number);
  const pendingShipment = completedOrders.filter(o => !o.tracking_number);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search packs..."
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

        <button
          onClick={loadPackOrders}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{completedOrders.length}</p>
                  <p className="text-gray-600 text-sm">Paid Orders</p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingShipment.length}</p>
                  <p className="text-gray-600 text-sm">Awaiting Shipment</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{shippedOrders.length}</p>
                  <p className="text-gray-600 text-sm">Shipped</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
                  <p className="text-gray-600 text-sm">Total Orders</p>
                </div>
                <div className="bg-gray-100 p-3 rounded-xl">
                  <Package className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">Campaign</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">Pack Type</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">Tracking</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{order.campaign_title}</p>
                          <p className="text-sm text-gray-500">{order.organizer_name}</p>
                          <p className="text-sm text-gray-500">{order.shipping_address.county}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getPackTypeBadge(order.pack_type)}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(order.payment_status)}
                      </td>
                      <td className="py-4 px-6">
                        {editingTracking === order.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="Enter tracking #"
                              className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
                              autoFocus
                            />
                            <button
                              onClick={() => updateTrackingNumber(order.id, trackingNumber)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTracking(null);
                                setTrackingNumber('');
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            {order.tracking_number ? (
                              <span className="text-sm text-gray-900 font-mono">{order.tracking_number}</span>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Not set</span>
                            )}
                            {order.payment_status === 'completed' && (
                              <button
                                onClick={() => {
                                  setEditingTracking(order.id);
                                  setTrackingNumber(order.tracking_number || '');
                                }}
                                className="text-blue-600 hover:text-blue-700"
                                title="Edit tracking number"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetails(true);
                            }}
                            className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => printPackingList(order)}
                            className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors"
                            title="Print packing list"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Campaign</h3>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Title:</span> {selectedOrder.campaign_title}</p>
                        <p className="text-sm"><span className="font-medium">Organizer:</span> {selectedOrder.organizer_name}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Pack Information</h3>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Pack Type:</span> {getPackTypeBadge(selectedOrder.pack_type)}</p>
                        <p className="text-sm"><span className="font-medium">Payment Status:</span> {getStatusBadge(selectedOrder.payment_status)}</p>
                        {selectedOrder.tshirt_sizes && (
                          <div className="text-sm">
                            <span className="font-medium">T-Shirts:</span>
                            <ul className="ml-4 mt-1">
                              {Object.entries(selectedOrder.tshirt_sizes)
                                .filter(([_, size]) => size)
                                .map(([key, size]) => (
                                  <li key={key}>{key.replace('shirt_', 'Shirt ')}: {size}</li>
                                ))}
                            </ul>
                          </div>
                        )}
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

                    {selectedOrder.tracking_number && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Tracking</h3>
                        <div className="bg-blue-50 rounded-xl p-4">
                          <p className="text-sm text-blue-900 font-mono">{selectedOrder.tracking_number}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => printPackingList(selectedOrder)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Print Packing List</span>
                      </button>
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
