// Utility to get location - checks manual override first, then auto-detects
export const getLocationWithManualOverride = async (autoDetectFn) => {
  // Check if manual location is set
  const saved = localStorage.getItem('safehaven_manual_location');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      return `${data.address} (${data.latitude}, ${data.longitude}) ±0m [Manual]`;
    } catch (e) {
      console.error('Failed to load manual location:', e);
    }
  }
  
  // Fall back to auto-detection
  return await autoDetectFn();
};
