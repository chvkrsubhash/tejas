export type AspectRatioPreset = '16:9' | '4:3' | 'portrait' | 'custom';

export type SlideLayoutType =
  | 'title'
  | 'title_content'
  | 'section_header'
  | 'two_column'
  | 'comparison'
  | 'picture_caption'
  | 'title_only'
  | 'blank'
  | 'custom';

export type SlideObjectType =
  | 'text'
  | 'shape'
  | 'image'
  | 'table'
  | 'chart'
  | 'diagram'
  | 'equation'
  | 'audio'
  | 'video'
  | 'embed';

export type ShapeKind =
  | 'rectangle'
  | 'rounded_rectangle'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'arrow_right'
  | 'arrow_left'
  | 'arrow_up'
  | 'arrow_down'
  | 'line'
  | 'connector'
  | 'star'
  | 'callout'
  | 'flowchart_process'
  | 'flowchart_decision'
  | 'flowchart_terminator'
  | 'hexagon'
  | 'pentagon';

export type ChartKind =
  | 'bar'
  | 'column'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'area'
  | 'scatter'
  | 'radar'
  | 'stacked_bar';

export type DiagramKind =
  | 'org_chart'
  | 'process'
  | 'flowchart'
  | 'timeline'
  | 'cycle'
  | 'hierarchy'
  | 'relationship'
  | 'pyramid'
  | 'venn'
  | 'mind_map';

export type TransitionEffect =
  | 'none'
  | 'fade'
  | 'push'
  | 'wipe'
  | 'split'
  | 'reveal'
  | 'cover'
  | 'uncover'
  | 'zoom'
  | 'dissolve';

export type AnimationCategory = 'entrance' | 'emphasis' | 'exit' | 'motion';

export type AnimationEffect =
  | 'appear'
  | 'fade_in'
  | 'fly_in'
  | 'zoom_in'
  | 'wipe_in'
  | 'pulse'
  | 'spin'
  | 'grow'
  | 'shrink'
  | 'color_change'
  | 'disappear'
  | 'fade_out'
  | 'fly_out'
  | 'zoom_out'
  | 'motion_line'
  | 'motion_curved'
  | 'motion_custom';

export type AnimationTrigger = 'on_click' | 'with_previous' | 'after_previous';

export interface ShadowStyle {
  enabled: boolean;
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface TextRunStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  color: string;
  highlightColor?: string;
  letterSpacing: number;
  lineHeight: number;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  verticalAlign: 'top' | 'middle' | 'bottom';
  listType: 'none' | 'bullet' | 'number';
  indentLevel: number;
  direction: 'ltr' | 'rtl';
  subscript?: boolean;
  superscript?: boolean;
}

export interface TextData {
  text: string;
  html?: string;
  style: TextRunStyle;
  padding: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
}

export interface ShapeData {
  kind: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
  text?: string;
  textStyle?: Partial<TextRunStyle>;
  dashArray?: number[];
}

export interface ImageData {
  src: string;
  originalSrc?: string;
  brightness: number;
  contrast: number;
  borderColor: string;
  borderWidth: number;
  maintainAspectRatio: boolean;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
}

export interface TableCell {
  id: string;
  text: string;
  bgColor: string;
  textColor: string;
  bold?: boolean;
  italic?: boolean;
  align: 'left' | 'center' | 'right';
  colSpan?: number;
  rowSpan?: number;
  mergedInto?: string;
}

export interface TableData {
  rows: number;
  cols: number;
  colWidths: number[];
  rowHeights: number[];
  borderColor: string;
  borderWidth: number;
  cells: TableCell[][];
}

export interface ChartSeries {
  name: string;
  color: string;
  values: number[];
}

