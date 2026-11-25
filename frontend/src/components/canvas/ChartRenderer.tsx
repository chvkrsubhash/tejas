import React from 'react';
import { ChartData } from '../../types/presentation';

interface ChartRendererProps {
  data: ChartData;
  width: number;
  height: number;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ data, width, height }) => {
  const padTop = data.title ? 36 : 16;
  const padBottom = data.showLegend ? 46 : 28;
  const padLeft = 44;
  const padRight = 20;
  const plotW = Math.max(40, width - padLeft - padRight);
  const plotH = Math.max(40, height - padTop - padBottom);

  const allValues = data.series.flatMap((s) => s.values);
  const maxVal = Math.max(1, ...allValues, 0);
  const cats = data.categories.length > 0 ? data.categories : ['A', 'B', 'C'];

  const renderGrid = () => {
    if (!data.showGrid || data.kind === 'pie' || data.kind === 'doughnut' || data.kind === 'radar') {
      return null;
    }
    const ticks = 4;
    return Array.from({ length: ticks + 1 }).map((_, i) => {
      const y = padTop + (plotH * i) / ticks;
      const val = Math.round(maxVal - (maxVal * i) / ticks);
      return (
        <g key={i}>
          <line x1={padLeft} y1={y} x2={padLeft + plotW} y2={y} stroke="#E2E8F0" strokeWidth={1} />
          <text x={padLeft - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#64748B">
            {val}
          </text>
        </g>
      );
    });
  };

  const renderBody = () => {
    if (data.kind === 'pie' || data.kind === 'doughnut') {
      const values = data.series[0]?.values || [];
      const total = values.reduce((a, b) => a + Math.max(0, b), 0) || 1;
      const cx = width / 2;
      const cy = padTop + plotH / 2;
      const r = Math.min(plotW, plotH) * 0.42;
      const innerR = data.kind === 'doughnut' ? r * 0.52 : 0;
      const palette = ['#C4512D', '#1E3A5F', '#0F766E', '#D97706', '#4F46E5', '#64748B'];
      let angle = -Math.PI / 2;

      return values.map((v, i) => {
        const slice = (Math.max(0, v) / total) * Math.PI * 2;
        const x1 = cx + r * Math.cos(angle);
        const y1 = cy + r * Math.sin(angle);
        const x2 = cx + r * Math.cos(angle + slice);
        const y2 = cy + r * Math.sin(angle + slice);
        const largeArc = slice > Math.PI ? 1 : 0;
        let d = '';
        if (innerR > 0) {
          const ix1 = cx + innerR * Math.cos(angle + slice);
          const iy1 = cy + innerR * Math.sin(angle + slice);
          const ix2 = cx + innerR * Math.cos(angle);
          const iy2 = cy + innerR * Math.sin(angle);
          d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
        } else {
          d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        }
        angle += slice;
        const color = data.series[i]?.color || palette[i % palette.length];
        return <path key={i} d={d} fill={color} stroke="#FFFFFF" strokeWidth={1.5} />;
      });
    }

    if (data.kind === 'radar') {
      const cx = width / 2;
      const cy = padTop + plotH / 2;
      const r = Math.min(plotW, plotH) * 0.4;
      const n = Math.max(3, cats.length);
      const rings = [0.25, 0.5, 0.75, 1];
      return (
        <g>
          {rings.map((ratio, idx) => {
            const pts = Array.from({ length: n })
              .map((_, i) => {
                const a = (Math.PI * 2 * i) / n - Math.PI / 2;
                return `${cx + r * ratio * Math.cos(a)},${cy + r * ratio * Math.sin(a)}`;
              })
              .join(' ');
            return <polygon key={idx} points={pts} fill="none" stroke="#CBD5E1" strokeWidth={1} />;
          })}
          {data.series.map((s, si) => {
            const pts = Array.from({ length: n })
              .map((_, i) => {
                const val = s.values[i] ?? 0;
                const ratio = Math.min(1, Math.max(0, val / maxVal));
                const a = (Math.PI * 2 * i) / n - Math.PI / 2;
                return `${cx + r * ratio * Math.cos(a)},${cy + r * ratio * Math.sin(a)}`;
              })
              .join(' ');
            return (
              <polygon
                key={si}
                points={pts}
                fill={s.color}
                fillOpacity={0.28}
                stroke={s.color}
                strokeWidth={2}
              />
            );
          })}
        </g>
      );
    }

    if (data.kind === 'bar' || data.kind === 'stacked_bar') {
      const rowH = plotH / cats.length;
      const sCount = Math.max(1, data.series.length);
      const maxStack =
        data.kind === 'stacked_bar'
          ? Math.max(
              1,
              ...cats.map((_, ci) => data.series.reduce((sum, s) => sum + (s.values[ci] || 0), 0))
            )
          : maxVal;

      return cats.map((cat, ci) => {
        let stackOffset = 0;
        return (
          <g key={ci}>
            <text
              x={padLeft - 6}
              y={padTop + ci * rowH + rowH / 2 + 4}
              textAnchor="end"
              fontSize={10}
              fill="#475569"
            >
              {cat}
            </text>
            {data.series.map((s, si) => {
              const v = Math.max(0, s.values[ci] || 0);
              const w = (v / maxStack) * plotW;
              if (data.kind === 'stacked_bar') {
                const x = padLeft + stackOffset;
                stackOffset += w;
                const bh = Math.max(8, rowH * 0.62);
                const y = padTop + ci * rowH + (rowH - bh) / 2;
                return <rect key={si} x={x} y={y} width={w} height={bh} fill={s.color} rx={2} />;
              }
              const bh = Math.max(6, (rowH * 0.72) / sCount);
              const y = padTop + ci * rowH + rowH * 0.14 + si * bh;
              return <rect key={si} x={padLeft} y={y} width={w} height={bh - 2} fill={s.color} rx={2} />;
            })}
          </g>
        );
      });
    }

    if (data.kind === 'line' || data.kind === 'area' || data.kind === 'scatter') {
      const stepX = cats.length > 1 ? plotW / (cats.length - 1) : plotW;
      return (
        <g>
          {cats.map((cat, ci) => (
            <text
              key={ci}
              x={padLeft + ci * stepX}
              y={padTop + plotH + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#475569"
            >
              {cat}
            </text>
          ))}
          {data.series.map((s, si) => {
            const pts = cats.map((_, ci) => {
              const x = padLeft + ci * stepX;
              const y = padTop + plotH - ((s.values[ci] || 0) / maxVal) * plotH;
              return { x, y };
            });
            const poly = pts.map((p) => `${p.x},${p.y}`).join(' ');
            const areaPath =
              pts.length > 0
                ? `M ${pts[0].x} ${padTop + plotH} ` +
                  pts.map((p) => `L ${p.x} ${p.y}`).join(' ') +
                  ` L ${pts[pts.length - 1].x} ${padTop + plotH} Z`
                : '';
            return (
              <g key={si}>
                {data.kind === 'area' && <path d={areaPath} fill={s.color} fillOpacity={0.22} />}
                {data.kind !== 'scatter' && (
                  <polyline fill="none" stroke={s.color} strokeWidth={2.5} points={poly} />
                )}
                {pts.map((p, pi) => (
                  <circle key={pi} cx={p.x} cy={p.y} r={data.kind === 'scatter' ? 5 : 3.5} fill={s.color} />
                ))}
              </g>
            );
          })}
        </g>
      );
    }

    // Default: Column chart
    const groupW = plotW / cats.length;
    const sCount = Math.max(1, data.series.length);
    const barW = Math.max(8, (groupW * 0.68) / sCount);

    return cats.map((cat, ci) => (
      <g key={ci}>
        <text
          x={padLeft + ci * groupW + groupW / 2}
          y={padTop + plotH + 16}
          textAnchor="middle"
          fontSize={10}
          fill="#475569"
        >
          {cat}
        </text>
        {data.series.map((s, si) => {
          const val = Math.max(0, s.values[ci] || 0);
          const h = (val / maxVal) * plotH;
          const x = padLeft + ci * groupW + groupW * 0.16 + si * barW;
          const y = padTop + plotH - h;
          return (
            <g key={si}>
              <rect x={x} y={y} width={Math.max(4, barW - 2)} height={h} fill={s.color} rx={2} />
              {data.showValues && h > 14 && (
                <text x={x + barW / 2 - 1} y={y - 4} textAnchor="middle" fontSize={9} fill="#334155">
                  {val}
                </text>
              )}
            </g>
          );
        })}
      </g>
    ));
  };

  return (
    <svg width={width} height={height} className="w-full h-full bg-white/95 rounded border border-[#E2E8F0]">
      {data.title && (
        <text x={width / 2} y={22} textAnchor="middle" fontSize={13} fontWeight="bold" fill="#1E293B">
          {data.title}
        </text>
      )}
      {renderGrid()}
      {data.kind !== 'pie' && data.kind !== 'doughnut' && data.kind !== 'radar' && (
        <g>
          <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + plotH} stroke="#94A3B8" strokeWidth={1.2} />
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={padLeft + plotW}
            y2={padTop + plotH}
            stroke="#94A3B8"
            strokeWidth={1.2}
          />
        </g>
      )}
      {renderBody()}
      {data.showLegend && (
        <g transform={`translate(${padLeft}, ${height - 16})`}>
          {data.series.map((s, i) => (
            <g key={i} transform={`translate(${i * 110}, 0)`}>
              <rect x={0} y={-8} width={10} height={10} fill={s.color} rx={2} />
              <text x={14} y={1} fontSize={10} fill="#475569">
                {s.name}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
};

