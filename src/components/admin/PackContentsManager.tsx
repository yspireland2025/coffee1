import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Save } from 'lucide-react';

interface ItemWithPacks {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  free_quantity: number;
  medium_quantity: number;
  large_quantity: number;
  free_pack_item_id: string | null;
  medium_pack_item_id: string | null;
  large_pack_item_id: string | null;
}

interface PackContentsManagerProps {
  items: ItemWithPacks[];
  onAddItem: (itemName: string, freeQty: number, mediumQty: number, largeQty: number) => Promise<void>;
  onUpdateItem: (itemId: string, itemName: string, freeQty: number, mediumQty: number, largeQty: number, freePIId: string | null, mediumPIId: string | null, largePIId: string | null) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
}

export default function PackContentsManager({
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}: PackContentsManagerProps) {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editFreeQty, setEditFreeQty] = useState(0);
  const [editMediumQty, setEditMediumQty] = useState(0);
  const [editLargeQty, setEditLargeQty] = useState(0);
  const [newItemName, setNewItemName] = useState('');
  const [newFreeQty, setNewFreeQty] = useState(0);
  const [newMediumQty, setNewMediumQty] = useState(0);
  const [newLargeQty, setNewLargeQty] = useState(0);

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      alert('Please enter an item name');
      return;
    }
    if (newFreeQty === 0 && newMediumQty === 0 && newLargeQty === 0) {
      alert('At least one pack type must have a quantity greater than 0');
      return;
    }

    await onAddItem(newItemName, newFreeQty, newMediumQty, newLargeQty);
    setNewItemName('');
    setNewFreeQty(0);
    setNewMediumQty(0);
    setNewLargeQty(0);
  };

  const handleUpdateItem = async (item: ItemWithPacks) => {
    if (!editItemName.trim()) {
      alert('Please enter an item name');
      return;
    }

    await onUpdateItem(
      item.id,
      editItemName,
      editFreeQty,
      editMediumQty,
      editLargeQty,
      item.free_pack_item_id,
      item.medium_pack_item_id,
      item.large_pack_item_id
    );
    setEditingItem(null);
    setEditItemName('');
    setEditFreeQty(0);
    setEditMediumQty(0);
    setEditLargeQty(0);
  };

  const startEdit = (item: ItemWithPacks) => {
    setEditingItem(item.id);
    setEditItemName(item.name);
    setEditFreeQty(item.free_quantity);
    setEditMediumQty(item.medium_quantity);
    setEditLargeQty(item.large_quantity);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setEditItemName('');
    setEditFreeQty(0);
    setEditMediumQty(0);
    setEditLargeQty(0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Pack Contents Management</h2>

        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Item</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Fundraising Guide"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Pack Qty</label>
              <input
                type="number"
                min="0"
                value={newFreeQty}
                onChange={(e) => setNewFreeQty(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medium Pack Qty</label>
              <input
                type="number"
                min="0"
                value={newMediumQty}
                onChange={(e) => setNewMediumQty(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Large Pack Qty</label>
              <input
                type="number"
                min="0"
                value={newLargeQty}
                onChange={(e) => setNewLargeQty(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleAddItem}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Item Name</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Free Pack</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Medium Pack</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Large Pack</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No items yet. Add your first item above.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {editingItem === item.id ? (
                      <>
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={editItemName}
                            onChange={(e) => setEditItemName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            value={editFreeQty}
                            onChange={(e) => setEditFreeQty(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            value={editMediumQty}
                            onChange={(e) => setEditMediumQty(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            min="0"
                            value={editLargeQty}
                            onChange={(e) => setEditLargeQty(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateItem(item)}
                              className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition-colors"
                              title="Save"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            item.free_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {item.free_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            item.medium_quantity > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {item.medium_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            item.large_quantity > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {item.large_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => startEdit(item)}
                              className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete "${item.name}"? This will remove it from all packs.`)) {
                                  await onDeleteItem(item.id);
                                }
                              }}
                              className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
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
