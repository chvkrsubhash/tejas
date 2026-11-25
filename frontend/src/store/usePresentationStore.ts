import { create } from 'zustand';
import {
  AIConfig,
  AspectRatioPreset,
  CommentThread,
  Folder,
  PermissionRole,
  Presentation,
  RibbonTab,
  RightPanelTab,
  Slide,
  SlideAnimation,
  SlideLayoutType,
  SlideMaster,
  SlideObject,
  SlideTransition,
  SyncStatus,
  WorkspaceViewMode,
} from '../types/presentation';
import { buildLayoutObjects, createSlide, uid } from '../data/layouts';
import { createDefaultMaster, getThemeById } from '../data/themes';
import { instantiateTemplate, TemplateItem } from '../data/templates';
import {
  DEFAULT_AI_CONFIG,
  idbDeletePresentation,
  idbGetFolders,
  idbGetPresentation,
  idbGetPresentations,
  idbGetSetting,
  idbQueueSync,
  idbSaveFolder,
  idbSavePresentation,
  idbSaveSetting,
} from '../services/idbStorage';

const MAX_HISTORY = 50;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
}

interface HistorySnapshot {
  slides: Slide[];
  masters: SlideMaster[];
  themeId: string;
  activeSlideId: string;
}

interface PresentationState {
  // User & Auth
  user: UserProfile;
  isAuthenticated: boolean;
  authToken: string | null;
  // Dashboard
  presentations: Presentation[];
  folders: Folder[];
  activePresentation: Presentation | null;
  // Editor selection & UI
  activeSlideId: string;
  selectedSlideIds: string[];
  selectedObjectIds: string[];
  editingObjectId: string | null;
  activeRibbonTab: RibbonTab;
  rightPanelTab: RightPanelTab;
  viewMode: WorkspaceViewMode;
  zoom: number;
  showRulers: boolean;
  showGrid: boolean;
  showGuides: boolean;
  snapToGrid: boolean;
  snapToObjects: boolean;
  isFullScreenEdit: boolean;
  isPresenting: boolean;
  isPresenterView: boolean;
  presentFromSlideIndex: number;
  syncStatus: SyncStatus;
  clipboardObjects: SlideObject[];
  formatPainterStyle: Partial<SlideObject> | null;
  // Undo / Redo
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  // AI Config
  aiConfig: AIConfig;
  // Modals
  showShortcutsModal: boolean;
  showShareModal: boolean;
  showExportModal: boolean;
  showPrintModal: boolean;
  showFindReplaceModal: boolean;

  // Actions - Lifecycle & Auth
  initApp: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  registerWithCredentials: (name: string, email: string, password: string) => Promise<void>;
  continueOffline: () => Promise<void>;
  logout: () => Promise<void>;
  createBlankPresentation: (title?: string, themeId?: string) => Promise<Presentation>;
  createFromTemplate: (template: TemplateItem) => Promise<Presentation>;
  importPresentationData: (pres: Presentation) => Promise<void>;
  openPresentation: (id: string) => Promise<void>;
  closePresentation: () => void;
  renamePresentation: (id: string, title: string) => Promise<void>;
  duplicatePresentation: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  trashPresentation: (id: string) => Promise<void>;
  restorePresentation: (id: string) => Promise<void>;
  deletePresentationPermanently: (id: string) => Promise<void>;
  moveToFolder: (id: string, folderId: string | null) => Promise<void>;
  createFolder: (name: string) => Promise<void>;

  // Actions - Slides
  setActiveSlide: (slideId: string, multi?: boolean) => void;
  addSlide: (layout?: SlideLayoutType, insertAfterCurrent?: boolean) => void;
  duplicateSlide: (slideId?: string) => void;
  deleteSlide: (slideId?: string) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
  toggleHideSlide: (slideId: string) => void;
  changeSlideLayout: (slideId: string, layout: SlideLayoutType) => void;
  resetSlideLayout: (slideId: string) => void;
  updateSlide: (slideId: string, patch: Partial<Slide>) => void;
  addSection: (title: string) => void;
  applyTheme: (themeId: string) => void;
  setSlideDimensions: (preset: AspectRatioPreset, width: number, height: number) => void;

  // Actions - Slide Master
  updateMaster: (masterId: string, patch: Partial<SlideMaster>) => void;

