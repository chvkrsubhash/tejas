import React from 'react';
import { DiagramData } from '../../types/presentation';

interface DiagramRendererProps {
  data: DiagramData;
  width: number;
  height: number;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({ data, width, height }) => {
  // Compute bounding box of nodes to scale cleanly into width x height
  const maxX = Math.max(660, ...data.nodes.map((n) => n.x + n.width + 20));
  const maxY = Math.max(280, ...data.nodes.map((n) => n.y + n.height + 20));
  const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));

  return (
    <svg viewBox={`0 0 ${maxX} ${maxY}`} width={width} height={height} className="w-full h-full">
      <defs>
        <marker
          id="diag-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B" />
        </marker>
      </defs>

      {data.edges.map((edge, idx) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return null;
        const x1 = from.x + from.width / 2;
        const y1 = from.y + from.height / 2;
        const x2 = to.x + to.width / 2;
        const y2 = to.y + to.height / 2;
        return (
          <g key={idx}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#64748B"
              strokeWidth={2.5}
              markerEnd="url(#diag-arrow)"
            />
            {edge.label && (
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 6}
                textAnchor="middle"
                fontSize={12}
                fontWeight="600"
                fill="#334155"
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {data.nodes.map((node) => {
        const cx = node.x + node.width / 2;
        const cy = node.y + node.height / 2;
        return (
          <g key={node.id}>
            {node.shape === 'circle' ? (
              <ellipse
                cx={cx}
                cy={cy}
                rx={node.width / 2}
                ry={node.height / 2}
                fill={node.fill}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            ) : node.shape === 'diamond' ? (
              <polygon
                points={`${cx},${node.y} ${node.x + node.width},${cy} ${cx},${node.y + node.height} ${node.x},${cy}`}
                fill={node.fill}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            ) : (
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx={node.shape === 'round' ? 10 : 3}
                fill={node.fill}
                stroke="#FFFFFF"
                strokeWidth={2}
              />
            )}
            <text
              x={cx}
              y={cy + 5}
              textAnchor="middle"
              fontSize={14}
              fontWeight="600"
              fill={node.textColor}
            >
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

