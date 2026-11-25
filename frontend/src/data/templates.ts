import { Presentation, Slide } from '../types/presentation';
import { createDefaultMaster, getThemeById } from './themes';
import { createTextObject, uid } from './layouts';

export interface TemplateItem {
  id: string;
  name: string;
  category: 'Business' | 'Education' | 'Technology' | 'General';
  description: string;
  themeId: string;
  buildSlides: () => Slide[];
}

function makeSlide(
  order: number,
  title: string,
  layout: Slide['layout'],
  bgColor: string,
  objectsFn: (slideId: string) => Slide['objects'],
  notes = ''
): Slide {
  const id = uid('slide');
  return {
    id,
    order,
    title,
    layout,
    hidden: false,
    background: { type: 'solid', color: bgColor },
    notes,
    transition: {
      effect: 'fade',
      duration: 450,
      direction: 'left',
      advanceOnClick: true,
      autoAdvanceAfter: null,
    },
    objects: objectsFn(id),
    animations: [],
  };
}

export const TEMPLATES: TemplateItem[] = [
  {
    id: 'tpl-investor-pitch',
    name: 'Investor Pitch Deck',
    category: 'Business',
    description: 'Structured 5-slide pitch deck covering problem, solution, traction, and ask.',
    themeId: 'corporate',
    buildSlides: () => {
      const t = getThemeById('corporate');
      return [
        makeSlide(0, 'Title', 'title', t.backgroundColor, (sid) => [
          {
            id: uid('obj'), slideId: sid, type: 'shape', name: 'Accent Strip',
            x: 0, y: 0, width: 24, height: 720, rotation: 0, zIndex: 0,
            locked: false, visible: true, opacity: 1, flipX: false, flipY: false,
            shapeData: { kind: 'rectangle', fill: t.accentColor, stroke: 'transparent', strokeWidth: 0, cornerRadius: 0 },
          },
          createTextObject(sid, 'Series A Investor Presentation', 96, 210, 1080, 96, {
            fontFamily: t.headingFont, fontSize: 50, fontWeight: 'bold', color: t.primaryColor,
          }, { placeholderRole: 'title' }),
          createTextObject(sid, 'Company Name • Q4 Strategy & Growth Outlook', 96, 320, 1080, 60, {
            fontFamily: t.bodyFont, fontSize: 24, color: t.mutedTextColor,
          }, { placeholderRole: 'subtitle' }),
        ], 'Welcome investors and introduce the core mission.'),
        makeSlide(1, 'Problem & Opportunity', 'two_column', t.backgroundColor, (sid) => [
          createTextObject(sid, 'Market Problem & Opportunity', 72, 48, 1136, 68, {
            fontFamily: t.headingFont, fontSize: 36, fontWeight: 'bold', color: t.primaryColor,
          }, { placeholderRole: 'title' }),
          createTextObject(sid, '• Legacy workflows slow teams down by 40%\n• Fragmented tools increase operational overhead\n• High error rates in manual reporting', 72, 150, 540, 460, {
            fontFamily: t.bodyFont, fontSize: 22, color: t.textColor, listType: 'bullet',
          }),
          {
            id: uid('obj'), slideId: sid, type: 'chart', name: 'Market Growth Chart',
            x: 650, y: 150, width: 550, height: 420, rotation: 0, zIndex: 2,
            locked: false, visible: true, opacity: 1, flipX: false, flipY: false,
            chartData: {
              kind: 'column',
              title: 'Addressable Market ($B)',
              showLegend: true,
              showGrid: true,
              showValues: true,
              categories: ['2024', '2025', '2026', '2027'],
              series: [{ name: 'TAM ($B)', color: t.accentColor, values: [12, 18, 27, 39] }],
            },
          },
        ]),
        makeSlide(2, 'Product Solution', 'title_content', t.backgroundColor, (sid) => [
          createTextObject(sid, 'Our Solution Architecture', 72, 48, 1136, 68, {
            fontFamily: t.headingFont, fontSize: 36, fontWeight: 'bold', color: t.primaryColor,
          }, { placeholderRole: 'title' }),
          {
            id: uid('obj'), slideId: sid, type: 'diagram', name: 'Solution Flow',
            x: 110, y: 180, width: 1060, height: 340, rotation: 0, zIndex: 2,
            locked: false, visible: true, opacity: 1, flipX: false, flipY: false,
            diagramData: {
              kind: 'process',
              accentColor: t.accentColor,
              nodes: [
                { id: 'n1', label: 'Ingest Data', x: 20, y: 90, width: 150, height: 64, fill: t.primaryColor, textColor: '#FFFFFF', shape: 'round' },
                { id: 'n2', label: 'Automate', x: 220, y: 90, width: 150, height: 64, fill: t.accentColor, textColor: '#FFFFFF', shape: 'round' },
                { id: 'n3', label: 'Collaborate', x: 420, y: 90, width: 150, height: 64, fill: t.secondaryColor, textColor: '#FFFFFF', shape: 'round' },
                { id: 'n4', label: 'Deliver ROI', x: 620, y: 90, width: 150, height: 64, fill: '#0F766E', textColor: '#FFFFFF', shape: 'round' },
              ],
              edges: [
                { from: 'n1', to: 'n2' },
                { from: 'n2', to: 'n3' },
                { from: 'n3', to: 'n4' },
              ],
            },
          },
        ]),
        makeSlide(3, 'Financial Summary', 'title_content', t.backgroundColor, (sid) => [
          createTextObject(sid, 'Key Financial Metrics', 72, 48, 1136, 68, {
            fontFamily: t.headingFont, fontSize: 36, fontWeight: 'bold', color: t.primaryColor,
          }, { placeholderRole: 'title' }),
          {
            id: uid('obj'), slideId: sid, type: 'table', name: 'Financial Table',
            x: 72, y: 150, width: 1136, height: 320, rotation: 0, zIndex: 2,
            locked: false, visible: true, opacity: 1, flipX: false, flipY: false,
            tableData: {
              rows: 4, cols: 4,
              colWidths: [320, 272, 272, 272],
              rowHeights: [64, 64, 64, 64],
              borderColor: '#CBD5E1', borderWidth: 1,
              cells: [
                [
                  { id: 'c00', text: 'Metric', bgColor: t.primaryColor, textColor: '#FFFFFF', bold: true, align: 'left' },
                  { id: 'c01', text: 'FY24', bgColor: t.primaryColor, textColor: '#FFFFFF', bold: true, align: 'center' },
                  { id: 'c02', text: 'FY25', bgColor: t.primaryColor, textColor: '#FFFFFF', bold: true, align: 'center' },
                  { id: 'c03', text: 'FY26 (Est)', bgColor: t.primaryColor, textColor: '#FFFFFF', bold: true, align: 'center' },
                ],
                [
                  { id: 'c10', text: 'ARR ($M)', bgColor: '#F8FAFC', textColor: '#1E293B', bold: true, align: 'left' },
                  { id: 'c11', text: '$2.4M', bgColor: '#FFFFFF', textColor: '#1E293B', align: 'center' },
                  { id: 'c12', text: '$6.1M', bgColor: '#FFFFFF', textColor: '#1E293B', align: 'center' },
                  { id: 'c13', text: '$14.5M', bgColor: '#FFFFFF', textColor: '#1E293B', align: 'center' },
                ],
                [
                  { id: 'c20', text: 'Gross Margin', bgColor: '#F8FAFC', textColor: '#1E293B', bold: true, align: 'left' },
                  { id: 'c21', text: '74%', bgColor: '#FFFFFF', textColor: '#1E293B', align: 'center' },
                  { id: 'c22', text: '79%', bgColor: '#FFFFFF', textColor: '#1E293B', align: 'center' },
                  { id: 'c23', text: '82%', bgColor: '#FFFFFF', textColor: '#1E293B', align: 'center' },
                ],
                [
                  { id: 'c30', text: 'Enterprise Customers', bgColor: '#F8FAFC', textColor: '#1E293B', bold: true, align: 'left' },
                  { id: 'c31', text: '45', bgColor: '#FFFFFF', textColor: '#1E293B', align: 'center' },
                  { id: 'c32', text: '128', bgColor: '#FFFFFF', textColor: '#1E293B', align: 'center' },
                  { id: 'c33', text: '310', bgColor: '#FFFFFF', textColor: '#1E293B', align: 'center' },
                ],
              ],
            },
          },
        ]),
      ];
    },
  },
  {
    id: 'tpl-business-review',
    name: 'Quarterly Business Review',
    category: 'Business',
    description: 'Executive QBR deck with KPIs, roadmap milestones, and action items.',
    themeId: 'business',
    buildSlides: () => {
      const t = getThemeById('business');
      return [
        makeSlide(0, 'QBR Overview', 'title', t.backgroundColor, (sid) => [
          createTextObject(sid, 'Quarterly Business Review', 72, 220, 1136, 90, {
            fontFamily: t.headingFont, fontSize: 48, fontWeight: 'bold', color: t.primaryColor, textAlign: 'center',
          }, { placeholderRole: 'title' }),
          createTextObject(sid, 'Performance Summary • Key Wins • Next Quarter Priorities', 72, 330, 1136, 60, {
            fontFamily: t.bodyFont, fontSize: 22, color: t.mutedTextColor, textAlign: 'center',
          }, { placeholderRole: 'subtitle' }),
        ]),
        makeSlide(1, 'Executive Summary', 'two_column', t.backgroundColor, (sid) => [
          createTextObject(sid, 'Executive Summary', 72, 48, 1136, 68, {
            fontFamily: t.headingFont, fontSize: 36, fontWeight: 'bold', color: t.primaryColor,
          }, { placeholderRole: 'title' }),
          createTextObject(sid, '• Exceeded quarterly revenue target by 14%\n• Reduced onboarding cycle from 14 days to 5 days\n• Launched enterprise SSO and audit logging', 72, 150, 540, 440, {
            fontFamily: t.bodyFont, fontSize: 22, color: t.textColor, listType: 'bullet',
          }),
          createTextObject(sid, '• Focus Area 1: Expand EMEA partner channel\n• Focus Area 2: Improve self-serve activation\n• Focus Area 3: Deliver v2 analytics module', 660, 150, 540, 440, {
            fontFamily: t.bodyFont, fontSize: 22, color: t.textColor, listType: 'bullet',
          }),
        ]),
      ];
    },
  },
  {
    id: 'tpl-classroom-lecture',
    name: 'Classroom Lecture',
    category: 'Education',
    description: 'Clear academic lecture deck with learning objectives, concepts, and summary.',
    themeId: 'educational',
    buildSlides: () => {
      const t = getThemeById('educational');
      return [
        makeSlide(0, 'Lecture Title', 'title', t.backgroundColor, (sid) => [
          createTextObject(sid, 'Course Module: Foundations & Theory', 72, 210, 1136, 96, {
            fontFamily: t.headingFont, fontSize: 46, fontWeight: 'bold', color: t.primaryColor, textAlign: 'center',
          }, { placeholderRole: 'title' }),
          createTextObject(sid, 'Instructor Name • Department • Semester 2026', 72, 325, 1136, 60, {
            fontFamily: t.bodyFont, fontSize: 22, color: t.mutedTextColor, textAlign: 'center',
          }, { placeholderRole: 'subtitle' }),
        ]),
        makeSlide(1, 'Learning Objectives', 'title_content', t.backgroundColor, (sid) => [
          createTextObject(sid, 'Learning Objectives', 72, 48, 1136, 68, {
            fontFamily: t.headingFont, fontSize: 36, fontWeight: 'bold', color: t.primaryColor,
          }, { placeholderRole: 'title' }),
          createTextObject(sid, '1. Understand the foundational principles and terminology\n2. Analyze real-world case studies using structured frameworks\n3. Apply quantitative methods to evaluate outcomes', 72, 150, 1136, 420, {
            fontFamily: t.bodyFont, fontSize: 24, color: t.textColor, listType: 'number', lineHeight: 1.6,
          }),
        ]),
      ];
    },
  },
  {
    id: 'tpl-research-presentation',
    name: 'Academic Research',
    category: 'Education',
    description: 'Structured research presentation for methodology, findings, and conclusions.',
    themeId: 'research',
    buildSlides: () => {
      const t = getThemeById('research');
      return [
        makeSlide(0, 'Research Title', 'title', t.backgroundColor, (sid) => [
          createTextObject(sid, 'Empirical Study & Methodology', 72, 210, 1136, 96, {
            fontFamily: t.headingFont, fontSize: 46, fontWeight: 'bold', color: t.primaryColor, textAlign: 'center',
          }, { placeholderRole: 'title' }),
          createTextObject(sid, 'Principal Investigator • Research Lab', 72, 325, 1136, 60, {
            fontFamily: t.bodyFont, fontSize: 22, color: t.mutedTextColor, textAlign: 'center',
          }, { placeholderRole: 'subtitle' }),
        ]),
        makeSlide(1, 'Methodology & Results', 'two_column', t.backgroundColor, (sid) => [
          createTextObject(sid, 'Experimental Results', 72, 48, 1136, 68, {
            fontFamily: t.headingFont, fontSize: 36, fontWeight: 'bold', color: t.primaryColor,
          }, { placeholderRole: 'title' }),
          createTextObject(sid, '• Sample Size: N = 1,240 participants\n• Control vs Treatment randomized split\n• Statistically significant improvement (p < 0.01)', 72, 150, 520, 420, {
            fontFamily: t.bodyFont, fontSize: 22, color: t.textColor, listType: 'bullet',
          }),
          {
            id: uid('obj'), slideId: sid, type: 'chart', name: 'Results Chart',
            x: 630, y: 150, width: 570, height: 420, rotation: 0, zIndex: 2,
            locked: false, visible: true, opacity: 1, flipX: false, flipY: false,
            chartData: {
              kind: 'line',
              title: 'Accuracy Across Epochs',
              showLegend: true,
              showGrid: true,
              showValues: false,
              categories: ['Epoch 1', 'Epoch 2', 'Epoch 3', 'Epoch 4', 'Epoch 5'],
              series: [
                { name: 'Baseline', color: '#64748B', values: [62, 68, 71, 74, 75] },
                { name: 'Proposed', color: t.primaryColor, values: [65, 76, 84, 89, 93] },
              ],
            },
          },
        ]),
      ];
    },
  },
  {
    id: 'tpl-software-architecture',
    name: 'Software Architecture',
    category: 'Technology',
    description: 'Dark technical deck for system design, service topology, and security.',
    themeId: 'technology',
    buildSlides: () => {
      const t = getThemeById('technology');
      return [
        makeSlide(0, 'System Architecture', 'title', t.backgroundColor, (sid) => [
          createTextObject(sid, 'Distributed System Architecture', 72, 210, 1136, 96, {
            fontFamily: t.headingFont, fontSize: 48, fontWeight: 'bold', color: t.primaryColor, textAlign: 'center',
          }, { placeholderRole: 'title' }),
          createTextObject(sid, 'High Availability • Low Latency • Zero-Trust Security', 72, 325, 1136, 60, {
            fontFamily: t.bodyFont, fontSize: 22, color: t.mutedTextColor, textAlign: 'center',
          }, { placeholderRole: 'subtitle' }),
        ]),
        makeSlide(1, 'Service Topology', 'title_content', t.backgroundColor, (sid) => [
          createTextObject(sid, 'Core Service Topology', 72, 48, 1136, 68, {
            fontFamily: t.headingFont, fontSize: 36, fontWeight: 'bold', color: t.primaryColor,
          }, { placeholderRole: 'title' }),
          {
            id: uid('obj'), slideId: sid, type: 'diagram', name: 'Architecture Diagram',
            x: 100, y: 150, width: 1080, height: 420, rotation: 0, zIndex: 2,
            locked: false, visible: true, opacity: 1, flipX: false, flipY: false,
            diagramData: {
              kind: 'hierarchy',
              accentColor: t.accentColor,
              nodes: [
                { id: 'n1', label: 'API Gateway', x: 240, y: 20, width: 200, height: 56, fill: t.accentColor, textColor: '#FFFFFF', shape: 'round' },
                { id: 'n2', label: 'Auth Service', x: 40, y: 150, width: 180, height: 54, fill: '#1E293B', textColor: '#F8FAFC', shape: 'round' },
                { id: 'n3', label: 'Core Engine', x: 250, y: 150, width: 180, height: 54, fill: '#0284C7', textColor: '#FFFFFF', shape: 'round' },
                { id: 'n4', label: 'MongoDB Atlas', x: 460, y: 150, width: 180, height: 54, fill: '#0F766E', textColor: '#FFFFFF', shape: 'round' },
              ],
              edges: [
                { from: 'n1', to: 'n2' },
                { from: 'n1', to: 'n3' },
                { from: 'n3', to: 'n4' },
              ],
            },
          },
        ]),
      ];
    },
  },
  {
    id: 'tpl-minimalist',
    name: 'Minimalist Deck',
    category: 'General',
    description: 'Clean Swiss-inspired layout with generous whitespace and sharp typography.',
    themeId: 'minimalist',
    buildSlides: () => {
      const t = getThemeById('minimalist');
      return [
        makeSlide(0, 'Minimalist Cover', 'title', t.backgroundColor, (sid) => [
          createTextObject(sid, 'Clear Ideas, Simply Presented', 72, 240, 1136, 90, {
            fontFamily: t.headingFont, fontSize: 48, fontWeight: 'bold', color: t.primaryColor, textAlign: 'left',
          }, { placeholderRole: 'title' }),
          createTextObject(sid, 'Author Name • Date', 72, 345, 1136, 50, {
            fontFamily: t.bodyFont, fontSize: 20, color: t.mutedTextColor, textAlign: 'left',
          }, { placeholderRole: 'subtitle' }),
        ]),
      ];
    },
  },
];

export function instantiateTemplate(template: TemplateItem, ownerId: string, ownerName: string): Presentation {
  const theme = getThemeById(template.themeId);
  const now = new Date().toISOString();
  return {
    id: uid('pres'),
    title: template.name,
    ownerId,
    ownerName,
    folderId: null,
    aspectRatio: '16:9',
    width: 1280,
    height: 720,
    themeId: theme.id,
    masters: [createDefaultMaster(theme)],
    slides: template.buildSlides(),
    sections: [],
    comments: [],
    permissions: [
      { id: uid('perm'), email: 'owner@akashavyom.local', name: ownerName, role: 'owner', addedAt: now },
    ],
    revisions: [],
    shareLinkEnabled: false,
    shareLinkRole: 'viewer',
    isFavorite: false,
    isTrashed: false,
    createdAt: now,
    updatedAt: now,
  };
}

