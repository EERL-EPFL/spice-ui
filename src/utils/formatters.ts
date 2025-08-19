// Shared utility functions for formatting data display

// Helper function to format enzyme volume for display
export const formatEnzymeVolume = (volumeLitres: number | string | null | undefined): string => {
  if (!volumeLitres) {
    return '0';
  }
  
  // Convert string to number if needed
  const numValue = typeof volumeLitres === 'string' ? parseFloat(volumeLitres) : volumeLitres;
  
  if (isNaN(numValue) || numValue <= 0) {
    return '0';
  }
  
  if (numValue >= 0.001) {
    // For volumes >= 1mL, show as decimal with up to 3 decimal places, remove trailing zeros
    return numValue.toFixed(3).replace(/\.?0+$/, '');
  } else {
    // For volumes < 1mL, use scientific notation
    return numValue.toExponential(2);
  }
};