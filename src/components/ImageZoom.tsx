import { useState, useRef, useCallback } from "react";

type ImageZoomProps = {
  src: string;
  alt: string;
  imgClassName?: string;
  containerClassName?: string;
  zoomScale?: number;
  zoomPanelSize?: number;
  children?: React.ReactNode;
};

export function ImageZoom({
  src,
  alt,
  imgClassName = "",
  containerClassName = "",
  zoomScale = 2.5,
  zoomPanelSize = 340,
  children,
}: ImageZoomProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setBgPos({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });

      const gap = 10;
      const rawLeft = rect.right + gap;
      const rawTop = rect.top + rect.height / 2 - zoomPanelSize / 2;

      const fitsRight = rawLeft + zoomPanelSize < window.innerWidth - gap;
      const left = fitsRight
        ? rawLeft
        : rect.left - zoomPanelSize - gap;

      const top = Math.max(
        gap,
        Math.min(window.innerHeight - zoomPanelSize - gap, rawTop)
      );

      setPanelPos({ top, left });
    },
    [zoomPanelSize]
  );

  return (
    <>
      <div
        ref={containerRef}
        className={`relative ${containerClassName}`}
        style={{ cursor: "crosshair" }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
        <img src={src} alt={alt} className={imgClassName} />
        {isHovering && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute hidden bg-black/25 md:block"
            style={{
              width: "46%",
              height: "46%",
              left: `calc(${bgPos.x}% - 23%)`,
              top: `calc(${bgPos.y}% - 23%)`,
              maxWidth: "320px",
              maxHeight: "320px",
            }}
          />
        )}
        {children}
      </div>

      {isHovering && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            top: panelPos.top,
            left: panelPos.left,
            width: zoomPanelSize,
            height: zoomPanelSize,
            backgroundImage: `url(${src})`,
            backgroundSize: `${zoomScale * 100}%`,
            backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
            backgroundRepeat: "no-repeat",
            backgroundColor: "#fff",
            zIndex: 9999,
            border: "1px solid #e5e7eb",
            borderRadius: "10px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}
