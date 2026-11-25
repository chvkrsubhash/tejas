import React from 'react';
import { Copy, EyeOff, Plus, Trash2 } from 'lucide-react';
import { usePresentationStore } from '../../store/usePresentationStore';
import { SlideRenderer } from '../canvas/SlideRenderer';

export const SlideSorterView: React.FC = () => {
  const {
    activePresentation,
    activeSlideId,
    setActiveSlide,
    setViewMode,
    duplicateSlide,
    deleteSlide,
    addSlide,
  } = usePresentationStore();

  if (!activePresentation) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F3F4F6]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#242424]">Slide Sorter</h2>
        <button
          type="button"
          onClick={() => addSlide('title_content')}
          className="px-3 py-1.5 bg-[#C4512D] text-white rounded text-xs font-medium flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add Slide
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {activePresentation.slides.map((slide, idx) => (
          <div
            key={slide.id}
            onClick={() => setActiveSlide(slide.id)}
            onDoubleClick={() => {
              setActiveSlide(slide.id);
              setViewMode('normal');
            }}
            className={`bg-white border rounded p-2 cursor-pointer transition-all ${
              slide.id === activeSlideId ? 'border-[#C4512D] ring-2 ring-[#FCECE6]' : 'border-[#DADCE0]'
            }`}
          >
            <div className="relative overflow-hidden border border-[#ECEEF1] rounded-xs">
              <SlideRenderer
                slide={slide}
                width={activePresentation.width}
                height={activePresentation.height}
                scale={220 / activePresentation.width}
                master={activePresentation.masters[0]}
                slideIndex={idx}
              />
              {slide.hidden && (
                <div className="absolute top-1 right-1 bg-white/90 p-1 rounded">
                  <EyeOff className="w-3 h-3" />
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-medium truncate">
                {idx + 1}. {slide.title}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateSlide(slide.id);
                  }}
                  className="p-1 hover:bg-[#F3F4F6] rounded"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSlide(slide.id);
                  }}
                  className="p-1 hover:bg-red-50 text-red-600 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const OutlineView: React.FC = () => {
  const { activePresentation, activeSlideId, setActiveSlide, setViewMode } = usePresentationStore();
  if (!activePresentation) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F3F4F6]">
      <div className="max-w-3xl mx-auto bg-white border border-[#DADCE0] rounded-md p-6 space-y-4">
        <h2 className="text-sm font-semibold text-[#242424] border-b border-[#DADCE0] pb-2">
          Presentation Outline
        </h2>
        {activePresentation.slides.map((slide, idx) => {
          const texts = slide.objects.filter((o) => o.textData).map((o) => o.textData!.text);
          return (
            <div
              key={slide.id}
              onClick={() => {
                setActiveSlide(slide.id);
                setViewMode('normal');
              }}
              className={`p-3 rounded border cursor-pointer ${
                slide.id === activeSlideId
                  ? 'border-[#C4512D] bg-[#FCECE6]/40'
                  : 'border-[#ECEEF1] hover:bg-[#F9FAFB]'
              }`}
            >
              <div className="text-xs font-bold text-[#C4512D] mb-1">
                Slide {idx + 1}: {slide.title}
              </div>
              {texts.map((t, ti) => (
                <div key={ti} className="text-xs text-[#242424] whitespace-pre-wrap ml-3 mb-1">
                  {t}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SlideMasterView: React.FC = () => {
  const { activePresentation, updateMaster, setViewMode } = usePresentationStore();
  if (!activePresentation) return null;
  const master = activePresentation.masters[0];
  if (!master) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#F3F4F6]">
      <div className="max-w-2xl mx-auto bg-white border border-[#DADCE0] rounded-md p-6 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-[#DADCE0] pb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#242424]">Slide Master Editor</h2>
            <p className="text-[#616161]">Changes apply globally across slides.</p>
          </div>
          <button
            type="button"
            onClick={() => setViewMode('normal')}
            className="px-3 py-1.5 bg-[#C4512D] text-white rounded font-medium"
          >
            Close Master View
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="font-medium block mb-1">Master Background Color</span>
            <input
              type="color"
              value={master.background.color}
              onChange={(e) =>
                updateMaster(master.id, { background: { type: 'solid', color: e.target.value } })
              }
            />
          </label>
          <label className="block">
            <span className="font-medium block mb-1">Global Primary Color</span>
            <input
              type="color"
              value={master.primaryColor}
              onChange={(e) => updateMaster(master.id, { primaryColor: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="font-medium block mb-1">Header Text</span>
            <input
              type="text"
              value={master.headerText || ''}
              onChange={(e) => updateMaster(master.id, { headerText: e.target.value })}
              className="w-full h-8 border border-[#DADCE0] rounded px-2"
            />
          </label>
          <label className="block">
            <span className="font-medium block mb-1">Footer Text</span>
            <input
              type="text"
              value={master.footerText || ''}
              onChange={(e) => updateMaster(master.id, { footerText: e.target.value })}
              className="w-full h-8 border border-[#DADCE0] rounded px-2"
            />
          </label>
          <label className="block col-span-2">
            <span className="font-medium block mb-1">Company Logo URL (or Data URL)</span>
            <input
              type="text"
              value={master.logoSrc || ''}
              onChange={(e) => updateMaster(master.id, { logoSrc: e.target.value })}
              placeholder="/tejas-logo.png"
              className="w-full h-8 border border-[#DADCE0] rounded px-2"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            checked={master.showSlideNumber}
            onChange={(e) => updateMaster(master.id, { showSlideNumber: e.target.checked })}
            className="accent-[#C4512D]"
          />
          <span>Show slide numbers on all slides</span>
        </label>
      </div>
    </div>
  );
};

