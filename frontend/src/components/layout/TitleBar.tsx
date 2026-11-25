import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Cloud,
  CloudOff,
  Grid,
  Loader2,
  MessageSquare,
  Play,
  Redo2,
  Share2,
  Sparkles,
  Undo2,
  User,
} from 'lucide-react';
import { brandConfig } from '../../config/brand';
import { usePresentationStore } from '../../store/usePresentationStore';

export const TitleBar: React.FC = () => {
  const {
    activePresentation,
    user,
    syncStatus,
    past,
    future,
    rightPanelTab,
    renamePresentation,
    closePresentation,
    undo,
    redo,
    setRightPanelTab,
    startPresentation,
    setModal,
  } = usePresentationStore();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showAppSwitcher, setShowAppSwitcher] = useState(false);

  if (!activePresentation) return null;

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft.trim() !== activePresentation.title) {
      renamePresentation(activePresentation.id, titleDraft.trim());
    }
  };

  return (
    <header className="h-11 bg-white border-b border-[#DADCE0] px-3 flex items-center justify-between select-none shrink-0 z-30">
      {/* Left: App Switcher, Logo, Back to Dashboard, Title, Undo/Redo, Autosave */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAppSwitcher((v) => !v)}
            title="AkashaVyom Ecosystem"
            className="p-1.5 rounded hover:bg-[#F3F4F6] text-[#616161]"
          >
            <Grid className="w-4 h-4" />
          </button>
          {showAppSwitcher && (
            <div
              onMouseLeave={() => setShowAppSwitcher(false)}
              className="absolute left-0 top-9 w-64 bg-white border border-[#DADCE0] rounded-md shadow-lg p-2 z-50"
            >
              <div className="text-[11px] font-semibold text-[#616161] px-2 py-1">
                {brandConfig.companyName} Suite
              </div>
              {brandConfig.ecosystemApps.map((app) => (
                <a
                  key={app.id}
                  href={app.url}
                  onClick={(e) => {
                    if (app.url.startsWith('#')) {
                      e.preventDefault();
                      setShowAppSwitcher(false);
                    }
                  }}
                  className="flex items-center justify-between px-2 py-2 rounded hover:bg-[#F3F4F6] text-xs"
                >
                  <div>
                    <div className="font-semibold text-[#242424]">{app.name}</div>
                    <div className="text-[11px] text-[#616161]">{app.description}</div>
                  </div>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: app.accent }}
                  />
                </a>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={closePresentation}
          title="Back to Dashboard"
          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[#F3F4F6] text-[#242424]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#616161]" />
          <img src={brandConfig.logoPath} alt={brandConfig.productName} className="w-5 h-5 object-contain" />
          <span className="text-xs font-semibold text-[#C4512D]">{brandConfig.productName}</span>
        </button>

        <div className="h-4 w-px bg-[#DADCE0] mx-1" />

        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') setEditingTitle(false);
            }}
            className="text-sm font-medium px-2 py-0.5 border border-[#C4512D] rounded outline-none bg-white w-60"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTitleDraft(activePresentation.title);
              setEditingTitle(true);
            }}
            title="Rename presentation"
            className="text-sm font-medium text-[#242424] hover:bg-[#F3F4F6] px-2 py-0.5 rounded truncate max-w-[260px]"
          >
            {activePresentation.title}
          </button>
        )}

        <div className="flex items-center gap-0.5 ml-1">
          <button
            type="button"
            onClick={undo}
            disabled={past.length === 0}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded hover:bg-[#F3F4F6] disabled:opacity-35 text-[#242424]"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={future.length === 0}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded hover:bg-[#F3F4F6] disabled:opacity-35 text-[#242424]"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Autosave Status */}
        <div className="flex items-center gap-1 text-[11px] text-[#616161] ml-2">
          {syncStatus === 'saving' || syncStatus === 'synchronizing' ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C4512D]" />
              <span>{syncStatus === 'saving' ? 'Saving...' : 'Synchronizing...'}</span>
            </>
          ) : syncStatus === 'offline' ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Offline (Cached)</span>
            </>
          ) : syncStatus === 'sync_failed' ? (
            <span className="text-red-600">Sync failed</span>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <Check className="w-3 h-3 text-emerald-600 -ml-1" />
              <span>Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Comments, AI, Present, Share, Profile */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setRightPanelTab(rightPanelTab === 'comments' ? null : 'comments')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${
            rightPanelTab === 'comments'
              ? 'bg-[#FCECE6] border-[#C4512D] text-[#C4512D]'
              : 'border-[#DADCE0] text-[#242424] hover:bg-[#F3F4F6]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Comments</span>
          {activePresentation.comments.filter((c) => !c.resolved).length > 0 && (
            <span className="px-1 rounded bg-[#C4512D] text-white text-[10px]">
              {activePresentation.comments.filter((c) => !c.resolved).length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setRightPanelTab(rightPanelTab === 'ai' ? null : 'ai')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${
            rightPanelTab === 'ai'
              ? 'bg-[#FCECE6] border-[#C4512D] text-[#C4512D]'
              : 'border-[#DADCE0] text-[#242424] hover:bg-[#F3F4F6]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C4512D]" />
          <span>AI Assistant</span>
        </button>

        <button
          type="button"
          onClick={() => startPresentation(true, false)}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium border border-[#DADCE0] bg-white hover:bg-[#F3F4F6] text-[#242424]"
        >
          <Play className="w-3.5 h-3.5 text-[#C4512D]" />
          <span>Present</span>
        </button>

        <button
          type="button"
          onClick={() => setModal('share', true)}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-[#C4512D] hover:bg-[#A94222] text-white"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share</span>
        </button>

        <div
          title={`${user.name} (${user.email})`}
          className="w-7 h-7 rounded-full bg-[#FCECE6] border border-[#C4512D]/40 text-[#C4512D] flex items-center justify-center text-xs font-semibold ml-1"
        >
          {user.avatarInitials || <User className="w-3.5 h-3.5" />}
        </div>
      </div>
    </header>
  );
};

