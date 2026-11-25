import JSZip from 'jszip';
import { Presentation, Slide, SlideBackground, SlideObject } from '../types/presentation';
import { createDefaultMaster, getThemeById } from '../data/themes';
import { createSlide, createTextObject, defaultTextStyle, uid } from '../data/layouts';

export interface ImportResult {
  presentation: Presentation;
  warnings: string[];
}

export async function importFromFile(
  file: File,
  ownerId: string,
  ownerName: string
): Promise<ImportResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text) as Presentation;
    const now = new Date().toISOString();
    return {
      presentation: {
        ...parsed,
        id: uid('pres'),
        ownerId,
        ownerName,
        createdAt: now,
        updatedAt: now,
      },
      warnings: [],
    };
  }

  if (ext === 'md' || ext === 'txt') {
    const text = await file.text();
    return importMarkdownOutline(file.name.replace(/\.(md|txt)$/i, ''), text, ownerId, ownerName);
  }

  if (ext === 'pptx') {
    return importPPTX(file, ownerId, ownerName);
  }

  throw new Error(`Unsupported file format: .${ext}`);
}

function importMarkdownOutline(
  title: string,
  content: string,
  ownerId: string,
  ownerName: string
): ImportResult {
  const theme = getThemeById('corporate');
  const blocks = content.split(/^#\s+/m).filter((b) => b.trim().length > 0);
  const slides: Slide[] =
    blocks.length > 0
      ? blocks.map((block, idx) => {
          const lines = block.split('\n');
          const heading = lines[0]?.trim() || `Slide ${idx + 1}`;
          const body = lines.slice(1).join('\n').trim();
          const s = createSlide(idx, 'title_content', theme, 1280, 720, heading);
          if (s.objects[0]?.textData) s.objects[0].textData.text = heading;
          if (s.objects[1]?.textData) s.objects[1].textData.text = body || '• Key point';
          return s;
        })
      : [createSlide(0, 'title', theme, 1280, 720, title)];

  const now = new Date().toISOString();
  return {
    presentation: {
      id: uid('pres'),
      title,
      ownerId,
      ownerName,
      folderId: null,
      aspectRatio: '16:9',
      width: 1280,
      height: 720,
      themeId: theme.id,
      masters: [createDefaultMaster(theme)],
      slides,
      sections: [],
      comments: [],
      permissions: [{ id: uid('perm'), email: 'owner@akashavyom.local', name: ownerName, role: 'owner', addedAt: now }],
      revisions: [],
      shareLinkEnabled: false,
      shareLinkRole: 'viewer',
      isFavorite: false,
      isTrashed: false,
      createdAt: now,
      updatedAt: now,
    },
    warnings: [],
  };
}

type ThemeColorMap = Record<string, string>;

function parseThemeColors(doc: Document): ThemeColorMap {
  const map: ThemeColorMap = {
    dk1: '#000000',
    lt1: '#FFFFFF',
    dk2: '#1F2937',
    lt2: '#F3F4F6',
    tx1: '#000000',
    tx2: '#1F2937',
    bg1: '#FFFFFF',
    bg2: '#F3F4F6',
    accent1: '#C4512D',
    accent2: '#1E3A5F',
    accent3: '#0F766E',
    accent4: '#D97706',
    accent5: '#4F46E5',
    accent6: '#64748B',
  };
  const clrScheme = doc.getElementsByTagName('a:clrScheme')[0];
  if (!clrScheme) return map;

  const keys = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'];
  for (const key of keys) {
    const el = clrScheme.getElementsByTagName(`a:${key}`)[0];
    if (!el) continue;
    const srgb = el.getElementsByTagName('a:srgbClr')[0]?.getAttribute('val');
    const sys = el.getElementsByTagName('a:sysClr')[0]?.getAttribute('lastClr');
    const hex = srgb || sys;
    if (hex) map[key] = `#${hex}`;
  }
  // Map OOXML aliases
  map.tx1 = map.dk1;
  map.tx2 = map.dk2;
  map.bg1 = map.lt1;
  map.bg2 = map.lt2;
  return map;
}

function resolveColorElement(el: Element | undefined, themeColors: ThemeColorMap): string | undefined {
  if (!el) return undefined;
  const srgb = el.getElementsByTagName('a:srgbClr')[0]?.getAttribute('val');
  if (srgb) return `#${srgb}`;
  const scheme = el.getElementsByTagName('a:schemeClr')[0]?.getAttribute('val');
  if (scheme && themeColors[scheme]) return themeColors[scheme];
  return undefined;
}

function extractBackground(doc: Document, themeColors: ThemeColorMap): SlideBackground | null {
  const bg = doc.getElementsByTagName('p:bg')[0];
  if (!bg) return null;

  const bgPr = bg.getElementsByTagName('p:bgPr')[0];
  if (bgPr) {
    const solid = bgPr.getElementsByTagName('a:solidFill')[0];
    const solidColor = resolveColorElement(solid, themeColors);
    if (solidColor) return { type: 'solid', color: solidColor };

    const grad = bgPr.getElementsByTagName('a:gradFill')[0];
    if (grad) {
      const stops = Array.from(grad.getElementsByTagName('a:gs'));
      const c1 = resolveColorElement(stops[0], themeColors) || '#1E293B';
      const c2 = resolveColorElement(stops[stops.length - 1], themeColors) || c1;
      return { type: 'gradient', color: c1, gradientFrom: c1, gradientTo: c2, gradientAngle: 135 };
    }
  }

  const bgRef = bg.getElementsByTagName('p:bgRef')[0];
  if (bgRef) {
    const refColor = resolveColorElement(bgRef, themeColors);
    if (refColor) return { type: 'solid', color: refColor };
  }

  return null;
}

async function parseRels(zip: JSZip, relsPath: string): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const relFile = zip.file(relsPath);
  if (!relFile) return map;
  const xml = await relFile.async('text');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  Array.from(doc.getElementsByTagName('Relationship')).forEach((rel) => {
    const id = rel.getAttribute('Id');
    const target = rel.getAttribute('Target');
    if (id && target) map[id] = target;
  });
  return map;
}

