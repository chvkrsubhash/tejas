import React from 'react';
import { Slide, SlideMaster, SlideObject } from '../../types/presentation';
import { ShapeRenderer } from './ShapeRenderer';
import { ChartRenderer } from './ChartRenderer';
import { DiagramRenderer } from './DiagramRenderer';
import { TableRenderer } from './TableRenderer';

interface SlideRendererProps {
  slide: Slide;
  width: number;
  height: number;
  scale?: number;
  master?: SlideMaster;
  slideIndex?: number;
  hiddenObjectIds?: Set<string>;
  activeAnimationMap?: Record<string, string>;
  onObjectClick?: (obj: SlideObject) => void;
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({
  slide,
  width,
  height,
  scale = 1,
  master,
  slideIndex = 0,
  hiddenObjectIds,
  activeAnimationMap,
  onObjectClick,
}) => {
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
      style={{
        width: width * scale,
        height: height * scale,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'relative',
          ...bgStyle,
          border: slide.border?.enabled
            ? `${slide.border.width}px solid ${slide.border.color}`
            : undefined,
        }}
      >
        {/* Master elements: logo, header, footer, slide number */}
        {master?.logoSrc && (
          <img
            src={master.logoSrc}
            alt="Master Logo"
            style={{
              position: 'absolute',
              top: 18,
              right: 24,
              height: 36,
              objectFit: 'contain',
              pointerEvents: 'none',
            }}
          />
        )}
        {master?.headerText && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 36,
              fontSize: 12,
              color: master.textColor,
              opacity: 0.65,
              pointerEvents: 'none',
            }}
          >
            {master.headerText}
          </div>
        )}
        {master?.footerText && (
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 36,
              fontSize: 12,
              color: master.textColor,
              opacity: 0.65,
              pointerEvents: 'none',
            }}
          >
            {master.footerText}
          </div>
        )}
        {master?.showSlideNumber && (
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              right: 28,
              fontSize: 12,
              color: master.textColor,
              opacity: 0.65,
              pointerEvents: 'none',
            }}
          >
            {slideIndex + 1}
          </div>
        )}

        {sortedObjects.map((obj) => {
          if (!obj.visible || hiddenObjectIds?.has(obj.id)) return null;
          const animClass = activeAnimationMap?.[obj.id] || '';
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
              onClick={() => onObjectClick?.(obj)}
              className={animClass}
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
                cursor: onObjectClick ? 'pointer' : 'default',
              }}
            >
              {obj.type === 'text' && obj.textData && (
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
              )}

              {obj.type === 'shape' && obj.shapeData && (
                <ShapeRenderer data={obj.shapeData} width={obj.width} height={obj.height} />
              )}

              {obj.type === 'image' && obj.imageData && (
                <img
                  src={obj.imageData.src}
                  alt={obj.altText || obj.name}
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

              {obj.type === 'table' && obj.tableData && <TableRenderer data={obj.tableData} />}
              {obj.type === 'chart' && obj.chartData && (
                <ChartRenderer data={obj.chartData} width={obj.width} height={obj.height} />
              )}
              {obj.type === 'diagram' && obj.diagramData && (
                <DiagramRenderer data={obj.diagramData} width={obj.width} height={obj.height} />
              )}
              {obj.type === 'equation' && obj.equationData && (
                <div
                  className="w-full h-full flex items-center justify-center font-serif"
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
                  autoPlay={obj.mediaData.autoplay}
                  loop={obj.mediaData.loop}
                  className="w-full h-full object-contain bg-black rounded"
                />
              )}
              {obj.type === 'embed' && obj.embedData && (
                <iframe
                  src={obj.embedData.url}
                  title={obj.embedData.title}
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-full border border-slate-300 rounded bg-white"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