export interface ChartData {
  kind: ChartKind;
  title: string;
  showLegend: boolean;
  showGrid: boolean;
  showValues: boolean;
  categories: string[];
  series: ChartSeries[];
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  textColor: string;
  shape: 'rect' | 'round' | 'circle' | 'diamond';
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramData {
  kind: DiagramKind;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  accentColor: string;
}

export interface MediaData {
  src: string;
  title: string;
  autoplay: boolean;
  loop: boolean;
}

export interface EmbedData {
  url: string;
  title: string;
}

export interface EquationData {
  latex: string;
  displayText: string;
  fontSize: number;
  color: string;
}

export interface SlideObject {
  id: string;
  slideId: string;
  type: SlideObjectType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
  flipX: boolean;
  flipY: boolean;
  groupId?: string;
  hyperlink?: string;
  altText?: string;
  placeholderRole?: 'title' | 'subtitle' | 'body' | 'footer' | 'slideNumber' | 'date';
  shadow?: ShadowStyle;
  textData?: TextData;
  shapeData?: ShapeData;
  imageData?: ImageData;
  tableData?: TableData;
  chartData?: ChartData;
  diagramData?: DiagramData;
  mediaData?: MediaData;
  embedData?: EmbedData;
  equationData?: EquationData;
}

export interface SlideBackground {
  type: 'solid' | 'gradient' | 'image';
  color: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientAngle?: number;
  imageSrc?: string;
}

export interface SlideTransition {
  effect: TransitionEffect;
  duration: number;
  direction: 'left' | 'right' | 'up' | 'down' | 'in' | 'out';
  advanceOnClick: boolean;
  autoAdvanceAfter: number | null;
}

export interface SlideAnimation {
  id: string;
  objectId: string;
  objectName: string;
  category: AnimationCategory;
  effect: AnimationEffect;
  trigger: AnimationTrigger;
  duration: number;
  delay: number;
  repeat: number;
  direction: 'left' | 'right' | 'up' | 'down';
  order: number;
  motionPoints?: Array<{ x: number; y: number }>;
}

export interface SlideSection {
  id: string;
  title: string;
  collapsed: boolean;
}

export interface Slide {
  id: string;
  order: number;
  title: string;
  layout: SlideLayoutType;
  masterId?: string;
  sectionId?: string;
  hidden: boolean;
  background: SlideBackground;
  border?: { enabled: boolean; color: string; width: number };
  notes: string;
  transition: SlideTransition;
  objects: SlideObject[];
  animations: SlideAnimation[];
  rehearsalTimingMs?: number;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  category: string;
  backgroundColor: string;
  surfaceColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  headingFont: string;
  bodyFont: string;
}

export interface SlideMaster {
  id: string;
  name: string;
  background: SlideBackground;
  headingFont: string;
  bodyFont: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  logoSrc?: string;
  headerText?: string;
  footerText?: string;
  showSlideNumber: boolean;
  showDate: boolean;
  layouts: SlideLayoutType[];
}

export interface CommentReply {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface CommentThread {
  id: string;
  slideId: string;
  objectId?: string;
  authorId: string;
  authorName: string;
  text: string;
  resolved: boolean;
  createdAt: string;
  replies: CommentReply[];
}

export type PermissionRole = 'owner' | 'editor' | 'commenter' | 'viewer';

export interface PermissionEntry {
  id: string;
  email: string;
  name: string;
  role: PermissionRole;
  addedAt: string;
}

export interface RevisionEntry {
  id: string;
  label: string;
  authorName: string;
  createdAt: string;
  snapshot: string; // serialized slides + theme JSON
}

export interface Presentation {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  folderId: string | null;
  aspectRatio: AspectRatioPreset;
  width: number;
  height: number;
  themeId: string;
  masters: SlideMaster[];
  slides: Slide[];
  sections: SlideSection[];
  comments: CommentThread[];
  permissions: PermissionEntry[];
  revisions: RevisionEntry[];
  shareLinkEnabled: boolean;
  shareLinkRole: PermissionRole;
  isFavorite: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt?: string;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: string;
}

export type RibbonTab =
  | 'File'
  | 'Home'
  | 'Insert'
  | 'Design'
  | 'Transitions'
  | 'Animations'
  | 'Slide Show'
  | 'Review'
  | 'View'
  | 'AI'
  | 'Help';

export type WorkspaceViewMode =
  | 'normal'
  | 'slide_sorter'
  | 'reading'
  | 'outline'
  | 'slide_master'
  | 'notes';

export type RightPanelTab =
  | 'format'
  | 'slide'
  | 'animations'
  | 'transitions'
  | 'selection'
  | 'comments'
  | 'ai'
  | null;

export type SyncStatus = 'saved' | 'saving' | 'offline' | 'synchronizing' | 'sync_failed';

export type AIProviderType = 'gemini' | 'groq' | 'openrouter' | 'ollama';

export interface AIConfig {
  enabled: boolean;
  provider: AIProviderType;
  model: string;
  apiKey: string;
  ollamaUrl: string;
  dailyLimit: number;
  dailyUsed: number;
  maxTokens: number;
}

