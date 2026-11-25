import {
  DiagramData,
  DiagramKind,
  Slide,
  SlideLayoutType,
  SlideObject,
  TextRunStyle,
  ThemeDefinition,
} from '../types/presentation';

export function uid(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36).slice(-4)}`;
}

export function defaultTextStyle(overrides: Partial<TextRunStyle> = {}): TextRunStyle {
  return {
    fontFamily: 'Segoe UI',
    fontSize: 20,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#242424',
    letterSpacing: 0,
    lineHeight: 1.35,
    textAlign: 'left',
    verticalAlign: 'top',
    listType: 'none',
    indentLevel: 0,
    direction: 'ltr',
    ...overrides,
  };
}

export function createTextObject(
  slideId: string,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  style: Partial<TextRunStyle> = {},
  extra: Partial<SlideObject> = {}
): SlideObject {
  return {
    id: uid('obj'),
    slideId,
    type: 'text',
    name: extra.name || 'Text Box',
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex: extra.zIndex ?? 1,
    locked: false,
    visible: true,
    opacity: 1,
    flipX: false,
    flipY: false,
    textData: {
      text,
      style: defaultTextStyle(style),
      padding: 12,
    },
    ...extra,
  };
}

export function buildLayoutObjects(
  slideId: string,
  layout: SlideLayoutType,
  theme: ThemeDefinition,
  width = 1280,
  height = 720
): SlideObject[] {
  const sx = width / 1280;
  const sy = height / 720;
  const padX = Math.round(72 * sx);

  switch (layout) {
    case 'title':
      return [
        createTextObject(
          slideId,
          'Presentation Title',
          padX,
          Math.round(210 * sy),
          width - padX * 2,
          Math.round(110 * sy),
          {
            fontFamily: theme.headingFont,
            fontSize: 52,
            fontWeight: 'bold',
            color: theme.primaryColor,
            textAlign: 'center',
            verticalAlign: 'middle',
          },
          { name: 'Title Placeholder', placeholderRole: 'title', zIndex: 1 }
        ),
        createTextObject(
          slideId,
          'Subtitle or Presenter Name • Organization',
          padX + 80,
          Math.round(340 * sy),
          width - (padX + 80) * 2,
          Math.round(70 * sy),
          {
            fontFamily: theme.bodyFont,
            fontSize: 24,
            color: theme.mutedTextColor,
            textAlign: 'center',
            verticalAlign: 'top',
          },
          { name: 'Subtitle Placeholder', placeholderRole: 'subtitle', zIndex: 2 }
        ),
      ];

    case 'section_header':
      return [
        {
          id: uid('obj'),
          slideId,
          type: 'shape',
          name: 'Accent Bar',
          x: padX,
          y: Math.round(250 * sy),
          width: Math.round(90 * sx),
          height: 8,
          rotation: 0,
          zIndex: 1,
          locked: false,
          visible: true,
          opacity: 1,
          flipX: false,
          flipY: false,
          shapeData: {
            kind: 'rectangle',
            fill: theme.accentColor,
            stroke: 'transparent',
            strokeWidth: 0,
            cornerRadius: 4,
          },
        },
        createTextObject(
          slideId,
          'Section Header',
          padX,
          Math.round(280 * sy),
          width - padX * 2,
          Math.round(90 * sy),
          {
            fontFamily: theme.headingFont,
            fontSize: 44,
            fontWeight: 'bold',
            color: theme.primaryColor,
          },
          { name: 'Section Title', placeholderRole: 'title', zIndex: 2 }
        ),
        createTextObject(
          slideId,
          'Brief section overview or key takeaway',
          padX,
          Math.round(380 * sy),
          width - padX * 2,
          Math.round(60 * sy),
          {
            fontFamily: theme.bodyFont,
            fontSize: 22,
            color: theme.mutedTextColor,
          },
          { name: 'Section Subtitle', placeholderRole: 'subtitle', zIndex: 3 }
        ),
      ];

    case 'two_column':
      return [
        createTextObject(
          slideId,
          'Slide Title',
          padX,
          Math.round(48 * sy),
          width - padX * 2,
          Math.round(72 * sy),
          {
            fontFamily: theme.headingFont,
            fontSize: 36,
            fontWeight: 'bold',
            color: theme.primaryColor,
          },
          { name: 'Slide Title', placeholderRole: 'title', zIndex: 1 }
        ),
        createTextObject(
          slideId,
          '• First column point\n• Supporting detail\n• Key metric or observation',
          padX,
          Math.round(150 * sy),
          Math.round((width - padX * 2 - 36) / 2),
          Math.round(490 * sy),
          {
            fontFamily: theme.bodyFont,
            fontSize: 22,
            color: theme.textColor,
            listType: 'bullet',
          },
          { name: 'Left Column', placeholderRole: 'body', zIndex: 2 }
        ),
        createTextObject(
          slideId,
          '• Second column point\n• Supporting detail\n• Next step or outcome',
          padX + Math.round((width - padX * 2 - 36) / 2) + 36,
          Math.round(150 * sy),
          Math.round((width - padX * 2 - 36) / 2),
          Math.round(490 * sy),
          {
            fontFamily: theme.bodyFont,
            fontSize: 22,
            color: theme.textColor,
            listType: 'bullet',
          },
          { name: 'Right Column', placeholderRole: 'body', zIndex: 3 }
        ),
      ];

    case 'comparison': {
      const colW = Math.round((width - padX * 2 - 36) / 2);
      const rightX = padX + colW + 36;
      return [
        createTextObject(
          slideId,
          'Comparison Title',
          padX,
          Math.round(48 * sy),
          width - padX * 2,
          Math.round(72 * sy),
          {
            fontFamily: theme.headingFont,
            fontSize: 36,
            fontWeight: 'bold',
            color: theme.primaryColor,
          },
          { name: 'Slide Title', placeholderRole: 'title', zIndex: 1 }
        ),
        createTextObject(
          slideId,
          'Option A',
          padX,
          Math.round(145 * sy),
          colW,
          Math.round(52 * sy),
          {
            fontFamily: theme.headingFont,
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.accentColor,
          },
          { name: 'Option A Header', zIndex: 2 }
        ),
        createTextObject(
          slideId,
          '• Advantage one\n• Advantage two\n• Cost & timeline',
          padX,
          Math.round(205 * sy),
          colW,
          Math.round(430 * sy),
          {
            fontFamily: theme.bodyFont,
            fontSize: 20,
            color: theme.textColor,
            listType: 'bullet',
          },
          { name: 'Option A Body', placeholderRole: 'body', zIndex: 3 }
        ),
        createTextObject(
          slideId,
          'Option B',
          rightX,
          Math.round(145 * sy),
          colW,
          Math.round(52 * sy),
          {
            fontFamily: theme.headingFont,
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.secondaryColor,
          },
          { name: 'Option B Header', zIndex: 4 }
        ),
        createTextObject(
          slideId,
          '• Advantage one\n• Advantage two\n• Cost & timeline',
          rightX,
          Math.round(205 * sy),
          colW,
          Math.round(430 * sy),
          {
            fontFamily: theme.bodyFont,
            fontSize: 20,
            color: theme.textColor,
            listType: 'bullet',
          },
          { name: 'Option B Body', placeholderRole: 'body', zIndex: 5 }
        ),
      ];
    }

    case 'picture_caption':
      return [
        createTextObject(
          slideId,
          'Visual Showcase',
          padX,
          Math.round(48 * sy),
          Math.round(440 * sx),
          Math.round(72 * sy),
          {
            fontFamily: theme.headingFont,
            fontSize: 34,
            fontWeight: 'bold',
            color: theme.primaryColor,
          },
          { name: 'Slide Title', placeholderRole: 'title', zIndex: 1 }
        ),
        createTextObject(
          slideId,
          'Add descriptive commentary explaining the visual on the right and its key insight.',
          padX,
          Math.round(150 * sy),
          Math.round(440 * sx),
          Math.round(460 * sy),
          {
            fontFamily: theme.bodyFont,
            fontSize: 20,
            color: theme.textColor,
          },
          { name: 'Caption Text', placeholderRole: 'body', zIndex: 2 }
        ),
        {
          id: uid('obj'),
          slideId,
          type: 'shape',
          name: 'Media Placeholder',
          x: Math.round(560 * sx),
          y: Math.round(80 * sy),
          width: Math.round(640 * sx),
          height: Math.round(540 * sy),
          rotation: 0,
          zIndex: 3,
          locked: false,
          visible: true,
          opacity: 1,
          flipX: false,
          flipY: false,
          shapeData: {
            kind: 'rounded_rectangle',
            fill: theme.surfaceColor,
            stroke: theme.secondaryColor,
            strokeWidth: 2,
            cornerRadius: 12,
            text: 'Insert Image or Chart Here',
            textStyle: {
              fontSize: 20,
              color: theme.mutedTextColor,
              textAlign: 'center',
            },
          },
        },
      ];

    case 'title_only':
      return [
        createTextObject(
          slideId,
          'Slide Title',
          padX,
          Math.round(48 * sy),
          width - padX * 2,
          Math.round(72 * sy),
          {
            fontFamily: theme.headingFont,
            fontSize: 36,
            fontWeight: 'bold',
            color: theme.primaryColor,
          },
          { name: 'Slide Title', placeholderRole: 'title', zIndex: 1 }
        ),
      ];

    case 'blank':
    case 'custom':
      return [];

    case 'title_content':
    default:
      return [
        createTextObject(
          slideId,
          'Slide Title',
          padX,
          Math.round(48 * sy),
          width - padX * 2,
          Math.round(72 * sy),
          {
            fontFamily: theme.headingFont,
            fontSize: 36,
            fontWeight: 'bold',
            color: theme.primaryColor,
          },
          { name: 'Slide Title', placeholderRole: 'title', zIndex: 1 }
        ),
        createTextObject(
          slideId,
          '• Key point one\n• Key point two\n• Supporting evidence or next steps',
          padX,
          Math.round(150 * sy),
          width - padX * 2,
          Math.round(490 * sy),
          {
            fontFamily: theme.bodyFont,
            fontSize: 24,
            color: theme.textColor,
            listType: 'bullet',
          },
          { name: 'Content Placeholder', placeholderRole: 'body', zIndex: 2 }
        ),
      ];
  }
}

export function createSlide(
  order: number,
  layout: SlideLayoutType,
  theme: ThemeDefinition,
  width = 1280,
  height = 720,
  title?: string
): Slide {
  const id = uid('slide');
  return {
    id,
    order,
    title: title || `Slide ${order + 1}`,
    layout,
    hidden: false,
    background: {
      type: 'solid',
      color: theme.backgroundColor,
    },
    notes: '',
    transition: {
      effect: 'none',
      duration: 500,
      direction: 'left',
      advanceOnClick: true,
      autoAdvanceAfter: null,
    },
    objects: buildLayoutObjects(id, layout, theme, width, height),
    animations: [],
  };
}

export function createDiagramTemplate(kind: DiagramKind, accentColor = '#C4512D'): DiagramData {
  switch (kind) {
    case 'org_chart':
      return {
        kind,
        accentColor,
        nodes: [
          { id: 'n1', label: 'CEO / Director', x: 220, y: 20, width: 180, height: 56, fill: accentColor, textColor: '#FFFFFF', shape: 'round' },
          { id: 'n2', label: 'Engineering', x: 40, y: 130, width: 160, height: 52, fill: '#1E3A5F', textColor: '#FFFFFF', shape: 'round' },
          { id: 'n3', label: 'Product', x: 230, y: 130, width: 160, height: 52, fill: '#1E3A5F', textColor: '#FFFFFF', shape: 'round' },
          { id: 'n4', label: 'Operations', x: 420, y: 130, width: 160, height: 52, fill: '#1E3A5F', textColor: '#FFFFFF', shape: 'round' },
        ],
        edges: [
          { from: 'n1', to: 'n2' },
          { from: 'n1', to: 'n3' },
          { from: 'n1', to: 'n4' },
        ],
      };
    case 'process':
      return {
        kind,
        accentColor,
        nodes: [
          { id: 'n1', label: '1. Research', x: 20, y: 90, width: 135, height: 64, fill: accentColor, textColor: '#FFFFFF', shape: 'round' },
          { id: 'n2', label: '2. Design', x: 180, y: 90, width: 135, height: 64, fill: '#2B547E', textColor: '#FFFFFF', shape: 'round' },
          { id: 'n3', label: '3. Build', x: 340, y: 90, width: 135, height: 64, fill: '#1E3A5F', textColor: '#FFFFFF', shape: 'round' },
          { id: 'n4', label: '4. Launch', x: 500, y: 90, width: 135, height: 64, fill: '#0F766E', textColor: '#FFFFFF', shape: 'round' },
        ],
        edges: [
          { from: 'n1', to: 'n2' },
          { from: 'n2', to: 'n3' },
          { from: 'n3', to: 'n4' },
        ],
      };
    case 'flowchart':
      return {
        kind,
        accentColor,
        nodes: [
          { id: 'n1', label: 'Start', x: 230, y: 16, width: 140, height: 48, fill: '#0F766E', textColor: '#FFFFFF', shape: 'round' },
          { id: 'n2', label: 'Valid Input?', x: 220, y: 95, width: 160, height: 64, fill: accentColor, textColor: '#FFFFFF', shape: 'diamond' },
          { id: 'n3', label: 'Process Data', x: 60, y: 190, width: 160, height: 52, fill: '#1E3A5F', textColor: '#FFFFFF', shape: 'rect' },
          { id: 'n4', label: 'Show Error', x: 380, y: 190, width: 160, height: 52, fill: '#991B1B', textColor: '#FFFFFF', shape: 'rect' },
        ],
        edges: [
          { from: 'n1', to: 'n2' },
          { from: 'n2', to: 'n3', label: 'Yes' },
          { from: 'n2', to: 'n4', label: 'No' },
        ],
      };
    case 'timeline':
      return {
        kind,
        accentColor,
        nodes: [
          { id: 'n1', label: 'Q1: Discovery', x: 20, y: 80, width: 140, height: 60, fill: accentColor, textColor: '#FFFFFF', shape: 'round' },
          { id: 'n2', label: 'Q2: Prototype', x: 185, y: 80, width: 140, height: 60, fill: '#1E3A5F', textColor: '#FFFFFF', shape: 'round' },
          { id: 'n3', label: 'Q3: Beta', x: 350, y: 80, width: 140, height: 60, fill: '#0F766E', textColor: '#FFFFFF', shape: 'round' },
          { id: 'n4', label: 'Q4: Release', x: 515, y: 80, width: 140, height: 60, fill: '#334155', textColor: '#FFFFFF', shape: 'round' },
        ],
        edges: [
          { from: 'n1', to: 'n2' },
          { from: 'n2', to: 'n3' },
          { from: 'n3', to: 'n4' },
        ],
      };
    case 'cycle':
      return {
        kind,
        accentColor,
        nodes: [
          { id: 'n1', label: 'Plan', x: 240, y: 16, width: 120, height: 52, fill: accentColor, textColor: '#FFFFFF', shape: 'circle' },
          { id: 'n2', label: 'Execute', x: 430, y: 110, width: 120, height: 52, fill: '#1E3A5F', textColor: '#FFFFFF', shape: 'circle' },
          { id: 'n3', label: 'Review', x: 240, y: 200, width: 120, height: 52, fill: '#0F766E', textColor: '#FFFFFF', shape: 'circle' },
          { id: 'n4', label: 'Refine', x: 50, y: 110, width: 120, height: 52, fill: '#475569', textColor: '#FFFFFF', shape: 'circle' },
        ],
        edges: [
          { from: 'n1', to: 'n2' },
          { from: 'n2', to: 'n3' },
          { from: 'n3', to: 'n4' },
          { from: 'n4', to: 'n1' },
        ],
      };
    case 'pyramid':
      return {
        kind,
        accentColor,
        nodes: [
          { id: 'n1', label: 'Vision', x: 230, y: 20, width: 160, height: 48, fill: accentColor, textColor: '#FFFFFF', shape: 'rect' },
          { id: 'n2', label: 'Strategy & Goals', x: 170, y: 85, width: 280, height: 52, fill: '#1E3A5F', textColor: '#FFFFFF', shape: 'rect' },
          { id: 'n3', label: 'Execution & Operations', x: 100, y: 155, width: 420, height: 56, fill: '#334155', textColor: '#FFFFFF', shape: 'rect' },
        ],
        edges: [],
      };
    case 'venn':
      return {
        kind,
        accentColor,
        nodes: [
          { id: 'n1', label: 'Design', x: 120, y: 50, width: 160, height: 160, fill: 'rgba(196,81,45,0.72)', textColor: '#FFFFFF', shape: 'circle' },
          { id: 'n2', label: 'Technology', x: 240, y: 50, width: 160, height: 160, fill: 'rgba(30,58,95,0.72)', textColor: '#FFFFFF', shape: 'circle' },
          { id: 'n3', label: 'Business', x: 180, y: 135, width: 160, height: 160, fill: 'rgba(15,118,110,0.72)', textColor: '#FFFFFF', shape: 'circle' },
        ],
        edges: [],
      };
    case 'mind_map':
      return {
        kind,
        accentColor,
        nodes: [
          { id: 'n1', label: 'Core Topic', x: 230, y: 105, width: 150, height: 56, fill: accentColor, textColor: '#FFFFFF', shape: 'round' },
          { id: 'n2', label: 'Branch A', x: 40, y: 30, width: 130, height: 46, fill: '#1E3A5F', textColor: '#FFFFFF', shape: 'round' },
          { id: 'n3', label: 'Branch B', x: 430, y: 30, width: 130, height: 46, fill: '#1E3A5F', textColor: '#FFFFFF', shape: 'round' },
          { id: 'n4', label: 'Branch C', x: 40, y: 185, width: 130, height: 46, fill: '#0F766E', textColor: '#FFFFFF', shape: 'round' },
          { id: 'n5', label: 'Branch D', x: 430, y: 185, width: 130, height: 46, fill: '#0F766E', textColor: '#FFFFFF', shape: 'round' },
        ],
        edges: [
          { from: 'n1', to: 'n2' },
          { from: 'n1', to: 'n3' },
          { from: 'n1', to: 'n4' },
          { from: 'n1', to: 'n5' },
        ],
      };
    case 'hierarchy':
    case 'relationship':
    default:
      return {
        kind,
        accentColor,
        nodes: [
          { id: 'n1', label: 'Primary Concept', x: 220, y: 24, width: 180, height: 52, fill: accentColor, textColor: '#FFFFFF', shape: 'round' },
          { id: 'n2', label: 'Factor A', x: 80, y: 140, width: 160, height: 52, fill: '#1E3A5F', textColor: '#FFFFFF', shape: 'round' },
          { id: 'n3', label: 'Factor B', x: 380, y: 140, width: 160, height: 52, fill: '#0F766E', textColor: '#FFFFFF', shape: 'round' },
        ],
        edges: [
          { from: 'n1', to: 'n2' },
          { from: 'n1', to: 'n3' },
          { from: 'n2', to: 'n3' },
        ],
      };
  }
}

