import React, { useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  BookOpen,
  CaseSensitive,
  CheckSquare,
  ChevronDown,
  Clipboard,
  Copy,
  Download,
  Eraser,
  FilePlus,
  FileSpreadsheet,
  FileText,
  FlipHorizontal,
  FlipVertical,
  FolderOpen,
  Group,
  Highlighter,
  Image as ImageIcon,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Keyboard,
  Layers,
  Layout,
  LayoutGrid,
  Link,
  List,
  ListOrdered,
  Lock,
  Maximize,
  MessageSquare,
  Monitor,
  Music,
  Network,
  Paintbrush,
  Palette,
  Play,
  Plus,
  Presentation as PresIcon,
  Printer,
  RotateCcw,
  RotateCw,
  Ruler,
  Save,
  Scissors,
  Search,
  Shapes,
  Sparkles,
  Square,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Trash2,
  Type,
  Underline,
  Ungroup,
  Upload,
  Video,
  Wand2,
} from 'lucide-react';
import { usePresentationStore } from '../../store/usePresentationStore';
import {
  AnimationCategory,
  AnimationEffect,
  ChartKind,
  DiagramKind,
  RibbonTab,
  ShapeKind,
  SlideLayoutType,
  TransitionEffect,
} from '../../types/presentation';
import { THEMES, getThemeById } from '../../data/themes';
import { createDiagramTemplate, defaultTextStyle, uid } from '../../data/layouts';
import { exportAsJSON, exportAsPPTX } from '../../services/exportService';
import { importFromFile } from '../../services/importService';
import { brandConfig } from '../../config/brand';

const TABS: RibbonTab[] = [
  'File',
  'Home',
  'Insert',
  'Design',
  'Transitions',
  'Animations',
  'Slide Show',
  'Review',
  'View',
  'AI',
  'Help',
];

const SHAPES: Array<{ kind: ShapeKind; label: string }> = [
  { kind: 'rectangle', label: 'Rectangle' },
  { kind: 'rounded_rectangle', label: 'Rounded Rect' },
  { kind: 'circle', label: 'Circle' },
  { kind: 'ellipse', label: 'Ellipse' },
  { kind: 'triangle', label: 'Triangle' },
  { kind: 'diamond', label: 'Diamond' },
  { kind: 'arrow_right', label: 'Arrow Right' },
  { kind: 'arrow_left', label: 'Arrow Left' },
  { kind: 'arrow_up', label: 'Arrow Up' },
  { kind: 'arrow_down', label: 'Arrow Down' },
  { kind: 'line', label: 'Line' },
  { kind: 'connector', label: 'Connector' },
  { kind: 'star', label: 'Star' },
  { kind: 'callout', label: 'Callout' },
  { kind: 'flowchart_process', label: 'Flow Process' },
  { kind: 'flowchart_decision', label: 'Flow Decision' },
  { kind: 'flowchart_terminator', label: 'Flow Terminator' },
  { kind: 'hexagon', label: 'Hexagon' },
  { kind: 'pentagon', label: 'Pentagon' },
];

const CHARTS: Array<{ kind: ChartKind; label: string }> = [
  { kind: 'column', label: 'Column Chart' },
  { kind: 'bar', label: 'Bar Chart' },
  { kind: 'line', label: 'Line Chart' },
  { kind: 'pie', label: 'Pie Chart' },
  { kind: 'doughnut', label: 'Doughnut Chart' },
  { kind: 'area', label: 'Area Chart' },
  { kind: 'scatter', label: 'Scatter Chart' },
  { kind: 'radar', label: 'Radar Chart' },
  { kind: 'stacked_bar', label: 'Stacked Bar' },
];

const DIAGRAMS: Array<{ kind: DiagramKind; label: string }> = [
  { kind: 'org_chart', label: 'Organization Chart' },
  { kind: 'process', label: 'Process Diagram' },
  { kind: 'flowchart', label: 'Flowchart' },
  { kind: 'timeline', label: 'Timeline' },
  { kind: 'cycle', label: 'Cycle Diagram' },
  { kind: 'hierarchy', label: 'Hierarchy' },
  { kind: 'relationship', label: 'Relationship' },
  { kind: 'pyramid', label: 'Pyramid' },
  { kind: 'venn', label: 'Venn Diagram' },
  { kind: 'mind_map', label: 'Mind Map' },
];

const TRANSITIONS: TransitionEffect[] = [
  'none',
  'fade',
  'push',
  'wipe',
  'split',
  'reveal',
  'cover',
  'uncover',
  'zoom',
  'dissolve',
];

const LAYOUTS: Array<{ id: SlideLayoutType; label: string }> = [
  { id: 'title', label: 'Title Slide' },
  { id: 'title_content', label: 'Title & Content' },
  { id: 'section_header', label: 'Section Header' },
  { id: 'two_column', label: 'Two Column' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'picture_caption', label: 'Picture & Caption' },
  { id: 'title_only', label: 'Title Only' },
  { id: 'blank', label: 'Blank' },
];

