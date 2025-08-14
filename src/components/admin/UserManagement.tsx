import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Edit, Trash2, UserPlus, Mail, Phone,
  Calendar, MapPin, Shield, AlertTriangle, CheckCircle, Ban
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_active: boolean;
  campaigns_count: number;
  total_raised: number;
  source: 'users_table' | 'campaigns_only';
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load users from database
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        console.log('Loading users from database...');
        
        // Fetch users from users table
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (usersError) {
          console.error('Error loading users:', usersError);
        }
        
        console.log('Users from database:', usersData);
        
        // Fetch campaigns to get all campaign creators
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('campaigns')
          .select('user_id, organizer, email, goal_amount, raised_amount, created_at');
        
        if (campaignsError) {
          console.error('Error loading campaigns for user stats:', campaignsError);
          return;
        }
        const allUsersMap = new Map<string, User>();
        
        // Add users from users table
        if (usersData) {
          usersData.forEach(user => {
            allUsersMap.set(user.id, {
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              role: user.role,
              created_at: user.created_at,
              last_sign_in_at: user.last_login_at,
              is_active: user.is_active,
              campaigns_count: 0,
              total_raised: 0,
              source: 'users_table'
            });
          });
        }
        
        // Process campaigns to add campaign creators and calculate stats
        const campaignCreators = new Map<string, { organizer: string; email: string; created_at: string }>();
        
        if (campaignsData) {
          campaignsData.forEach(campaign => {
            const campaignRaisedAmount = Math.round(campaign.raised_amount / 100); // Convert cents to euros
            
            if (campaign.user_id) {
              // User has an ID, update their stats
              const existingUser = allUsersMap.get(campaign.user_id);
              if (existingUser) {
                existingUser.campaigns_count += 1;
                existingUser.total_raised += campaignRaisedAmount;
              } else {
                // User ID exists but not in users table, create from campaign data
                allUsersMap.set(campaign.user_id, {
                  id: campaign.user_id,
                  email: campaign.email,
                  full_name: campaign.organizer,
                  role: 'user',
                  created_at: campaign.created_at,
                  last_sign_in_at: null,
                  is_active: true,
                  campaigns_count: 1,
                  total_raised: campaignRaisedAmount,
                  source: 'campaigns_only'
                });
              }
            } else {
              // No user_id, track by email to avoid duplicates
              const emailKey = campaign.email.toLowerCase();
              if (!campaignCreators.has(emailKey)) {
                campaignCreators.set(emailKey, {
                  organizer: campaign.organizer,
                  email: campaign.email,
                  created_at: campaign.created_at
                });
              }
            }
          });
        }
        
        // Add campaign creators without user_id as separate users
        let tempIdCounter = 1;
        campaignCreators.forEach((creator, email) => {
          // Check if this email already exists in our users map
          const existingUser = Array.from(allUsersMap.values()).find(user => 
            user.email.toLowerCase() === email
          );
          
          if (!existingUser) {
            // Calculate stats for this email
            const userCampaigns = campaignsData?.filter(c => 
              !c.user_id && c.email.toLowerCase() === email
            ) || [];
            
            const totalRaised = userCampaigns.reduce((sum, campaign) => 
              sum + Math.round((campaign.raised_amount || 0) / 100), 0 // Convert cents to euros
            );
            
            allUsersMap.set(`temp_${tempIdCounter}`, {
              id: `temp_${tempIdCounter}`,
              email: creator.email,
              full_name: creator.organizer,
              role: 'user',
              created_at: creator.created_at,
              last_sign_in_at: null,
              is_active: true,
              campaigns_count: userCampaigns.length,
              total_raised: totalRaised,
              source: 'campaigns_only'
            });
            tempIdCounter++;
          }
        });
        
        // Convert map to array and sort by creation date
        const formattedUsers = Array.from(allUsersMap.values()).sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        console.log('Formatted users:', formattedUsers);
        
        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
        // Show error toast
        const errorToast = document.createElement('div');
        errorToast.className = 'fixed top-4 right-4 bg-red-100 border border-red-200 text-red-800 px-6 py-3 rounded-lg shadow-lg z-50';
        errorToast.innerHTML = `❌ Failed to load users: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
    
    loadUsers();
    
    // Set up real-time subscription for user changes
    const subscription = supabase
      .channel('admin_users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' },
        () => {
          console.log('User change detected, reloading...');
          loadUsers();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.is_active);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => !user.is_active);
      }
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter]);

  const handleActivateUser = (userId: string) => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, is_active: true } : user
    ));
  };

  const handleDeactivateUser = (userId: string) => {
    setUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, is_active: false } : user
    ));
  };

  const getStatusBadge = (user: User) => {
    if (user.is_active) {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Active</span>;
    }
    return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Inactive</span>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
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
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Invite User</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-gray-600 text-sm">Total Users</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.is_active).length}
              </p>
              <p className="text-gray-600 text-sm">Active Users</p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => !u.is_active).length}
              </p>
              <p className="text-gray-600 text-sm">Inactive</p>
            </div>
            <div className="bg-red-100 p-3 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.campaigns_count > 0).length}
              </p>
              <p className="text-gray-600 text-sm">Campaign Creators</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      ) : (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 min-w-[200px]">User</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700">Status</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden sm:table-cell">Campaigns</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden md:table-cell">Total Raised</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden lg:table-cell">Joined</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700 hidden lg:table-cell">Last Active</th>
                <th className="text-left py-4 px-3 sm:px-6 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-3 sm:px-6">
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.source === 'campaigns_only' && (
                        <p className="text-xs text-orange-600">Campaign creator (not registered)</p>
                      )}
                      <div className="sm:hidden mt-1 space-y-1">
                        <p className="text-xs text-gray-600">{user.campaigns_count} campaigns</p>
                        <p className="text-xs text-gray-600">€{user.total_raised.toLocaleString()} raised</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 sm:px-6">
                    {getStatusBadge(user)}
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden sm:table-cell">
                    <span className="text-gray-900 font-medium">{user.campaigns_count}</span>
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden md:table-cell">
                    <span className="text-gray-900 font-medium">€{user.total_raised.toLocaleString()}</span>
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden lg:table-cell">
                    <span className="text-gray-600 text-sm">{formatDate(user.created_at)}</span>
                  </td>
                  <td className="py-4 px-3 sm:px-6 hidden lg:table-cell">
                    <span className="text-gray-600 text-sm">{formatDate(user.last_sign_in_at)}</span>
                  </td>
                  <td className="py-4 px-3 sm:px-6">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDetails(true);
                        }}
                        className="bg-blue-100 text-blue-700 p-1.5 sm:p-2 rounded-lg hover:bg-blue-200 transition-colors"
                        title="View details"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      
                      {user.is_active ? (
                        <button
                          onClick={() => handleDeactivateUser(user.id)}
                          className="bg-red-100 text-red-700 p-1.5 sm:p-2 rounded-lg hover:bg-red-200 transition-colors"
                          title="Deactivate user"
                        >
                          <Ban className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateUser(user.id)}
                          className="bg-green-100 text-green-700 p-1.5 sm:p-2 rounded-lg hover:bg-green-200 transition-colors"
                          title="Activate user"
                        >
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
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
      )}

      {/* User Details Modal */}
      {showDetails && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Eye className="h-6 w-6 text-gray-700" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">User Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <p className="text-sm text-gray-600">{selectedUser.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Full Name</p>
                          <p className="text-sm text-gray-600">{selectedUser.full_name}</p>
                          {selectedUser.source === 'campaigns_only' && (
                            <p className="text-xs text-orange-600 mt-1">
                              This user created campaigns but hasn't registered an account
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Member Since</p>
                          <p className="text-sm text-gray-600">{formatDate(selectedUser.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Account Status</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">Status</p>
                        {getStatusBadge(selectedUser)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Role</p>
                        <p className="text-sm text-gray-600">{selectedUser.role}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Last Sign In</p>
                        <p className="text-sm text-gray-600">{formatDateTime(selectedUser.last_sign_in_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Activity Summary</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-blue-900">{selectedUser.campaigns_count}</p>
                      <p className="text-blue-700 text-sm">Campaigns Created</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4">
                      <p className="text-2xl font-bold text-green-900">€{selectedUser.total_raised.toLocaleString()}</p>
                      <p className="text-green-700 text-sm">Total Raised</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 pt-6 border-t border-gray-200">
                  {selectedUser.is_active ? (
                    <button
                      onClick={() => {
                        handleDeactivateUser(selectedUser.id);
                        setShowDetails(false);
                      }}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <Ban className="h-4 w-4" />
                      <span>Deactivate User</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleActivateUser(selectedUser.id);
                        setShowDetails(false);
                      }}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Activate User</span>
                    </button>
                  )}
                  
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
    </div>
  );
}