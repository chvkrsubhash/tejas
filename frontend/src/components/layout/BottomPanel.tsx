import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Maximize2,
  Minus,
  Monitor,
  Plus,
  StickyNote,
} from 'lucide-react';
import { usePresentationStore } from '../../store/usePresentationStore';

export const BottomPanel: React.FC = () => {
  const {
    activePresentation,
    activeSlideId,
    zoom,
    viewMode,
    syncStatus,
    updateSlide,
    setZoom,
    setViewMode,
    startPresentation,
  } = usePresentationStore();

  const [notesOpen, setNotesOpen] = useState(false);

  if (!activePresentation) return null;

  const slideIndex = activePresentation.slides.findIndex((s) => s.id === activeSlideId);
  const currentSlide = activePresentation.slides[slideIndex];

  return (
    <div className="bg-white border-t border-[#DADCE0] select-none shrink-0 z-20">
      {/* Collapsible Speaker Notes Drawer */}
      {notesOpen && currentSlide && (
        <div className="h-28 border-b border-[#DADCE0] px-3 py-2 bg-[#FAFAFA] flex flex-col">
          <div className="text-[11px] font-semibold text-[#616161] mb-1">
            Speaker Notes — Slide {slideIndex + 1}
          </div>
          <textarea
            value={currentSlide.notes}
            onChange={(e) => updateSlide(currentSlide.id, { notes: e.target.value })}
            placeholder="Click to add speaker notes..."
            className="flex-1 w-full resize-none bg-white border border-[#DADCE0] rounded px-2 py-1 text-xs text-[#242424] outline-none focus:border-[#C4512D]"
          />
        </div>
      )}

      {/* Status Bar */}
      <div className="h-7 px-3 flex items-center justify-between text-[11px] text-[#616161]">
        <div className="flex items-center gap-4">
          <span>
            Slide {slideIndex + 1} of {activePresentation.slides.length}
          </span>
          <span className="capitalize">Status: {syncStatus.replace('_', ' ')}</span>
          <button
            type="button"
            onClick={() => setNotesOpen((v) => !v)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#F3F4F6] ${
              notesOpen ? 'text-[#C4512D] font-medium' : ''
            }`}
          >
            <StickyNote className="w-3 h-3" />
            <span>Notes</span>
            {notesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>

        {/* View Modes & Zoom Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border-r border-[#DADCE0] pr-3 gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode('normal')}
              title="Normal View"
              className={`p-1 rounded ${
                viewMode === 'normal' ? 'bg-[#FCECE6] text-[#C4512D]' : 'hover:bg-[#F3F4F6]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('slide_sorter')}
              title="Slide Sorter"
              className={`p-1 rounded ${
                viewMode === 'slide_sorter' ? 'bg-[#FCECE6] text-[#C4512D]' : 'hover:bg-[#F3F4F6]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('reading')}
              title="Reading View"
              className={`p-1 rounded ${
                viewMode === 'reading' ? 'bg-[#FCECE6] text-[#C4512D]' : 'hover:bg-[#F3F4F6]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => startPresentation(true, false)}
              title="Slide Show"
              className="p-1 rounded hover:bg-[#F3F4F6]"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom(zoom - 0.1)}
              title="Zoom Out"
              className="p-0.5 rounded hover:bg-[#F3F4F6]"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={25}
              max={200}
              value={Math.round(zoom * 100)}
              onChange={(e) => setZoom(Number(e.target.value) / 100)}
              className="w-20 accent-[#C4512D] cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom(zoom + 0.1)}
              title="Zoom In"
              className="p-0.5 rounded hover:bg-[#F3F4F6]"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(0.72)}
              title="Fit Slide to Window"
              className="w-10 text-right font-medium hover:text-[#242424]"
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