  // Actions - Objects
  selectObject: (objectId: string | null, multi?: boolean) => void;
  selectAllObjects: () => void;
  setEditingObject: (objectId: string | null) => void;
  addObject: (obj: Omit<SlideObject, 'id' | 'slideId' | 'zIndex'>) => SlideObject;
  updateObject: (objectId: string, patch: Partial<SlideObject>, recordHistory?: boolean) => void;
  deleteSelectedObjects: () => void;
  duplicateSelectedObjects: () => void;
  copySelectedObjects: () => void;
  cutSelectedObjects: () => void;
  pasteObjects: (plainTextOnly?: boolean) => void;
  captureFormatPainter: () => void;
  applyFormatPainter: (targetObjectId: string) => void;
  bringToFront: (objectId: string) => void;
  sendToBack: (objectId: string) => void;
  bringForward: (objectId: string) => void;
  sendBackward: (objectId: string) => void;
  alignSelectedObjects: (align: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeSelectedObjects: (axis: 'horizontal' | 'vertical') => void;
  groupSelectedObjects: () => void;
  ungroupSelectedObjects: () => void;
  toggleLockObject: (objectId: string) => void;

  // Actions - Animations & Transitions
  addAnimation: (slideId: string, anim: Omit<SlideAnimation, 'id' | 'order'>) => void;
  updateAnimation: (slideId: string, animId: string, patch: Partial<SlideAnimation>) => void;
  removeAnimation: (slideId: string, animId: string) => void;
  reorderAnimations: (slideId: string, fromIndex: number, toIndex: number) => void;
  applyTransitionToAll: (transition: SlideTransition) => void;

  // Actions - Comments, Revisions, Sharing
  addComment: (slideId: string, text: string, objectId?: string) => void;
  replyToComment: (commentId: string, text: string) => void;
  toggleResolveComment: (commentId: string) => void;
  createRevision: (label: string) => void;
  restoreRevision: (revisionId: string) => void;
  addPermission: (email: string, name: string, role: PermissionRole) => void;
  updatePermission: (permId: string, role: PermissionRole) => void;
  removePermission: (permId: string) => void;
  setShareLink: (enabled: boolean, role: PermissionRole) => void;

  // Actions - History & UI
  undo: () => void;
  redo: () => void;
  setRibbonTab: (tab: RibbonTab) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setViewMode: (mode: WorkspaceViewMode) => void;
  setZoom: (zoom: number) => void;
  toggleRulers: () => void;
  toggleGrid: () => void;
  toggleGuides: () => void;
  toggleSnapToGrid: () => void;
  toggleSnapToObjects: () => void;
  setFullScreenEdit: (v: boolean) => void;
  startPresentation: (fromCurrent?: boolean, presenterView?: boolean) => void;
  stopPresentation: () => void;
  updateAIConfig: (patch: Partial<AIConfig>) => Promise<void>;
  setModal: (modal: 'shortcuts' | 'share' | 'export' | 'print' | 'findReplace', open: boolean) => void;
  saveNow: () => Promise<void>;
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

function cloneSlides(slides: Slide[]): Slide[] {
  return JSON.parse(JSON.stringify(slides));
}

function pushHistory(state: PresentationState): Partial<PresentationState> {
  if (!state.activePresentation) return {};
  const snap: HistorySnapshot = {
    slides: cloneSlides(state.activePresentation.slides),
    masters: JSON.parse(JSON.stringify(state.activePresentation.masters)),
    themeId: state.activePresentation.themeId,
    activeSlideId: state.activeSlideId,
  };
  const past = [...state.past.slice(-(MAX_HISTORY - 1)), snap];
  return { past, future: [] };
}

function scheduleAutosave(get: () => PresentationState, set: (p: Partial<PresentationState>) => void) {
  set({ syncStatus: 'saving' });
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(async () => {
    const pres = get().activePresentation;
    if (!pres) return;
    try {
      const updated = { ...pres, updatedAt: new Date().toISOString() };
      await idbSavePresentation(updated);
      await idbQueueSync(updated.id);
      set({
        syncStatus: navigator.onLine ? 'saved' : 'offline',
        presentations: get().presentations.map((p) => (p.id === updated.id ? updated : p)),
      });
    } catch {
      set({ syncStatus: 'sync_failed' });
    }
  }, 450);
}

export const usePresentationStore = create<PresentationState>((set, get) => ({
  user: {
    id: 'user-local-1',
    name: 'AkashaVyom User',
    email: 'user@akashavyom.local',
    avatarInitials: 'AU',
  },
  isAuthenticated: false,
  authToken: null,
  presentations: [],
  folders: [],
  activePresentation: null,
  activeSlideId: '',
  selectedSlideIds: [],
  selectedObjectIds: [],
  editingObjectId: null,
  activeRibbonTab: 'Home',
  rightPanelTab: null,
  viewMode: 'normal',
  zoom: 0.72,
  showRulers: false,
  showGrid: false,
  showGuides: true,
  snapToGrid: false,
  snapToObjects: true,
  isFullScreenEdit: false,
  isPresenting: false,
  isPresenterView: false,
  presentFromSlideIndex: 0,
  syncStatus: 'saved',
  clipboardObjects: [],
  formatPainterStyle: null,
  past: [],
  future: [],
  aiConfig: DEFAULT_AI_CONFIG,
  showShortcutsModal: false,
  showShareModal: false,
  showExportModal: false,
  showPrintModal: false,
  showFindReplaceModal: false,

  initApp: async () => {
    const [presentations, folders, aiConfig, authSession] = await Promise.all([
      idbGetPresentations(),
      idbGetFolders(),
      idbGetSetting<AIConfig>('aiConfig', DEFAULT_AI_CONFIG),
      idbGetSetting<{ token: string | null; user: UserProfile; isAuthenticated: boolean } | null>(
        'authSession',
        null
      ),
    ]);
    set({
      presentations,
      folders,
      aiConfig,
      ...(authSession
        ? {
            isAuthenticated: authSession.isAuthenticated,
            authToken: authSession.token,
            user: authSession.user,
          }
        : {}),
    });
  },

  loginWithCredentials: async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      if (res.ok) {
        const data = await res.json();
        const initials = (data.user.name || 'AU')
          .split(' ')
          .map((s: string) => s[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        const user: UserProfile = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatarInitials: initials,
        };
        await idbSaveSetting('authSession', { token: data.access_token, user, isAuthenticated: true });
        set({ isAuthenticated: true, authToken: data.access_token, user });
        return;
      }
      if (res.status === 401 || res.status === 422) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Invalid email or password.');
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Invalid email or password.') throw err;
    }

    // Local IndexedDB account fallback when FastAPI backend is not running
    const localUsers = await idbGetSetting<Array<{ id: string; name: string; email: string; passHash: string }>>(
      'localUsers',
      []
    );
    const enc = new TextEncoder().encode(password + cleanEmail);
    const hashBuf = await crypto.subtle.digest('SHA-256', enc);
    const passHash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const found = localUsers.find((u) => u.email === cleanEmail && u.passHash === passHash);
    if (!found) {
      throw new Error('Invalid credentials or no local account found. Create an account or Continue Offline.');
    }
    const initials = found.name
      .split(' ')
      .map((s) => s[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const user: UserProfile = { id: found.id, name: found.name, email: found.email, avatarInitials: initials };
    await idbSaveSetting('authSession', { token: null, user, isAuthenticated: true });
    set({ isAuthenticated: true, authToken: null, user });
  },

  registerWithCredentials: async (name, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
      });
      if (res.ok) {
        const data = await res.json();
        const initials = cleanName
          .split(' ')
          .map((s: string) => s[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);
        const user: UserProfile = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatarInitials: initials,
        };
        await idbSaveSetting('authSession', { token: data.access_token, user, isAuthenticated: true });
        set({ isAuthenticated: true, authToken: data.access_token, user });
        return;
      }
      if (res.status === 409 || res.status === 422) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Email already registered.');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('already registered')) throw err;
    }

    // Local IndexedDB account creation when FastAPI backend is not running
    const localUsers = await idbGetSetting<Array<{ id: string; name: string; email: string; passHash: string }>>(
      'localUsers',
      []
    );
    if (localUsers.some((u) => u.email === cleanEmail)) {
      throw new Error('An account with this email already exists locally. Please Sign In.');
    }
    const enc = new TextEncoder().encode(password + cleanEmail);
    const hashBuf = await crypto.subtle.digest('SHA-256', enc);
    const passHash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const newUser = { id: uid('usr'), name: cleanName, email: cleanEmail, passHash };
    await idbSaveSetting('localUsers', [...localUsers, newUser]);

    const initials = cleanName
      .split(' ')
      .map((s) => s[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const user: UserProfile = { id: newUser.id, name: newUser.name, email: newUser.email, avatarInitials: initials };
    await idbSaveSetting('authSession', { token: null, user, isAuthenticated: true });
    set({ isAuthenticated: true, authToken: null, user });
  },

  continueOffline: async () => {
    const user = get().user;
    await idbSaveSetting('authSession', { token: null, user, isAuthenticated: true });
    set({ isAuthenticated: true, authToken: null });
  },

  logout: async () => {
    await idbSaveSetting('authSession', null);
    set({ isAuthenticated: false, authToken: null, activePresentation: null });
  },

  createBlankPresentation: async (title = 'Untitled Presentation', themeId = 'corporate') => {
    const { user, presentations } = get();
    const theme = getThemeById(themeId);
    const now = new Date().toISOString();
    const firstSlide = createSlide(0, 'title', theme, 1280, 720, 'Title Slide');
    const pres: Presentation = {
      id: uid('pres'),
      title,
      ownerId: user.id,
      ownerName: user.name,
      folderId: null,
      aspectRatio: '16:9',
      width: 1280,
      height: 720,
      themeId: theme.id,
      masters: [createDefaultMaster(theme)],
      slides: [firstSlide],
      sections: [],
      comments: [],
      permissions: [{ id: uid('perm'), email: user.email, name: user.name, role: 'owner', addedAt: now }],
      revisions: [],
      shareLinkEnabled: false,
      shareLinkRole: 'viewer',
      isFavorite: false,
      isTrashed: false,
      createdAt: now,
      updatedAt: now,
    };
    await idbSavePresentation(pres);
    set({
      presentations: [pres, ...presentations],
      activePresentation: pres,
      activeSlideId: firstSlide.id,
      selectedSlideIds: [firstSlide.id],
      selectedObjectIds: [],
      past: [],
      future: [],
      syncStatus: 'saved',
    });
    return pres;
  },

  createFromTemplate: async (template) => {
    const { user, presentations } = get();
    const pres = instantiateTemplate(template, user.id, user.name);
    await idbSavePresentation(pres);
    set({
      presentations: [pres, ...presentations],
      activePresentation: pres,
      activeSlideId: pres.slides[0]?.id || '',
      selectedSlideIds: pres.slides[0] ? [pres.slides[0].id] : [],
      selectedObjectIds: [],
      past: [],
      future: [],
      syncStatus: 'saved',
    });
    return pres;
  },

  importPresentationData: async (pres) => {
    const { presentations } = get();
    await idbSavePresentation(pres);
    set({
      presentations: [pres, ...presentations.filter((p) => p.id !== pres.id)],
      activePresentation: pres,
      activeSlideId: pres.slides[0]?.id || '',
      selectedSlideIds: pres.slides[0] ? [pres.slides[0].id] : [],
      selectedObjectIds: [],
      past: [],
      future: [],
    });
  },

  openPresentation: async (id) => {
    const pres = await idbGetPresentation(id);
    if (!pres) return;
    set({
      activePresentation: pres,
      activeSlideId: pres.slides[0]?.id || '',
      selectedSlideIds: pres.slides[0] ? [pres.slides[0].id] : [],
      selectedObjectIds: [],
      editingObjectId: null,
      past: [],
      future: [],
      viewMode: 'normal',
    });
  },

  closePresentation: () => {
    set({
      activePresentation: null,
      activeSlideId: '',
      selectedSlideIds: [],
      selectedObjectIds: [],
      editingObjectId: null,
      past: [],
      future: [],
    });
  },

  renamePresentation: async (id, title) => {
    const clean = title.trim() || 'Untitled Presentation';
    const { presentations, activePresentation } = get();
    const updatedList = presentations.map((p) =>
      p.id === id ? { ...p, title: clean, updatedAt: new Date().toISOString() } : p
    );
    const target = updatedList.find((p) => p.id === id);
    if (target) await idbSavePresentation(target);
    set({
      presentations: updatedList,
      activePresentation:
        activePresentation?.id === id ? { ...activePresentation, title: clean } : activePresentation,
    });
  },

  duplicatePresentation: async (id) => {
    const orig = await idbGetPresentation(id);
    if (!orig) return;
    const now = new Date().toISOString();
    const copy: Presentation = {
      ...JSON.parse(JSON.stringify(orig)),
      id: uid('pres'),
      title: `${orig.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    await idbSavePresentation(copy);
    set({ presentations: [copy, ...get().presentations] });
  },

  toggleFavorite: async (id) => {
    const updated = get().presentations.map((p) =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    const item = updated.find((p) => p.id === id);
    if (item) await idbSavePresentation(item);
    set({ presentations: updated });
  },

  trashPresentation: async (id) => {
    const updated = get().presentations.map((p) =>
      p.id === id ? { ...p, isTrashed: true, updatedAt: new Date().toISOString() } : p
    );
    const item = updated.find((p) => p.id === id);
    if (item) await idbSavePresentation(item);
    set({ presentations: updated });
  },

  restorePresentation: async (id) => {
    const updated = get().presentations.map((p) =>
      p.id === id ? { ...p, isTrashed: false, updatedAt: new Date().toISOString() } : p
    );
    const item = updated.find((p) => p.id === id);
    if (item) await idbSavePresentation(item);
    set({ presentations: updated });
  },

  deletePresentationPermanently: async (id) => {
    await idbDeletePresentation(id);
    set({ presentations: get().presentations.filter((p) => p.id !== id) });
  },

  moveToFolder: async (id, folderId) => {
    const updated = get().presentations.map((p) =>
      p.id === id ? { ...p, folderId, updatedAt: new Date().toISOString() } : p
    );
    const item = updated.find((p) => p.id === id);
    if (item) await idbSavePresentation(item);
    set({ presentations: updated });
  },

  createFolder: async (name) => {
    const folder: Folder = { id: uid('fld'), name: name.trim(), createdAt: new Date().toISOString() };
    await idbSaveFolder(folder);
    set({ folders: [...get().folders, folder] });
  },

  setActiveSlide: (slideId, multi = false) => {
    if (multi) {
      const curr = get().selectedSlideIds;
      const exists = curr.includes(slideId);
      const next = exists && curr.length > 1 ? curr.filter((id) => id !== slideId) : [...curr, slideId];
      set({ activeSlideId: slideId, selectedSlideIds: next, selectedObjectIds: [], editingObjectId: null });
    } else {
      set({ activeSlideId: slideId, selectedSlideIds: [slideId], selectedObjectIds: [], editingObjectId: null });
    }
  },

  addSlide: (layout = 'title_content', insertAfterCurrent = true) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const hist = pushHistory(state);
    const theme = getThemeById(pres.themeId);
    const idx = pres.slides.findIndex((s) => s.id === state.activeSlideId);
    const insertAt = insertAfterCurrent && idx >= 0 ? idx + 1 : pres.slides.length;
    const newSlide = createSlide(insertAt, layout, theme, pres.width, pres.height);
    const slides = [...pres.slides];
    slides.splice(insertAt, 0, newSlide);
    slides.forEach((s, i) => {
      s.order = i;
    });
    set({
      ...hist,
      activePresentation: { ...pres, slides },
      activeSlideId: newSlide.id,
      selectedSlideIds: [newSlide.id],
      selectedObjectIds: [],
      editingObjectId: null,
    });
    scheduleAutosave(get, set);
  },

  duplicateSlide: (slideId) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const targetId = slideId || state.activeSlideId;
    const idx = pres.slides.findIndex((s) => s.id === targetId);
    if (idx < 0) return;
    const hist = pushHistory(state);
    const orig = pres.slides[idx];
    const newSlideId = uid('slide');
    const cloned: Slide = {
      ...JSON.parse(JSON.stringify(orig)),
      id: newSlideId,
      title: `${orig.title} (Copy)`,
    };
    cloned.objects = cloned.objects.map((o) => ({ ...o, id: uid('obj'), slideId: newSlideId }));
    const slides = [...pres.slides];
    slides.splice(idx + 1, 0, cloned);
    slides.forEach((s, i) => (s.order = i));
    set({
      ...hist,
      activePresentation: { ...pres, slides },
      activeSlideId: newSlideId,
      selectedSlideIds: [newSlideId],
      selectedObjectIds: [],
    });
    scheduleAutosave(get, set);
  },

  deleteSlide: (slideId) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres || pres.slides.length <= 1) return;
    const idsToRemove = slideId
      ? [slideId]
      : state.selectedSlideIds.length > 0
      ? state.selectedSlideIds
      : [state.activeSlideId];
    if (pres.slides.length - idsToRemove.length < 1) return;
    const hist = pushHistory(state);
    const slides = pres.slides.filter((s) => !idsToRemove.includes(s.id));
    slides.forEach((s, i) => (s.order = i));
    const nextActive = slides[0].id;
    set({
      ...hist,
      activePresentation: { ...pres, slides },
      activeSlideId: nextActive,
      selectedSlideIds: [nextActive],
      selectedObjectIds: [],
    });
    scheduleAutosave(get, set);
  },

  reorderSlides: (fromIndex, toIndex) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres || fromIndex === toIndex) return;
    const hist = pushHistory(state);
    const slides = [...pres.slides];
    const [moved] = slides.splice(fromIndex, 1);
    slides.splice(toIndex, 0, moved);
    slides.forEach((s, i) => (s.order = i));
    set({ ...hist, activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  toggleHideSlide: (slideId) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const hist = pushHistory(state);
    const slides = pres.slides.map((s) => (s.id === slideId ? { ...s, hidden: !s.hidden } : s));
    set({ ...hist, activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  changeSlideLayout: (slideId, layout) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const hist = pushHistory(state);
    const theme = getThemeById(pres.themeId);
    const slides = pres.slides.map((s) =>
      s.id === slideId
        ? { ...s, layout, objects: buildLayoutObjects(slideId, layout, theme, pres.width, pres.height) }
        : s
    );
    set({ ...hist, activePresentation: { ...pres, slides }, selectedObjectIds: [] });
    scheduleAutosave(get, set);
  },

  resetSlideLayout: (slideId) => {
    const state = get();
    const pres = state.activePresentation;
    const slide = pres?.slides.find((s) => s.id === slideId);
    if (!pres || !slide) return;
    get().changeSlideLayout(slideId, slide.layout);
  },

  updateSlide: (slideId, patch) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const hist = pushHistory(state);
    const slides = pres.slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s));
    set({ ...hist, activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  addSection: (title) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const secId = uid('sec');
    const sections = [...pres.sections, { id: secId, title: title.trim() || 'New Section', collapsed: false }];
    const slides = pres.slides.map((s) => (s.id === state.activeSlideId ? { ...s, sectionId: secId } : s));
    set({ activePresentation: { ...pres, sections, slides } });
    scheduleAutosave(get, set);
  },

  applyTheme: (themeId) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const hist = pushHistory(state);
    const theme = getThemeById(themeId);
    const slides = pres.slides.map((s) => ({
      ...s,
      background: { type: 'solid' as const, color: theme.backgroundColor },
      objects: s.objects.map((obj) => {
        if (obj.type === 'text' && obj.textData) {
          const isTitle = obj.placeholderRole === 'title';
          return {
            ...obj,
            textData: {
              ...obj.textData,
              style: {
                ...obj.textData.style,
                fontFamily: isTitle ? theme.headingFont : theme.bodyFont,
                color: isTitle ? theme.primaryColor : theme.textColor,
              },
            },
          };
        }
        return obj;
      }),
    }));
    set({
      ...hist,
      activePresentation: {
        ...pres,
        themeId,
        masters: [createDefaultMaster(theme)],
        slides,
      },
    });
    scheduleAutosave(get, set);
  },

  setSlideDimensions: (aspectRatio, width, height) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const hist = pushHistory(state);
    set({ ...hist, activePresentation: { ...pres, aspectRatio, width, height } });
    scheduleAutosave(get, set);
  },

  updateMaster: (masterId, patch) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const hist = pushHistory(state);
    const masters = pres.masters.map((m) => (m.id === masterId ? { ...m, ...patch } : m));
    // Propagate background & font updates to slides
    const updatedMaster = masters.find((m) => m.id === masterId);
    const slides = updatedMaster
      ? pres.slides.map((s) => ({
          ...s,
          background: patch.background ? patch.background : s.background,
        }))
      : pres.slides;
    set({ ...hist, activePresentation: { ...pres, masters, slides } });
    scheduleAutosave(get, set);
  },

  selectObject: (objectId, multi = false) => {
    if (!objectId) {
      set({ selectedObjectIds: [], editingObjectId: null });
      return;
    }
    const pres = get().activePresentation;
    const slide = pres?.slides.find((s) => s.id === get().activeSlideId);
    const target = slide?.objects.find((o) => o.id === objectId);
    const groupIds = target?.groupId
      ? slide!.objects.filter((o) => o.groupId === target.groupId).map((o) => o.id)
      : [objectId];

    if (multi) {
      const curr = get().selectedObjectIds;
      const exists = curr.includes(objectId);
      const next = exists
        ? curr.filter((id) => !groupIds.includes(id))
        : Array.from(new Set([...curr, ...groupIds]));
      set({ selectedObjectIds: next, editingObjectId: null });
    } else {
      set({ selectedObjectIds: groupIds, editingObjectId: null });
    }
  },

  selectAllObjects: () => {
    const pres = get().activePresentation;
    const slide = pres?.slides.find((s) => s.id === get().activeSlideId);
    if (!slide) return;
    set({ selectedObjectIds: slide.objects.map((o) => o.id) });
  },

  setEditingObject: (objectId) => set({ editingObjectId: objectId }),

  addObject: (objInput) => {
    const state = get();
    const pres = state.activePresentation;
    const slide = pres?.slides.find((s) => s.id === state.activeSlideId);
    if (!pres || !slide) throw new Error('No active slide');
    const hist = pushHistory(state);
    const maxZ = slide.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
    const newObj: SlideObject = {
      ...objInput,
      id: uid('obj'),
      slideId: slide.id,
      zIndex: maxZ + 1,
    };
    const slides = pres.slides.map((s) =>
      s.id === slide.id ? { ...s, objects: [...s.objects, newObj] } : s
    );
    set({
      ...hist,
      activePresentation: { ...pres, slides },
      selectedObjectIds: [newObj.id],
    });
    scheduleAutosave(get, set);
    return newObj;
  },

  updateObject: (objectId, patch, recordHistory = true) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const hist = recordHistory ? pushHistory(state) : {};
    const slides = pres.slides.map((s) =>
      s.id === state.activeSlideId
        ? {
            ...s,
            objects: s.objects.map((o) => (o.id === objectId ? { ...o, ...patch } : o)),
          }
        : s
    );
    set({ ...hist, activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  deleteSelectedObjects: () => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres || state.selectedObjectIds.length === 0) return;
    const hist = pushHistory(state);
    const slides = pres.slides.map((s) =>
      s.id === state.activeSlideId
        ? {
            ...s,
            objects: s.objects.filter((o) => !state.selectedObjectIds.includes(o.id) || o.locked),
          }
        : s
    );
    set({
      ...hist,
      activePresentation: { ...pres, slides },
      selectedObjectIds: [],
      editingObjectId: null,
    });
    scheduleAutosave(get, set);
  },

  duplicateSelectedObjects: () => {
    const state = get();
    const pres = state.activePresentation;
    const slide = pres?.slides.find((s) => s.id === state.activeSlideId);
    if (!pres || !slide || state.selectedObjectIds.length === 0) return;
    const hist = pushHistory(state);
    let maxZ = slide.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
    const clones: SlideObject[] = slide.objects
      .filter((o) => state.selectedObjectIds.includes(o.id))
      .map((o) => ({
        ...JSON.parse(JSON.stringify(o)),
        id: uid('obj'),
        x: o.x + 24,
        y: o.y + 24,
        zIndex: ++maxZ,
        locked: false,
      }));
    const slides = pres.slides.map((s) =>
      s.id === slide.id ? { ...s, objects: [...s.objects, ...clones] } : s
    );
    set({
      ...hist,
      activePresentation: { ...pres, slides },
      selectedObjectIds: clones.map((c) => c.id),
    });
    scheduleAutosave(get, set);
  },

  copySelectedObjects: () => {
    const state = get();
    const slide = state.activePresentation?.slides.find((s) => s.id === state.activeSlideId);
    if (!slide) return;
    const selected = slide.objects.filter((o) => state.selectedObjectIds.includes(o.id));
    if (selected.length > 0) {
      set({ clipboardObjects: JSON.parse(JSON.stringify(selected)) });
    }
  },

  cutSelectedObjects: () => {
    get().copySelectedObjects();
    get().deleteSelectedObjects();
  },

  pasteObjects: (plainTextOnly = false) => {
    const state = get();
    const pres = state.activePresentation;
    const slide = pres?.slides.find((s) => s.id === state.activeSlideId);
    if (!pres || !slide || state.clipboardObjects.length === 0) return;
    const hist = pushHistory(state);
    let maxZ = slide.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
    const pasted: SlideObject[] = state.clipboardObjects.map((o) => {
      const clone: SlideObject = {
        ...JSON.parse(JSON.stringify(o)),
        id: uid('obj'),
        slideId: slide.id,
        x: o.x + 28,
        y: o.y + 28,
        zIndex: ++maxZ,
        locked: false,
      };
      if (plainTextOnly && clone.textData) {
        clone.textData.style = {
          ...clone.textData.style,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          color: '#242424',
          highlightColor: undefined,
        };
      }
      return clone;
    });
    const slides = pres.slides.map((s) =>
      s.id === slide.id ? { ...s, objects: [...s.objects, ...pasted] } : s
    );
    set({
      ...hist,
      activePresentation: { ...pres, slides },
      selectedObjectIds: pasted.map((p) => p.id),
    });
    scheduleAutosave(get, set);
  },

  captureFormatPainter: () => {
    const state = get();
    const slide = state.activePresentation?.slides.find((s) => s.id === state.activeSlideId);
    const obj = slide?.objects.find((o) => o.id === state.selectedObjectIds[0]);
    if (!obj) return;
    set({
      formatPainterStyle: {
        opacity: obj.opacity,
        shadow: obj.shadow,
        textData: obj.textData ? { ...obj.textData, text: '' } : undefined,
        shapeData: obj.shapeData ? { ...obj.shapeData } : undefined,
      },
    });
  },

  applyFormatPainter: (targetObjectId) => {
    const state = get();
    if (!state.formatPainterStyle) return;
    const slide = state.activePresentation?.slides.find((s) => s.id === state.activeSlideId);
    const target = slide?.objects.find((o) => o.id === targetObjectId);
    if (!target) return;
    const patch: Partial<SlideObject> = {
      opacity: state.formatPainterStyle.opacity ?? target.opacity,
      shadow: state.formatPainterStyle.shadow ?? target.shadow,
    };
    if (target.textData && state.formatPainterStyle.textData) {
      patch.textData = {
        ...target.textData,
        style: { ...state.formatPainterStyle.textData.style },
      };
    }
    if (target.shapeData && state.formatPainterStyle.shapeData) {
      patch.shapeData = {
        ...target.shapeData,
        fill: state.formatPainterStyle.shapeData.fill,
        stroke: state.formatPainterStyle.shapeData.stroke,
        strokeWidth: state.formatPainterStyle.shapeData.strokeWidth,
      };
    }
    get().updateObject(targetObjectId, patch);
    set({ formatPainterStyle: null });
  },

  bringToFront: (objectId) => {
    const state = get();
    const slide = state.activePresentation?.slides.find((s) => s.id === state.activeSlideId);
    if (!slide) return;
    const maxZ = slide.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
    get().updateObject(objectId, { zIndex: maxZ + 1 });
  },

  sendToBack: (objectId) => {
    const state = get();
    const slide = state.activePresentation?.slides.find((s) => s.id === state.activeSlideId);
    if (!slide) return;
    const minZ = slide.objects.reduce((m, o) => Math.min(m, o.zIndex), 1);
    get().updateObject(objectId, { zIndex: Math.max(0, minZ - 1) });
  },

  bringForward: (objectId) => {
    const state = get();
    const slide = state.activePresentation?.slides.find((s) => s.id === state.activeSlideId);
    const obj = slide?.objects.find((o) => o.id === objectId);
    if (obj) get().updateObject(objectId, { zIndex: obj.zIndex + 1 });
  },

  sendBackward: (objectId) => {
    const state = get();
    const slide = state.activePresentation?.slides.find((s) => s.id === state.activeSlideId);
    const obj = slide?.objects.find((o) => o.id === objectId);
    if (obj) get().updateObject(objectId, { zIndex: Math.max(0, obj.zIndex - 1) });
  },

  alignSelectedObjects: (align) => {
    const state = get();
    const pres = state.activePresentation;
    const slide = pres?.slides.find((s) => s.id === state.activeSlideId);
    if (!pres || !slide || state.selectedObjectIds.length === 0) return;
    const hist = pushHistory(state);
    const selected = slide.objects.filter((o) => state.selectedObjectIds.includes(o.id));
    const useSlideBounds = selected.length === 1;
    const minX = useSlideBounds ? 0 : Math.min(...selected.map((o) => o.x));
    const maxX = useSlideBounds ? pres.width : Math.max(...selected.map((o) => o.x + o.width));
    const minY = useSlideBounds ? 0 : Math.min(...selected.map((o) => o.y));
    const maxY = useSlideBounds ? pres.height : Math.max(...selected.map((o) => o.y + o.height));

    const slides = pres.slides.map((s) => {
      if (s.id !== slide.id) return s;
      return {
        ...s,
        objects: s.objects.map((o) => {
          if (!state.selectedObjectIds.includes(o.id) || o.locked) return o;
          switch (align) {
            case 'left': return { ...o, x: minX };
            case 'center': return { ...o, x: Math.round((minX + maxX) / 2 - o.width / 2) };
            case 'right': return { ...o, x: maxX - o.width };
            case 'top': return { ...o, y: minY };
            case 'middle': return { ...o, y: Math.round((minY + maxY) / 2 - o.height / 2) };
            case 'bottom': return { ...o, y: maxY - o.height };
          }
        }),
      };
    });
    set({ ...hist, activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  distributeSelectedObjects: (axis) => {
    const state = get();
    const pres = state.activePresentation;
    const slide = pres?.slides.find((s) => s.id === state.activeSlideId);
    if (!pres || !slide || state.selectedObjectIds.length < 3) return;
    const hist = pushHistory(state);
    const selected = slide.objects.filter((o) => state.selectedObjectIds.includes(o.id));
    const sorted = [...selected].sort((a, b) => (axis === 'horizontal' ? a.x - b.x : a.y - b.y));
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const updates = new Map<string, number>();

    if (axis === 'horizontal') {
      const totalSpan = last.x + last.width - first.x;
      const sumW = sorted.reduce((acc, o) => acc + o.width, 0);
      const gap = (totalSpan - sumW) / (sorted.length - 1);
      let cursor = first.x;
      sorted.forEach((o) => {
        updates.set(o.id, Math.round(cursor));
        cursor += o.width + gap;
      });
    } else {
      const totalSpan = last.y + last.height - first.y;
      const sumH = sorted.reduce((acc, o) => acc + o.height, 0);
      const gap = (totalSpan - sumH) / (sorted.length - 1);
      let cursor = first.y;
      sorted.forEach((o) => {
        updates.set(o.id, Math.round(cursor));
        cursor += o.height + gap;
      });
    }

    const slides = pres.slides.map((s) =>
      s.id !== slide.id
        ? s
        : {
            ...s,
            objects: s.objects.map((o) => {
              const val = updates.get(o.id);
              if (val === undefined) return o;
              return axis === 'horizontal' ? { ...o, x: val } : { ...o, y: val };
            }),
          }
    );
    set({ ...hist, activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  groupSelectedObjects: () => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres || state.selectedObjectIds.length < 2) return;
    const hist = pushHistory(state);
    const gid = uid('grp');
    const slides = pres.slides.map((s) =>
      s.id !== state.activeSlideId
        ? s
        : {
            ...s,
            objects: s.objects.map((o) =>
              state.selectedObjectIds.includes(o.id) ? { ...o, groupId: gid } : o
            ),
          }
    );
    set({ ...hist, activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  ungroupSelectedObjects: () => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres || state.selectedObjectIds.length === 0) return;
    const hist = pushHistory(state);
    const slides = pres.slides.map((s) =>
      s.id !== state.activeSlideId
        ? s
        : {
            ...s,
            objects: s.objects.map((o) =>
              state.selectedObjectIds.includes(o.id) ? { ...o, groupId: undefined } : o
            ),
          }
    );
    set({ ...hist, activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  toggleLockObject: (objectId) => {
    const slide = get().activePresentation?.slides.find((s) => s.id === get().activeSlideId);
    const obj = slide?.objects.find((o) => o.id === objectId);
    if (obj) get().updateObject(objectId, { locked: !obj.locked });
  },

  addAnimation: (slideId, animInput) => {
    const state = get();
    const pres = state.activePresentation;
    const slide = pres?.slides.find((s) => s.id === slideId);
    if (!pres || !slide) return;
    const hist = pushHistory(state);
    const newAnim: SlideAnimation = {
      ...animInput,
      id: uid('anim'),
      order: slide.animations.length,
    };
    const slides = pres.slides.map((s) =>
      s.id === slideId ? { ...s, animations: [...s.animations, newAnim] } : s
    );
    set({ ...hist, activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  updateAnimation: (slideId, animId, patch) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const slides = pres.slides.map((s) =>
      s.id === slideId
        ? { ...s, animations: s.animations.map((a) => (a.id === animId ? { ...a, ...patch } : a)) }
        : s
    );
    set({ activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  removeAnimation: (slideId, animId) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const hist = pushHistory(state);
    const slides = pres.slides.map((s) =>
      s.id === slideId
        ? {
            ...s,
            animations: s.animations
              .filter((a) => a.id !== animId)
              .map((a, idx) => ({ ...a, order: idx })),
          }
        : s
    );
    set({ ...hist, activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  reorderAnimations: (slideId, fromIndex, toIndex) => {
    const state = get();
    const pres = state.activePresentation;
    const slide = pres?.slides.find((s) => s.id === slideId);
    if (!pres || !slide) return;
    const list = [...slide.animations];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);
    list.forEach((a, idx) => (a.order = idx));
    const slides = pres.slides.map((s) => (s.id === slideId ? { ...s, animations: list } : s));
    set({ activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  applyTransitionToAll: (transition) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const hist = pushHistory(state);
    const slides = pres.slides.map((s) => ({ ...s, transition: { ...transition } }));
    set({ ...hist, activePresentation: { ...pres, slides } });
    scheduleAutosave(get, set);
  },

  addComment: (slideId, text, objectId) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres || !text.trim()) return;
    const thread: CommentThread = {
      id: uid('cmt'),
      slideId,
      objectId,
      authorId: state.user.id,
      authorName: state.user.name,
      text: text.trim(),
      resolved: false,
      createdAt: new Date().toISOString(),
      replies: [],
    };
    set({
      activePresentation: { ...pres, comments: [...pres.comments, thread] },
    });
    scheduleAutosave(get, set);
  },

  replyToComment: (commentId, text) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres || !text.trim()) return;
    const comments = pres.comments.map((c) =>
      c.id === commentId
        ? {
            ...c,
            replies: [
              ...c.replies,
              {
                id: uid('rep'),
                authorId: state.user.id,
                authorName: state.user.name,
                text: text.trim(),
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : c
    );
    set({ activePresentation: { ...pres, comments } });
    scheduleAutosave(get, set);
  },

  toggleResolveComment: (commentId) => {
    const pres = get().activePresentation;
    if (!pres) return;
    const comments = pres.comments.map((c) =>
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    );
    set({ activePresentation: { ...pres, comments } });
    scheduleAutosave(get, set);
  },

  createRevision: (label) => {
    const state = get();
    const pres = state.activePresentation;
    if (!pres) return;
    const rev = {
      id: uid('rev'),
      label: label || `Snapshot ${pres.revisions.length + 1}`,
      authorName: state.user.name,
      createdAt: new Date().toISOString(),
      snapshot: JSON.stringify({ slides: pres.slides, themeId: pres.themeId, masters: pres.masters }),
    };
    set({ activePresentation: { ...pres, revisions: [rev, ...pres.revisions] } });
    scheduleAutosave(get, set);
  },

  restoreRevision: (revisionId) => {
    const state = get();
    const pres = state.activePresentation;
    const rev = pres?.revisions.find((r) => r.id === revisionId);
    if (!pres || !rev) return;
    const hist = pushHistory(state);
    const parsed = JSON.parse(rev.snapshot);
    set({
      ...hist,
      activePresentation: {
        ...pres,
        slides: parsed.slides,
        themeId: parsed.themeId,
        masters: parsed.masters,
      },
      activeSlideId: parsed.slides[0]?.id || '',
      selectedObjectIds: [],
    });
    scheduleAutosave(get, set);
  },

  addPermission: (email, name, role) => {
    const pres = get().activePresentation;
    if (!pres || !email.trim()) return;
    const entry = {
      id: uid('perm'),
      email: email.trim(),
      name: name.trim() || email.trim(),
      role,
      addedAt: new Date().toISOString(),
    };
    set({ activePresentation: { ...pres, permissions: [...pres.permissions, entry] } });
    scheduleAutosave(get, set);
  },

  updatePermission: (permId, role) => {
    const pres = get().activePresentation;
    if (!pres) return;
    set({
      activePresentation: {
        ...pres,
        permissions: pres.permissions.map((p) => (p.id === permId ? { ...p, role } : p)),
      },
    });
    scheduleAutosave(get, set);
  },

  removePermission: (permId) => {
    const pres = get().activePresentation;
    if (!pres) return;
    set({
      activePresentation: {
        ...pres,
        permissions: pres.permissions.filter((p) => p.id !== permId),
      },
    });
    scheduleAutosave(get, set);
  },

  setShareLink: (shareLinkEnabled, shareLinkRole) => {
    const pres = get().activePresentation;
    if (!pres) return;
    set({ activePresentation: { ...pres, shareLinkEnabled, shareLinkRole } });
    scheduleAutosave(get, set);
  },

  undo: () => {
    const state = get();
    if (state.past.length === 0 || !state.activePresentation) return;
    const prev = state.past[state.past.length - 1];
    const currentSnap: HistorySnapshot = {
      slides: cloneSlides(state.activePresentation.slides),
      masters: JSON.parse(JSON.stringify(state.activePresentation.masters)),
      themeId: state.activePresentation.themeId,
      activeSlideId: state.activeSlideId,
    };
    set({
      past: state.past.slice(0, -1),
      future: [currentSnap, ...state.future],
      activePresentation: {
        ...state.activePresentation,
        slides: prev.slides,
        masters: prev.masters,
        themeId: prev.themeId,
      },
      activeSlideId: prev.activeSlideId,
      selectedObjectIds: [],
    });
    scheduleAutosave(get, set);
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0 || !state.activePresentation) return;
    const next = state.future[0];
    const currentSnap: HistorySnapshot = {
      slides: cloneSlides(state.activePresentation.slides),
      masters: JSON.parse(JSON.stringify(state.activePresentation.masters)),
      themeId: state.activePresentation.themeId,
      activeSlideId: state.activeSlideId,
    };
    set({
      past: [...state.past, currentSnap],
      future: state.future.slice(1),
      activePresentation: {
        ...state.activePresentation,
        slides: next.slides,
        masters: next.masters,
        themeId: next.themeId,
      },
      activeSlideId: next.activeSlideId,
      selectedObjectIds: [],
    });
    scheduleAutosave(get, set);
  },

  setRibbonTab: (activeRibbonTab) => set({ activeRibbonTab }),
  setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),
  setViewMode: (viewMode) => set({ viewMode }),
  setZoom: (zoom) => set({ zoom: Math.min(2.5, Math.max(0.25, zoom)) }),
  toggleRulers: () => set({ showRulers: !get().showRulers }),
  toggleGrid: () => set({ showGrid: !get().showGrid }),
  toggleGuides: () => set({ showGuides: !get().showGuides }),
  toggleSnapToGrid: () => set({ snapToGrid: !get().snapToGrid }),
  toggleSnapToObjects: () => set({ snapToObjects: !get().snapToObjects }),
  setFullScreenEdit: (isFullScreenEdit) => set({ isFullScreenEdit }),

  startPresentation: (fromCurrent = false, presenterView = false) => {
    const pres = get().activePresentation;
    if (!pres) return;
    const idx = fromCurrent
      ? Math.max(0, pres.slides.findIndex((s) => s.id === get().activeSlideId))
      : 0;
    set({
      isPresenting: true,
      isPresenterView: presenterView,
      presentFromSlideIndex: idx,
    });
  },

  stopPresentation: () => set({ isPresenting: false, isPresenterView: false }),

  updateAIConfig: async (patch) => {
    const next = { ...get().aiConfig, ...patch };
    await idbSaveSetting('aiConfig', next);
    set({ aiConfig: next });
  },

  setModal: (modal, open) => {
    switch (modal) {
      case 'shortcuts': set({ showShortcutsModal: open }); break;
      case 'share': set({ showShareModal: open }); break;
      case 'export': set({ showExportModal: open }); break;
      case 'print': set({ showPrintModal: open }); break;
      case 'findReplace': set({ showFindReplaceModal: open }); break;
    }
  },

  saveNow: async () => {
    const pres = get().activePresentation;
    if (!pres) return;
    set({ syncStatus: 'saving' });
    const updated = { ...pres, updatedAt: new Date().toISOString() };
    await idbSavePresentation(updated);
    set({
      syncStatus: navigator.onLine ? 'saved' : 'offline',
      presentations: get().presentations.map((p) => (p.id === updated.id ? updated : p)),
    });
  },
}));

