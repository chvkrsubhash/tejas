import React from 'react';
import { ShapeData } from '../../types/presentation';

interface ShapeRendererProps {
  data: ShapeData;
  width: number;
  height: number;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({ data, width, height }) => {
  const sw = data.strokeWidth || 0;
  const pad = sw / 2 + 1;
  const w = Math.max(4, width - pad * 2);
  const h = Math.max(4, height - pad * 2);

  const renderShape = () => {
    switch (data.kind) {
      case 'rectangle':
      case 'flowchart_process':
        return (
          <rect
            x={pad}
            y={pad}
            width={w}
            height={h}
            rx={0}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      case 'rounded_rectangle':
      case 'flowchart_terminator':
        return (
          <rect
            x={pad}
            y={pad}
            width={w}
            height={h}
            rx={data.kind === 'flowchart_terminator' ? Math.min(w, h) / 2 : data.cornerRadius ?? 12}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      case 'circle':
      case 'ellipse':
        return (
          <ellipse
            cx={width / 2}
            cy={height / 2}
            rx={w / 2}
            ry={h / 2}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      case 'triangle':
        return (
          <polygon
            points={`${width / 2},${pad} ${width - pad},${height - pad} ${pad},${height - pad}`}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      case 'diamond':
      case 'flowchart_decision':
        return (
          <polygon
            points={`${width / 2},${pad} ${width - pad},${height / 2} ${width / 2},${height - pad} ${pad},${height / 2}`}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      case 'arrow_right':
        return (
          <polygon
            points={`${pad},${pad + h * 0.28} ${pad + w * 0.65},${pad + h * 0.28} ${pad + w * 0.65},${pad} ${width - pad},${height / 2} ${pad + w * 0.65},${height - pad} ${pad + w * 0.65},${pad + h * 0.72} ${pad},${pad + h * 0.72}`}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      case 'arrow_left':
        return (
          <polygon
            points={`${width - pad},${pad + h * 0.28} ${pad + w * 0.35},${pad + h * 0.28} ${pad + w * 0.35},${pad} ${pad},${height / 2} ${pad + w * 0.35},${height - pad} ${pad + w * 0.35},${pad + h * 0.72} ${width - pad},${pad + h * 0.72}`}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      case 'arrow_up':
        return (
          <polygon
            points={`${width / 2},${pad} ${width - pad},${pad + h * 0.35} ${pad + w * 0.72},${pad + h * 0.35} ${pad + w * 0.72},${height - pad} ${pad + w * 0.28},${height - pad} ${pad + w * 0.28},${pad + h * 0.35} ${pad},${pad + h * 0.35}`}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      case 'arrow_down':
        return (
          <polygon
            points={`${pad + w * 0.28},${pad} ${pad + w * 0.72},${pad} ${pad + w * 0.72},${pad + h * 0.65} ${width - pad},${pad + h * 0.65} ${width / 2},${height - pad} ${pad},${pad + h * 0.65} ${pad + w * 0.28},${pad + h * 0.65}`}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      case 'line':
        return (
          <line
            x1={pad}
            y1={height / 2}
            x2={width - pad}
            y2={height / 2}
            stroke={data.stroke !== 'transparent' ? data.stroke : data.fill}
            strokeWidth={Math.max(2, sw || 3)}
            strokeDasharray={data.dashArray?.join(',')}
          />
        );
      case 'connector':
        return (
          <polyline
            points={`${pad},${pad} ${width / 2},${pad} ${width / 2},${height - pad} ${width - pad},${height - pad}`}
            fill="none"
            stroke={data.stroke !== 'transparent' ? data.stroke : data.fill}
            strokeWidth={Math.max(2, sw || 2.5)}
          />
        );
      case 'star': {
        const cx = width / 2;
        const cy = height / 2;
        const outerR = Math.min(w, h) / 2;
        const innerR = outerR * 0.42;
        const pts: string[] = [];
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const a = (Math.PI * i) / 5 - Math.PI / 2;
          pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
        }
        return (
          <polygon
            points={pts.join(' ')}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      }
      case 'callout':
        return (
          <path
            d={`M ${pad + 10} ${pad} H ${width - pad - 10} Q ${width - pad} ${pad} ${width - pad} ${pad + 10} V ${height - pad - 22} Q ${width - pad} ${height - pad - 12} ${width - pad - 10} ${height - pad - 12} H ${pad + w * 0.35} L ${pad + w * 0.18} ${height - pad} L ${pad + w * 0.22} ${height - pad - 12} H ${pad + 10} Q ${pad} ${height - pad - 12} ${pad} ${height - pad - 22} V ${pad + 10} Q ${pad} ${pad} ${pad + 10} ${pad} Z`}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      case 'hexagon':
        return (
          <polygon
            points={`${pad + w * 0.25},${pad} ${pad + w * 0.75},${pad} ${width - pad},${height / 2} ${pad + w * 0.75},${height - pad} ${pad + w * 0.25},${height - pad} ${pad},${height / 2}`}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      case 'pentagon':
        return (
          <polygon
            points={`${width / 2},${pad} ${width - pad},${pad + h * 0.38} ${pad + w * 0.8},${height - pad} ${pad + w * 0.2},${height - pad} ${pad},${pad + h * 0.38}`}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
      default:
        return (
          <rect
            x={pad}
            y={pad}
            width={w}
            height={h}
            rx={data.cornerRadius ?? 0}
            fill={data.fill}
            stroke={data.stroke}
            strokeWidth={sw}
          />
        );
    }
  };

  return (
    <div className="relative w-full h-full">
      <svg width={width} height={height} className="w-full h-full overflow-visible">
        {renderShape()}
      </svg>
      {data.text && (
        <div
          className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none select-none text-center"
          style={{
            color: data.textStyle?.color || '#FFFFFF',
            fontSize: `${data.textStyle?.fontSize || 16}px`,
            fontWeight: data.textStyle?.fontWeight || 'normal',
          }}
        >
          {data.text}
        </div>
      )}
    </div>
  );
};

