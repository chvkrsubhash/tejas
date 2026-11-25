import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eraser,
  Grid,
  Highlighter,
  MousePointer,
  Pause,
  Pen,
  Play,
  RotateCcw,
  X,
} from 'lucide-react';
import { usePresentationStore } from '../../store/usePresentationStore';
import { SlideRenderer } from '../canvas/SlideRenderer';

interface SlideShowOverlayProps {
  rehearsalMode?: boolean;
}

export const SlideShowOverlay: React.FC<SlideShowOverlayProps> = ({ rehearsalMode = false }) => {
  const {
    activePresentation,
    isPresenting,
    isPresenterView,
    presentFromSlideIndex,
    stopPresentation,
    updateSlide,
  } = usePresentationStore();

  const [currentIdx, setCurrentIdx] = useState(presentFromSlideIndex);
  const [animStep, setAnimStep] = useState(0);
  const [tool, setTool] = useState<'pointer' | 'laser' | 'pen' | 'highlighter'>('pointer');
  const [screenMask, setScreenMask] = useState<'none' | 'black' | 'white'>('none');
  const [showOverview, setShowOverview] = useState(false);
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [strokes, setStrokes] = useState<Array<{ points: string; color: string; width: number; opacity: number }>>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [timerPaused, setTimerPaused] = useState(false);
  const [transitionActive, setTransitionActive] = useState(false);
  const slideEnteredAtRef = useRef<number>(Date.now());
  const drawingRef = useRef(false);

  const visibleSlides = activePresentation?.slides.filter((s) => !s.hidden) || [];

  useEffect(() => {
    setCurrentIdx(Math.min(presentFromSlideIndex, Math.max(0, visibleSlides.length - 1)));
    setAnimStep(0);
    setElapsedSec(0);
    slideEnteredAtRef.current = Date.now();
  }, [isPresenting, presentFromSlideIndex]);

  useEffect(() => {
    if (!isPresenting || timerPaused) return;
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isPresenting, timerPaused]);

  const currentSlide = visibleSlides[currentIdx];
  const nextSlide = visibleSlides[currentIdx + 1];

  const goToSlide = (nextIdx: number) => {
    if (rehearsalMode && currentSlide) {
      updateSlide(currentSlide.id, { rehearsalTimingMs: Date.now() - slideEnteredAtRef.current });
    }
    slideEnteredAtRef.current = Date.now();
    setTransitionActive(true);
    setTimeout(() => setTransitionActive(false), currentSlide?.transition.duration || 350);
    setCurrentIdx(nextIdx);
    setAnimStep(0);
    setStrokes([]);
  };

  const advance = () => {
    if (!currentSlide) return;
    const clickAnims = currentSlide.animations.filter((a) => a.trigger === 'on_click');
    if (animStep < clickAnims.length) {
      setAnimStep((s) => s + 1);
      return;
    }
    if (currentIdx < visibleSlides.length - 1) {
      goToSlide(currentIdx + 1);
    } else {
      stopPresentation();
    }
  };

  const goBack = () => {
    if (currentIdx > 0) goToSlide(currentIdx - 1);
  };

  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!isPresenting || isPresenterView) return;
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [isPresenting, isPresenterView]);

  useEffect(() => {
    if (!isPresenting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stopPresentation();
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        advance();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        goBack();
      } else if (e.key.toLowerCase() === 'b') setScreenMask((m) => (m === 'black' ? 'none' : 'black'));
      else if (e.key.toLowerCase() === 'w') setScreenMask((m) => (m === 'white' ? 'none' : 'white'));
      else if (e.key.toLowerCase() === 'g') setShowOverview((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Auto-advance timer
  useEffect(() => {
    if (!isPresenting || !currentSlide?.transition.autoAdvanceAfter) return;
    const ms = currentSlide.transition.autoAdvanceAfter * 1000;
    const t = setTimeout(() => {
      if (currentIdx < visibleSlides.length - 1) goToSlide(currentIdx + 1);
    }, ms);
    return () => clearTimeout(t);
  }, [isPresenting, currentIdx]);

  if (!isPresenting || !activePresentation || !currentSlide) return null;

  // Compute which entrance-animated objects are still hidden until clicked
  const clickAnims = currentSlide.animations.filter((a) => a.trigger === 'on_click');
  const hiddenObjectIds = new Set<string>();
  clickAnims.forEach((anim, idx) => {
    if (anim.category === 'entrance' && idx >= animStep) {
      hiddenObjectIds.add(anim.objectId);
    }
  });

  const W = activePresentation.width;
  const H = activePresentation.height;
  const scale = isPresenterView ? Math.min(720 / W, 440 / H) : Math.min(viewport.w / W, viewport.h / H);

  const fmtTime = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const transitionClass = transitionActive
    ? currentSlide.transition.effect === 'zoom'
      ? 'scale-95 opacity-80 transition-all duration-300'
      : currentSlide.transition.effect === 'push'
      ? 'translate-x-4 opacity-80 transition-all duration-300'
      : 'opacity-40 transition-opacity duration-300'
    : 'opacity-100 scale-100 translate-x-0 transition-all duration-300';

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col select-none">
      {/* Top Bar (overlays on hover in full-screen presentation) */}
      <div
        className={`h-10 px-4 bg-black/75 flex items-center justify-between text-xs z-20 ${
          isPresenterView ? '' : 'absolute top-0 left-0 right-0 opacity-0 hover:opacity-100 transition-opacity'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#F97316]">
            {isPresenterView ? 'Presenter View' : rehearsalMode ? 'Rehearsal Mode' : 'Slide Show'}
          </span>
          <span>
            Slide {currentIdx + 1} / {visibleSlides.length}
          </span>
          <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{fmtTime(elapsedSec)}</span>
          {isPresenterView && (
            <>
              <button type="button" onClick={() => setTimerPaused((p) => !p)} className="p-1 hover:bg-white/10 rounded">
                {timerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button type="button" onClick={() => setElapsedSec(0)} className="p-1 hover:bg-white/10 rounded">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTool('pointer')}
            title="Pointer"
            className={`p-1.5 rounded ${tool === 'pointer' ? 'bg-[#C4512D]' : 'hover:bg-white/10'}`}
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setTool('laser')}
            title="Laser Pointer"
            className={`px-2 py-1 rounded text-[11px] ${tool === 'laser' ? 'bg-[#C4512D]' : 'hover:bg-white/10'}`}
          >
            Laser
          </button>
          <button
            type="button"
            onClick={() => setTool('pen')}
            title="Pen"
            className={`p-1.5 rounded ${tool === 'pen' ? 'bg-[#C4512D]' : 'hover:bg-white/10'}`}
          >
            <Pen className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setTool('highlighter')}
            title="Highlighter"
            className={`p-1.5 rounded ${tool === 'highlighter' ? 'bg-[#C4512D]' : 'hover:bg-white/10'}`}
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setStrokes([])}
            title="Clear Annotations"
            className="p-1.5 rounded hover:bg-white/10"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowOverview((v) => !v)}
            title="Slide Overview (G)"
            className="p-1.5 rounded hover:bg-white/10"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={stopPresentation}
            className="ml-2 px-2.5 py-1 bg-white/15 hover:bg-red-600 rounded flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
      </div>

      {/* Main Presentation Area */}
      {screenMask !== 'none' ? (
        <div
          onClick={() => setScreenMask('none')}
          className={`flex-1 cursor-pointer ${screenMask === 'black' ? 'bg-black' : 'bg-white'}`}
        />
      ) : showOverview ? (
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleSlides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                goToSlide(idx);
                setShowOverview(false);
              }}
              className={`border-2 rounded overflow-hidden text-left ${
                idx === currentIdx ? 'border-[#C4512D]' : 'border-white/20 hover:border-white/60'
              }`}
            >
              <SlideRenderer slide={s} width={W} height={H} scale={240 / W} master={activePresentation.masters[0]} slideIndex={idx} />
              <div className="px-2 py-1 bg-black/70 text-[11px]">
                {idx + 1}. {s.title}
              </div>
            </button>
          ))}
        </div>
      ) : isPresenterView ? (
        <div className="flex-1 grid grid-cols-12 gap-4 p-6 overflow-hidden">
          <div className="col-span-7 flex flex-col items-center justify-center bg-black/40 rounded p-4">
            <SlideRenderer
              slide={currentSlide}
              width={W}
              height={H}
              scale={scale}
              master={activePresentation.masters[0]}
              slideIndex={currentIdx}
              hiddenObjectIds={hiddenObjectIds}
            />
          </div>
          <div className="col-span-5 flex flex-col gap-4">
            <div className="bg-black/40 rounded p-3">
              <div className="text-xs text-slate-400 mb-2">Next Slide</div>
              {nextSlide ? (
                <SlideRenderer
                  slide={nextSlide}
                  width={W}
                  height={H}
                  scale={280 / W}
                  master={activePresentation.masters[0]}
                  slideIndex={currentIdx + 1}
                />
              ) : (
                <div className="text-xs text-slate-500 py-8 text-center">End of presentation</div>
              )}
            </div>
            <div className="flex-1 bg-black/40 rounded p-4 overflow-y-auto">
              <div className="text-xs text-slate-400 mb-2">Speaker Notes</div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed text-slate-100">
                {currentSlide.notes || 'No speaker notes for this slide.'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => {
            if (tool === 'pointer' && currentSlide.transition.advanceOnClick) advance();
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            if (tool === 'laser') setLaserPos({ x, y });
            if (drawingRef.current && (tool === 'pen' || tool === 'highlighter')) {
              setStrokes((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last) last.points += ` ${x},${y}`;
                return copy;
              });
            }
          }}
          onMouseDown={(e) => {
            if (tool === 'pen' || tool === 'highlighter') {
              drawingRef.current = true;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              setStrokes((prev) => [
                ...prev,
                {
                  points: `${x},${y}`,
                  color: tool === 'pen' ? '#EF4444' : '#FACC15',
                  width: tool === 'pen' ? 3 : 14,
                  opacity: tool === 'pen' ? 1 : 0.45,
                },
              ]);
            }
          }}
          onMouseUp={() => {
            drawingRef.current = false;
          }}
          className="flex-1 flex items-center justify-center relative overflow-hidden"
        >
          <div className={transitionClass}>
            <SlideRenderer
              slide={currentSlide}
              width={W}
              height={H}
              scale={scale}
              master={activePresentation.masters[0]}
              slideIndex={currentIdx}
              hiddenObjectIds={hiddenObjectIds}
            />
          </div>

          {/* Drawing Annotations Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {strokes.map((st, idx) => (
              <polyline
                key={idx}
                points={st.points}
                fill="none"
                stroke={st.color}
                strokeWidth={st.width}
                strokeOpacity={st.opacity}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>

          {/* Laser Pointer */}
          {tool === 'laser' && laserPos && (
            <div
              style={{ left: laserPos.x - 7, top: laserPos.y - 7 }}
              className="absolute w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_12px_4px_rgba(239,68,68,0.85)] pointer-events-none"
            />
          )}
        </div>
      )}

      {/* Bottom Navigation Controls (overlays on hover in full-screen presentation) */}
      <div
        className={`h-10 bg-black/75 flex items-center justify-center gap-4 z-20 ${
          isPresenterView ? '' : 'absolute bottom-0 left-0 right-0 opacity-0 hover:opacity-100 transition-opacity'
        }`}
      >
        <button
          type="button"
          onClick={goBack}
          disabled={currentIdx === 0}
          className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs">
          {currentIdx + 1} / {visibleSlides.length}
        </span>
        <button type="button" onClick={advance} className="p-1.5 rounded hover:bg-white/10">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

