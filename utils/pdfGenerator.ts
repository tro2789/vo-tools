import { jsPDF } from 'jspdf';
import { QuoteResult, formatCurrency, getPricingModelName } from './pricingTypes';

/**
 * Generate a modern, visually appealing quote PDF matching VO Tools aesthetic
 */
export const generateQuotePDF = (
  quote: QuoteResult,
  clientName: string = 'Client',
  projectName: string = 'Voiceover Project'
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 0;

  // Blue gradient header background (simulated with rectangles)
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Add subtle gradient effect with lighter blue
  doc.setFillColor(59, 130, 246); // Blue-500
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Mic icon simulation (simple circle)
  doc.setFillColor(255, 255, 255);
  doc.circle(pageWidth / 2, 18, 8, 'F');
  doc.setFillColor(37, 99, 235);
  doc.circle(pageWidth / 2, 18, 6, 'F');
  
  // Header text - VO Tools
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('VO TOOLS', pageWidth / 2, 32, { align: 'center' });
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Voiceover Quote', pageWidth / 2, 42, { align: 'center' });

  // Date badge
  yPos = 60;
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.roundedRect(pageWidth / 2 - 35, yPos - 5, 70, 10, 2, 2, 'F');
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.setFontSize(9);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  doc.text(dateStr, pageWidth / 2, yPos + 2, { align: 'center' });

  // Client and Project Section with background
  yPos = 80;
  doc.setFillColor(249, 250, 251); // Slate-50
  doc.roundedRect(15, yPos, pageWidth - 30, 30, 4, 4, 'F');
  
  yPos += 8;
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJECT DETAILS', 20, yPos);
  
  yPos += 8;
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(clientName, 20, yPos);
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(projectName, 20, yPos);

  // Script Analysis Card
  yPos = 120;
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.roundedRect(15, yPos, pageWidth - 30, 35, 4, 4, 'F');
  
  yPos += 8;
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SCRIPT ANALYSIS', 20, yPos);
  
  yPos += 8;
  doc.setTextColor(51, 65, 85); // Slate-700
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Word count with icon
  doc.text(`📝 ${quote.wordCount.toLocaleString()} words`, 20, yPos);
  
  yPos += 7;
  doc.text(`⏱️  ${quote.readingTime}`, 20, yPos);
  
  yPos += 7;
  doc.text(`💰 ${getPricingModelName(quote.pricingModel)}`, 20, yPos);

  // Pricing Breakdown Card
  yPos = 165;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.roundedRect(15, yPos, pageWidth - 30, 60, 4, 4, 'FD');
  
  yPos += 8;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PRICING BREAKDOWN', 20, yPos);
  
  yPos += 10;
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Base Price:', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(quote.basePrice), pageWidth - 20, yPos, { align: 'right' });
  
  // Minimum fee badge if applicable
  if (quote.includesMinimumFee) {
    yPos += 7;
    doc.setFillColor(254, 249, 195); // Yellow-100
    doc.roundedRect(25, yPos - 4, 70, 6, 1, 1, 'F');
    doc.setTextColor(133, 77, 14); // Yellow-800
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Minimum Fee Applied', 27, yPos);
  }

  // Divider line
  yPos += 10;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);

  // Initial Recording - highlighted
  yPos += 10;
  doc.setFillColor(239, 246, 255); // Blue-50
  doc.roundedRect(18, yPos - 5, pageWidth - 36, 12, 2, 2, 'F');
  
  doc.setTextColor(30, 64, 175); // Blue-800
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Initial Recording:', 20, yPos + 3);
  
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.setFontSize(16);
  doc.text(formatCurrency(quote.finalPrice), pageWidth - 20, yPos + 3, { align: 'right' });

  // Revision price
  yPos += 15;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Revision/Pickup Fee:', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(quote.revisionPrice), pageWidth - 20, yPos, { align: 'right' });

  // Terms & Notes Section
  yPos = 235;
  doc.setFillColor(249, 250, 251); // Slate-50
  doc.roundedRect(15, yPos, pageWidth - 30, 35, 4, 4, 'F');
  
  yPos += 8;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS & CONDITIONS', 20, yPos);
  
  yPos += 7;
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('✓ Quote valid for 30 days', 20, yPos);
  yPos += 5;
  doc.text('✓ Revision fee applies to changes after delivery', 20, yPos);
  yPos += 5;
  doc.text('✓ Additional fees may apply for expedited delivery', 20, yPos);
  yPos += 5;
  doc.text('✓ Usage rights to be negotiated separately', 20, yPos);

  // Footer with gradient
  const footerY = pageHeight - 20;
  doc.setFillColor(241, 245, 249); // Slate-100
  doc.rect(0, footerY, pageWidth, 20, 'F');
  
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by', pageWidth / 2 - 20, footerY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('VO Tools', pageWidth / 2 + 8, footerY + 8);
  
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Professional Voiceover Calculator', pageWidth / 2, footerY + 13, { align: 'center' });

  // Save the PDF
  const filename = `VO_Quote_${projectName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
