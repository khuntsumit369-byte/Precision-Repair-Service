import React, { useState } from 'react';
import { CatalogItem } from '../types';
import { formatCurrency } from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Package,
  Wrench,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Boxes,
  TrendingUp,
  Tag,
} from 'lucide-react';

interface PartsInventoryProps {
  catalog: CatalogItem[];
  onSaveItem: (item: CatalogItem) => void;
  onDeleteItem: (itemId: string) => void;
  lang: 'gu' | 'en';
}

export const PartsInventory: React.FC<PartsInventoryProps> = ({
  catalog,
  onSaveItem,
  onDeleteItem,
  lang,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'part' | 'service'>('all');
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);

  // Filtered list
  const filteredItems = catalog.filter((item) => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      (item.nameGu && item.nameGu.toLowerCase().includes(term)) ||
      item.code.toLowerCase().includes(term) ||
      (item.category && item.category.toLowerCase().includes(term))
    );
  });

  const handleOpenAdd = () => {
    const newItem: CatalogItem = {
      id: 'item-' + Date.now(),
      code: 'PRT-' + Math.floor(100 + Math.random() * 900),
      name: '',
      nameGu: '',
      type: 'part',
      salePrice: 0,
      costPrice: 0,
      stock: 50,
      unit: 'pcs',
      category: 'Spare Parts',
    };
    setEditingItem(newItem);
    setIsNew(true);
  };

  const handleOpenEdit = (item: CatalogItem) => {
    setEditingItem({ ...item });
    setIsNew(false);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;
    onSaveItem(editingItem);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-600" />
            <span>
              {lang === 'gu'
                ? 'સ્પેર પાર્ટ્સ અને સર્વિસ ભાવ પત્રક (Product Master)'
                : 'Spare Parts Inventory & Service Rates'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'gu'
              ? 'Bearing (₹70), MOSFET (₹80), Cable (₹250), Coupler (₹40), Switch (₹30) અને સર્વિસ ચાર્જ'
              : 'Manage selling rates, purchase costs, inventory and labor charges used in billing & purchase.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'gu' ? '+ નવો સ્પેર પાર્ટ / સર્વિસ ઉમેરો' : '+ Add Item / Rate'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              lang === 'gu'
                ? 'પાર્ટ કે સર્વિસનું નામ અથવા કોડ શોધો...'
                : 'Search part name or code...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            {lang === 'gu' ? 'બધા (All)' : 'All Items'} ({catalog.length})
          </button>
          <button
            onClick={() => setTypeFilter('part')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'part' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            {lang === 'gu' ? 'સ્પેર પાર્ટ્સ (Parts)' : 'Spare Parts'} (
            {catalog.filter((i) => i.type === 'part').length})
          </button>
          <button
            onClick={() => setTypeFilter('service')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              typeFilter === 'service' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            {lang === 'gu' ? 'સર્વિસ ચાર્જ (Labor)' : 'Labor Services'} (
            {catalog.filter((i) => i.type === 'service').length})
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 pl-6 w-12 text-center">Sr.</th>
                <th className="py-3">Code</th>
                <th className="py-3">Name / વિગત</th>
                <th className="py-3 text-center">Type</th>
                <th className="py-3 text-right">Sale Price</th>
                <th className="py-3 text-right">Purchase Cost</th>
                <th className="py-3 text-center">Stock</th>
                <th className="py-3 text-right">Total Cost Value</th>
                <th className="py-3 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, index) => {
                const isPart = item.type === 'part';
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 pl-6 text-center font-mono font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 font-mono font-bold text-indigo-700">
                      {item.code}
                    </td>
                    <td className="py-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        {isPart ? (
                          <Package className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <Wrench className="w-4 h-4 text-indigo-600 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold text-sm text-slate-900">{item.name}</span>
                          {item.nameGu && (
                            <span className="text-xs text-slate-500 ml-2 font-normal">
                              ({item.nameGu})
                            </span>
                          )}
                          {item.category && (
                            <div className="text-[10px] text-slate-400 font-normal">
                              {item.category}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPart
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`}
                      >
                        {isPart ? 'Spare Part' : 'Service Labor'}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono font-black text-sm text-slate-900">
                      {formatCurrency(item.salePrice)}
                    </td>
                    <td className="py-3 text-right font-mono text-slate-500">
                      {isPart ? formatCurrency(item.costPrice) : '-'}
                    </td>
                    <td className="py-3 text-center font-mono">
                      {isPart ? (
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            (item.stock || 0) < 10
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.stock ?? 0} {item.unit || 'pcs'}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-800">
                      {isPart ? formatCurrency((item.stock || 0) * (item.costPrice || 0)) : '-'}
                    </td>
                    <td className="py-3 pr-6 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Item */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                {isNew
                  ? lang === 'gu'
                    ? 'નવો પાર્ટ અથવા સર્વિસ ઉમેરો'
                    : 'Add Item or Service'
                  : lang === 'gu'
                  ? 'સુધારો કરો'
                  : 'Edit Item / Rate'}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'આઇટમ ટાઇપ' : 'Item Type'}
                  </label>
                  <select
                    value={editingItem.type}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, type: e.target.value as any })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="part">Spare Part (સ્પેર પાર્ટ)</option>
                    <option value="service">Service Labor (સર્વિસ ચાર્જ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'કોડ (Item Code)' : 'Item Code'}
                  </label>
                  <input
                    type="text"
                    value={editingItem.code}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, code: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'નામ (English)' : 'Item Name (English)'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bearing, Cable, MOSFET"
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'નામ (ગુજરાતી)' : 'Name (Gujarati)'}
                </label>
                <input
                  type="text"
                  placeholder="દા.ત. બેરિંગ, કેબલ, મોસ્ફેટ"
                  value={editingItem.nameGu || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, nameGu: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'વેચાણ ભાવ (Sale Price ₹)' : 'Sale Price (₹)'} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingItem.salePrice}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        salePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'ખરીદ ભાવ (Purchase Cost ₹)' : 'Purchase Cost (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={editingItem.type === 'service'}
                    value={editingItem.costPrice}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        costPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-sm font-mono text-slate-700 border border-slate-300 rounded-xl disabled:bg-slate-100"
                  />
                </div>
              </div>

              {editingItem.type === 'part' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'gu' ? 'હાજર સ્ટોક (Stock)' : 'In Stock Quantity'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.stock || 0}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          stock: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {lang === 'gu' ? 'એકમ (Unit)' : 'Unit (pcs, set)'}
                    </label>
                    <input
                      type="text"
                      value={editingItem.unit || 'pcs'}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, unit: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  {lang === 'gu' ? 'સાચવો' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
