import React, { useState } from 'react';
import { CatalogItem, PurchaseItem, PurchaseRecord } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Boxes,
  Plus,
  Search,
  ShoppingCart,
  TrendingUp,
  Package,
  Calendar,
  User,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  X,
  PlusCircle,
  Trash2,
  Edit2,
  ArrowUpRight,
  Filter,
} from 'lucide-react';

interface PartsPurchaseAndStockViewProps {
  catalog: CatalogItem[];
  purchases: PurchaseRecord[];
  onSaveCatalogItem: (item: CatalogItem) => void;
  onDeleteCatalogItem: (itemId: string) => void;
  onRecordPurchase: (purchase: PurchaseRecord, updatedCatalog: CatalogItem[]) => void;
  onUpdatePurchase?: (purchase: PurchaseRecord, updatedCatalog: CatalogItem[]) => void;
  onDeletePurchase?: (purchaseId: string) => void;
  lang: 'gu' | 'en';
}

export const PartsPurchaseAndStockView: React.FC<PartsPurchaseAndStockViewProps> = ({
  catalog,
  purchases,
  onSaveCatalogItem,
  onDeleteCatalogItem,
  onRecordPurchase,
  onUpdatePurchase,
  onDeletePurchase,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'purchases'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals state
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [editingPart, setEditingPart] = useState<CatalogItem | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);

  // New Purchase Bill form state
  const [purchaseVendor, setPurchaseVendor] = useState('');
  const [purchaseBillNo, setPurchaseBillNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseVendorPhone, setPurchaseVendorPhone] = useState('');
  const [purchasePaymentMode, setPurchasePaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Credit'>('Cash');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedPartIdToAdd, setSelectedPartIdToAdd] = useState('');
  const [purchaseQtyToAdd, setPurchaseQtyToAdd] = useState(10);
  const [purchaseCostToAdd, setPurchaseCostToAdd] = useState(0);

  // Only physical spare parts
  const spareParts = catalog.filter((i) => i.type === 'part');

  // Filtered parts for inventory table
  const filteredParts = spareParts.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      (item.nameGu && item.nameGu.toLowerCase().includes(term)) ||
      item.code.toLowerCase().includes(term)
    );
  });

  // Inventory stats
  const totalPartsCount = spareParts.length;
  const totalStockQuantity = spareParts.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalStockValuation = spareParts.reduce(
    (sum, p) => sum + (p.stock || 0) * (p.costPrice || 0),
    0
  );
  const lowStockCount = spareParts.filter((p) => (p.stock || 0) <= 15).length;
  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  // Stock quick adjustment
  const handleQuickStockAdjust = (item: CatalogItem, delta: number) => {
    const newStock = Math.max(0, (item.stock || 0) + delta);
    onSaveCatalogItem({
      ...item,
      stock: newStock,
    });
  };

  // Open Edit Part Modal
  const handleOpenEditPart = (item: CatalogItem) => {
    setEditingPart({ ...item });
    setShowAddPartModal(true);
  };

  // Open New Part Modal
  const handleOpenNewPart = () => {
    setEditingPart({
      id: 'item-' + Date.now(),
      code: 'PRT-' + Math.floor(100 + Math.random() * 900),
      name: '',
      nameGu: '',
      type: 'part',
      salePrice: 0,
      costPrice: 0,
      stock: 50,
      unit: 'pcs',
      category: 'Mechanical Spares',
    });
    setShowAddPartModal(true);
  };

  // Save Part Form
  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart || !editingPart.name.trim()) return;
    onSaveCatalogItem(editingPart);
    setShowAddPartModal(false);
    setEditingPart(null);
  };

  // Open New Purchase Bill Modal
  const handleOpenNewPurchase = () => {
    setEditingPurchase(null);
    const today = new Date().toISOString().split('T')[0];
    setPurchaseDate(today);
    setPurchaseVendor('');
    setPurchaseBillNo('');
    setPurchaseVendorPhone('');
    setPurchasePaymentMode('Cash');
    setPurchaseNotes('');
    setPurchaseItems([]);

    if (spareParts.length > 0) {
      setSelectedPartIdToAdd(spareParts[0].id);
      setPurchaseCostToAdd(spareParts[0].costPrice || 0);
      setPurchaseQtyToAdd(10);
    }
    setShowPurchaseModal(true);
  };

  // Open Edit Purchase Bill Modal
  const handleOpenEditPurchase = (purchase: PurchaseRecord) => {
    setEditingPurchase(purchase);
    setPurchaseDate(purchase.date);
    setPurchaseVendor(purchase.vendorName);
    setPurchaseBillNo(purchase.billNumber || '');
    setPurchaseVendorPhone(purchase.vendorPhone || '');
    setPurchasePaymentMode(purchase.paymentMode || 'Cash');
    setPurchaseNotes(purchase.notes || '');
    setPurchaseItems([...purchase.items]);

    if (spareParts.length > 0) {
      setSelectedPartIdToAdd(spareParts[0].id);
      setPurchaseCostToAdd(spareParts[0].costPrice || 0);
      setPurchaseQtyToAdd(10);
    }
    setShowPurchaseModal(true);
  };

  // Custom Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'purchase' | 'part';
    id: string;
    name: string;
    extra?: string;
  } | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'purchase' && onDeletePurchase) {
      onDeletePurchase(deleteTarget.id);
    } else if (deleteTarget.type === 'part') {
      onDeleteCatalogItem(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  // Delete Purchase Bill
  const handleDeletePurchaseClick = (purchase: PurchaseRecord) => {
    setDeleteTarget({
      type: 'purchase',
      id: purchase.id,
      name: `${purchase.purchaseNo} (${purchase.vendorName})`,
      extra: `${formatCurrency(purchase.totalAmount)} • ${formatDate(purchase.date)} • ${purchase.items.length} Parts (Reverts Stock)`,
    });
  };

  // Add Item to Purchase list
  const handleAddLineToPurchase = () => {
    const part = spareParts.find((p) => p.id === selectedPartIdToAdd);
    if (!part) return;

    const existingIdx = purchaseItems.findIndex((pi) => pi.catalogItemId === part.id);
    if (existingIdx >= 0) {
      const updated = [...purchaseItems];
      updated[existingIdx].quantity += purchaseQtyToAdd;
      updated[existingIdx].unitCost = purchaseCostToAdd;
      updated[existingIdx].totalCost = updated[existingIdx].quantity * purchaseCostToAdd;
      setPurchaseItems(updated);
    } else {
      const newItem: PurchaseItem = {
        id: 'pitem-' + Date.now(),
        catalogItemId: part.id,
        code: part.code,
        name: part.name,
        quantity: purchaseQtyToAdd,
        unitCost: purchaseCostToAdd,
        totalCost: purchaseQtyToAdd * purchaseCostToAdd,
      };
      setPurchaseItems([...purchaseItems, newItem]);
    }
  };

  const handleRemovePurchaseLine = (id: string) => {
    setPurchaseItems(purchaseItems.filter((i) => i.id !== id));
  };

  // Save or Update Purchase Bill and adjust Stock in Catalog
  const handleSavePurchaseBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseVendor.trim()) {
      alert(lang === 'gu' ? 'કૃપા કરીને વેન્ડર / સપ્લાયરનું નામ દાખલ કરો' : 'Please enter vendor name');
      return;
    }
    if (purchaseItems.length === 0) {
      alert(lang === 'gu' ? 'કૃપા કરીને ઓછામાં ઓછો એક પાર્ટ ઉમેરો' : 'Please add at least one part item');
      return;
    }

    const totalBill = purchaseItems.reduce((sum, item) => sum + item.totalCost, 0);

    if (editingPurchase) {
      // EDIT MODE
      const updatedPurchase: PurchaseRecord = {
        ...editingPurchase,
        billNumber: purchaseBillNo.trim() || undefined,
        vendorName: purchaseVendor.trim(),
        vendorPhone: purchaseVendorPhone.trim() || undefined,
        date: purchaseDate,
        items: purchaseItems,
        totalAmount: totalBill,
        paidAmount: purchasePaymentMode === 'Credit' ? 0 : totalBill,
        paymentMode: purchasePaymentMode,
        notes: purchaseNotes.trim() || undefined,
      };

      // Calculate difference in stocks
      const oldQuantities: Record<string, number> = {};
      editingPurchase.items.forEach((it) => {
        oldQuantities[it.catalogItemId] = (oldQuantities[it.catalogItemId] || 0) + it.quantity;
      });

      const newQuantities: Record<string, { qty: number; unitCost: number }> = {};
      purchaseItems.forEach((it) => {
        if (!newQuantities[it.catalogItemId]) {
          newQuantities[it.catalogItemId] = { qty: it.quantity, unitCost: it.unitCost };
        } else {
          newQuantities[it.catalogItemId].qty += it.quantity;
          newQuantities[it.catalogItemId].unitCost = it.unitCost;
        }
      });

      const updatedCatalog = catalog.map((catItem) => {
        let currentStock = catItem.stock || 0;
        // Revert old quantity
        if (oldQuantities[catItem.id]) {
          currentStock = Math.max(0, currentStock - oldQuantities[catItem.id]);
        }
        // Add new quantity
        if (newQuantities[catItem.id]) {
          currentStock += newQuantities[catItem.id].qty;
          return {
            ...catItem,
            stock: currentStock,
            costPrice: newQuantities[catItem.id].unitCost,
          };
        }
        return {
          ...catItem,
          stock: currentStock,
        };
      });

      if (onUpdatePurchase) {
        onUpdatePurchase(updatedPurchase, updatedCatalog);
      } else {
        onRecordPurchase(updatedPurchase, updatedCatalog);
      }
      setShowPurchaseModal(false);
      setEditingPurchase(null);
    } else {
      // NEW PURCHASE MODE
      const purchaseNo = `PUR-${new Date().getFullYear()}-${String(purchases.length + 1).padStart(3, '0')}`;

      const newPurchase: PurchaseRecord = {
        id: 'pur-' + Date.now(),
        purchaseNo,
        billNumber: purchaseBillNo.trim() || undefined,
        vendorName: purchaseVendor.trim(),
        vendorPhone: purchaseVendorPhone.trim() || undefined,
        date: purchaseDate,
        items: purchaseItems,
        totalAmount: totalBill,
        paidAmount: purchasePaymentMode === 'Credit' ? 0 : totalBill,
        paymentMode: purchasePaymentMode,
        notes: purchaseNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      // Increment stocks in catalog
      const updatedCatalog = catalog.map((item) => {
        const boughtItem = purchaseItems.find((pi) => pi.catalogItemId === item.id);
        if (boughtItem) {
          return {
            ...item,
            stock: (item.stock || 0) + boughtItem.quantity,
            costPrice: boughtItem.unitCost, // Update latest purchase cost
          };
        }
        return item;
      });

      onRecordPurchase(newPurchase, updatedCatalog);
      setShowPurchaseModal(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <Boxes className="w-5 h-5" />
            </div>
            <span>
              {lang === 'gu'
                ? 'પાર્ટ્સ ખરીદી અને સ્ટોક મેનેજમેન્ટ (Parts Purchase & Stock)'
                : 'Parts Purchase & Stock Inventory'}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'gu'
              ? 'સ્પેરપાર્ટ્સની ખરીદી (Purchase Bills), ગોડાઉન સ્ટોક, ખરીદ કિંમત (Cost Price) અને વેચાણ ભાવનો હિસાબ'
              : 'Track vendor purchase bills, stock levels, parts inventory valuation and reorder alerts.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenNewPurchase}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-amber-200 transition-all hover:scale-102"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{lang === 'gu' ? '+ નવી ખરીદી બિલ (Purchase)' : '+ New Purchase Bill'}</span>
          </button>

          <button
            onClick={handleOpenNewPart}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'gu' ? '+ નવો સ્પેરપાર્ટ' : '+ Add Part'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{lang === 'gu' ? 'કુલ સ્પેરપાર્ટ્સ' : 'Total Part Types'}</span>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {totalPartsCount}
          </div>
          <span className="text-[11px] text-slate-400">In Product Master</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{lang === 'gu' ? 'કુલ સ્ટોક નંગ' : 'Total Stock Qty'}</span>
            <Package className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 font-mono">
            {totalStockQuantity} <span className="text-xs font-sans text-slate-500">pcs</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Available in shop</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{lang === 'gu' ? 'કુલ સ્ટોક મૂલ્ય (Cost)' : 'Stock Valuation'}</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700 font-mono">
            {formatCurrency(totalStockValuation)}
          </div>
          <span className="text-[11px] text-slate-400">At Purchase Cost</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{lang === 'gu' ? 'કુલ ખરીદી (Purchases)' : 'Total Purchases'}</span>
            <ShoppingCart className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700 font-mono">
            {formatCurrency(totalPurchasesAmount)}
          </div>
          <span className="text-[11px] text-amber-600 font-medium">
            {purchases.length} Purchase bills recorded
          </span>
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/70">
          <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'stock'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>{lang === 'gu' ? '૧. પાર્ટ્સ સ્ટોક ઇન્વેન્ટરી' : '1. Stock Inventory'}</span>
              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full text-[10px]">
                {spareParts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'purchases'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{lang === 'gu' ? '૨. પાર્ટ્સ ખરીદી બિલ હિસ્ટ્રી' : '2. Purchase Bills'}</span>
              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full text-[10px]">
                {purchases.length}
              </span>
            </button>
          </div>

          {/* Search bar inside header */}
          <div className="flex items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'gu' ? 'શોધો (નામ, કોડ)...' : 'Search part name, code...'}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* TAB 1: Stock Inventory */}
        {activeTab === 'stock' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 pl-6 w-12 text-center">Sr.</th>
                  <th className="py-3">Part Code</th>
                  <th className="py-3">Part Name (સ્પેરપાર્ટ નામ)</th>
                  <th className="py-3 text-right">Purchase Cost (ખરીદ કિંમત)</th>
                  <th className="py-3 text-right">Selling Rate (વેચાણ ભાવ)</th>
                  <th className="py-3 text-center">Margin %</th>
                  <th className="py-3 text-center">In Stock (હાજર સ્ટોક)</th>
                  <th className="py-3 text-right">Total Cost Value (કુલ મૂલ્ય)</th>
                  <th className="py-3 text-center">Stock Adjust</th>
                  <th className="py-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-400 italic">
                      {lang === 'gu' ? 'કોઈ પાર્ટ મળ્યો નથી.' : 'No parts found matching search.'}
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((part, index) => {
                    const margin =
                      part.salePrice > part.costPrice && part.salePrice > 0
                        ? Math.round(((part.salePrice - part.costPrice) / part.salePrice) * 100)
                        : 0;
                    const isLowStock = (part.stock || 0) <= 15;

                    return (
                      <tr key={part.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 pl-6 text-center font-mono font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-700">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {part.code}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-slate-900">
                          <div>{part.name}</div>
                          {part.nameGu && (
                            <div className="text-[11px] text-slate-400 font-normal">
                              {part.nameGu}
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-600 font-medium">
                          {formatCurrency(part.costPrice)}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-indigo-700">
                          {formatCurrency(part.salePrice)}
                        </td>
                        <td className="py-3 text-center">
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-mono text-[10px]">
                            +{margin}%
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 font-mono font-bold px-2.5 py-1 rounded-full text-xs ${
                              isLowStock
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {part.stock || 0} {part.unit || 'pcs'}
                            {isLowStock && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-800">
                          {formatCurrency((part.stock || 0) * (part.costPrice || 0))}
                        </td>
                        <td className="py-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleQuickStockAdjust(part, -1)}
                              className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors text-xs"
                              title="Decrease 1"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleQuickStockAdjust(part, 1)}
                              className="w-6 h-6 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center transition-colors text-xs"
                              title="Increase 1"
                            >
                              +
                            </button>
                            <button
                              onClick={() => handleQuickStockAdjust(part, 10)}
                              className="px-1.5 h-6 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center transition-colors text-[10px]"
                              title="Add 10"
                            >
                              +10
                            </button>
                          </div>
                        </td>
                        <td className="py-3 pr-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditPart(part)}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                              title="Edit Part"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteTarget({
                                  type: 'part',
                                  id: part.id,
                                  name: part.name,
                                  extra: `${part.code} • Stock: ${part.stock || 0} ${part.unit || 'pcs'}`,
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete Part"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: Purchase Bills History */}
        {activeTab === 'purchases' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-3 pl-6 w-12 text-center">Sr.</th>
                  <th className="py-3">Purchase #</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Vendor / Supplier (વેન્ડર)</th>
                  <th className="py-3">Items Purchased (ખરીદેલ પાર્ટ્સ)</th>
                  <th className="py-3 text-right">Total Amount (રકમ)</th>
                  <th className="py-3 text-center">Payment Mode</th>
                  <th className="py-3 text-center">Status</th>
                  <th className="py-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                      {lang === 'gu'
                        ? 'હજુ સુધી કોઈ પાર્ટ્સ ખરીદી બિલ નોંધેલ નથી.'
                        : 'No purchase bills recorded yet. Click "+ New Purchase Bill" to record one.'}
                    </td>
                  </tr>
                ) : (
                  purchases.map((pur, index) => (
                    <tr key={pur.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pl-6 text-center font-mono font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="py-3.5 font-mono font-bold text-amber-900">
                        {pur.purchaseNo}
                        {pur.billNumber && (
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">
                            Bill: {pur.billNumber}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 font-medium text-slate-700">
                        {formatDate(pur.date)}
                      </td>
                      <td className="py-3.5">
                        <div className="font-bold text-slate-900">{pur.vendorName}</div>
                        {pur.vendorPhone && (
                          <div className="text-[11px] text-slate-400">{pur.vendorPhone}</div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {pur.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium"
                            >
                              {it.name} <strong>x{it.quantity}</strong> (@ ₹{it.unitCost})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-mono font-black text-amber-800 text-sm">
                        {formatCurrency(pur.totalAmount)}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded text-[10px]">
                          {pur.paymentMode}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            pur.paidAmount >= pur.totalAmount
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {pur.paidAmount >= pur.totalAmount ? 'PAID' : 'CREDIT / બાકી'}
                        </span>
                      </td>
                      <td className="py-3.5 pr-6 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditPurchase(pur)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title={lang === 'gu' ? 'ખરીદી બિલ સુધારો (Edit)' : 'Edit Purchase Bill'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePurchaseClick(pur)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={lang === 'gu' ? 'ખરીદી બિલ ડિલીટ કરો' : 'Delete Purchase Bill'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Record or Edit Purchase Bill */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-amber-50/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingPurchase
                      ? lang === 'gu'
                        ? `ખરીદી બિલ સુધારો (${editingPurchase.purchaseNo})`
                        : `Edit Purchase Bill (${editingPurchase.purchaseNo})`
                      : lang === 'gu'
                      ? 'નવું પાર્ટ્સ ખરીદી બિલ (New Purchase Bill)'
                      : 'New Parts Purchase Bill'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {lang === 'gu'
                      ? 'સ્પેરપાર્ટ્સની વિગત, જથ્થો અને ખરીદ કિંમત સેવ કરવાથી ગોડાઉન સ્ટોક ઓટોમેટિક અપડેટ થશે.'
                      : 'Vendor parts, bill items, quantities and costs automatically sync to inventory.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchaseBill} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'વેન્ડર / સપ્લાયર નામ (Vendor Name)' : 'Vendor / Supplier Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'gu' ? 'દા.ત. Royal Spares Rajkot' : 'e.g. Royal Spares'}
                    value={purchaseVendor}
                    onChange={(e) => setPurchaseVendor(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'ખરીદી તારીખ (Date)' : 'Purchase Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'વેન્ડર બિલ નંબર (Invoice #)' : 'Vendor Bill Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RS-9812"
                    value={purchaseBillNo}
                    onChange={(e) => setPurchaseBillNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'વેન્ડર ફોન નંબર' : 'Vendor Phone'}
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98250..."
                    value={purchaseVendorPhone}
                    onChange={(e) => setPurchaseVendorPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Add Items Subform */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                  <span>{lang === 'gu' ? 'ખરીદેલ પાર્ટ્સ ઉમેરો (Add Items to Bill)' : 'Add Purchased Parts:'}</span>
                </div>

                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <label className="block text-[11px] text-slate-500 mb-1">Select Part</label>
                    <select
                      value={selectedPartIdToAdd}
                      onChange={(e) => {
                        setSelectedPartIdToAdd(e.target.value);
                        const p = spareParts.find((item) => item.id === e.target.value);
                        if (p) setPurchaseCostToAdd(p.costPrice || 0);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                    >
                      {spareParts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code}) — Cost: ₹{p.costPrice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[11px] text-slate-500 mb-1">Qty (જથ્થો)</label>
                    <input
                      type="number"
                      min="1"
                      value={purchaseQtyToAdd}
                      onChange={(e) => setPurchaseQtyToAdd(parseInt(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-[11px] text-slate-500 mb-1">Unit Cost ₹</label>
                    <input
                      type="number"
                      min="0"
                      value={purchaseCostToAdd}
                      onChange={(e) => setPurchaseCostToAdd(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>

                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={handleAddLineToPurchase}
                      className="w-full h-8 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center justify-center font-bold"
                      title="Add item"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items in this bill */}
                {purchaseItems.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {purchaseItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-amber-600" />
                          <span className="font-semibold text-slate-800">{item.name}</span>
                          <span className="font-mono text-slate-500">
                            {item.quantity} x ₹{item.unitCost}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(item.totalCost)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePurchaseLine(item.id)}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 flex justify-between items-baseline font-bold text-slate-900 border-t border-slate-200">
                      <span>Total Purchase Bill:</span>
                      <span className="font-mono text-base text-amber-700">
                        {formatCurrency(purchaseItems.reduce((sum, it) => sum + it.totalCost, 0))}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'ચૂકવણી મોડ (Payment Mode)' : 'Payment Mode'}
                  </label>
                  <select
                    value={purchasePaymentMode}
                    onChange={(e) => setPurchasePaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="Cash">Cash (રોકડ ચૂકવેલ)</option>
                    <option value="UPI">UPI / GPay (ઓનલાઇન ચૂકવેલ)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Credit">Credit / બાકી (Later Payment)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'નોંધ / વિગત' : 'Notes'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Courier received via Navkar"
                    value={purchaseNotes}
                    onChange={(e) => setPurchaseNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {lang === 'gu'
                    ? 'આ બિલ સેવ કરવાથી પસંદ કરેલ સ્પેરપાર્ટ્સનો સ્ટોક આપમેળે ઉમેરાઈ જશે અને કેશ ફ્લોમાં જાવક નોંધાશે.'
                    : 'Saving this purchase will automatically increment catalog stocks and record an outflow in Cash Flow.'}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {editingPurchase
                    ? lang === 'gu'
                      ? 'ખરીદી બિલ અપડેટ કરો'
                      : 'Update Purchase Bill'
                    : lang === 'gu'
                    ? 'ખરીદી બિલ સાચવો (+ સ્ટોક અપડેટ)'
                    : 'Save Purchase Bill & Add Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Part */}
      {showAddPartModal && editingPart && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {editingPart.id.startsWith('item-')
                  ? lang === 'gu'
                    ? 'નવો સ્પેરપાર્ટ ઉમેરો'
                    : 'Add New Spare Part'
                  : lang === 'gu'
                  ? 'સ્પેરપાર્ટ એડિટ કરો'
                  : 'Edit Spare Part'}
              </h2>
              <button
                onClick={() => setShowAddPartModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePart} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Part Code</label>
                <input
                  type="text"
                  required
                  value={editingPart.code}
                  onChange={(e) => setEditingPart({ ...editingPart, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'સ્પેરપાર્ટ નામ (English)' : 'Part Name (English)'} *
                </label>
                <input
                  type="text"
                  required
                  value={editingPart.name}
                  onChange={(e) => setEditingPart({ ...editingPart, name: e.target.value })}
                  placeholder="e.g. Bearing, Cable, MOSFET"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'ગુજરાતી નામ (વૈકલ્પિક)' : 'Gujarati Name (Optional)'}
                </label>
                <input
                  type="text"
                  value={editingPart.nameGu || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, nameGu: e.target.value })}
                  placeholder="દા.ત. બેરિંગ, કેબલ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'ખરીદ કિંમત (Cost ₹)' : 'Purchase Cost (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingPart.costPrice}
                    onChange={(e) =>
                      setEditingPart({ ...editingPart, costPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'વેચાણ ભાવ (Sale ₹)' : 'Selling Rate (₹)'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingPart.salePrice}
                    onChange={(e) =>
                      setEditingPart({ ...editingPart, salePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'હાજર સ્ટોક (Initial In-Stock)' : 'In-Stock Quantity'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingPart.stock || 0}
                  onChange={(e) =>
                    setEditingPart({ ...editingPart, stock: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddPartModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl"
                >
                  Save Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REUSABLE CUSTOM IN-UI DELETE CONFIRMATION MODAL */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title={
          deleteTarget?.type === 'purchase'
            ? lang === 'gu'
              ? 'ખરીદી બિલ ડિલીટ કરો'
              : 'Delete Purchase Bill'
            : lang === 'gu'
            ? 'સ્પેરપાર્ટ ડિલીટ કરો'
            : 'Delete Spare Part'
        }
        message={
          deleteTarget?.type === 'purchase'
            ? lang === 'gu'
              ? `શું તમે ખરીદી બિલ #${deleteTarget?.name} ડિલીટ કરવા માંગો છો? આનાથી ખરીદેલ પાર્ટ્સનો સ્ટોક આપમેળે રિવર્ટ થઈ જશે.`
              : `Delete purchase bill #${deleteTarget?.name}? This will revert purchased inventory stock.`
            : lang === 'gu'
            ? `શું તમે ખરેખર સ્પેરપાર્ટ "${deleteTarget?.name}" ડિલીટ કરવા માંગો છો?`
            : `Are you sure you want to delete part "${deleteTarget?.name}"?`
        }
        itemDetails={deleteTarget?.extra}
        confirmButtonText={lang === 'gu' ? 'હા, ડિલીટ કરો' : 'Yes, Delete'}
        cancelButtonText={lang === 'gu' ? 'રદ કરો' : 'Cancel'}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        lang={lang}
      />
    </div>
  );
};
