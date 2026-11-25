import React, { useState } from 'react';
import { Copy, Eye, EyeOff, FolderPlus, Plus, Trash2 } from 'lucide-react';
import { usePresentationStore } from '../../store/usePresentationStore';
import { SlideRenderer } from '../canvas/SlideRenderer';

export const LeftSidebar: React.FC = () => {
  const {
    activePresentation,
    activeSlideId,
    selectedSlideIds,
    setActiveSlide,
    addSlide,
    duplicateSlide,
    deleteSlide,
    reorderSlides,
    toggleHideSlide,
    addSection,
  } = usePresentationStore();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; slideId: string } | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(212);

  if (!activePresentation) return null;

  const master = activePresentation.masters[0];
  const thumbWidth = Math.max(140, sidebarWidth - 46);
  const scale = thumbWidth / activePresentation.width;

  const startResize = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const origW = sidebarWidth;
    const onMove = (ev: MouseEvent) => {
      setSidebarWidth(Math.min(340, Math.max(170, origW + (ev.clientX - startX))));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <aside
      style={{ width: sidebarWidth }}
      onClick={() => setContextMenu(null)}
      className="bg-[#F8F9FA] border-r border-[#DADCE0] flex flex-col relative shrink-0 select-none"
    >
      {/* Header Toolbar */}
      <div className="h-9 px-2 border-b border-[#DADCE0] flex items-center justify-between bg-white">
        <span className="text-[11px] font-semibold text-[#616161] uppercase tracking-wider">
          Slides ({activePresentation.slides.length})
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => addSlide('title_content')}
            title="New Slide (Ctrl+M)"
            className="p-1 rounded hover:bg-[#F3F4F6] text-[#242424]"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => duplicateSlide()}
            title="Duplicate Slide"
            className="p-1 rounded hover:bg-[#F3F4F6] text-[#242424]"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => deleteSlide()}
            disabled={activePresentation.slides.length <= 1}
            title="Delete Slide"
            className="p-1 rounded hover:bg-[#F3F4F6] text-[#242424] disabled:opacity-35"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {activePresentation.slides.map((slide, idx) => {
          const isActive = slide.id === activeSlideId;
          const isSelected = selectedSlideIds.includes(slide.id);
          const section = activePresentation.sections.find((s) => s.id === slide.sectionId);

          return (
            <React.Fragment key={slide.id}>
              {section && (
                <div className="text-[10px] font-semibold text-[#C4512D] px-1 pt-1 uppercase tracking-wide truncate">
                  {section.title}
                </div>
              )}
              <div
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== idx) {
                    reorderSlides(dragIndex, idx);
                  }
                  setDragIndex(null);
                }}
                onClick={(e) => setActiveSlide(slide.id, e.shiftKey || e.ctrlKey || e.metaKey)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setActiveSlide(slide.id);
                  setContextMenu({ x: e.clientX, y: e.clientY, slideId: slide.id });
                }}
                className={`group flex items-start gap-1.5 p-1.5 rounded cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#FCECE6] ring-1 ring-[#C4512D]'
                    : isSelected
                    ? 'bg-[#FCECE6]/60'
                    : 'hover:bg-[#E9ECEF]'
                }`}
              >
                <div className="w-5 text-[11px] font-medium text-[#616161] text-right pt-0.5 shrink-0">
                  {idx + 1}
                </div>
                <div
                  className={`relative bg-white border rounded-xs overflow-hidden shadow-xs ${
                    isActive ? 'border-[#C4512D]' : 'border-[#DADCE0]'
                  } ${slide.hidden ? 'opacity-45' : ''}`}
                >
                  <SlideRenderer
                    slide={slide}
                    width={activePresentation.width}
                    height={activePresentation.height}
                    scale={scale}
                    master={master}
                    slideIndex={idx}
                  />
                  {slide.hidden && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                      <EyeOff className="w-4 h-4 text-[#242424]" />
                    </div>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed w-44 bg-white border border-[#DADCE0] rounded-md shadow-lg py-1 z-50 text-xs"
        >
          <button
            type="button"
            onClick={() => {
              addSlide('title_content');
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[#F3F4F6] flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> New Slide
          </button>
          <button
            type="button"
            onClick={() => {
              duplicateSlide(contextMenu.slideId);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[#F3F4F6] flex items-center gap-2"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicate Slide
          </button>
          <button
            type="button"
            onClick={() => {
              toggleHideSlide(contextMenu.slideId);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[#F3F4F6] flex items-center gap-2"
          >
            <Eye className="w-3.5 h-3.5" /> Toggle Hide Slide
          </button>
          <button
            type="button"
            onClick={() => {
              addSection('New Section');
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-[#F3F4F6] flex items-center gap-2"
          >
            <FolderPlus className="w-3.5 h-3.5" /> Add Section Here
          </button>
          <div className="my-1 border-t border-[#DADCE0]" />
          <button
            type="button"
            onClick={() => {
              deleteSlide(contextMenu.slideId);
              setContextMenu(null);
            }}
            disabled={activePresentation.slides.length <= 1}
            className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-600 disabled:opacity-40 flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Slide
          </button>
        </div>
      )}

      {/* Resize Handle */}
      <div
        onMouseDown={startResize}
        className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-[#C4512D]/40"
      />
    </aside>
  );
};

