import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Save } from 'lucide-react';

interface PackContent {
  id: string;
  pack_type: 'free' | 'medium' | 'large';
  item_name: string;
  quantity: number;
  display_order: number;
}

interface PackContentsManagerProps {
  packContents: PackContent[];
  onAddContent: (packType: 'free' | 'medium' | 'large', itemName: string, quantity: number) => Promise<void>;
  onUpdateContent: (id: string, itemName: string, quantity: number) => Promise<void>;
  onDeleteContent: (id: string) => Promise<void>;
}

export default function PackContentsManager({
  packContents,
  onAddContent,
  onUpdateContent,
  onDeleteContent
}: PackContentsManagerProps) {
  const [selectedPackType, setSelectedPackType] = useState<'free' | 'medium' | 'large'>('free');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [newItemName, setNewItemName] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);

  const currentPackContents = packContents.filter(c => c.pack_type === selectedPackType);

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      alert('Please enter an item name');
      return;
    }
    if (newQuantity < 1) {
      alert('Quantity must be at least 1');
      return;
    }

    await onAddContent(selectedPackType, newItemName, newQuantity);
    setNewItemName('');
    setNewQuantity(1);
  };

  const handleUpdateItem = async (id: string) => {
    if (!editItemName.trim()) {
      alert('Please enter an item name');
      return;
    }
    if (editQuantity < 1) {
      alert('Quantity must be at least 1');
      return;
    }

    await onUpdateContent(id, editItemName, editQuantity);
    setEditingItem(null);
    setEditItemName('');
    setEditQuantity(1);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Pack Contents Management</h2>

        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => setSelectedPackType('free')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedPackType === 'free'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Free Pack
          </button>
          <button
            onClick={() => setSelectedPackType('medium')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedPackType === 'medium'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Medium Pack
          </button>
          <button
            onClick={() => setSelectedPackType('large')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              selectedPackType === 'large'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Large Pack
          </button>
        </div>

        <div className="mb-6 bg-gray-50 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Add New Item</h3>
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g., Fundraising Guide"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleAddItem}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-700">Item Name</th>
                <th className="text-center py-4 px-6 font-medium text-gray-700">Quantity</th>
                <th className="text-right py-4 px-6 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPackContents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    No items in this pack. Add items above.
                  </td>
                </tr>
              ) : (
                currentPackContents.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      {editingItem === item.id ? (
                        <input
                          type="text"
                          value={editItemName}
                          onChange={(e) => setEditItemName(e.target.value)}
                          className="w-full border border-gray-300 rounded px-3 py-1"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{item.item_name}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {editingItem === item.id ? (
                        <input
                          type="number"
                          min="1"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                          className="w-20 border border-gray-300 rounded px-3 py-1 text-center"
                        />
                      ) : (
                        <span className="text-gray-900">{item.quantity}</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        {editingItem === item.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateItem(item.id)}
                              className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingItem(null);
                                setEditItemName('');
                                setEditQuantity(1);
                              }}
                              className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingItem(item.id);
                                setEditItemName(item.item_name);
                                setEditQuantity(item.quantity);
                              }}
                              className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this item?')) {
                                  await onDeleteContent(item.id);
                                }
                              }}
                              className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
