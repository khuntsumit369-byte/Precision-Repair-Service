import React from 'react';
import { generateBarcodeBars } from '../utils/codeGenerator';

interface BarcodeProps {
  code: string;
  height?: number;
  showText?: boolean;
  className?: string;
  scale?: number;
}

export const BarcodeRenderer: React.FC<BarcodeProps> = ({
  code,
  height = 36,
  showText = true,
  className = '',
  scale = 1,
}) => {
  const bars = generateBarcodeBars(code);
  const barMultiplier = 2 * scale;
  let totalCalculatedWidth = 0;
  bars.forEach((w) => {
    totalCalculatedWidth += w * barMultiplier;
  });

  const svgWidth = Math.max(Math.round(80 * scale), Math.round(totalCalculatedWidth));

  let currentX = 0;
  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={svgWidth}
        height={height}
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {bars.map((width, idx) => {
          const w = width * barMultiplier;
          const isBlack = idx % 2 === 0;
          const x = currentX;
          currentX += w;
          if (!isBlack) return null;
          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={w}
              height={height}
              fill="#1e293b"
            />
          );
        })}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] font-bold tracking-widest text-slate-800 mt-1">
          *{code}*
        </span>
      )}
    </div>
  );
};
