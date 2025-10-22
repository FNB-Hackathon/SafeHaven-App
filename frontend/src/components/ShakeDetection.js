import { useEffect } from 'react';

const ShakeDetection = ({ onShake }) => {
  useEffect(() => {
    let lastX, lastY, lastZ;
    let shakeThreshold = 15;

    const handleMotion = (event) => {
      const { x, y, z } = event.accelerationIncludingGravity;
      
      if (lastX !== undefined) {
        const deltaX = Math.abs(x - lastX);
        const deltaY = Math.abs(y - lastY);
        const deltaZ = Math.abs(z - lastZ);
        
        if (deltaX + deltaY + deltaZ > shakeThreshold) {
          onShake();
        }
      }
      
      lastX = x;
      lastY = y;
      lastZ = z;
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [onShake]);

  return null;
};

export default ShakeDetection;