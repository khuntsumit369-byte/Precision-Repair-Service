import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  fileName: string;
  format?: 'a5' | 'a4';
  orientation?: 'portrait' | 'landscape';
}

/**
 * Downloads a DOM element as a formatted PDF file.
 */
export async function downloadElementAsPdf(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const { fileName, format = 'a5', orientation = 'portrait' } = options;

  // Render element to high-res canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Calculate proportional dimensions
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= pageHeight) {
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
  } else {
    // If element slightly exceeds single page height, fit proportional to height
    const scaleFactor = pageHeight / imgHeight;
    const finalWidth = imgWidth * scaleFactor;
    const finalHeight = pageHeight;
    const marginX = (pageWidth - finalWidth) / 2;
    pdf.addImage(imgData, 'JPEG', marginX, 0, finalWidth, finalHeight);
  }

  const finalName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  pdf.save(finalName);
}

/**
 * Downloads a DOM element as a high-resolution PNG image file.
 */
export async function downloadElementAsImage(
  element: HTMLElement,
  fileName: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName.toLowerCase().endsWith('.png') ? fileName : `${fileName}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