function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

async function importPPTX(
  file: File,
  ownerId: string,
  ownerName: string
): Promise<ImportResult> {
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('PPTX archive exceeds 50 MB safety limit.');
  }
  const zip = await JSZip.loadAsync(file);
  const warnings: string[] = [];
  const parser = new DOMParser();

  // 1. Parse Theme Colors
  let themeColors: ThemeColorMap = parseThemeColors(parser.parseFromString('<root/>', 'application/xml'));
  const themeFile = zip.file('ppt/theme/theme1.xml');
  if (themeFile) {
    const themeDoc = parser.parseFromString(await themeFile.async('text'), 'application/xml');
    themeColors = parseThemeColors(themeDoc);
  }

  // 2. Parse Master Background as fallback
  let masterBg: SlideBackground | null = null;
  const masterFile = zip.file('ppt/slideMasters/slideMaster1.xml');
  if (masterFile) {
    const masterDoc = parser.parseFromString(await masterFile.async('text'), 'application/xml');
    masterBg = extractBackground(masterDoc, themeColors);
  }

  // 3. Discover slide XML files sorted by slide number
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || '0', 10);
      const nb = parseInt(b.match(/\d+/)?.[0] || '0', 10);
      return na - nb;
    });

  if (slidePaths.length === 0) {
    throw new Error('No slides found in PPTX archive.');
  }

  // 4. Read slide size
  let width = 1280;
  let height = 720;
  const presXmlFile = zip.file('ppt/presentation.xml');
  if (presXmlFile) {
    const presXml = await presXmlFile.async('text');
    const doc = parser.parseFromString(presXml, 'application/xml');
    const sldSz = doc.getElementsByTagName('p:sldSz')[0];
    if (sldSz) {
      const cx = parseInt(sldSz.getAttribute('cx') || '0', 10);
      const cy = parseInt(sldSz.getAttribute('cy') || '0', 10);
      if (cx > 0 && cy > 0) {
        width = Math.round((cx / 914400) * 96);
        height = Math.round((cy / 914400) * 96);
      }
    }
  }

  const theme = getThemeById(isDarkHex(masterBg?.color || themeColors.bg1) ? 'dark' : 'corporate');
  const slides: Slide[] = [];

  for (let i = 0; i < slidePaths.length; i++) {
    const slidePath = slidePaths[i];
    const slideFileName = slidePath.split('/').pop()!;
    const rels = await parseRels(zip, `ppt/slides/_rels/${slideFileName}.rels`);

    const xmlStr = await zip.file(slidePath)!.async('text');
    const doc = parser.parseFromString(xmlStr, 'application/xml');
    const slideId = uid('slide');
    const objects: SlideObject[] = [];

    // Resolve background: Slide -> Layout -> Master -> Theme bg1
    let slideBg = extractBackground(doc, themeColors);
    if (!slideBg) {
      const layoutTarget = Object.values(rels).find((t) => t.includes('slideLayouts/'));
      if (layoutTarget) {
        const normalized = layoutTarget.replace('../', 'ppt/');
        const layoutFile = zip.file(normalized);
        if (layoutFile) {
          const layoutDoc = parser.parseFromString(await layoutFile.async('text'), 'application/xml');
          slideBg = extractBackground(layoutDoc, themeColors);
        }
      }
    }
    if (!slideBg) {
      slideBg = masterBg || { type: 'solid', color: themeColors.bg1 || '#FFFFFF' };
    }

    const defaultTextColor = isDarkHex(slideBg.color) ? '#F8FAFC' : themeColors.tx1 || '#242424';

    // Parse Shapes & Text Boxes
    const spElements = Array.from(doc.getElementsByTagName('p:sp'));
    spElements.forEach((sp, spIdx) => {
      const xfrm = sp.getElementsByTagName('a:xfrm')[0];
      const off = xfrm?.getElementsByTagName('a:off')[0];
      const ext = xfrm?.getElementsByTagName('a:ext')[0];
      const x = off ? Math.round((parseInt(off.getAttribute('x') || '0', 10) / 914400) * 96) : 72;
      const y = off ? Math.round((parseInt(off.getAttribute('y') || '0', 10) / 914400) * 96) : 72 + spIdx * 80;
      const w = ext ? Math.max(40, Math.round((parseInt(ext.getAttribute('cx') || '0', 10) / 914400) * 96)) : 800;
      const h = ext ? Math.max(24, Math.round((parseInt(ext.getAttribute('cy') || '0', 10) / 914400) * 96)) : 120;

      // Check shape fill
      const spPr = sp.getElementsByTagName('p:spPr')[0];
      const shapeFill = resolveColorElement(spPr?.getElementsByTagName('a:solidFill')[0], themeColors);
      const ln = spPr?.getElementsByTagName('a:ln')[0];
      const shapeStroke = resolveColorElement(ln?.getElementsByTagName('a:solidFill')[0], themeColors) || 'transparent';
      const prstGeom = spPr?.getElementsByTagName('a:prstGeom')[0]?.getAttribute('prst');

      // Extract text & formatting from first run/paragraph
      const pNodes = Array.from(sp.getElementsByTagName('a:p'));
      const paragraphs = pNodes.map((p) =>
        Array.from(p.getElementsByTagName('a:t'))
          .map((t) => t.textContent || '')
          .join('')
      );
      const text = paragraphs.join('\n').trim();

      const firstRPr =
        sp.getElementsByTagName('a:rPr')[0] ||
        sp.getElementsByTagName('a:defRPr')[0];
      const szAttr = firstRPr?.getAttribute('sz');
      const isTitlePlaceholder = sp.getElementsByTagName('p:ph')[0]?.getAttribute('type') === 'title' ||
        sp.getElementsByTagName('p:ph')[0]?.getAttribute('type') === 'ctrTitle';
      const fontSizePx = szAttr
        ? Math.max(10, Math.round((parseInt(szAttr, 10) / 100) * (96 / 72)))
        : isTitlePlaceholder
        ? 42
        : 20;

      const bold = firstRPr?.getAttribute('b') === '1' || isTitlePlaceholder;
      const italic = firstRPr?.getAttribute('i') === '1';
      const underline = firstRPr?.getAttribute('u') && firstRPr.getAttribute('u') !== 'none';
      const textColor =
        resolveColorElement(firstRPr?.getElementsByTagName('a:solidFill')[0], themeColors) ||
        defaultTextColor;
      const fontFamily = firstRPr?.getElementsByTagName('a:latin')[0]?.getAttribute('typeface') || 'Segoe UI';

      const algnAttr = pNodes[0]?.getElementsByTagName('a:pPr')[0]?.getAttribute('algn');
      const textAlign =
        algnAttr === 'ctr' ? 'center' : algnAttr === 'r' ? 'right' : algnAttr === 'just' ? 'justify' : 'left';

      if (text) {
        objects.push(
          createTextObject(
            slideId,
            text,
            x,
            y,
            w,
            h,
            defaultTextStyle({
              fontSize: fontSizePx,
              fontFamily,
              fontWeight: bold ? 'bold' : 'normal',
              fontStyle: italic ? 'italic' : 'normal',
              textDecoration: underline ? 'underline' : 'none',
              color: textColor,
              textAlign,
            }),
            {
              zIndex: spIdx + 1,
              placeholderRole: isTitlePlaceholder ? 'title' : undefined,
              textData: {
                text,
                padding: 8,
                backgroundColor: shapeFill,
                style: defaultTextStyle({
                  fontSize: fontSizePx,
                  fontFamily,
                  fontWeight: bold ? 'bold' : 'normal',
                  fontStyle: italic ? 'italic' : 'normal',
                  textDecoration: underline ? 'underline' : 'none',
                  color: textColor,
                  textAlign,
                }),
              },
            }
          )
        );
      } else if (shapeFill || prstGeom) {
        objects.push({
          id: uid('obj'),
          slideId,
          type: 'shape',
          name: prstGeom || 'Shape',
          x,
          y,
          width: w,
          height: h,
          rotation: 0,
          zIndex: spIdx + 1,
          locked: false,
          visible: true,
          opacity: 1,
          flipX: false,
          flipY: false,
          shapeData: {
            kind: prstGeom === 'ellipse' ? 'ellipse' : prstGeom === 'roundRect' ? 'rounded_rectangle' : 'rectangle',
            fill: shapeFill || themeColors.accent1,
            stroke: shapeStroke,
            strokeWidth: shapeStroke !== 'transparent' ? 2 : 0,
            cornerRadius: prstGeom === 'roundRect' ? 12 : 0,
          },
        });
      }
    });

    // Parse Embedded Pictures (<p:pic>)
    const pics = Array.from(doc.getElementsByTagName('p:pic'));
    for (let pIdx = 0; pIdx < pics.length; pIdx++) {
      const pic = pics[pIdx];
      const blip = pic.getElementsByTagName('a:blip')[0];
      const rId = blip?.getAttribute('r:embed');
      const target = rId ? rels[rId] : undefined;
      if (!target) continue;

      const mediaPath = target.startsWith('../') ? target.replace('../', 'ppt/') : `ppt/slides/${target}`;
      const mediaFile = zip.file(mediaPath);
      if (!mediaFile) continue;

      const ext = mediaPath.split('.').pop()?.toLowerCase() || 'png';
      const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'svg' ? 'image/svg+xml' : 'image/png';
      const base64 = await mediaFile.async('base64');

      const xfrm = pic.getElementsByTagName('a:xfrm')[0];
      const off = xfrm?.getElementsByTagName('a:off')[0];
      const extEl = xfrm?.getElementsByTagName('a:ext')[0];
      const x = off ? Math.round((parseInt(off.getAttribute('x') || '0', 10) / 914400) * 96) : 120;
      const y = off ? Math.round((parseInt(off.getAttribute('y') || '0', 10) / 914400) * 96) : 120;
      const w = extEl ? Math.max(40, Math.round((parseInt(extEl.getAttribute('cx') || '0', 10) / 914400) * 96)) : 320;
      const h = extEl ? Math.max(40, Math.round((parseInt(extEl.getAttribute('cy') || '0', 10) / 914400) * 96)) : 240;

      objects.push({
        id: uid('obj'),
        slideId,
        type: 'image',
        name: mediaPath.split('/').pop() || 'Image',
        x,
        y,
        width: w,
        height: h,
        rotation: 0,
        zIndex: objects.length + 1,
        locked: false,
        visible: true,
        opacity: 1,
        flipX: false,
        flipY: false,
        imageData: {
          src: `data:${mime};base64,${base64}`,
          brightness: 100,
          contrast: 100,
          borderColor: '#DADCE0',
          borderWidth: 0,
          maintainAspectRatio: true,
        },
      });
    }

    // Parse Speaker Notes
    let notes = '';
    const notesTarget = Object.values(rels).find((t) => t.includes('notesSlides/'));
    if (notesTarget) {
      const notesFile = zip.file(notesTarget.replace('../', 'ppt/'));
      if (notesFile) {
        const notesDoc = parser.parseFromString(await notesFile.async('text'), 'application/xml');
        notes = Array.from(notesDoc.getElementsByTagName('a:t'))
          .map((t) => t.textContent || '')
          .join(' ')
          .trim();
      }
    }

    slides.push({
      id: slideId,
      order: i,
      title: `Slide ${i + 1}`,
      layout: 'custom',
      hidden: false,
      background: slideBg,
      notes,
      transition: {
        effect: 'none',
        duration: 500,
        direction: 'left',
        advanceOnClick: true,
        autoAdvanceAfter: null,
      },
      objects,
      animations: [],
    });
  }

  const now = new Date().toISOString();
  return {
    presentation: {
      id: uid('pres'),
      title: file.name.replace(/\.pptx$/i, ''),
      ownerId,
      ownerName,
      folderId: null,
      aspectRatio: width === 960 ? '4:3' : '16:9',
      width,
      height,
      themeId: theme.id,
      masters: [createDefaultMaster(theme)],
      slides,
      sections: [],
      comments: [],
      permissions: [{ id: uid('perm'), email: 'owner@akashavyom.local', name: ownerName, role: 'owner', addedAt: now }],
      revisions: [],
      shareLinkEnabled: false,
      shareLinkRole: 'viewer',
      isFavorite: false,
      isTrashed: false,
      createdAt: now,
      updatedAt: now,
    },
    warnings,
  };
}
