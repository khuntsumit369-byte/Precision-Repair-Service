import { Invoice } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  }

  let crore = Math.floor(num / 10000000);
  num %= 10000000;
  let lakh = Math.floor(num / 100000);
  num %= 100000;
  let thousand = Math.floor(num / 1000);
  num %= 1000;
  let remaining = num;

  let res = '';
  if (crore > 0) res += inWords(crore) + ' Crore ';
  if (lakh > 0) res += inWords(lakh) + ' Lakh ';
  if (thousand > 0) res += inWords(thousand) + ' Thousand ';
  if (remaining > 0) res += inWords(remaining);

  return res.trim() + ' Rupees Only';
}

export function generateWhatsAppMessage(invoice: Invoice, workshopName: string): string {
  const lines: string[] = [];
  lines.push(`*🔧 ${workshopName}*`);
  lines.push(`*Repair Service Bill / રીપેર બિલ*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📄 *Invoice No:* ${invoice.invoiceNumber}`);
  lines.push(`📅 *Date:* ${formatDate(invoice.date)}`);
  lines.push(`👤 *Customer:* ${invoice.customerName}`);
  lines.push(`🔢 *Total Units Repaired:* ${invoice.units.length} Items`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`*Unit Details & Tracking Codes:*`);

  invoice.units.forEach((u, i) => {
    lines.push(`\n*${i + 1}. ${u.unitName}* [🏷️ \`${u.trackingCode}\`]`);
    if (u.parts.length > 0) {
      // Parts replaced without disclosing individual part rates
      const partsStr = u.parts.map(p => (p.quantity > 1 ? `${p.name} (Qty: ${p.quantity})` : p.name)).join(', ');
      lines.push(`   ⚙️ Replaced Parts: ${partsStr}`);
    }
    if (u.services.length > 0) {
      const srvStr = u.services.map(s => s.name).join(', ');
      lines.push(`   🛠️ Service: ${srvStr}`);
    }
  });

  lines.push(`\n━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💰 *Total Amount:* ${formatCurrency(invoice.subtotal)}`);
  if (invoice.discount > 0) lines.push(`🏷️ *Discount / Waived:* -${formatCurrency(invoice.discount)}`);
  if (invoice.taxAmount > 0) lines.push(`🏛️ *Tax:* +${formatCurrency(invoice.taxAmount)}`);
  lines.push(`*💵 Grand Total: ${formatCurrency(invoice.grandTotal)}*`);
  lines.push(`*Payment Status:* ${invoice.paymentStatus.toUpperCase()} (Paid: ${formatCurrency(invoice.paidAmount)} | Due: ${formatCurrency(invoice.balanceDue)})`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📌 *Note:* All units have unique service tracking stickers affixed.`);
  lines.push(`Thank you for your business! 🙏`);

  return lines.join('\n');
}

export interface UnitCategorySummary {
  categoryKey: string;
  categoryTitle: string;
  categoryTitleGu: string;
  count: number;
  totalAmount: number;
  units: {
    name: string;
    trackingCode: string;
    subtotal: number;
  }[];
}

export function groupInvoiceUnitsByCategory(invoice: Invoice): UnitCategorySummary[] {
  const groups: Record<string, UnitCategorySummary> = {};

  invoice.units.forEach((unit) => {
    let key: string = unit.unitType || 'Custom';
    let title: string = unit.unitType || 'Equipment Repair';
    let titleGu: string = 'ઇક્વિપમેન્ટ સર્વિસ';

    const lowerName = (unit.unitName + ' ' + (unit.unitType || '')).toLowerCase();
    if (lowerName.includes('handpiece')) {
      key = 'Handpiece';
      title = 'Handpiece';
      titleGu = 'હેન્ડપીસ (Handpiece)';
    } else if (lowerName.includes('controller') || lowerName.includes('control')) {
      key = 'Controller';
      title = 'Controller';
      titleGu = 'કંટ્રોલર (Controller)';
    } else if (lowerName.includes('motor') || lowerName.includes('micro-motor')) {
      key = 'Micro-Motor';
      title = 'Motor / Micro-Motor';
      titleGu = 'માઇક્રો-મોટર (Micro-Motor)';
    } else if (lowerName.includes('ultrasonic')) {
      key = 'Ultrasonic';
      title = 'Ultrasonic Scaler';
      titleGu = 'અલ્ટ્રાસોનિક સ્કેલર';
    }

    if (!groups[key]) {
      groups[key] = {
        categoryKey: key,
        categoryTitle: title,
        categoryTitleGu: titleGu,
        count: 0,
        totalAmount: 0,
        units: [],
      };
    }

    groups[key].count += 1;
    groups[key].totalAmount += unit.unitSubtotal;
    groups[key].units.push({
      name: unit.unitName,
      trackingCode: unit.trackingCode,
      subtotal: unit.unitSubtotal,
    });
  });

  return Object.values(groups);
}
