import React, { useState, useEffect } from 'react';
import {
  CatalogItem,
  Customer,
  Invoice,
  RepairedUnit,
  UnitMasterItem,
  UnitPartUsage,
  UnitServiceCharge,
  WorkshopSettings,
} from '../types';
import { generateInvoiceNumber, generateUnitTrackingCode } from '../utils/codeGenerator';
import { getNextAtomicInvoiceNumber } from '../utils/firestoreSync';
import { formatCurrency } from '../utils/formatters';
import {
  Plus,
  Trash2,
  Wrench,
  Package,
  Save,
  ArrowLeft,
  Tag,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Edit3,
  X,
} from 'lucide-react';

interface InvoiceEditorProps {
  initialInvoice?: Invoice | null;
  catalog: CatalogItem[];
  customers: Customer[];
  existingInvoices: Invoice[];
  unitMasters?: UnitMasterItem[];
  settings: WorkshopSettings;
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
  lang: 'gu' | 'en';
}

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({
  initialInvoice,
  catalog,
  customers,
  existingInvoices,
  unitMasters = [],
  settings,
  onSave,
  onCancel,
  lang,
}) => {
  const isEditing = !!initialInvoice;

  // Invoice-level state
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    initialInvoice ? initialInvoice.invoiceNumber : generateInvoiceNumber(existingInvoices)
  );

  // Sync atomic next invoice number across devices for new invoice
  useEffect(() => {
    if (!initialInvoice) {
      let isCancelled = false;
      getNextAtomicInvoiceNumber()
        .then((atomicNum) => {
          if (!isCancelled && atomicNum) {
            setInvoiceNumber(atomicNum);
          }
        })
        .catch(() => {});
      return () => {
        isCancelled = true;
      };
    }
  }, [initialInvoice]);
  const [date, setDate] = useState<string>(
    initialInvoice ? initialInvoice.date : new Date().toISOString().split('T')[0]
  );
  const [customerId, setCustomerId] = useState<string>(
    initialInvoice ? initialInvoice.customerId : customers[0]?.id || ''
  );
  const [customerName, setCustomerName] = useState<string>(
    initialInvoice ? initialInvoice.customerName : customers[0]?.name || ''
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    initialInvoice ? initialInvoice.customerPhone || '' : customers[0]?.phone || ''
  );
  const [customerCity, setCustomerCity] = useState<string>(
    initialInvoice ? initialInvoice.customerCity || '' : customers[0]?.city || ''
  );
  const [discount, setDiscount] = useState<number>(initialInvoice ? initialInvoice.discount : 0);
  const [taxPercent, setTaxPercent] = useState<number>(initialInvoice ? initialInvoice.taxPercent : 0);
  const [paidAmount, setPaidAmount] = useState<number>(initialInvoice ? initialInvoice.paidAmount : 0);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>(
    initialInvoice?.paymentMode || 'Cash'
  );
  const [remarks, setRemarks] = useState<string>(initialInvoice?.remarks || '');

  // Units list state
  const [units, setUnits] = useState<RepairedUnit[]>(initialInvoice ? initialInvoice.units : []);

  // Custom Manual Unit Modal State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customUnitName, setCustomUnitName] = useState('');
  const [customUnitPrefix, setCustomUnitPrefix] = useState('UNT');
  const [customServiceCharge, setCustomServiceCharge] = useState<number>(200);
  const [customBrandModel, setCustomBrandModel] = useState('');
  const [customIssue, setCustomIssue] = useState('');

  // Dropdown for selecting from all master units
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');

  // Stock error alert message
  const [stockErrorMessage, setStockErrorMessage] = useState<string | null>(null);

  // Helper to find catalog item for a part usage
  const findCatalogItem = (part: { catalogItemId?: string; code?: string; name: string }) => {
    return catalog.find(
      (c) =>
        c.id === part.catalogItemId ||
        (part.code && c.code.toLowerCase() === part.code.toLowerCase()) ||
        c.name.toLowerCase() === part.name.toLowerCase()
    );
  };

  // Helper to compute available stock for a catalog item in this editor session
  const getAvailableStockForItem = (catalogItemId: string, excludeUnitPartId?: string): number => {
    const catItem = catalog.find((c) => c.id === catalogItemId);
    if (!catItem || catItem.type !== 'part') return 999999;

    const baseStock = catItem.stock ?? 0;

    // If editing an existing invoice, restore the quantity previously used by initialInvoice
    let initialUsed = 0;
    if (initialInvoice && initialInvoice.units) {
      initialInvoice.units.forEach((u) => {
        u.parts?.forEach((p) => {
          const match = findCatalogItem(p);
          if (match && match.id === catItem.id) {
            initialUsed += (p.quantity || 1);
          }
        });
      });
    }

    const totalAllowed = baseStock + initialUsed;

    // Sum currently added in editor's units (excluding the specific row being edited)
    let currentUsed = 0;
    units.forEach((u) => {
      u.parts?.forEach((p) => {
        if (excludeUnitPartId && p.id === excludeUnitPartId) {
          return;
        }
        const match = findCatalogItem(p);
        if (match && match.id === catItem.id) {
          currentUsed += (p.quantity || 1);
        }
      });
    });

    return Math.max(0, totalAllowed - currentUsed);
  };

  // When customer dropdown changes
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__new__') {
      setCustomerId('cust-' + Date.now());
      setCustomerName('');
      setCustomerPhone('');
      setCustomerCity('');
    } else {
      const c = customers.find((cust) => cust.id === val);
      if (c) {
        setCustomerId(c.id);
        setCustomerName(c.name);
        setCustomerPhone(c.phone || '');
        setCustomerCity(c.city || '');
      }
    }
  };

  // Helper to collect all existing codes
  const getAllCodes = () => {
    const codes: string[] = [];
    existingInvoices.forEach((inv) => {
      inv.units.forEach((u) => codes.push(u.trackingCode));
    });
    units.forEach((u) => codes.push(u.trackingCode));
    return codes;
  };

  // Add new Unit from Master item or by type
  const handleAddUnitFromMaster = (masterItem: UnitMasterItem) => {
    const displayName = (lang === 'gu' && masterItem.nameGu) ? masterItem.nameGu : masterItem.name;
    const cleanName = displayName.split('(')[0].trim();
    const currentOfType = units.filter((u) => u.unitType === cleanName || u.unitName.startsWith(cleanName)).length + 1;
    const unitName = `${cleanName} ${currentOfType}`;
    const code = generateUnitTrackingCode(cleanName, getAllCodes(), date, masterItem.codePrefix);

    const defaultServices: UnitServiceCharge[] = [];
    if (masterItem.defaultServiceCharge > 0) {
      defaultServices.push({
        id: 'srv-' + Date.now(),
        name: `${cleanName} Service Charge`,
        charge: masterItem.defaultServiceCharge,
      });
    }

    const newUnit: RepairedUnit = {
      id: 'unit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      unitType: cleanName,
      unitName,
      trackingCode: code,
      brandModel: '',
      reportedIssue: masterItem.commonIssues?.[0] || '',
      technicianNotes: '',
      parts: [],
      services: defaultServices,
      unitSubtotal: defaultServices.reduce((sum, s) => sum + s.charge, 0),
      warrantyDays: masterItem.defaultWarrantyDays || settings.defaultWarrantyDays,
      status: 'Repaired',
    };

    setUnits([...units, newUnit]);
  };

  // Add Custom / Manual Unit
  const handleAddCustomManualUnit = () => {
    const rawName = customUnitName.trim() || (lang === 'gu' ? 'અન્ય મશીન યુનિટ' : 'Custom Machine Unit');
    const prefix = customUnitPrefix.trim().toUpperCase() || 'UNT';
    const currentOfType = units.filter((u) => u.unitName.startsWith(rawName)).length + 1;
    const unitName = `${rawName} ${currentOfType}`;
    const code = generateUnitTrackingCode(rawName, getAllCodes(), date, prefix);

    const defaultServices: UnitServiceCharge[] = [];
    if (customServiceCharge > 0) {
      defaultServices.push({
        id: 'srv-' + Date.now(),
        name: `${rawName} Service Charge`,
        charge: customServiceCharge,
      });
    }

    const newUnit: RepairedUnit = {
      id: 'unit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      unitType: 'Custom',
      unitName,
      trackingCode: code,
      brandModel: customBrandModel.trim(),
      reportedIssue: customIssue.trim(),
      technicianNotes: '',
      parts: [],
      services: defaultServices,
      unitSubtotal: defaultServices.reduce((sum, s) => sum + s.charge, 0),
      warrantyDays: settings.defaultWarrantyDays,
      status: 'Repaired',
    };

    setUnits([...units, newUnit]);
    setShowCustomModal(false);
    setCustomUnitName('');
    setCustomBrandModel('');
    setCustomIssue('');
  };

  // Add new Unit (Handpiece or Motor or other)
  const handleAddUnit = (type: 'Handpiece' | 'Motor' | 'Custom') => {
    // If master has a matching item, use its prefix/charges
    const matchingMaster = unitMasters.find((um) => {
      const n = (um.name + ' ' + (um.nameGu || '')).toLowerCase();
      if (type === 'Handpiece') return n.includes('handpiece') || n.includes('હેન્ડપીસ');
      if (type === 'Motor') return (n.includes('motor') || n.includes('મોટર')) && !n.includes('polishing');
      return false;
    });

    if (matchingMaster) {
      handleAddUnitFromMaster(matchingMaster);
      return;
    }

    const currentOfType = units.filter((u) => u.unitType === type).length + 1;
    const unitName = `${type} ${currentOfType}`;
    const code = generateUnitTrackingCode(type, getAllCodes(), date);

    // If Handpiece or Motor, we can automatically add their standard service charge if found
    const defaultServices: UnitServiceCharge[] = [];
    if (type === 'Handpiece') {
      const srvItem = catalog.find((i) => i.id === 'item-srv-hp' || i.name.toLowerCase().includes('handpiece service'));
      if (srvItem) {
        defaultServices.push({
          id: 'srv-' + Date.now(),
          catalogItemId: srvItem.id,
          name: srvItem.name,
          charge: srvItem.salePrice,
        });
      }
    } else if (type === 'Motor') {
      const srvItem = catalog.find((i) => i.id === 'item-srv-mot' || i.name.toLowerCase().includes('motor service'));
      if (srvItem) {
        defaultServices.push({
          id: 'srv-' + Date.now(),
          catalogItemId: srvItem.id,
          name: srvItem.name,
          charge: srvItem.salePrice,
        });
      }
    }

    const newUnit: RepairedUnit = {
      id: 'unit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      unitType: type,
      unitName,
      trackingCode: code,
      brandModel: '',
      reportedIssue: '',
      technicianNotes: '',
      parts: [],
      services: defaultServices,
      unitSubtotal: defaultServices.reduce((sum, s) => sum + s.charge, 0),
      warrantyDays: settings.defaultWarrantyDays,
      status: 'Repaired',
    };

    setUnits([...units, newUnit]);
  };

  // Remove Unit
  const handleRemoveUnit = (unitId: string) => {
    setUnits(units.filter((u) => u.id !== unitId));
  };

  // Update Unit Details
  const handleUpdateUnitField = (unitId: string, field: keyof RepairedUnit, value: any) => {
    setUnits(
      units.map((u) => {
        if (u.id !== unitId) return u;
        return { ...u, [field]: value };
      })
    );
  };

  // Add Part to a specific Unit
  const handleAddPartToUnit = (unitId: string, catalogItemId: string) => {
    const item = catalog.find((i) => i.id === catalogItemId);
    if (!item) return;

    // Check available stock
    const available = getAvailableStockForItem(item.id);
    if (available <= 0) {
      const err =
        lang === 'gu'
          ? `ખાલી સ્ટોક ભૂલ (Empty Stock Error)! "${item.name}" નો સ્ટોક ખાલી છે (0 pcs ઉપલબ્ધ). આ પાર્ટ બિલમાં ઉમેરી શકાશે નહીં.`
          : `Empty stock error! "${item.name}" is out of stock (0 pcs available). Cannot add to invoice.`;
      setStockErrorMessage(err);
      return;
    }

    setStockErrorMessage(null);

    setUnits(
      units.map((unit) => {
        if (unit.id !== unitId) return unit;
        const newPart: UnitPartUsage = {
          id: 'part-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          catalogItemId: item.id,
          name: item.name,
          code: item.code,
          quantity: 1,
          unitPrice: item.salePrice,
          totalPrice: item.salePrice,
          costPrice: item.costPrice || 0,
          totalCost: (item.costPrice || 0) * 1,
        };
        const updatedParts = [...unit.parts, newPart];
        const partsCost = updatedParts.reduce((sum, p) => sum + p.totalPrice, 0);
        const srvCost = unit.services.reduce((sum, s) => sum + s.charge, 0);
        return {
          ...unit,
          parts: updatedParts,
          unitSubtotal: partsCost + srvCost,
        };
      })
    );
  };

  // Update Part quantity / price in a Unit
  const handleUpdatePart = (
    unitId: string,
    partId: string,
    quantity: number,
    unitPrice: number
  ) => {
    const targetUnit = units.find((u) => u.id === unitId);
    const targetPart = targetUnit?.parts.find((p) => p.id === partId);
    const catItem = targetPart ? findCatalogItem(targetPart) : null;

    let finalQuantity = Math.max(1, quantity);

    if (catItem && catItem.type === 'part') {
      const maxAllowedForThisRow = getAvailableStockForItem(catItem.id, partId);
      if (maxAllowedForThisRow <= 0) {
        const err =
          lang === 'gu'
            ? `ખાલી સ્ટોક ભૂલ (Empty Stock Error)! "${targetPart?.name}" નો સ્ટોક ખાલી છે.`
            : `Empty stock error! "${targetPart?.name}" is out of stock.`;
        setStockErrorMessage(err);
        finalQuantity = 1;
      } else if (quantity > maxAllowedForThisRow) {
        const err =
          lang === 'gu'
            ? `ખાલી સ્ટોક ભૂલ (Empty Stock Error)! "${targetPart?.name}" માટે માત્ર ${maxAllowedForThisRow} pcs સ્ટોક ઉપલબ્ધ છે. સ્ટોક કરતા વધારે એડ કરી શકાશે નહીં.`
            : `Empty stock error! Only ${maxAllowedForThisRow} pcs available for "${targetPart?.name}". Cannot exceed available stock.`;
        setStockErrorMessage(err);
        finalQuantity = maxAllowedForThisRow;
      } else {
        setStockErrorMessage(null);
      }
    }

    setUnits(
      units.map((unit) => {
        if (unit.id !== unitId) return unit;
        const updatedParts = unit.parts.map((p) => {
          if (p.id !== partId) return p;
          const pr = Math.max(0, unitPrice);
          const cp = p.costPrice ?? (catItem?.costPrice || 0);
          return {
            ...p,
            quantity: finalQuantity,
            unitPrice: pr,
            totalPrice: finalQuantity * pr,
            costPrice: cp,
            totalCost: finalQuantity * cp,
          };
        });
        const partsCost = updatedParts.reduce((sum, p) => sum + p.totalPrice, 0);
        const srvCost = unit.services.reduce((sum, s) => sum + s.charge, 0);
        return {
          ...unit,
          parts: updatedParts,
          unitSubtotal: partsCost + srvCost,
        };
      })
    );
  };

  // Remove Part from Unit
  const handleRemovePart = (unitId: string, partId: string) => {
    setUnits(
      units.map((unit) => {
        if (unit.id !== unitId) return unit;
        const updatedParts = unit.parts.filter((p) => p.id !== partId);
        const partsCost = updatedParts.reduce((sum, p) => sum + p.totalPrice, 0);
        const srvCost = unit.services.reduce((sum, s) => sum + s.charge, 0);
        return {
          ...unit,
          parts: updatedParts,
          unitSubtotal: partsCost + srvCost,
        };
      })
    );
  };

  // Add Service Charge to Unit
  const handleAddServiceToUnit = (unitId: string, catalogItemId: string) => {
    const item = catalog.find((i) => i.id === catalogItemId);
    if (!item) return;

    setUnits(
      units.map((unit) => {
        if (unit.id !== unitId) return unit;
        const newService: UnitServiceCharge = {
          id: 'srv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
          catalogItemId: item.id,
          name: item.name,
          charge: item.salePrice,
        };
        const updatedServices = [...unit.services, newService];
        const partsCost = unit.parts.reduce((sum, p) => sum + p.totalPrice, 0);
        const srvCost = updatedServices.reduce((sum, s) => sum + s.charge, 0);
        return {
          ...unit,
          services: updatedServices,
          unitSubtotal: partsCost + srvCost,
        };
      })
    );
  };

  // Update Service Charge amount
  const handleUpdateServiceCharge = (
    unitId: string,
    serviceId: string,
    newCharge: number
  ) => {
    setUnits(
      units.map((unit) => {
        if (unit.id !== unitId) return unit;
        const updatedServices = unit.services.map((s) => {
          if (s.id !== serviceId) return s;
          return { ...s, charge: Math.max(0, newCharge) };
        });
        const partsCost = unit.parts.reduce((sum, p) => sum + p.totalPrice, 0);
        const srvCost = updatedServices.reduce((sum, s) => sum + s.charge, 0);
        return {
          ...unit,
          services: updatedServices,
          unitSubtotal: partsCost + srvCost,
        };
      })
    );
  };

  // Remove Service Charge
  const handleRemoveService = (unitId: string, serviceId: string) => {
    setUnits(
      units.map((unit) => {
        if (unit.id !== unitId) return unit;
        const updatedServices = unit.services.filter((s) => s.id !== serviceId);
        const partsCost = unit.parts.reduce((sum, p) => sum + p.totalPrice, 0);
        const srvCost = updatedServices.reduce((sum, s) => sum + s.charge, 0);
        return {
          ...unit,
          services: updatedServices,
          unitSubtotal: partsCost + srvCost,
        };
      })
    );
  };

  // Calculate totals
  const partsTotal = units.reduce(
    (sum, u) => sum + u.parts.reduce((pSum, p) => pSum + p.totalPrice, 0),
    0
  );
  const totalPartsPurchaseCost = units.reduce(
    (sum, u) =>
      sum +
      u.parts.reduce((pSum, p) => {
        const catItem = findCatalogItem(p);
        const cp = p.costPrice ?? (catItem?.costPrice || 0);
        return pSum + (p.quantity || 1) * cp;
      }, 0),
    0
  );
  const servicesTotal = units.reduce(
    (sum, u) => sum + u.services.reduce((sSum, s) => sSum + s.charge, 0),
    0
  );
  const subtotal = partsTotal + servicesTotal;
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxAmount = taxPercent > 0 ? Math.round((taxableAmount * taxPercent) / 100) : 0;
  const grandTotal = taxableAmount + taxAmount;
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  // Auto-set paid amount on new invoice creation if desired
  useEffect(() => {
    if (!initialInvoice && paidAmount === 0 && grandTotal > 0) {
      setPaidAmount(grandTotal);
    }
  }, [grandTotal]);

  const handleSave = () => {
    if (!customerName.trim()) {
      alert(lang === 'gu' ? 'કૃપા કરીને ગ્રાહકનું નામ દાખલ કરો' : 'Please enter customer name');
      return;
    }
    if (units.length === 0) {
      alert(lang === 'gu' ? 'કૃપા કરીને ઓછામાં ઓછું 1 રીપેર યુનિટ ઉમેરો' : 'Please add at least 1 repaired unit');
      return;
    }

    // Validate that all parts in the bill do not exceed available catalog stock
    const partsUsageMap: Record<string, { name: string; requestedQty: number }> = {};
    units.forEach((u) => {
      u.parts?.forEach((p) => {
        const catItem = findCatalogItem(p);
        if (catItem && catItem.type === 'part') {
          if (!partsUsageMap[catItem.id]) {
            partsUsageMap[catItem.id] = { name: catItem.name, requestedQty: 0 };
          }
          partsUsageMap[catItem.id].requestedQty += (p.quantity || 1);
        }
      });
    });

    for (const catId of Object.keys(partsUsageMap)) {
      const usage = partsUsageMap[catId];
      const catItem = catalog.find((c) => c.id === catId);
      if (catItem) {
        let initialUsed = 0;
        if (initialInvoice && initialInvoice.units) {
          initialInvoice.units.forEach((u) => {
            u.parts?.forEach((p) => {
              const match = findCatalogItem(p);
              if (match && match.id === catItem.id) {
                initialUsed += (p.quantity || 1);
              }
            });
          });
        }
        const totalAllowed = (catItem.stock ?? 0) + initialUsed;
        if (usage.requestedQty > totalAllowed) {
          const errMsg =
            lang === 'gu'
              ? `ખાલી સ્ટોક ભૂલ (Empty Stock Error)! "${usage.name}" નો સ્ટોક ખાલી અથવા અપૂરતો છે (જરૂરી: ${usage.requestedQty} pcs, સ્ટોક: ${totalAllowed} pcs). સ્ટોક કરતાં વધુ બિલમાં ન લઈ શકાય.`
              : `Empty stock error! Insufficient stock for "${usage.name}" (Required: ${usage.requestedQty} pcs, Available stock: ${totalAllowed} pcs). Cannot exceed available stock.`;
          setStockErrorMessage(errMsg);
          alert(errMsg);
          return;
        }
      }
    }

    let paymentStatus: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (paidAmount >= grandTotal) {
      paymentStatus = 'Paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'Partial';
    }

    // Sanitize units with costPrice and totalCost
    const sanitizedUnits: RepairedUnit[] = units.map((u) => ({
      ...u,
      parts: u.parts.map((p) => {
        const catItem = findCatalogItem(p);
        const costPrice = p.costPrice ?? (catItem?.costPrice || 0);
        return {
          ...p,
          costPrice,
          totalCost: (p.quantity || 1) * costPrice,
        };
      }),
    }));

    const newInvoice: Invoice = {
      id: initialInvoice ? initialInvoice.id : 'inv-' + Date.now(),
      invoiceNumber,
      date,
      customerId: customerId || 'cust-' + Date.now(),
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerCity: customerCity.trim(),
      units: sanitizedUnits,
      totalUnitsCount: sanitizedUnits.length,
      partsTotal,
      servicesTotal,
      subtotal,
      discount,
      taxPercent,
      taxAmount,
      grandTotal,
      paidAmount,
      balanceDue,
      paymentStatus,
      paymentMode,
      remarks,
      createdAt: initialInvoice ? initialInvoice.createdAt : new Date().toISOString(),
    };

    onSave(newInvoice);
  };

  const sparePartItems = catalog.filter((i) => i.type === 'part');
  const serviceItems = catalog.filter((i) => i.type === 'service');

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEditing
                ? lang === 'gu'
                  ? 'ઇનવોઇસ સુધારો (Edit Invoice)'
                  : 'Edit Invoice'
                : lang === 'gu'
                ? 'નવું રીપેર બિલ બનાવો (Create Repair Bill)'
                : 'Create Repair Service Bill'}
            </h1>
            <p className="text-xs text-slate-500">
              {lang === 'gu'
                ? 'દરેક મશીન (હેન્ડપીસ/મોટર) ના યુનિટ કોડ અને સ્પેરપાર્ટ્સની ગણતરી સાથે બિલ'
                : 'Consolidated invoice with unique tracking codes for each Handpiece / Motor'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all hover:shadow-indigo-200"
          >
            <Save className="w-4 h-4" />
            <span>{lang === 'gu' ? 'બિલ સેવ કરો & કોડ બનાવો' : 'Save & Generate Bill'}</span>
          </button>
        </div>
      </div>

      {/* Stock Error Alert Banner */}
      {stockErrorMessage && (
        <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800">
                {lang === 'gu' ? 'સ્ટોક ચેતવણી (Stock Alert / Empty Stock)' : 'Stock Alert / Empty Stock'}
              </h4>
              <p className="text-xs font-semibold text-rose-700 mt-0.5">{stockErrorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStockErrorMessage(null)}
            className="text-rose-400 hover:text-rose-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Customer & Invoice Meta Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
          {lang === 'gu' ? '1. બિલ અને ગ્રાહકની વિગત' : '1. Invoice & Customer Details'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'gu' ? 'ઇનવોઇસ નં' : 'Invoice Number'}
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'gu' ? 'તારીખ (Date)' : 'Invoice Date'}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'gu' ? 'ગ્રાહક પસંદ કરો (Select Customer)' : 'Select Customer'}
            </label>
            <select
              value={customerId}
              onChange={handleCustomerChange}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city || 'City'})
                </option>
              ))}
              <option value="__new__">+ Enter New Customer...</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'gu' ? 'ગ્રાહકનું નામ' : 'Customer Name'} *
            </label>
            <input
              type="text"
              placeholder="e.g. Govindji Jewellers"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'gu' ? 'મોબાઇલ નંબર' : 'Phone Number'}
            </label>
            <input
              type="text"
              placeholder="+91 98..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {lang === 'gu' ? 'શહેર / બજાર' : 'City / Area'}
            </label>
            <input
              type="text"
              placeholder="e.g. Soni Bazar, Rajkot"
              value={customerCity}
              onChange={(e) => setCustomerCity(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Repaired Units Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="space-y-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span>{lang === 'gu' ? '2. રીપેર કરેલ મશીન યુનિટ્સ' : '2. Repaired Units & Service Codes'}</span>
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  {units.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'gu'
                  ? 'માસ્ટરમાં એડ કરેલા તમામ યુનિટ્સ અને અન્ય કસ્ટમ યુનિટ્સ મેન્યુઅલી ઉમેરો. દરેક યુનિટનો ઓટોમેટિક કોડ બનશે.'
                  : 'Add units from Master catalog or create custom units manually. Each unit gets an auto-generated tracking code.'}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddUnit('Handpiece')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-xl transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'gu' ? '૧. હેન્ડપીસ ઉમેરો' : '1. Add Handpiece'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddUnit('Motor')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-semibold rounded-xl transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'gu' ? '૨. મોટર ઉમેરો' : '2. Add Motor'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 text-xs font-semibold rounded-xl transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === 'gu' ? '૩. અન્ય યુનિટ મેન્યુઅલી ઉમેરો' : '3. Add Custom / Manual Unit'}</span>
              </button>
            </div>
          </div>

          {/* Master Units Dropdown & Quick Selector Bar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-700">
                {lang === 'gu' ? 'માસ્ટર લિસ્ટમાંથી યુનિટ પસંદ કરો:' : 'Select from Master Units Catalog:'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
              <select
                value={selectedMasterId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  if (val === '__custom__') {
                    setShowCustomModal(true);
                    setSelectedMasterId('');
                    return;
                  }
                  const item = unitMasters.find((u) => u.id === val);
                  if (item) {
                    handleAddUnitFromMaster(item);
                    setSelectedMasterId('');
                  }
                }}
                className="flex-1 min-w-[200px] px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">
                  {lang === 'gu'
                    ? `-- માસ્ટર માંથી યુનિટ ઉમેરો (${unitMasters.length} ઉપલબ્ધ) --`
                    : `-- Select & Add Unit from Master (${unitMasters.length} available) --`}
                </option>
                {unitMasters.map((um) => (
                  <option key={um.id} value={um.id}>
                    {lang === 'gu' && um.nameGu ? um.nameGu : um.name} (કોડ: {um.codePrefix} | સર્વિસ: ₹{um.defaultServiceCharge})
                  </option>
                ))}
                <option value="__custom__">
                  {lang === 'gu' ? '+ અન્ય યુનિટ જાતે લખીને ઉમેરો (Manual)...' : '+ Other Custom Unit Manually...'}
                </option>
              </select>

              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium rounded-xl transition-all shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>{lang === 'gu' ? '+ અન્ય નવું યુનિટ' : '+ Other Manual'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {units.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
            <Tag className="w-10 h-10 text-slate-400 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {lang === 'gu' ? 'હજુ કોઈ મશીન ઉમેર્યું નથી' : 'No units added yet'}
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {lang === 'gu'
                  ? 'હેન્ડપીસ, મોટર અથવા માસ્ટર લિસ્ટમાં એડ કરેલા અન્ય તમામ મશીન યુનિટ્સ (કંટ્રોલર, સ્કેલર, પોલિશિંગ મોટર વગેરે) અહીંથી ઉમેરી શકો છો.'
                  : 'Add Handpieces, Motors, or any unit configured in your Master Catalog (Controllers, Scalers, Polishers, etc.).'}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleAddUnit('Handpiece')}
                className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-emerald-700 transition-colors"
              >
                {lang === 'gu' ? '૧. + હેન્ડપીસ ઉમેરો' : '1. + Add Handpiece'}
              </button>
              <button
                type="button"
                onClick={() => handleAddUnit('Motor')}
                className="px-3.5 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
              >
                {lang === 'gu' ? '૨. + મોટર ઉમેરો' : '2. + Add Motor'}
              </button>
              <button
                type="button"
                onClick={() => setShowCustomModal(true)}
                className="px-3.5 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-purple-700 transition-colors"
              >
                {lang === 'gu' ? '૩. + અન્ય યુનિટ મેન્યુઅલી' : '3. + Other Manual Unit'}
              </button>
            </div>
          </div>
        )}

        {/* Units Cards List */}
        <div className="space-y-4">
          {units.map((unit, index) => (
            <div
              key={unit.id}
              className="border-2 border-slate-200 hover:border-slate-300 rounded-xl p-4 bg-slate-50/30 transition-all space-y-3"
            >
              {/* Unit Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={unit.unitName}
                    onChange={(e) => handleUpdateUnitField(unit.id, 'unitName', e.target.value)}
                    className="font-bold text-slate-900 bg-white px-2.5 py-1 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 w-40 sm:w-52"
                    placeholder="e.g. Handpiece 1"
                  />
                  <input
                    type="text"
                    value={unit.brandModel || ''}
                    onChange={(e) => handleUpdateUnitField(unit.id, 'brandModel', e.target.value)}
                    className="text-xs text-slate-600 bg-white px-2 py-1 border border-slate-300 rounded-lg w-32 sm:w-44"
                    placeholder="Model: Marathon / NSK"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {/* Service Tracking Code */}
                  <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-indigo-200">
                    <span className="text-[10px] uppercase font-bold text-indigo-600">Code:</span>
                    <input
                      type="text"
                      value={unit.trackingCode}
                      onChange={(e) => handleUpdateUnitField(unit.id, 'trackingCode', e.target.value)}
                      className="font-mono font-bold text-xs text-indigo-700 bg-transparent focus:outline-none w-28"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveUnit(unit.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove unit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Problem / Work Done Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <input
                    type="text"
                    value={unit.reportedIssue || ''}
                    onChange={(e) => handleUpdateUnitField(unit.id, 'reportedIssue', e.target.value)}
                    placeholder={lang === 'gu' ? 'ખામી (દા.ત. અવાજ આવે છે, ગરમ થાય છે)' : 'Reported issue (e.g. Vibration, noise)'}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={unit.technicianNotes || ''}
                    onChange={(e) => handleUpdateUnitField(unit.id, 'technicianNotes', e.target.value)}
                    placeholder={lang === 'gu' ? 'કરેલું કામ (દા.ત. બેરિંગ બદલી, ઓઇલિંગ કર્યું)' : 'Diagnosis / Technician notes'}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Quick Add Pills & Full Parts Selector from Catalog */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {lang === 'gu' ? 'ક્વિક ઉમેરો:' : 'Quick Add Parts:'}
                  </span>
                  {sparePartItems.map((part) => {
                    const avail = getAvailableStockForItem(part.id);
                    const isEmpty = avail <= 0;
                    return (
                      <button
                        key={part.id}
                        type="button"
                        onClick={() => handleAddPartToUnit(unit.id, part.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          isEmpty
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                        title={isEmpty ? 'Empty Stock' : `Available Stock: ${avail} pcs`}
                      >
                        <Plus className={`w-3 h-3 ${isEmpty ? 'text-rose-500' : 'text-amber-700'}`} />
                        <span>{part.name}</span>
                        <span className={`font-semibold font-mono ${isEmpty ? 'text-rose-700' : 'text-amber-700'}`}>
                          ₹{part.salePrice}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            isEmpty
                              ? 'bg-rose-200 text-rose-900 border border-rose-300'
                              : 'bg-amber-200/80 text-amber-950'
                          }`}
                        >
                          {isEmpty
                            ? lang === 'gu'
                              ? 'ખાલી સ્ટોક'
                              : 'Empty Stock'
                            : `${avail} pcs`}
                        </span>
                      </button>
                    );
                  })}

                  <span className="text-slate-300">|</span>

                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {lang === 'gu' ? 'સર્વિસ ચાર્જ:' : 'Labor:'}
                  </span>
                  {serviceItems.map((srv) => (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleAddServiceToUnit(unit.id, srv.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-[11px] font-medium transition-colors"
                    >
                      <Plus className="w-3 h-3 text-indigo-700" />
                      <span>{srv.name}</span>
                      <span className="font-semibold font-mono text-indigo-700">₹{srv.salePrice}</span>
                    </button>
                  ))}
                </div>

                {/* Additional Catalog Parts Dropdown */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    {lang === 'gu' ? 'તમામ સ્ટોકમાંથી ઉમેરો:' : 'Select from Full Stock:'}
                  </span>
                  <select
                    value=""
                    onChange={(e) => {
                      const pid = e.target.value;
                      if (pid) {
                        handleAddPartToUnit(unit.id, pid);
                      }
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-sm font-medium"
                  >
                    <option value="">
                      {lang === 'gu'
                        ? '-- અન્ય સ્પેરપાર્ટ સ્ટોકમાંથી પસંદ કરો --'
                        : '-- Add Other Part from Stock --'}
                    </option>
                    {sparePartItems.map((part) => {
                      const avail = getAvailableStockForItem(part.id);
                      const isEmpty = avail <= 0;
                      return (
                        <option key={part.id} value={part.id}>
                          {part.name} - ₹{part.salePrice} (
                          {isEmpty
                            ? lang === 'gu'
                              ? '⚠️ સ્ટોક ખાલી - Empty Stock'
                              : '⚠️ Empty Stock'
                            : `સ્ટોક: ${avail} pcs`}
                          )
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Items List Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-1.5 pl-3 w-10 text-center">Sr.</th>
                      <th className="py-1.5 pl-2">Item / Service Name</th>
                      <th className="py-1.5 text-center w-20">Type</th>
                      <th className="py-1.5 text-center w-24">Qty</th>
                      <th className="py-1.5 text-right w-24">Rate (₹)</th>
                      <th className="py-1.5 text-right w-28">Amount</th>
                      <th className="py-1.5 pr-3 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Parts */}
                    {unit.parts.map((p, pIdx) => {
                      const catItem = findCatalogItem(p);
                      const maxAvail = catItem ? getAvailableStockForItem(catItem.id, p.id) : 999;
                      const isExceeding = p.quantity > maxAvail;
                      const costPricePerUnit = p.costPrice ?? (catItem?.costPrice || 0);
                      const totalPartPurchaseCost = (p.quantity || 1) * costPricePerUnit;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-2 pl-3 text-center font-mono font-bold text-slate-400">
                            {pIdx + 1}
                          </td>
                          <td className="py-2 pl-2 font-medium text-slate-800">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="font-bold">{p.name}</span>
                              {p.code && <span className="text-[10px] text-slate-400 font-mono">({p.code})</span>}
                            </div>
                            {catItem && (
                              <div className="text-[10px] text-slate-500 font-medium mt-0.5 flex flex-wrap items-center gap-2">
                                <span>
                                  {lang === 'gu' ? 'ઉપલબ્ધ સ્ટોક:' : 'Stock:'}{' '}
                                  <strong className={maxAvail <= 0 ? 'text-rose-600 font-black' : 'text-emerald-700 font-bold'}>
                                    {maxAvail} pcs
                                  </strong>
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-2 text-center">
                            <span className="text-[9px] bg-amber-50 text-amber-800 font-semibold px-1.5 py-0.5 rounded">
                              Part
                            </span>
                          </td>
                          <td className="py-2 text-center">
                            <div className="inline-flex flex-col items-center">
                              <input
                                type="number"
                                min="1"
                                max={maxAvail > 0 ? maxAvail : 1}
                                value={p.quantity}
                                onChange={(e) =>
                                  handleUpdatePart(unit.id, p.id, parseInt(e.target.value) || 1, p.unitPrice)
                                }
                                className={`w-14 text-center py-0.5 border rounded font-mono font-bold text-xs ${
                                  isExceeding
                                    ? 'border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500'
                                    : 'border-slate-300'
                                }`}
                              />
                              {maxAvail < 999 && (
                                <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                                  max {maxAvail}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 text-right">
                            <input
                              type="number"
                              value={p.unitPrice}
                              onChange={(e) =>
                                handleUpdatePart(unit.id, p.id, p.quantity, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 text-right py-0.5 pr-1 border border-slate-300 rounded font-mono"
                            />
                            {/* Exact niche small font ma parts no purchase rate and total purchase rate */}
                            {costPricePerUnit > 0 && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                                <div>{lang === 'gu' ? 'ખરીદ ભાવ:' : 'Cost:'} ₹{costPricePerUnit}</div>
                                <div className="text-[9px] font-semibold text-indigo-600">
                                  {lang === 'gu' ? 'કુલ ખરીદ પડતર:' : 'Total Cost:'} ₹{totalPartPurchaseCost}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-2 text-right font-mono font-bold text-slate-900">
                            <div>{formatCurrency(p.totalPrice)}</div>
                            {/* Exact niche small font ma parts no Total purchase rate */}
                            {totalPartPurchaseCost > 0 && (
                              <div
                                className="text-[10px] font-semibold text-indigo-600 font-mono mt-0.5 whitespace-nowrap"
                                title={lang === 'gu' ? 'આ પાર્ટની કુલ ખરીદ કિંમત' : 'Total Purchase Cost of used pcs'}
                              >
                                {lang === 'gu' ? 'કુલ ખરીદ:' : 'Tot Cost:'} ₹{totalPartPurchaseCost}
                              </div>
                            )}
                          </td>
                          <td className="py-2 pr-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePart(unit.id, p.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Services */}
                    {unit.services.map((s, sIdx) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-2 pl-3 text-center font-mono font-bold text-slate-400">
                          {unit.parts.length + sIdx + 1}
                        </td>
                        <td className="py-2 pl-2 font-medium text-slate-800 flex items-center gap-1.5">
                          <Wrench className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{s.name}</span>
                        </td>
                        <td className="py-2 text-center">
                          <span className="text-[9px] bg-indigo-50 text-indigo-800 font-semibold px-1.5 py-0.5 rounded">
                            Labor
                          </span>
                        </td>
                        <td className="py-2 text-center font-mono text-slate-500">1</td>
                        <td className="py-2 text-right">
                          <input
                            type="number"
                            value={s.charge}
                            onChange={(e) =>
                              handleUpdateServiceCharge(unit.id, s.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-16 text-right py-0.5 pr-1 border border-slate-300 rounded font-mono"
                          />
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(s.charge)}
                        </td>
                        <td className="py-2 pr-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveService(unit.id, s.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {unit.parts.length === 0 && unit.services.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-3 text-center text-slate-400 italic text-xs">
                          {lang === 'gu'
                            ? 'આ યુનિટમાં સ્પેર પાર્ટ્સ કે સર્વિસ ચાર્જ ઉમેરો.'
                            : 'Click quick buttons above to add parts or service charge.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const unitPartsCost = unit.parts.reduce((sum, p) => {
                        const catItem = findCatalogItem(p);
                        const cp = p.costPrice ?? (catItem?.costPrice || 0);
                        return sum + (p.quantity || 1) * cp;
                      }, 0);
                      return (
                        <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                          <td colSpan={5} className="py-2 pl-3 text-right">
                            <div>{unit.unitName} {lang === 'gu' ? 'કુલ રકમ:' : 'Subtotal:'}</div>
                            {unitPartsCost > 0 && (
                              <div className="text-[10px] font-normal text-slate-500 font-mono mt-0.5">
                                {lang === 'gu' ? '↳ વપરાયેલ પાર્ટ્સ ખરીદ પડતર:' : '↳ Parts Total Purchase Cost:'}{' '}
                                <strong className="text-slate-700 font-bold">₹{unitPartsCost}</strong>
                              </div>
                            )}
                          </td>
                          <td className="py-2 text-right font-mono text-indigo-700 text-sm">
                            {formatCurrency(unit.unitSubtotal)}
                          </td>
                          <td></td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Totals & Payment Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
          {lang === 'gu' ? '3. બિલ સારાંશ અને પેમેન્ટ' : '3. Invoice Summary & Payment Terms'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Notes and Remarks */}
          <div className="md:col-span-6 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {lang === 'gu' ? 'નોંધ / રીમાર્કસ' : 'Invoice Remarks / Notes'}
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. 4 Handpieces and 3 Motors repaired. 30 days warranty on parts."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'પેમેન્ટ મોડ' : 'Payment Mode'}
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  <option value="Cash">Cash (રોકડ)</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="w-32">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GST (%)
                </label>
                <select
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  <option value={0}>None (0%)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                </select>
              </div>
            </div>
          </div>

          {/* Amount Calculation Box */}
          <div className="md:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>{lang === 'gu' ? 'સ્પેરપાર્ટ્સ વેચાણ રકમ:' : 'Total Spare Parts (Billed):'}</span>
              <span className="font-mono font-medium">{formatCurrency(partsTotal)}</span>
            </div>
            {totalPartsPurchaseCost > 0 && (
              <div className="flex justify-between text-xs text-slate-500 pl-2">
                <span className="flex items-center gap-1">
                  <span>↳</span>
                  <span>{lang === 'gu' ? 'પાર્ટ્સ કુલ ખરીદ પડતર (Total Purchase Cost):' : 'Parts Total Purchase Cost:'}</span>
                </span>
                <span className="font-mono font-bold text-indigo-700">₹{totalPartsPurchaseCost}</span>
              </div>
            )}
            {partsTotal > totalPartsPurchaseCost && totalPartsPurchaseCost > 0 && (
              <div className="flex justify-between text-[11px] text-emerald-700 pl-4 font-semibold">
                <span>{lang === 'gu' ? 'પાર્ટ્સ પર કુલ નફો (Parts Profit):' : 'Parts Gross Margin:'}</span>
                <span className="font-mono">+{formatCurrency(partsTotal - totalPartsPurchaseCost)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-slate-600">
              <span>{lang === 'gu' ? 'સર્વિસ ચાર્જ કુલ રકમ:' : 'Total Service Charges:'}</span>
              <span className="font-mono font-medium">{formatCurrency(servicesTotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 border-t border-slate-200 pt-1.5">
              <span>{lang === 'gu' ? 'સબ-ટોટલ (Subtotal):' : 'Subtotal:'}</span>
              <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
            </div>

            {/* Discount input */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">{lang === 'gu' ? 'ડિસ્કાઉન્ટ (₹):' : 'Discount (₹):'}</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 text-right py-1 px-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            {taxPercent > 0 && (
              <div className="flex justify-between text-xs text-slate-600">
                <span>Tax ({taxPercent}%):</span>
                <span className="font-mono font-medium">+{formatCurrency(taxAmount)}</span>
              </div>
            )}

            {/* Grand Total */}
            <div className="border-t-2 border-slate-300 pt-2 flex justify-between items-baseline text-slate-900">
              <span className="text-sm font-bold">{lang === 'gu' ? 'કુલ રકમ (Grand Total):' : 'Grand Total:'}</span>
              <span className="font-mono text-xl font-black text-indigo-700">
                {formatCurrency(grandTotal)}
              </span>
            </div>

            {/* Paid Amount */}
            <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-2">
              <span className="font-semibold text-slate-700">
                {lang === 'gu' ? 'ચૂકવેલ રકમ (Paid Amount):' : 'Paid Amount (₹):'}
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-28 text-right py-1 px-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-700"
                />
                <button
                  type="button"
                  onClick={() => setPaidAmount(grandTotal)}
                  className="text-[10px] px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold hover:bg-emerald-200"
                  title="Mark full payment"
                >
                  Full
                </button>
              </div>
            </div>

            {/* Balance Due */}
            <div className="flex justify-between text-xs font-bold pt-1">
              <span className="text-slate-700">{lang === 'gu' ? 'બાકી લેણું (Balance Due):' : 'Balance Due:'}</span>
              <span className={`font-mono text-sm ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                {formatCurrency(balanceDue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
        </button>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all hover:shadow-indigo-200"
        >
          <Save className="w-4 h-4" />
          <span>{lang === 'gu' ? 'બિલ સેવ કરો & કોડ જનરેટ કરો' : 'Save & Generate Invoice'}</span>
        </button>
      </div>

      {/* Manual / Custom Unit Addition Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    {lang === 'gu' ? 'અન્ય મશીન યુનિટ મેન્યુઅલી ઉમેરો' : 'Add Custom / Manual Unit'}
                  </h3>
                  <p className="text-[11px] text-purple-100">
                    {lang === 'gu'
                      ? 'કોઈપણ નવું મશીન જાતે લખીને બિલમાં જોડો'
                      : 'Type any custom machine name to add to this invoice'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'યુનિટ / મશીનનું નામ' : 'Unit / Machine Name'} *
                </label>
                <input
                  type="text"
                  placeholder={lang === 'gu' ? 'દા.ત. લેસર મશીન, વેક્યુમ પમ્પ, ડિજિટલ સ્કેલર' : 'e.g. Laser Welder, Vacuum Pump'}
                  value={customUnitName}
                  onChange={(e) => setCustomUnitName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'કોડ પ્રીફિક્સ (Code Prefix)' : 'Code Prefix'}
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. LSR, PMP"
                    value={customUnitPrefix}
                    onChange={(e) => setCustomUnitPrefix(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-300 rounded-xl uppercase focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {lang === 'gu' ? 'બારકોડ માટે વપરાશે' : 'Used for barcoded tag'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {lang === 'gu' ? 'સર્વિસ ચાર્જ (₹)' : 'Service Charge (₹)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="200"
                    value={customServiceCharge}
                    onChange={(e) => setCustomServiceCharge(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-sm font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'બ્રાન્ડ / મોડલ (ઓપ્શનલ)' : 'Brand / Model (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Panasonic, NSK, Custom Make"
                  value={customBrandModel}
                  onChange={(e) => setCustomBrandModel(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {lang === 'gu' ? 'ખામી / સમસ્યા (ઓપ્શનલ)' : 'Reported Issue (Optional)'}
                </label>
                <input
                  type="text"
                  placeholder={lang === 'gu' ? 'દા.ત. નો-પાવર, અવાજ, ગરમ થવું' : 'e.g. No power, vibration'}
                  value={customIssue}
                  onChange={(e) => setCustomIssue(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomManualUnit}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'gu' ? 'આ યુનિટ ઉમેરો' : 'Add This Unit'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
