/**
 * Tracking Code & Barcode utilities for repair units
 */

export function generateUnitTrackingCode(
  unitType: string,
  existingCodes: string[] = [],
  dateStr?: string,
  customPrefix?: string
): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateCode = `${yy}${mm}${dd}`;

  let prefix = customPrefix ? customPrefix.trim().toUpperCase() : 'UNT';
  if (!customPrefix) {
    const typeLower = unitType.toLowerCase();
    if (typeLower.includes('handpiece') || typeLower.includes('hp')) {
      prefix = 'HP';
    } else if (typeLower.includes('motor')) {
      prefix = 'MOT';
    } else if (typeLower.includes('chuck') || typeLower.includes('head')) {
      prefix = 'CHK';
    } else if (typeLower.includes('pcb') || typeLower.includes('box') || typeLower.includes('ctrl')) {
      prefix = 'BOX';
    } else if (typeLower.includes('scaler') || typeLower.includes('usc')) {
      prefix = 'USC';
    } else if (typeLower.includes('polisher') || typeLower.includes('pol')) {
      prefix = 'POL';
    }
  }

  // Find next index for this date & prefix
  let seq = 1;
  const matchPattern = new RegExp(`^${prefix}-${dateCode}-(\\d+)`, 'i');
  for (const code of existingCodes) {
    const match = code.match(matchPattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num >= seq) {
        seq = num + 1;
      }
    }
  }

  return `${prefix}-${dateCode}-${String(seq).padStart(2, '0')}`;
}

export function generateInvoiceNumber(existingInvoices: { invoiceNumber: string }[] = []): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}-${month}`;

  let maxNum = 0;
  for (const inv of existingInvoices) {
    if (inv.invoiceNumber && inv.invoiceNumber.startsWith(`INV-${year}-`)) {
      const parts = inv.invoiceNumber.split('-');
      if (parts.length >= 3) {
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }
  const nextSeq = String(maxNum + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

/**
 * Generates an SVG pseudo-barcode pattern reliably representing a code string.
 */
export function generateBarcodeBars(code: string): number[] {
  // Deterministic bar widths based on char codes
  const widths: number[] = [2, 1, 2, 1, 1]; // start guard
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const c = code.charCodeAt(i);
    hash = (hash * 31 + c) % 1000;
    const w1 = (c % 3) + 1;
    const w2 = ((c >> 1) % 2) + 1;
    const w3 = ((c >> 2) % 3) + 1;
    widths.push(w1, 1, w2, 1, w3);
  }
  widths.push(2, 1, 2); // end guard
  return widths;
}
