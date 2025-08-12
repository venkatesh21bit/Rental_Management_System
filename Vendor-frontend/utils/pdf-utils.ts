// Utility for client-side PDF generation
export const generatePDF = async (element: HTMLElement, options: any) => {
  // Check if we're in the browser
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in the browser');
  }

  try {
    // Dynamic import for html2pdf
    const html2pdf = (await import('html2pdf.js')).default;
    
    return html2pdf()
      .set(options)
      .from(element)
      .save();
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
};
