import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock idbStorage for unit tests in Node/jsdom
vi.mock('../../services/idbStorage', () => ({
  DEFAULT_AI_CONFIG: {
    enabled: true,
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    apiKey: '',
    ollamaUrl: 'http://localhost:11434',
    dailyLimit: 100,
    dailyUsed: 0,
    maxTokens: 2048,
  },
  idbGetPresentations: async () => [],
  idbGetFolders: async () => [],
  idbGetSetting: async (_k: string, fb: unknown) => fb,
  idbSavePresentation: async () => {},
  idbDeletePresentation: async () => {},
  idbSaveFolder: async () => {},
  idbQueueSync: async () => {},
  idbSaveSetting: async () => {},
  idbGetPresentation: async () => undefined,
}));

import { usePresentationStore } from '../usePresentationStore';
import { TEMPLATES } from '../../data/templates';
import { defaultTextStyle } from '../../data/layouts';

describe('Tejas Presentation Store', () => {
  beforeEach(() => {
    usePresentationStore.setState({
      presentations: [],
      activePresentation: null,
      activeSlideId: '',
      selectedSlideIds: [],
      selectedObjectIds: [],
      past: [],
      future: [],
    });
  });

  it('creates a blank presentation and adds/duplicates/deletes slides', async () => {
    const store = usePresentationStore.getState();
    const pres = await store.createBlankPresentation('Q4 Strategy');
    expect(pres.title).toBe('Q4 Strategy');
    expect(pres.slides.length).toBe(1);

    usePresentationStore.getState().addSlide('two_column');
    expect(usePresentationStore.getState().activePresentation?.slides.length).toBe(2);

    usePresentationStore.getState().duplicateSlide();
    expect(usePresentationStore.getState().activePresentation?.slides.length).toBe(3);

    usePresentationStore.getState().deleteSlide();
    expect(usePresentationStore.getState().activePresentation?.slides.length).toBe(2);
  });

  it('supports object creation, positioning, undo, and redo', async () => {
    await usePresentationStore.getState().createBlankPresentation('Canvas Test');
    const obj = usePresentationStore.getState().addObject({
      type: 'text',
      name: 'Test Box',
      x: 100,
      y: 120,
      width: 300,
      height: 80,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 1,
      flipX: false,
      flipY: false,
      textData: { text: 'Hello', style: defaultTextStyle(), padding: 10 },
    });

    usePresentationStore.getState().updateObject(obj.id, { x: 250, rotation: 45 });
    let slide = usePresentationStore.getState().activePresentation!.slides[0];
    let updated = slide.objects.find((o) => o.id === obj.id)!;
    expect(updated.x).toBe(250);
    expect(updated.rotation).toBe(45);

    usePresentationStore.getState().undo();
    slide = usePresentationStore.getState().activePresentation!.slides[0];
    updated = slide.objects.find((o) => o.id === obj.id)!;
    expect(updated.x).toBe(100);

    usePresentationStore.getState().redo();
    slide = usePresentationStore.getState().activePresentation!.slides[0];
    updated = slide.objects.find((o) => o.id === obj.id)!;
    expect(updated.x).toBe(250);
  });

  it('instantiates templates with native editable objects', async () => {
    const pres = await usePresentationStore.getState().createFromTemplate(TEMPLATES[0]);
    expect(pres.slides.length).toBeGreaterThanOrEqual(4);
    expect(pres.slides[0].objects.length).toBeGreaterThan(0);
  });

  it('supports theme switching, animations, comments, and permissions', async () => {
    await usePresentationStore.getState().createBlankPresentation('Theme Test');
    usePresentationStore.getState().applyTheme('technology');
    expect(usePresentationStore.getState().activePresentation?.themeId).toBe('technology');

    const slide = usePresentationStore.getState().activePresentation!.slides[0];
    const obj = slide.objects[0];
    usePresentationStore.getState().addAnimation(slide.id, {
      objectId: obj.id,
      objectName: obj.name,
      category: 'entrance',
      effect: 'fade_in',
      trigger: 'on_click',
      duration: 500,
      delay: 0,
      repeat: 1,
      direction: 'left',
    });
    expect(usePresentationStore.getState().activePresentation!.slides[0].animations.length).toBe(1);

    usePresentationStore.getState().addComment(slide.id, 'Check title font');
    expect(usePresentationStore.getState().activePresentation!.comments.length).toBe(1);

    usePresentationStore.getState().addPermission('colleague@akashavyom.local', 'Colleague', 'editor');
    expect(usePresentationStore.getState().activePresentation!.permissions.length).toBe(2);
  });
});

