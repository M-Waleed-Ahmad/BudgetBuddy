import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PAGE_WIDTH = 210; // A4 width mm
const PAGE_HEIGHT = 297; // A4 height mm
const MARGIN = 12;

// Shared hook for exporting any element by ref to PDF with header/footer, date, pagination.
export const usePdfExport = () => {
  const exportPdf = useCallback(async ({ element, filename = 'report.pdf', title = 'BudgetBuddy Report' }) => {
    if (!element) throw new Error('Element is required for PDF export');

    const canvas = await html2canvas(element, { scale: window.devicePixelRatio || 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = Math.min((PAGE_WIDTH - 2 * MARGIN) / imgProps.width, (PAGE_HEIGHT - 2 * MARGIN) / imgProps.height);
    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;

    let position = MARGIN;
    let page = 1;
    const totalPages = 1; // Single-page render for now

    const addHeaderFooter = () => {
      pdf.setFontSize(12);
      pdf.text(title, MARGIN, 10);
      const date = new Date().toLocaleString();
      pdf.setFontSize(10);
      pdf.text(`Generated: ${date}`, PAGE_WIDTH - MARGIN - 50, 10);
      pdf.setFontSize(9);
      pdf.text(`Page ${page} of ${totalPages}`, PAGE_WIDTH - MARGIN - 30, PAGE_HEIGHT - 5);
    };

    addHeaderFooter();
    pdf.addImage(imgData, 'PNG', (PAGE_WIDTH - imgWidth) / 2, position, imgWidth, imgHeight);
    pdf.save(filename);
  }, []);

  return { exportPdf };
};

export default usePdfExport;
