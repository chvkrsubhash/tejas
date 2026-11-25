import React, { useRef, useState } from 'react';
import { usePresentationStore } from '../../store/usePresentationStore';
import { SlideObject } from '../../types/presentation';
import { ShapeRenderer } from './ShapeRenderer';
import { ChartRenderer } from './ChartRenderer';
import { DiagramRenderer } from './DiagramRenderer';
import { TableRenderer } from './TableRenderer';
import { RichTextEditor } from './RichTextEditor';
import { Lock, RotateCw } from 'lucide-react';

interface GuideLine {
  orientation: 'v' | 'h';
  pos: number;
}

export const SlideCanvas: React.FC = () => {
  const {
    activePresentation,
    activeSlideId,
    selectedObjectIds,
    editingObjectId,
    zoom,
    showRulers,
    showGrid,
    showGuides,
    snapToGrid,
    snapToObjects,
    formatPainterStyle,
    selectObject,
    setEditingObject,
    updateObject,
    applyFormatPainter,
    setZoom,
  } = usePresentationStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [guides, setGuides] = useState<GuideLine[]>([]);

  const slide = activePresentation?.slides.find((s) => s.id === activeSlideId);
  const master = activePresentation?.masters[0];

  if (!activePresentation || !slide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F3F4F6] text-[#616161]">
        No slide selected
      </div>
    );
  }

  const W = activePresentation.width;
  const H = activePresentation.height;
  const GRID = 20;

  const snapCoord = (val: number) => (snapToGrid ? Math.round(val / GRID) * GRID : Math.round(val));

  const startDrag = (e: React.MouseEvent, obj: SlideObject) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (formatPainterStyle) {
      applyFormatPainter(obj.id);
      return;
    }

    if (!selectedObjectIds.includes(obj.id)) {
      selectObject(obj.id, e.shiftKey);
    }

    if (obj.locked || editingObjectId === obj.id) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const origX = obj.x;
    const origY = obj.y;

    const otherObjects = slide.objects.filter((o) => o.id !== obj.id && o.visible);

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      let nextX = snapCoord(origX + dx);
      let nextY = snapCoord(origY + dy);
      const activeGuides: GuideLine[] = [];

      if (snapToObjects || showGuides) {
        const threshold = 7;
        const cx = nextX + obj.width / 2;
        const cy = nextY + obj.height / 2;

        // Slide center guides
        if (Math.abs(cx - W / 2) < threshold) {
          nextX = Math.round(W / 2 - obj.width / 2);
          activeGuides.push({ orientation: 'v', pos: W / 2 });
        }
        if (Math.abs(cy - H / 2) < threshold) {
          nextY = Math.round(H / 2 - obj.height / 2);
          activeGuides.push({ orientation: 'h', pos: H / 2 });
        }

        for (const other of otherObjects) {
          if (Math.abs(nextX - other.x) < threshold) {
            nextX = other.x;
            activeGuides.push({ orientation: 'v', pos: other.x });
          } else if (Math.abs(nextX + obj.width - (other.x + other.width)) < threshold) {
            nextX = other.x + other.width - obj.width;
            activeGuides.push({ orientation: 'v', pos: other.x + other.width });
          }
          if (Math.abs(nextY - other.y) < threshold) {
            nextY = other.y;
            activeGuides.push({ orientation: 'h', pos: other.y });
          } else if (Math.abs(nextY + obj.height - (other.y + other.height)) < threshold) {
            nextY = other.y + other.height - obj.height;
            activeGuides.push({ orientation: 'h', pos: other.y + other.height });
          }
        }
      }

      setGuides(showGuides ? activeGuides : []);
      updateObject(obj.id, { x: nextX, y: nextY }, false);
    };

    const onUp = () => {
      setGuides([]);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startResize = (e: React.MouseEvent, obj: SlideObject, dir: string) => {
    e.stopPropagation();
    if (obj.locked) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const { x, y, width, height } = obj;

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      let nx = x;
      let ny = y;
      let nw = width;
      let nh = height;

      if (dir.includes('e')) nw = Math.max(24, snapCoord(width + dx));
      if (dir.includes('s')) nh = Math.max(20, snapCoord(height + dy));
      if (dir.includes('w')) {
        const diff = Math.min(width - 24, dx);
        nx = snapCoord(x + diff);
        nw = Math.max(24, snapCoord(width - diff));
      }
      if (dir.includes('n')) {
        const diff = Math.min(height - 20, dy);
        ny = snapCoord(y + diff);
        nh = Math.max(20, snapCoord(height - diff));
      }

      updateObject(obj.id, { x: nx, y: ny, width: nw, height: nh }, false);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startRotate = (e: React.MouseEvent, obj: SlideObject) => {
    e.stopPropagation();
    if (obj.locked) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = (obj.x + obj.width / 2) * zoom;
    const centerY = (obj.y + obj.height / 2) * zoom;

    const onMove = (ev: MouseEvent) => {
      const slideEl = document.getElementById('tejas-active-slide-surface');
      if (!slideEl) return;
      const sRect = slideEl.getBoundingClientRect();
      const angleRad = Math.atan2(ev.clientY - (sRect.top + centerY), ev.clientX - (sRect.left + centerX));
      let deg = Math.round((angleRad * 180) / Math.PI + 90);
      if (ev.shiftKey) deg = Math.round(deg / 15) * 15;
      updateObject(obj.id, { rotation: (deg + 360) % 360 }, false);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      const startX = e.clientX;
      const startY = e.clientY;
      const origPan = { ...pan };
      const onMove = (ev: MouseEvent) => {
        setPan({ x: origPan.x + (ev.clientX - startX), y: origPan.y + (ev.clientY - startY) });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return;
    }
    selectObject(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(zoom + (e.deltaY < 0 ? 0.08 : -0.08));
    }
  };

  const bgStyle: React.CSSProperties =
    slide.background.type === 'gradient'
      ? {
          background: `linear-gradient(${slide.background.gradientAngle ?? 135}deg, ${
            slide.background.gradientFrom || '#FFFFFF'
          }, ${slide.background.gradientTo || '#E2E8F0'})`,
        }
      : slide.background.type === 'image' && slide.background.imageSrc
      ? {
          backgroundImage: `url(${slide.background.imageSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {
          backgroundColor: slide.background.color || '#FFFFFF',
        };

  const sortedObjects = [...slide.objects].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
      className={`flex-1 relative overflow-auto bg-[#E5E7EB] flex items-center justify-center p-10 select-none ${
        formatPainterStyle ? 'cursor-crosshair' : ''
      }`}
    >
      {/* Rulers */}
      {showRulers && (
        <>
          <div className="absolute top-0 left-6 right-0 h-5 bg-white border-b border-[#DADCE0] flex items-center text-[10px] text-[#616161] px-2 z-20 pointer-events-none">
            {Array.from({ length: 13 }).map((_, i) => (
              <div key={i} className="flex-1 border-l border-[#DADCE0] pl-1">
                {i * 100}px
              </div>
            ))}
          </div>
          <div className="absolute top-5 left-0 bottom-0 w-6 bg-white border-r border-[#DADCE0] flex flex-col text-[9px] text-[#616161] z-20 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 border-t border-[#DADCE0] pt-0.5 text-center">
                {i * 100}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Scaled Slide Container */}
      <div
        style={{
          width: W * zoom,
          height: H * zoom,
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
          border: '1px solid #CBD5E1',
          flexShrink: 0,
        }}
      >
        <div
          id="tejas-active-slide-surface"
          style={{
            width: W,
            height: H,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            position: 'relative',
            ...bgStyle,
            border: slide.border?.enabled
              ? `${slide.border.width}px solid ${slide.border.color}`
              : undefined,
          }}
        >
          {/* Grid Overlay */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(to right, rgba(148,163,184,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.22) 1px, transparent 1px)',
                backgroundSize: `${GRID}px ${GRID}px`,
              }}
            />
          )}

          {/* Master Layer */}
          {master?.logoSrc && (
            <img
              src={master.logoSrc}
              alt="Master Logo"
              className="absolute top-4 right-6 h-9 object-contain pointer-events-none"
            />
          )}
          {master?.headerText && (
            <div
              className="absolute top-3 left-9 text-xs pointer-events-none opacity-65"
              style={{ color: master.textColor }}
            >
              {master.headerText}
            </div>
          )}
          {master?.footerText && (
            <div
              className="absolute bottom-3 left-9 text-xs pointer-events-none opacity-65"
              style={{ color: master.textColor }}
            >
              {master.footerText}
            </div>
          )}
          {master?.showSlideNumber && (
            <div
              className="absolute bottom-3 right-7 text-xs pointer-events-none opacity-65"
              style={{ color: master.textColor }}
            >
              {slide.order + 1}
            </div>
          )}

          {/* Alignment Guides */}
          {guides.map((g, idx) =>
            g.orientation === 'v' ? (
              <div
                key={idx}
                className="absolute top-0 bottom-0 w-px bg-[#C4512D] pointer-events-none z-50"
                style={{ left: g.pos }}
              />
            ) : (
              <div
                key={idx}
                className="absolute left-0 right-0 h-px bg-[#C4512D] pointer-events-none z-50"
                style={{ top: g.pos }}
              />
            )
          )}

          {/* Slide Objects */}
          {sortedObjects.map((obj) => {
            if (!obj.visible) return null;
            const isSelected = selectedObjectIds.includes(obj.id);
            const isEditing = editingObjectId === obj.id;
            const transformParts = [
              `rotate(${obj.rotation}deg)`,
              obj.flipX ? 'scaleX(-1)' : '',
              obj.flipY ? 'scaleY(-1)' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={obj.id}
                onMouseDown={(e) => startDrag(e, obj)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (obj.type === 'text' && !obj.locked) {
                    setEditingObject(obj.id);
                  }
                }}
                style={{
                  position: 'absolute',
                  left: obj.x,
                  top: obj.y,
                  width: obj.width,
                  height: obj.height,
                  opacity: obj.opacity,
                  transform: transformParts,
                  boxShadow: obj.shadow?.enabled
                    ? `${obj.shadow.offsetX}px ${obj.shadow.offsetY}px ${obj.shadow.blur}px ${obj.shadow.color}`
                    : undefined,
                  outline: isSelected ? '2px solid #C4512D' : '1px solid transparent',
                  outlineOffset: 1,
                  cursor: obj.locked ? 'not-allowed' : isEditing ? 'text' : 'move',
                }}
              >
                {/* Object Content */}
                {obj.type === 'text' && obj.textData && (
                  isEditing ? (
                    <RichTextEditor
                      data={obj.textData}
                      onChange={(text, html) =>
                        updateObject(
                          obj.id,
                          { textData: { ...obj.textData!, text, html } },
                          false
                        )
                      }
                      onBlur={() => setEditingObject(null)}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex flex-col overflow-hidden whitespace-pre-wrap break-words"
                      style={{
                        padding: `${obj.textData.padding}px`,
                        fontFamily: obj.textData.style.fontFamily,
                        fontSize: `${obj.textData.style.fontSize}px`,
                        fontWeight: obj.textData.style.fontWeight,
                        fontStyle: obj.textData.style.fontStyle,
                        textDecoration: obj.textData.style.textDecoration,
                        color: obj.textData.style.color,
                        backgroundColor: obj.textData.backgroundColor || 'transparent',
                        letterSpacing: `${obj.textData.style.letterSpacing}px`,
                        lineHeight: obj.textData.style.lineHeight,
                        textAlign: obj.textData.style.textAlign,
                        justifyContent:
                          obj.textData.style.verticalAlign === 'middle'
                            ? 'center'
                            : obj.textData.style.verticalAlign === 'bottom'
                            ? 'flex-end'
                            : 'flex-start',
                        direction: obj.textData.style.direction,
                      }}
                    >
                      {obj.textData.html ? (
                        <div dangerouslySetInnerHTML={{ __html: obj.textData.html }} />
                      ) : (
                        obj.textData.text
                      )}
                    </div>
                  )
                )}

                {obj.type === 'shape' && obj.shapeData && (
                  <ShapeRenderer data={obj.shapeData} width={obj.width} height={obj.height} />
                )}

                {obj.type === 'image' && obj.imageData && (
                  <img
                    src={obj.imageData.src}
                    alt={obj.altText || obj.name}
                    draggable={false}
                    className="w-full h-full"
                    style={{
                      objectFit: obj.imageData.maintainAspectRatio ? 'contain' : 'fill',
                      filter: `brightness(${obj.imageData.brightness}%) contrast(${obj.imageData.contrast}%)`,
                      border:
                        obj.imageData.borderWidth > 0
                          ? `${obj.imageData.borderWidth}px solid ${obj.imageData.borderColor}`
                          : undefined,
                    }}
                  />
                )}

                {obj.type === 'table' && obj.tableData && (
                  <TableRenderer
                    data={obj.tableData}
                    editable={isSelected}
                    onCellChange={(r, c, val) => {
                      const nextCells = obj.tableData!.cells.map((row, ri) =>
                        ri === r
                          ? row.map((cell, ci) => (ci === c ? { ...cell, text: val } : cell))
                          : row
                      );
                      updateObject(obj.id, {
                        tableData: { ...obj.tableData!, cells: nextCells },
                      });
                    }}
                  />
                )}

                {obj.type === 'chart' && obj.chartData && (
                  <ChartRenderer data={obj.chartData} width={obj.width} height={obj.height} />
                )}

                {obj.type === 'diagram' && obj.diagramData && (
                  <DiagramRenderer data={obj.diagramData} width={obj.width} height={obj.height} />
                )}

                {obj.type === 'equation' && obj.equationData && (
                  <div
                    className="w-full h-full flex items-center justify-center font-serif bg-white/60 rounded"
                    style={{
                      fontSize: `${obj.equationData.fontSize}px`,
                      color: obj.equationData.color,
                    }}
                  >
                    {obj.equationData.displayText}
                  </div>
                )}

                {obj.type === 'audio' && obj.mediaData && (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded border border-slate-300 px-3">
                    <audio src={obj.mediaData.src} controls className="w-full" />
                  </div>
                )}

                {obj.type === 'video' && obj.mediaData && (
                  <video
                    src={obj.mediaData.src}
                    controls
                    className="w-full h-full object-contain bg-black rounded"
                  />
                )}

                {obj.type === 'embed' && obj.embedData && (
                  <div className="w-full h-full relative border border-slate-300 rounded bg-white overflow-hidden">
                    <iframe
                      src={obj.embedData.url}
                      title={obj.embedData.title}
                      sandbox="allow-scripts allow-same-origin"
                      className="w-full h-full pointer-events-none"
                    />
                  </div>
                )}

                {/* Lock Indicator */}
                {isSelected && obj.locked && (
                  <div className="absolute -top-6 left-0 bg-[#242424] text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </div>
                )}

                {/* Resize & Rotate Handles */}
                {isSelected && !obj.locked && !isEditing && (
                  <>
                    <button
                      type="button"
                      onMouseDown={(e) => startRotate(e, obj)}
                      title="Rotate"
                      className="absolute -top-8 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border border-[#C4512D] text-[#C4512D] flex items-center justify-center shadow-sm cursor-grab"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    {[
                      { dir: 'nw', cls: '-top-1.5 -left-1.5 cursor-nwse-resize' },
                      { dir: 'n', cls: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
                      { dir: 'ne', cls: '-top-1.5 -right-1.5 cursor-nesw-resize' },
                      { dir: 'e', cls: 'top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize' },
                      { dir: 'se', cls: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
                      { dir: 's', cls: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
                      { dir: 'sw', cls: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
                      { dir: 'w', cls: 'top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize' },
                    ].map((h) => (
                      <div
                        key={h.dir}
                        onMouseDown={(e) => startResize(e, obj, h.dir)}
                        className={`absolute w-3 h-3 bg-white border-2 border-[#C4512D] rounded-xs ${h.cls}`}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