export const Ribbon: React.FC<{
  onOpenAccessibility?: () => void;
  onOpenRevisions?: () => void;
  onOpenRecording?: () => void;
  onOpenRehearse?: () => void;
}> = ({ onOpenAccessibility, onOpenRevisions, onOpenRecording, onOpenRehearse }) => {
  const store = usePresentationStore();
  const {
    activePresentation,
    activeSlideId,
    selectedObjectIds,
    activeRibbonTab,
    rightPanelTab,
    viewMode,
    showRulers,
    showGrid,
    showGuides,
    snapToGrid,
    snapToObjects,
    formatPainterStyle,
    setRibbonTab,
    setRightPanelTab,
    setViewMode,
    addSlide,
    duplicateSlide,
    deleteSlide,
    changeSlideLayout,
    resetSlideLayout,
    addSection,
    addObject,
    updateObject,
    copySelectedObjects,
    cutSelectedObjects,
    pasteObjects,
    captureFormatPainter,
    bringToFront,
    sendToBack,
    alignSelectedObjects,
    distributeSelectedObjects,
    groupSelectedObjects,
    ungroupSelectedObjects,
    toggleLockObject,
    applyTheme,
    setSlideDimensions,
    updateSlide,
    applyTransitionToAll,
    addAnimation,
    startPresentation,
    toggleRulers,
    toggleGrid,
    toggleGuides,
    toggleSnapToGrid,
    toggleSnapToObjects,
    setFullScreenEdit,
    setZoom,
    setModal,
    saveNow,
    closePresentation,
    importPresentationData,
  } = store;

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  if (!activePresentation) return null;

  const activeSlide = activePresentation.slides.find((s) => s.id === activeSlideId);
  const selectedObj = activeSlide?.objects.find((o) => o.id === selectedObjectIds[0]);
  const textStyle = selectedObj?.textData?.style;
  const theme = getThemeById(activePresentation.themeId);

  const updateTextStyle = (patch: Partial<NonNullable<typeof textStyle>>) => {
    if (!selectedObj?.textData) return;
    updateObject(selectedObj.id, {
      textData: {
        ...selectedObj.textData,
        style: { ...selectedObj.textData.style, ...patch },
      },
    });
  };

  const insertShape = (kind: ShapeKind) => {
    addObject({
      type: 'shape',
      name: kind.replace('_', ' '),
      x: 440,
      y: 220,
      width: kind === 'line' ? 280 : 200,
      height: kind === 'line' ? 16 : 140,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 1,
      flipX: false,
      flipY: false,
      shapeData: {
        kind,
        fill: theme.accentColor,
        stroke: theme.primaryColor,
        strokeWidth: 2,
        cornerRadius: kind === 'rounded_rectangle' ? 14 : 0,
      },
    });
    setOpenMenu(null);
  };

  const insertTable = (rows = 3, cols = 4) => {
    const cells = Array.from({ length: rows }).map((_, r) =>
      Array.from({ length: cols }).map((__, c) => ({
        id: uid('cell'),
        text: r === 0 ? `Header ${c + 1}` : `Cell ${r},${c + 1}`,
        bgColor: r === 0 ? theme.primaryColor : '#FFFFFF',
        textColor: r === 0 ? '#FFFFFF' : '#242424',
        bold: r === 0,
        align: 'left' as const,
      }))
    );
    addObject({
      type: 'table',
      name: 'Table',
      x: 220,
      y: 180,
      width: 680,
      height: 240,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 1,
      flipX: false,
      flipY: false,
      tableData: {
        rows,
        cols,
        colWidths: Array(cols).fill(170),
        rowHeights: Array(rows).fill(52),
        borderColor: '#CBD5E1',
        borderWidth: 1,
        cells,
      },
    });
  };

  const insertChart = (kind: ChartKind) => {
    addObject({
      type: 'chart',
      name: `${kind} chart`,
      x: 280,
      y: 160,
      width: 580,
      height: 380,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 1,
      flipX: false,
      flipY: false,
      chartData: {
        kind,
        title: 'Quarterly Performance',
        showLegend: true,
        showGrid: true,
        showValues: true,
        categories: ['Q1', 'Q2', 'Q3', 'Q4'],
        series: [
          { name: '2025', color: theme.primaryColor, values: [42, 58, 65, 81] },
          { name: '2026', color: theme.accentColor, values: [54, 72, 86, 98] },
        ],
      },
    });
    setOpenMenu(null);
  };

  const insertDiagram = (kind: DiagramKind) => {
    addObject({
      type: 'diagram',
      name: `${kind.replace('_', ' ')} diagram`,
      x: 200,
      y: 170,
      width: 720,
      height: 330,
      rotation: 0,
      locked: false,
      visible: true,
      opacity: 1,
      flipX: false,
      flipY: false,
      diagramData: createDiagramTemplate(kind, theme.accentColor),
    });
    setOpenMenu(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      addObject({
        type: 'image',
        name: file.name,
        x: 340,
        y: 160,
        width: 460,
        height: 320,
        rotation: 0,
        locked: false,
        visible: true,
        opacity: 1,
        flipX: false,
        flipY: false,
        altText: file.name,
        imageData: {
          src,
          brightness: 100,
          contrast: 100,
          borderColor: '#DADCE0',
          borderWidth: 0,
          maintainAspectRatio: true,
        },
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await importFromFile(file, store.user.id, store.user.name);
      await importPresentationData(result.presentation);
      if (result.warnings.length > 0) {
        alert(`Imported with notes:\n• ${result.warnings.join('\n• ')}`);
      }
    } catch (err) {
      alert(`Import failed: ${(err as Error).message}`);
    }
    e.target.value = '';
  };

  const triggerAnimation = (category: AnimationCategory, effect: AnimationEffect) => {
    if (!activeSlide || !selectedObj) {
      alert('Select an object on the slide first to add an animation.');
      return;
    }
    addAnimation(activeSlide.id, {
      objectId: selectedObj.id,
      objectName: selectedObj.name,
      category,
      effect,
      trigger: 'on_click',
      duration: 600,
      delay: 0,
      repeat: 1,
      direction: 'left',
    });
    setRightPanelTab('animations');
  };

  const RibbonBtn: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
  }> = ({ icon, label, onClick, active, disabled }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center px-2 py-1 rounded text-[11px] min-w-[48px] transition-colors disabled:opacity-35 ${
        active
          ? 'bg-[#FCECE6] text-[#C4512D] font-medium'
          : 'text-[#242424] hover:bg-[#F3F4F6]'
      }`}
    >
      {icon}
      <span className="mt-0.5 leading-tight whitespace-nowrap">{label}</span>
    </button>
  );

  const GroupBox: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="flex flex-col justify-between px-2.5 border-r border-[#DADCE0] last:border-r-0 h-full">
      <div className="flex items-center gap-1 flex-1">{children}</div>
      <div className="text-[10px] text-[#616161] text-center leading-none pb-0.5">{title}</div>
    </div>
  );

  return (
    <div className="bg-white border-b border-[#DADCE0] select-none shrink-0 z-20">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".pptx,.json,.md,.txt"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* Tab Strip */}
      <div className="flex items-center px-3 border-b border-[#ECEEF1] gap-1 h-8 bg-[#FAFAFA]">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setRibbonTab(tab);
              setOpenMenu(null);
            }}
            className={`px-3 h-full text-xs font-medium border-b-2 transition-colors ${
              activeRibbonTab === tab
                ? 'border-[#C4512D] text-[#C4512D] bg-white'
                : 'border-transparent text-[#616161] hover:text-[#242424] hover:bg-[#F3F4F6]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Ribbon Toolbar Content */}
      <div className="h-[72px] px-2 py-1 flex items-center overflow-x-auto bg-white">
        {activeRibbonTab === 'File' && (
          <>
            <GroupBox title="Presentation">
              <RibbonBtn icon={<FolderOpen className="w-4 h-4" />} label="Dashboard" onClick={closePresentation} />
              <RibbonBtn icon={<FilePlus className="w-4 h-4" />} label="New Blank" onClick={() => store.createBlankPresentation()} />
              <RibbonBtn icon={<Save className="w-4 h-4" />} label="Save Now" onClick={saveNow} />
            </GroupBox>
            <GroupBox title="Import & Export">
              <RibbonBtn icon={<Upload className="w-4 h-4" />} label="Import File" onClick={() => importInputRef.current?.click()} />
              <RibbonBtn icon={<Download className="w-4 h-4" />} label="Export PPTX" onClick={() => exportAsPPTX(activePresentation)} />
              <RibbonBtn icon={<FileText className="w-4 h-4" />} label="Export / All" onClick={() => setModal('export', true)} />
              <RibbonBtn icon={<FileSpreadsheet className="w-4 h-4" />} label="Save JSON" onClick={() => exportAsJSON(activePresentation)} />
            </GroupBox>
            <GroupBox title="Print & History">
              <RibbonBtn icon={<Printer className="w-4 h-4" />} label="Print" onClick={() => setModal('print', true)} />
              <RibbonBtn icon={<RotateCcw className="w-4 h-4" />} label="Versions" onClick={() => onOpenRevisions?.()} />
            </GroupBox>
          </>
        )}

        {activeRibbonTab === 'Home' && (
          <>
            <GroupBox title="Clipboard">
              <RibbonBtn icon={<Clipboard className="w-4 h-4" />} label="Paste" onClick={() => pasteObjects(false)} />
              <RibbonBtn icon={<Scissors className="w-4 h-4" />} label="Cut" onClick={cutSelectedObjects} disabled={selectedObjectIds.length === 0} />
              <RibbonBtn icon={<Copy className="w-4 h-4" />} label="Copy" onClick={copySelectedObjects} disabled={selectedObjectIds.length === 0} />
              <RibbonBtn
                icon={<Paintbrush className="w-4 h-4" />}
                label="Format"
                active={Boolean(formatPainterStyle)}
                onClick={captureFormatPainter}
                disabled={selectedObjectIds.length === 0}
              />
            </GroupBox>

            <GroupBox title="Slides">
              <RibbonBtn icon={<Plus className="w-4 h-4 text-[#C4512D]" />} label="New Slide" onClick={() => addSlide('title_content')} />
              <div className="relative">
                <RibbonBtn
                  icon={<Layout className="w-4 h-4" />}
                  label="Layout"
                  onClick={() => setOpenMenu(openMenu === 'layout' ? null : 'layout')}
                />
                {openMenu === 'layout' && activeSlide && (
                  <div className="fixed mt-1 w-44 bg-white border border-[#DADCE0] rounded shadow-lg py-1 z-50">
                    {LAYOUTS.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          changeSlideLayout(activeSlide.id, l.id);
                          setOpenMenu(null);
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#F3F4F6]"
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <RibbonBtn
                icon={<RotateCcw className="w-4 h-4" />}
                label="Reset"
                onClick={() => activeSlide && resetSlideLayout(activeSlide.id)}
              />
              <RibbonBtn icon={<Trash2 className="w-4 h-4" />} label="Delete" onClick={() => deleteSlide()} />
              <RibbonBtn
                icon={<Layers className="w-4 h-4" />}
                label="Section"
                onClick={() => {
                  const name = prompt('Section name:', 'New Section');
                  if (name) addSection(name);
                }}
              />
            </GroupBox>

            <GroupBox title="Font">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <select
                    value={textStyle?.fontFamily || 'Segoe UI'}
                    disabled={!textStyle}
                    onChange={(e) => updateTextStyle({ fontFamily: e.target.value })}
                    className="h-6 text-xs border border-[#DADCE0] rounded px-1.5 bg-white w-28"
                  >
                    <option value="Segoe UI">Segoe UI</option>
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                  <input
                    type="number"
                    min={8}
                    max={144}
                    disabled={!textStyle}
                    value={textStyle?.fontSize || 20}
                    onChange={(e) => updateTextStyle({ fontSize: Number(e.target.value) })}
                    className="h-6 w-12 text-xs border border-[#DADCE0] rounded px-1 text-center"
                  />
                  <input
                    type="color"
                    title="Font Color"
                    disabled={!textStyle}
                    value={textStyle?.color || '#242424'}
                    onChange={(e) => updateTextStyle({ color: e.target.value })}
                    className="w-6 h-6 border border-[#DADCE0] rounded cursor-pointer p-0"
                  />
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={!textStyle}
                    onClick={() =>
                      updateTextStyle({ fontWeight: textStyle?.fontWeight === 'bold' ? 'normal' : 'bold' })
                    }
                    className={`p-1 rounded ${
                      textStyle?.fontWeight === 'bold' ? 'bg-[#FCECE6] text-[#C4512D]' : 'hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!textStyle}
                    onClick={() =>
                      updateTextStyle({ fontStyle: textStyle?.fontStyle === 'italic' ? 'normal' : 'italic' })
                    }
                    className={`p-1 rounded ${
                      textStyle?.fontStyle === 'italic' ? 'bg-[#FCECE6] text-[#C4512D]' : 'hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!textStyle}
                    onClick={() =>
                      updateTextStyle({
                        textDecoration: textStyle?.textDecoration === 'underline' ? 'none' : 'underline',
                      })
                    }
                    className={`p-1 rounded ${
                      textStyle?.textDecoration === 'underline'
                        ? 'bg-[#FCECE6] text-[#C4512D]'
                        : 'hover:bg-[#F3F4F6]'
                    }`}
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!textStyle}
                    onClick={() =>
                      updateTextStyle({
                        textDecoration:
                          textStyle?.textDecoration === 'line-through' ? 'none' : 'line-through',
                      })
                    }
                    className="p-1 rounded hover:bg-[#F3F4F6]"
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!textStyle}
                    title="Subscript"
                    onClick={() => updateTextStyle({ subscript: !textStyle?.subscript, superscript: false })}
                    className="p-1 rounded hover:bg-[#F3F4F6]"
                  >
                    <Subscript className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!textStyle}
                    title="Superscript"
                    onClick={() => updateTextStyle({ superscript: !textStyle?.superscript, subscript: false })}
                    className="p-1 rounded hover:bg-[#F3F4F6]"
                  >
                    <Superscript className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!textStyle}
                    title="Toggle Case"
                    onClick={() => {
                      if (!selectedObj?.textData) return;
                      const txt = selectedObj.textData.text;
                      const next = txt === txt.toUpperCase() ? txt.toLowerCase() : txt.toUpperCase();
                      updateObject(selectedObj.id, {
                        textData: { ...selectedObj.textData, text: next, html: undefined },
                      });
                    }}
                    className="p-1 rounded hover:bg-[#F3F4F6]"
                  >
                    <CaseSensitive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!textStyle}
                    title="Clear Formatting"
                    onClick={() =>
                      updateTextStyle({
                        fontWeight: 'normal',
                        fontStyle: 'normal',
                        textDecoration: 'none',
                        color: '#242424',
                      })
                    }
                    className="p-1 rounded hover:bg-[#F3F4F6]"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </GroupBox>

            <GroupBox title="Paragraph">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-0.5">
                  <button type="button" disabled={!textStyle} onClick={() => updateTextStyle({ textAlign: 'left' })} className="p-1 rounded hover:bg-[#F3F4F6]">
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" disabled={!textStyle} onClick={() => updateTextStyle({ textAlign: 'center' })} className="p-1 rounded hover:bg-[#F3F4F6]">
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" disabled={!textStyle} onClick={() => updateTextStyle({ textAlign: 'right' })} className="p-1 rounded hover:bg-[#F3F4F6]">
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" disabled={!textStyle} onClick={() => updateTextStyle({ textAlign: 'justify' })} className="p-1 rounded hover:bg-[#F3F4F6]">
                    <AlignJustify className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={!selectedObj?.textData}
                    onClick={() => {
                      if (!selectedObj?.textData) return;
                      const lines = selectedObj.textData.text.split('\n').map((l) => (l.startsWith('• ') ? l : `• ${l}`));
                      updateObject(selectedObj.id, {
                        textData: { ...selectedObj.textData, text: lines.join('\n'), html: undefined },
                      });
                    }}
                    className="p-1 rounded hover:bg-[#F3F4F6]"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!selectedObj?.textData}
                    onClick={() => {
                      if (!selectedObj?.textData) return;
                      const lines = selectedObj.textData.text.split('\n').map((l, i) => `${i + 1}. ${l.replace(/^\d+\.\s*/, '')}`);
                      updateObject(selectedObj.id, {
                        textData: { ...selectedObj.textData, text: lines.join('\n'), html: undefined },
                      });
                    }}
                    className="p-1 rounded hover:bg-[#F3F4F6]"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" disabled={!textStyle} onClick={() => updateTextStyle({ indentLevel: Math.max(0, (textStyle?.indentLevel || 0) - 1) })} className="p-1 rounded hover:bg-[#F3F4F6]">
                    <IndentDecrease className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" disabled={!textStyle} onClick={() => updateTextStyle({ indentLevel: (textStyle?.indentLevel || 0) + 1 })} className="p-1 rounded hover:bg-[#F3F4F6]">
                    <IndentIncrease className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </GroupBox>

            <GroupBox title="Arrange">
              <RibbonBtn icon={<Layers className="w-4 h-4" />} label="Front" onClick={() => selectedObj && bringToFront(selectedObj.id)} disabled={!selectedObj} />
              <RibbonBtn icon={<Layers className="w-4 h-4 opacity-50" />} label="Back" onClick={() => selectedObj && sendToBack(selectedObj.id)} disabled={!selectedObj} />
              <RibbonBtn icon={<AlignCenter className="w-4 h-4" />} label="Center" onClick={() => alignSelectedObjects('center')} disabled={selectedObjectIds.length === 0} />
              <RibbonBtn icon={<Group className="w-4 h-4" />} label="Group" onClick={groupSelectedObjects} disabled={selectedObjectIds.length < 2} />
              <RibbonBtn icon={<Ungroup className="w-4 h-4" />} label="Ungroup" onClick={ungroupSelectedObjects} disabled={selectedObjectIds.length === 0} />
              <RibbonBtn icon={<RotateCw className="w-4 h-4" />} label="Rotate" onClick={() => selectedObj && updateObject(selectedObj.id, { rotation: (selectedObj.rotation + 90) % 360 })} disabled={!selectedObj} />
              <RibbonBtn icon={<FlipHorizontal className="w-4 h-4" />} label="Flip H" onClick={() => selectedObj && updateObject(selectedObj.id, { flipX: !selectedObj.flipX })} disabled={!selectedObj} />
              <RibbonBtn icon={<Lock className="w-4 h-4" />} label="Lock" onClick={() => selectedObj && toggleLockObject(selectedObj.id)} disabled={!selectedObj} />
            </GroupBox>
          </>
        )}

        {activeRibbonTab === 'Insert' && (
          <>
            <GroupBox title="Text & Media">
              <RibbonBtn
                icon={<Type className="w-4 h-4 text-[#C4512D]" />}
                label="Text Box"
                onClick={() =>
                  addObject({
                    type: 'text',
                    name: 'Text Box',
                    x: 340,
                    y: 260,
                    width: 420,
                    height: 110,
                    rotation: 0,
                    locked: false,
                    visible: true,
                    opacity: 1,
                    flipX: false,
                    flipY: false,
                    textData: {
                      text: 'Double-click to edit text',
                      style: defaultTextStyle({ fontFamily: theme.bodyFont, color: theme.textColor }),
                      padding: 12,
                    },
                  })
                }
              />
              <RibbonBtn icon={<ImageIcon className="w-4 h-4" />} label="Image" onClick={() => imageInputRef.current?.click()} />
              <RibbonBtn
                icon={<Music className="w-4 h-4" />}
                label="Audio"
                onClick={() => {
                  const url = prompt('Enter audio URL (MP3/WAV/OGG):');
                  if (!url) return;
                  addObject({
                    type: 'audio',
                    name: 'Audio Clip',
                    x: 420,
                    y: 300,
                    width: 340,
                    height: 64,
                    rotation: 0,
                    locked: false,
                    visible: true,
                    opacity: 1,
                    flipX: false,
                    flipY: false,
                    mediaData: { src: url, title: 'Audio', autoplay: false, loop: false },
                  });
                }}
              />
              <RibbonBtn
                icon={<Video className="w-4 h-4" />}
                label="Video"
                onClick={() => {
                  const url = prompt('Enter video URL (MP4/WebM):');
                  if (!url) return;
                  addObject({
                    type: 'video',
                    name: 'Video Clip',
                    x: 320,
                    y: 160,
                    width: 520,
                    height: 300,
                    rotation: 0,
                    locked: false,
                    visible: true,
                    opacity: 1,
                    flipX: false,
                    flipY: false,
                    mediaData: { src: url, title: 'Video', autoplay: false, loop: false },
                  });
                }}
              />
            </GroupBox>

            <GroupBox title="Illustrations">
              <div className="relative">
                <RibbonBtn
                  icon={<Shapes className="w-4 h-4" />}
                  label="Shapes ▾"
                  onClick={() => setOpenMenu(openMenu === 'shapes' ? null : 'shapes')}
                />
                {openMenu === 'shapes' && (
                  <div className="fixed mt-1 w-64 bg-white border border-[#DADCE0] rounded shadow-lg p-2 grid grid-cols-2 gap-1 z-50 max-h-72 overflow-y-auto">
                    {SHAPES.map((s) => (
                      <button
                        key={s.kind}
                        type="button"
                        onClick={() => insertShape(s.kind)}
                        className="px-2 py-1.5 text-left text-xs hover:bg-[#FCECE6] hover:text-[#C4512D] rounded"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <RibbonBtn icon={<Table className="w-4 h-4" />} label="Table" onClick={() => insertTable(3, 4)} />

              <div className="relative">
                <RibbonBtn
                  icon={<FileSpreadsheet className="w-4 h-4" />}
                  label="Chart ▾"
                  onClick={() => setOpenMenu(openMenu === 'charts' ? null : 'charts')}
                />
                {openMenu === 'charts' && (
                  <div className="fixed mt-1 w-48 bg-white border border-[#DADCE0] rounded shadow-lg py-1 z-50">
                    {CHARTS.map((c) => (
                      <button
                        key={c.kind}
                        type="button"
                        onClick={() => insertChart(c.kind)}
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#FCECE6] hover:text-[#C4512D]"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <RibbonBtn
                  icon={<Network className="w-4 h-4" />}
                  label="Diagram ▾"
                  onClick={() => setOpenMenu(openMenu === 'diagrams' ? null : 'diagrams')}
                />
                {openMenu === 'diagrams' && (
                  <div className="fixed mt-1 w-48 bg-white border border-[#DADCE0] rounded shadow-lg py-1 z-50">
                    {DIAGRAMS.map((d) => (
                      <button
                        key={d.kind}
                        type="button"
                        onClick={() => insertDiagram(d.kind)}
                        className="w-full px-3 py-1.5 text-left text-xs hover:bg-[#FCECE6] hover:text-[#C4512D]"
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </GroupBox>

            <GroupBox title="Symbols & Links">
              <RibbonBtn
                icon={<span className="text-sm font-serif font-bold">∑</span>}
                label="Equation"
                onClick={() => {
                  const eq = prompt('Enter mathematical expression:', 'E = mc²');
                  if (!eq) return;
                  addObject({
                    type: 'equation',
                    name: 'Equation',
                    x: 420,
                    y: 280,
                    width: 320,
                    height: 80,
                    rotation: 0,
                    locked: false,
                    visible: true,
                    opacity: 1,
                    flipX: false,
                    flipY: false,
                    equationData: { latex: eq, displayText: eq, fontSize: 32, color: theme.primaryColor },
                  });
                }}
              />
              <RibbonBtn
                icon={<Link className="w-4 h-4" />}
                label="Web Embed"
                onClick={() => {
                  const url = prompt('Enter HTTPS URL to embed:');
                  if (!url || !url.startsWith('https://')) return;
                  addObject({
                    type: 'embed',
                    name: 'Web Embed',
                    x: 240,
                    y: 120,
                    width: 720,
                    height: 440,
                    rotation: 0,
                    locked: false,
                    visible: true,
                    opacity: 1,
                    flipX: false,
                    flipY: false,
                    embedData: { url, title: 'Embedded Content' },
                  });
                }}
              />
              <RibbonBtn
                icon={<span className="text-xs font-bold">#</span>}
                label="Slide #"
                onClick={() =>
                  addObject({
                    type: 'text',
                    name: 'Slide Number',
                    x: activePresentation.width - 100,
                    y: activePresentation.height - 54,
                    width: 72,
                    height: 36,
                    rotation: 0,
                    locked: false,
                    visible: true,
                    opacity: 1,
                    flipX: false,
                    flipY: false,
                    placeholderRole: 'slideNumber',
                    textData: {
                      text: `${(activeSlide?.order ?? 0) + 1}`,
                      style: defaultTextStyle({ fontSize: 14, textAlign: 'right', color: theme.mutedTextColor }),
                      padding: 4,
                    },
                  })
                }
              />
            </GroupBox>
          </>
        )}

        {activeRibbonTab === 'Design' && (
          <>
            <GroupBox title="Themes">
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-[540px] py-1">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTheme(t.id)}
                    className={`px-2.5 py-1.5 rounded border text-left shrink-0 transition-all ${
                      activePresentation.themeId === t.id
                        ? 'border-[#C4512D] ring-1 ring-[#C4512D]'
                        : 'border-[#DADCE0] hover:border-[#616161]'
                    }`}
                    style={{ backgroundColor: t.backgroundColor, color: t.textColor }}
                  >
                    <div className="text-[11px] font-semibold leading-tight">{t.name}</div>
                    <div className="flex gap-1 mt-1">
                      <span className="w-3 h-1.5 rounded-xs" style={{ backgroundColor: t.primaryColor }} />
                      <span className="w-3 h-1.5 rounded-xs" style={{ backgroundColor: t.accentColor }} />
                    </div>
                  </button>
                ))}
              </div>
            </GroupBox>
            <GroupBox title="Slide Size">
              <RibbonBtn icon={<Monitor className="w-4 h-4" />} label="16:9 Wide" active={activePresentation.aspectRatio === '16:9'} onClick={() => setSlideDimensions('16:9', 1280, 720)} />
              <RibbonBtn icon={<Square className="w-4 h-4" />} label="4:3 Std" active={activePresentation.aspectRatio === '4:3'} onClick={() => setSlideDimensions('4:3', 960, 720)} />
              <RibbonBtn icon={<Layout className="w-4 h-4" />} label="Portrait" active={activePresentation.aspectRatio === 'portrait'} onClick={() => setSlideDimensions('portrait', 720, 1080)} />
            </GroupBox>
            <GroupBox title="Customize">
              <RibbonBtn icon={<Palette className="w-4 h-4" />} label="Background" onClick={() => setRightPanelTab('slide')} />
              <RibbonBtn icon={<Layers className="w-4 h-4" />} label="Slide Master" active={viewMode === 'slide_master'} onClick={() => setViewMode('slide_master')} />
            </GroupBox>
          </>
        )}

        {activeRibbonTab === 'Transitions' && activeSlide && (
          <>
            <GroupBox title="Transition to This Slide">
              <div className="flex items-center gap-1 overflow-x-auto max-w-[540px]">
                {TRANSITIONS.map((eff) => (
                  <button
                    key={eff}
                    type="button"
                    onClick={() =>
                      updateSlide(activeSlide.id, {
                        transition: { ...activeSlide.transition, effect: eff },
                      })
                    }
                    className={`px-2.5 py-1.5 rounded border text-xs capitalize shrink-0 ${
                      activeSlide.transition.effect === eff
                        ? 'bg-[#FCECE6] border-[#C4512D] text-[#C4512D] font-medium'
                        : 'border-[#DADCE0] hover:bg-[#F3F4F6]'
                    }`}
                  >
                    {eff}
                  </button>
                ))}
              </div>
            </GroupBox>
            <GroupBox title="Timing">
              <RibbonBtn icon={<Play className="w-4 h-4" />} label="Options" onClick={() => setRightPanelTab('transitions')} />
              <RibbonBtn
                icon={<CheckSquare className="w-4 h-4" />}
                label="Apply All"
                onClick={() => applyTransitionToAll(activeSlide.transition)}
              />
            </GroupBox>
          </>
        )}

        {activeRibbonTab === 'Animations' && (
          <>
            <GroupBox title="Entrance">
              <RibbonBtn icon={<Sparkles className="w-4 h-4 text-emerald-600" />} label="Appear" onClick={() => triggerAnimation('entrance', 'appear')} />
              <RibbonBtn icon={<Sparkles className="w-4 h-4 text-emerald-600" />} label="Fade In" onClick={() => triggerAnimation('entrance', 'fade_in')} />
              <RibbonBtn icon={<Sparkles className="w-4 h-4 text-emerald-600" />} label="Fly In" onClick={() => triggerAnimation('entrance', 'fly_in')} />
              <RibbonBtn icon={<Sparkles className="w-4 h-4 text-emerald-600" />} label="Zoom In" onClick={() => triggerAnimation('entrance', 'zoom_in')} />
            </GroupBox>
            <GroupBox title="Emphasis">
              <RibbonBtn icon={<Wand2 className="w-4 h-4 text-amber-600" />} label="Pulse" onClick={() => triggerAnimation('emphasis', 'pulse')} />
              <RibbonBtn icon={<RotateCw className="w-4 h-4 text-amber-600" />} label="Spin" onClick={() => triggerAnimation('emphasis', 'spin')} />
              <RibbonBtn icon={<Maximize className="w-4 h-4 text-amber-600" />} label="Grow" onClick={() => triggerAnimation('emphasis', 'grow')} />
            </GroupBox>
            <GroupBox title="Exit & Pane">
              <RibbonBtn icon={<Sparkles className="w-4 h-4 text-red-600" />} label="Fade Out" onClick={() => triggerAnimation('exit', 'fade_out')} />
              <RibbonBtn icon={<Sparkles className="w-4 h-4 text-red-600" />} label="Zoom Out" onClick={() => triggerAnimation('exit', 'zoom_out')} />
              <RibbonBtn
                icon={<Layers className="w-4 h-4 text-[#C4512D]" />}
                label="Anim Pane"
                active={rightPanelTab === 'animations'}
                onClick={() => setRightPanelTab('animations')}
              />
            </GroupBox>
          </>
        )}

        {activeRibbonTab === 'Slide Show' && (
          <>
            <GroupBox title="Start Slide Show">
              <RibbonBtn icon={<Play className="w-4 h-4 text-[#C4512D]" />} label="From Start" onClick={() => startPresentation(false, false)} />
              <RibbonBtn icon={<PresIcon className="w-4 h-4 text-[#C4512D]" />} label="From Current" onClick={() => startPresentation(true, false)} />
              <RibbonBtn icon={<Monitor className="w-4 h-4" />} label="Presenter View" onClick={() => startPresentation(true, true)} />
            </GroupBox>
            <GroupBox title="Rehearse & Record">
              <RibbonBtn icon={<RotateCw className="w-4 h-4" />} label="Rehearse" onClick={() => onOpenRehearse?.()} />
              <RibbonBtn icon={<Video className="w-4 h-4" />} label="Record" onClick={() => onOpenRecording?.()} />
            </GroupBox>
          </>
        )}

        {activeRibbonTab === 'Review' && (
          <>
            <GroupBox title="Proofing & Search">
              <RibbonBtn icon={<Search className="w-4 h-4" />} label="Find & Replace" onClick={() => setModal('findReplace', true)} />
              <RibbonBtn icon={<CheckSquare className="w-4 h-4" />} label="Accessibility" onClick={() => onOpenAccessibility?.()} />
            </GroupBox>
            <GroupBox title="Comments & History">
              <RibbonBtn icon={<MessageSquare className="w-4 h-4" />} label="Comments" active={rightPanelTab === 'comments'} onClick={() => setRightPanelTab('comments')} />
              <RibbonBtn icon={<RotateCcw className="w-4 h-4" />} label="Version History" onClick={() => onOpenRevisions?.()} />
            </GroupBox>
          </>
        )}

        {activeRibbonTab === 'View' && (
          <>
            <GroupBox title="Presentation Views">
              <RibbonBtn icon={<Monitor className="w-4 h-4" />} label="Normal" active={viewMode === 'normal'} onClick={() => setViewMode('normal')} />
              <RibbonBtn icon={<LayoutGrid className="w-4 h-4" />} label="Slide Sorter" active={viewMode === 'slide_sorter'} onClick={() => setViewMode('slide_sorter')} />
              <RibbonBtn icon={<BookOpen className="w-4 h-4" />} label="Reading" active={viewMode === 'reading'} onClick={() => setViewMode('reading')} />
              <RibbonBtn icon={<List className="w-4 h-4" />} label="Outline" active={viewMode === 'outline'} onClick={() => setViewMode('outline')} />
              <RibbonBtn icon={<Layers className="w-4 h-4" />} label="Slide Master" active={viewMode === 'slide_master'} onClick={() => setViewMode('slide_master')} />
            </GroupBox>
            <GroupBox title="Show">
              <RibbonBtn icon={<Ruler className="w-4 h-4" />} label="Rulers" active={showRulers} onClick={toggleRulers} />
              <RibbonBtn icon={<LayoutGrid className="w-4 h-4" />} label="Gridlines" active={showGrid} onClick={toggleGrid} />
              <RibbonBtn icon={<AlignCenter className="w-4 h-4" />} label="Guides" active={showGuides} onClick={toggleGuides} />
              <RibbonBtn icon={<CheckSquare className="w-4 h-4" />} label="Snap Grid" active={snapToGrid} onClick={toggleSnapToGrid} />
              <RibbonBtn icon={<CheckSquare className="w-4 h-4" />} label="Snap Obj" active={snapToObjects} onClick={toggleSnapToObjects} />
            </GroupBox>
            <GroupBox title="Window">
              <RibbonBtn icon={<Layers className="w-4 h-4" />} label="Selection Pane" active={rightPanelTab === 'selection'} onClick={() => setRightPanelTab('selection')} />
              <RibbonBtn icon={<Maximize className="w-4 h-4" />} label="Fit Window" onClick={() => setZoom(0.72)} />
              <RibbonBtn icon={<Maximize className="w-4 h-4" />} label="Full Screen" onClick={() => setFullScreenEdit(true)} />
            </GroupBox>
          </>
        )}

        {activeRibbonTab === 'AI' && (
          <>
            <GroupBox title="AI Presentation Assistant">
              <RibbonBtn icon={<Sparkles className="w-4 h-4 text-[#C4512D]" />} label="Open AI Panel" active={rightPanelTab === 'ai'} onClick={() => setRightPanelTab('ai')} />
            </GroupBox>
          </>
        )}

        {activeRibbonTab === 'Help' && (
          <>
            <GroupBox title="Support & Reference">
              <RibbonBtn icon={<Keyboard className="w-4 h-4" />} label="Shortcuts" onClick={() => setModal('shortcuts', true)} />
              <RibbonBtn
                icon={<PresIcon className="w-4 h-4 text-[#C4512D]" />}
                label="About"
                onClick={() =>
                  alert(`${brandConfig.productName} Presentation Editor\n${brandConfig.tagline}\nVersion 1.0.0`)
                }
              />
            </GroupBox>
          </>
        )}
      </div>
    </div>
  );
};

