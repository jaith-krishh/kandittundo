import { useEffect, useRef } from 'react';

export default function VantaBackground() {
  const vantaRef = useRef(null);
  const effectRef = useRef(null);

  useEffect(() => {
    if (!window.VANTA || !window.THREE) return;

    if (effectRef.current) effectRef.current.destroy();

    effectRef.current = window.VANTA.DOTS({
      el: vantaRef.current,
      THREE: window.THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200,
      minWidth: 200,
      scale: 1.0,
      scaleMobile: 1.0,
      color: 0x545454,
      color2: 0x545454,
      size: 2.4,
      spacing: 33.0,
      backgroundColor: 0x0f0f0f
    });

    return () => { effectRef.current?.destroy(); };
  }, []);

  return (
    <div ref={vantaRef} style={{
      position: 'fixed', inset: 0, zIndex: -1
    }} />
  );
}
