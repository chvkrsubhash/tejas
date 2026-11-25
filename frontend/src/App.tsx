import React, { useEffect, useState } from 'react';
import { usePresentationStore } from './store/usePresentationStore';
import { Dashboard } from './components/dashboard/Dashboard';
import { LoginScreen } from './components/auth/LoginScreen';
import { TitleBar } from './components/layout/TitleBar';
import { Ribbon } from './components/ribbon/Ribbon';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { RightSidebar } from './components/layout/RightSidebar';
import { BottomPanel } from './components/layout/BottomPanel';
import { SlideCanvas } from './components/canvas/SlideCanvas';
import { SlideShowOverlay } from './components/slideshow/SlideShowOverlay';
import { OutlineView, SlideMasterView, SlideSorterView } from './components/views/WorkspaceViews';
import {
  AccessibilityModal,
  ExportModal,
  FindReplaceModal,
  PrintModal,
  RecordingModal,
  RevisionsModal,
  ShareModal,
  ShortcutsModal,
} from './components/modals/EditorModals';

export function App() {
  const store = usePresentationStore();
  const {
    activePresentation,
    activeSlideId,
    isAuthenticated,
    selectedObjectIds,
    editingObjectId,
    viewMode,
    isFullScreenEdit,
    isPresenting,
    initApp,
    saveNow,
    addSlide,
    undo,
    redo,
    copySelectedObjects,
    pasteObjects,
    cutSelectedObjects,
    duplicateSelectedObjects,
    deleteSelectedObjects,
    groupSelectedObjects,
    ungroupSelectedObjects,
    updateObject,
    selectObject,
    startPresentation,
    setFullScreenEdit,
  } = store;

  const [showAccessibility, setShowAccessibility] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const [rehearsalMode, setRehearsalMode] = useState(false);

  useEffect(() => {
    initApp();
  }, [initApp]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!activePresentation || isPresenting) return;
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          editingObjectId !== null);

      if (e.key === 'F5') {
        e.preventDefault();
        startPresentation(false, false);
        return;
      }

      if (e.key === 'Escape') {
        if (isFullScreenEdit) setFullScreenEdit(false);
        else selectObject(null);
        return;
      }

      if (isInput) return;

      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveNow();
      } else if (ctrl && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        addSlide('title_content');
      } else if (ctrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (ctrl && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (ctrl && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copySelectedObjects();
      } else if (ctrl && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        pasteObjects(false);
      } else if (ctrl && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        cutSelectedObjects();
      } else if (ctrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedObjects();
      } else if (ctrl && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        ungroupSelectedObjects();
      } else if (ctrl && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        groupSelectedObjects();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedObjectIds.length > 0) {
          e.preventDefault();
          deleteSelectedObjects();
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'].includes(e.key)) {
        if (selectedObjectIds.length === 0) {
          const idx = activePresentation.slides.findIndex((s) => s.id === activeSlideId);
          if (idx >= 0) {
            if (e.key === 'ArrowUp' || e.key === 'PageUp') {
              e.preventDefault();
              if (idx > 0) store.setActiveSlide(activePresentation.slides[idx - 1].id);
            } else if (e.key === 'ArrowDown' || e.key === 'PageDown') {
              e.preventDefault();
              if (idx < activePresentation.slides.length - 1) {
                store.setActiveSlide(activePresentation.slides[idx + 1].id);
              }
            }
          }
          return;
        }
        e.preventDefault();
        const step = e.shiftKey ? 10 : 2;
        const slide = activePresentation.slides.find((s) => s.id === activeSlideId);
        selectedObjectIds.forEach((oid) => {
          const obj = slide?.objects.find((o) => o.id === oid);
          if (!obj || obj.locked) return;
          if (e.key === 'ArrowUp') updateObject(oid, { y: obj.y - step }, false);
          if (e.key === 'ArrowDown') updateObject(oid, { y: obj.y + step }, false);
          if (e.key === 'ArrowLeft') updateObject(oid, { x: obj.x - step }, false);
          if (e.key === 'ArrowRight') updateObject(oid, { x: obj.x + step }, false);
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePresentation, activeSlideId, selectedObjectIds, editingObjectId, isPresenting, isFullScreenEdit]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (!activePresentation) {
    return <Dashboard />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F3F4F6] text-[#242424] overflow-hidden">
      {!isFullScreenEdit && <TitleBar />}
      {!isFullScreenEdit && (
        <Ribbon
          onOpenAccessibility={() => setShowAccessibility(true)}
          onOpenRevisions={() => setShowRevisions(true)}
          onOpenRecording={() => setShowRecording(true)}
          onOpenRehearse={() => {
            setRehearsalMode(true);
            startPresentation(false, false);
          }}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'normal' && !isFullScreenEdit && <LeftSidebar />}
        {viewMode === 'slide_sorter' ? (
          <SlideSorterView />
        ) : viewMode === 'outline' ? (
          <OutlineView />
        ) : viewMode === 'slide_master' ? (
          <SlideMasterView />
        ) : (
          <SlideCanvas />
        )}
        {!isFullScreenEdit && <RightSidebar />}
      </div>

      {!isFullScreenEdit && <BottomPanel />}

      {isPresenting && <SlideShowOverlay rehearsalMode={rehearsalMode} />}

      <ShortcutsModal />
      <ShareModal />
      <ExportModal />
      <PrintModal />
      <FindReplaceModal />
      <AccessibilityModal open={showAccessibility} onClose={() => setShowAccessibility(false)} />
      <RevisionsModal open={showRevisions} onClose={() => setShowRevisions(false)} />
      <RecordingModal open={showRecording} onClose={() => setShowRecording(false)} />
    </div>
  );
}

export default App;

