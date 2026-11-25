import React, { useRef, useState } from 'react';
import {
  Clock,
  Copy,
  FilePlus,
  Folder,
  FolderPlus,
  Home,
  LayoutGrid,
  List,
  MoreVertical,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Star,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { brandConfig } from '../../config/brand';
import { usePresentationStore } from '../../store/usePresentationStore';
import { TEMPLATES } from '../../data/templates';
import { SlideRenderer } from '../canvas/SlideRenderer';
import { importFromFile } from '../../services/importService';

type NavSection =
  | 'home'
  | 'my_presentations'
  | 'recent'
  | 'shared'
  | 'favorites'
  | 'templates'
  | 'trash'
  | 'settings';

export const Dashboard: React.FC = () => {
  const store = usePresentationStore();
  const {
    presentations,
    folders,
    user,
    aiConfig,
    createBlankPresentation,
    createFromTemplate,
    openPresentation,
    renamePresentation,
    duplicatePresentation,
    toggleFavorite,
    trashPresentation,
    restorePresentation,
    deletePresentationPermanently,
    moveToFolder,
    createFolder,
    importPresentationData,
    updateAIConfig,
  } = store;

  const [nav, setNav] = useState<NavSection>('home');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'updated' | 'name'>('updated');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importFromFile(file, user.id, user.name);
      await importPresentationData(res.presentation);
      if (res.warnings.length > 0) {
        alert(`Imported with notes:\n• ${res.warnings.join('\n• ')}`);
      }
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`);
    }
    e.target.value = '';
  };

  const filtered = presentations
    .filter((p) => {
      if (nav === 'trash') return p.isTrashed;
      if (p.isTrashed) return false;
      if (nav === 'favorites') return p.isFavorite;
      if (nav === 'shared') return p.permissions.length > 1 || p.ownerId !== user.id;
      if (selectedFolderId && nav === 'my_presentations') return p.folderId === selectedFolderId;
      return true;
    })
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortBy === 'name' ? a.title.localeCompare(b.title) : b.updatedAt.localeCompare(a.updatedAt)
    );

  const navItems: Array<{ id: NavSection; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'my_presentations', label: 'My Presentations', icon: <Folder className="w-4 h-4" /> },
    { id: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" /> },
    { id: 'shared', label: 'Shared With Me', icon: <Users className="w-4 h-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Star className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'trash', label: 'Trash', icon: <Trash2 className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="h-screen w-screen flex bg-[#F3F4F6] text-[#242424] overflow-hidden">
      <input
        ref={importRef}
        type="file"
        accept=".pptx,.json,.md,.txt"
        onChange={handleImport}
        className="hidden"
      />

      {/* Left Navigation */}
      <aside className="w-60 bg-white border-r border-[#DADCE0] flex flex-col justify-between shrink-0">
        <div>
          <div className="h-14 px-4 border-b border-[#DADCE0] flex items-center gap-2.5">
            <img src={brandConfig.logoPath} alt={brandConfig.productName} className="w-7 h-7 object-contain" />
            <div>
              <div className="text-sm font-bold text-[#242424] leading-tight">{brandConfig.productName}</div>
              <div className="text-[10px] text-[#616161]">{brandConfig.companyName}</div>
            </div>
          </div>

          <div className="p-3 space-y-1.5">
            <button
              type="button"
              onClick={() => createBlankPresentation()}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-[#C4512D] hover:bg-[#A94222] text-white text-xs font-semibold transition-colors"
            >
              <FilePlus className="w-4 h-4" />
              <span>Blank Presentation</span>
            </button>
            <button
              type="button"
              onClick={() => importRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded border border-[#DADCE0] hover:bg-[#F3F4F6] text-xs font-medium text-[#242424]"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import PPTX / JSON</span>
            </button>
          </div>

          <nav className="px-2 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setNav(item.id);
                  setSelectedFolderId(null);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                  nav === item.id
                    ? 'bg-[#FCECE6] text-[#C4512D]'
                    : 'text-[#616161] hover:bg-[#F3F4F6] hover:text-[#242424]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Folders */}
          <div className="mt-4 px-3">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#616161] mb-1">
              <span>FOLDERS</span>
              <button
                type="button"
                onClick={() => {
                  const name = prompt('Folder name:');
                  if (name?.trim()) createFolder(name);
                }}
                title="Create Folder"
                className="p-0.5 hover:text-[#C4512D]"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setNav('my_presentations');
                    setSelectedFolderId(f.id);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs ${
                    selectedFolderId === f.id ? 'bg-[#FCECE6] text-[#C4512D]' : 'text-[#616161] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span className="truncate">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-[#DADCE0] text-[11px] text-[#616161] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="font-medium text-[#242424] truncate">{user.name}</div>
            <div className="truncate">{user.email}</div>
          </div>
          <button
            type="button"
            onClick={() => store.logout()}
            className="px-2 py-1 border border-[#DADCE0] rounded hover:bg-[#F3F4F6] text-[#242424] shrink-0"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Search & Toolbar */}
        <header className="h-14 bg-white border-b border-[#DADCE0] px-6 flex items-center justify-between shrink-0">
          <div className="relative w-96">
            <Search className="w-4 h-4 text-[#616161] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search presentations..."
              className="w-full h-8 pl-9 pr-3 text-xs bg-[#F3F4F6] border border-transparent focus:border-[#C4512D] focus:bg-white rounded outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'updated' | 'name')}
              className="h-8 text-xs border border-[#DADCE0] rounded px-2 bg-white"
            >
              <option value="updated">Sort by Last Modified</option>
              <option value="name">Sort by Name</option>
            </select>
            <div className="flex border border-[#DADCE0] rounded overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 ${viewMode === 'grid' ? 'bg-[#FCECE6] text-[#C4512D]' : 'bg-white text-[#616161]'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 ${viewMode === 'list' ? 'bg-[#FCECE6] text-[#C4512D]' : 'bg-white text-[#616161]'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {nav === 'settings' ? (
            <div className="max-w-xl bg-white border border-[#DADCE0] rounded-md p-5 space-y-4">
              <h2 className="text-base font-semibold">Workspace & AI Provider Settings</h2>
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between">
                  <span className="font-medium">Enable AI Assistant</span>
                  <input
                    type="checkbox"
                    checked={aiConfig.enabled}
                    onChange={(e) => updateAIConfig({ enabled: e.target.checked })}
                    className="accent-[#C4512D]"
                  />
                </label>
                <div>
                  <label className="block font-medium mb-1">AI Provider</label>
                  <select
                    value={aiConfig.provider}
                    onChange={(e) => updateAIConfig({ provider: e.target.value as typeof aiConfig.provider })}
                    className="w-full h-8 border border-[#DADCE0] rounded px-2"
                  >
                    <option value="gemini">Google Gemini API</option>
                    <option value="groq">Groq API</option>
                    <option value="openrouter">OpenRouter Compatible API</option>
                    <option value="ollama">Ollama (Local)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Model Name</label>
                  <input
                    type="text"
                    value={aiConfig.model}
                    onChange={(e) => updateAIConfig({ model: e.target.value })}
                    className="w-full h-8 border border-[#DADCE0] rounded px-2"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">API Key (Stored locally / sent securely to backend)</label>
                  <input
                    type="password"
                    value={aiConfig.apiKey}
                    onChange={(e) => updateAIConfig({ apiKey: e.target.value })}
                    placeholder="Optional for local-only editing"
                    className="w-full h-8 border border-[#DADCE0] rounded px-2"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {(nav === 'home' || nav === 'templates') && (
                <section>
                  <h2 className="text-xs font-semibold text-[#616161] uppercase tracking-wider mb-3">
                    Professional Templates
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => createFromTemplate(tpl)}
                        className="text-left bg-white border border-[#DADCE0] hover:border-[#C4512D] rounded-md p-3 transition-colors group"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-semibold uppercase text-[#C4512D] bg-[#FCECE6] px-1.5 py-0.5 rounded">
                            {tpl.category}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-[#242424] group-hover:text-[#C4512D]">
                          {tpl.name}
                        </div>
                        <div className="text-xs text-[#616161] mt-1 line-clamp-2">{tpl.description}</div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {nav !== 'templates' && (
                <section>
                  <h2 className="text-xs font-semibold text-[#616161] uppercase tracking-wider mb-3">
                    {nav === 'trash'
                      ? 'Trash'
                      : nav === 'favorites'
                      ? 'Favorites'
                      : 'Presentations'} ({filtered.length})
                  </h2>

                  {filtered.length === 0 ? (
                    <div className="bg-white border border-[#DADCE0] rounded-md p-10 text-center text-xs text-[#616161]">
                      No presentations here yet. Create a blank presentation, pick a template, or import a PPTX file.
                    </div>
                  ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filtered.map((pres) => {
                        const firstSlide = pres.slides[0];
                        return (
                          <div
                            key={pres.id}
                            className="bg-white border border-[#DADCE0] hover:border-[#C4512D] rounded-md overflow-hidden flex flex-col relative"
                          >
                            <div
                              onClick={() => !pres.isTrashed && openPresentation(pres.id)}
                              className="aspect-video bg-[#F8FAFC] border-b border-[#DADCE0] overflow-hidden cursor-pointer flex items-center justify-center"
                            >
                              {firstSlide && (
                                <SlideRenderer
                                  slide={firstSlide}
                                  width={pres.width}
                                  height={pres.height}
                                  scale={260 / pres.width}
                                  master={pres.masters[0]}
                                />
                              )}
                            </div>
                            <div className="p-3 flex items-center justify-between gap-2">
                              <div
                                onClick={() => !pres.isTrashed && openPresentation(pres.id)}
                                className="min-w-0 cursor-pointer flex-1"
                              >
                                <div className="text-xs font-semibold text-[#242424] truncate">
                                  {pres.title}
                                </div>
                                <div className="text-[11px] text-[#616161]">
                                  {pres.slides.length} slides • {new Date(pres.updatedAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => toggleFavorite(pres.id)}
                                  className="p-1 rounded hover:bg-[#F3F4F6]"
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 ${
                                      pres.isFavorite ? 'fill-[#C4512D] text-[#C4512D]' : 'text-[#616161]'
                                    }`}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setMenuOpenId(menuOpenId === pres.id ? null : pres.id)}
                                  className="p-1 rounded hover:bg-[#F3F4F6]"
                                >
                                  <MoreVertical className="w-3.5 h-3.5 text-[#616161]" />
                                </button>
                              </div>
                            </div>

                            {menuOpenId === pres.id && (
                              <div className="absolute right-2 bottom-10 w-40 bg-white border border-[#DADCE0] rounded shadow-lg py-1 z-30 text-xs">
                                {!pres.isTrashed ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = prompt('Rename presentation:', pres.title);
                                        if (next) renamePresentation(pres.id, next);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-left hover:bg-[#F3F4F6]"
                                    >
                                      Rename
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        duplicatePresentation(pres.id);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-left hover:bg-[#F3F4F6] flex items-center gap-1.5"
                                    >
                                      <Copy className="w-3 h-3" /> Duplicate
                                    </button>
                                    {folders.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          moveToFolder(pres.id, folders[0].id);
                                          setMenuOpenId(null);
                                        }}
                                        className="w-full px-3 py-1.5 text-left hover:bg-[#F3F4F6]"
                                      >
                                        Move to {folders[0].name}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        trashPresentation(pres.id);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-600"
                                    >
                                      Move to Trash
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        restorePresentation(pres.id);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-left hover:bg-[#F3F4F6] flex items-center gap-1.5"
                                    >
                                      <RotateCcw className="w-3 h-3" /> Restore
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        deletePresentationPermanently(pres.id);
                                        setMenuOpenId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-600"
                                    >
                                      Delete Permanently
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-[#DADCE0] rounded-md divide-y divide-[#DADCE0]">
                      {filtered.map((pres) => (
                        <div
                          key={pres.id}
                          className="px-4 py-2.5 flex items-center justify-between hover:bg-[#F9FAFB] text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => !pres.isTrashed && openPresentation(pres.id)}
                            className="font-medium text-[#242424] hover:text-[#C4512D] text-left flex-1"
                          >
                            {pres.title}
                          </button>
                          <div className="flex items-center gap-6 text-[#616161]">
                            <span>{pres.slides.length} slides</span>
                            <span>{new Date(pres.updatedAt).toLocaleDateString()}</span>
                            <button type="button" onClick={() => toggleFavorite(pres.id)}>
                              <Star className={`w-3.5 h-3.5 ${pres.isFavorite ? 'fill-[#C4512D] text-[#C4512D]' : ''}`} />
                            </button>
                            <button type="button" onClick={() => trashPresentation(pres.id)} className="text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

