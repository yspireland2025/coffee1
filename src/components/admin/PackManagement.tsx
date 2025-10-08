import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Eye, Package, Printer,
  TrendingUp, CheckCircle, Clock, MapPin,
  Phone, RefreshCw, Truck, Edit2, X, Save, Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import PackContentsManager from './PackContentsManager';

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

interface PackContent {
  id: string;
  pack_type: 'free' | 'medium' | 'large';
  item_name: string;
  quantity: number;
  display_order: number;
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
  const [printOrder, setPrintOrder] = useState<PackOrder | null>(null);
  const [packContents, setPackContents] = useState<PackContent[]>([]);
  const [showContentsManager, setShowContentsManager] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'contents'>('orders');

  useEffect(() => {
    loadPackOrders();
    loadPackContents();

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

  const loadPackContents = async () => {
    try {
      const { data, error } = await supabase
        .from('pack_contents')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setPackContents(data || []);
    } catch (error) {
      console.error('Error loading pack contents:', error);
      setPackContents([]);
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
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const addPackContent = async (packType: 'free' | 'medium' | 'large', itemName: string, quantity: number) => {
    try {
      const maxOrder = Math.max(...packContents.filter(c => c.pack_type === packType).map(c => c.display_order), 0);

      const { error } = await supabase
        .from('pack_contents')
        .insert({
          pack_type: packType,
          item_name: itemName,
          quantity: quantity,
          display_order: maxOrder + 1
        });

      if (error) throw error;

      await loadPackContents();
    } catch (error) {
      console.error('Error adding pack content:', error);
      alert('Failed to add pack content');
    }
  };

  const updatePackContent = async (id: string, itemName: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from('pack_contents')
        .update({
          item_name: itemName,
          quantity: quantity
        })
        .eq('id', id);

      if (error) throw error;

      await loadPackContents();
    } catch (error) {
      console.error('Error updating pack content:', error);
      alert('Failed to update pack content');
    }
  };

  const deletePackContent = async (id: string) => {
    try {
      console.log('🟢 DELETE FUNCTION CALLED with id:', id);

      const { data: { user } } = await supabase.auth.getUser();
      console.log('🟢 Current user:', user?.id);

      console.log('🟢 Updating UI optimistically...');
      setPackContents(prev => prev.filter(item => item.id !== id));

      console.log('🟢 Calling Supabase delete...');
      const { data, error } = await supabase
        .from('pack_contents')
        .delete()
        .eq('id', id)
        .select();

      console.log('🟢 Delete response - data:', data, 'error:', error);

      if (error) {
        console.error('🟢 Delete error:', error);
        await loadPackContents();
        throw error;
      }

      console.log('🟢 Successfully deleted from database');
    } catch (error) {
      console.error('🟢 Error deleting pack content:', error);
      alert('Failed to delete pack content: ' + (error as Error).message);
    }
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Pack Orders
          </button>
          <button
            onClick={() => setActiveTab('contents')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              activeTab === 'contents'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Pack Contents</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' && (
        <>
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
        </>
      )}

      {activeTab === 'orders' && loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading pack orders...</p>
          </div>
        </div>
      ) : activeTab === 'orders' ? (
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

          {printOrder && (
            <div className="print-only fixed inset-0 bg-white z-[9999]">
              <style>
                {`
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    .print-only, .print-only * {
                      visibility: visible;
                    }
                    .print-only {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                    }
                    .no-print {
                      display: none !important;
                    }
                  }
                  @media screen {
                    .print-only {
                      display: none;
                    }
                  }
                `}
              </style>
              <div className="p-8 max-w-4xl mx-auto">
                <div className="border-b-4 border-black pb-6 mb-8">
                  <h1 className="text-4xl font-bold">PACKING LIST</h1>
                  <p className="text-gray-600 mt-2">Order ID: {printOrder.id}</p>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-300">Campaign Information</h2>
                  <div className="grid grid-cols-[150px_1fr] gap-2">
                    <div className="font-bold text-gray-700">Campaign:</div>
                    <div>{printOrder.campaign_title}</div>
                    <div className="font-bold text-gray-700">Organizer:</div>
                    <div>{printOrder.organizer_name}</div>
                    <div className="font-bold text-gray-700">Order Date:</div>
                    <div>{new Date(printOrder.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-300">Pack Details</h2>
                  <div className="grid grid-cols-[150px_1fr] gap-2">
                    <div className="font-bold text-gray-700">Pack Type:</div>
                    <div>
                      <span className="inline-block px-4 py-1 bg-gray-200 rounded font-bold uppercase">
                        {printOrder.pack_type}
                      </span>
                    </div>
                    <div className="font-bold text-gray-700">Payment Status:</div>
                    <div className="font-bold" style={{ color: printOrder.payment_status === 'completed' ? 'green' : 'orange' }}>
                      {printOrder.payment_status.toUpperCase()}
                    </div>
                    {printOrder.paid_at && (
                      <>
                        <div className="font-bold text-gray-700">Paid On:</div>
                        <div>{new Date(printOrder.paid_at).toLocaleDateString()}</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-300">Pack Contents</h2>
                  <div className="bg-gray-100 p-4 rounded">
                    {packContents.filter(c => c.pack_type === printOrder.pack_type).length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-300">
                            <th className="text-left py-2">Item</th>
                            <th className="text-right py-2">Quantity</th>
                            <th className="text-right py-2">Packed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {packContents
                            .filter(c => c.pack_type === printOrder.pack_type)
                            .map((item) => (
                              <tr key={item.id} className="border-b border-gray-200">
                                <td className="py-2">{item.item_name}</td>
                                <td className="text-right py-2">{item.quantity}</td>
                                <td className="text-right py-2">☐</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      <div>No pack contents defined</div>
                    )}
                  </div>
                </div>

                {printOrder.tshirt_sizes && Object.values(printOrder.tshirt_sizes).some(size => size) && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-300">T-Shirt Sizes Ordered</h2>
                    <div className="bg-blue-50 p-4 rounded border-2 border-blue-300">
                      <div className="space-y-1">
                        {Object.entries(printOrder.tshirt_sizes)
                          .filter(([_, size]) => size)
                          .map(([key, size]) => (
                            <div key={key} className="font-medium">{key.replace('shirt_', 'T-Shirt ')}: {size}</div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-300">Shipping Address</h2>
                  <div className="border-2 border-black p-4 bg-gray-50">
                    <div className="font-bold text-lg mb-2">{printOrder.shipping_address.name}</div>
                    <div>{printOrder.shipping_address.address_line_1}</div>
                    {printOrder.shipping_address.address_line_2 && (
                      <div>{printOrder.shipping_address.address_line_2}</div>
                    )}
                    <div>{printOrder.shipping_address.city}, {printOrder.shipping_address.county}</div>
                    <div className="font-bold mt-1">{printOrder.shipping_address.eircode}</div>
                    <div>{printOrder.shipping_address.country}</div>
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <strong>Phone:</strong> {printOrder.mobile_number}
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 pb-2 border-b border-gray-300">Tracking Information</h2>
                  <div className="border-2 border-dashed border-gray-600 p-4 min-h-[60px]">
                    {printOrder.tracking_number ? (
                      <div><strong>Tracking Number:</strong> {printOrder.tracking_number}</div>
                    ) : (
                      <div className="italic text-gray-600">Tracking number not yet assigned</div>
                    )}
                  </div>
                </div>

                <div className="mt-12 pt-6 border-t border-gray-300">
                  <div className="grid grid-cols-[150px_1fr] gap-2">
                    <div className="font-bold text-gray-700">Packed By:</div>
                    <div>_____________________</div>
                    <div className="font-bold text-gray-700">Date:</div>
                    <div>_____________________</div>
                    <div className="font-bold text-gray-700">Checked By:</div>
                    <div>_____________________</div>
                  </div>
                </div>

                <div className="no-print mt-8 text-center space-x-4">
                  <button
                    onClick={() => window.print()}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                  >
                    Print
                  </button>
                  <button
                    onClick={() => setPrintOrder(null)}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

      {activeTab === 'contents' && (
        <PackContentsManager
          packContents={packContents}
          onAddContent={addPackContent}
          onUpdateContent={updatePackContent}
          onDeleteContent={deletePackContent}
        />
      )}
    </div>
  );
}
