import PptxGenJS from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { Presentation, Slide } from '../types/presentation';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function pxToIn(px: number, slidePx: number, slideIn: number): number {
  return Number(((px / slidePx) * slideIn).toFixed(3));
}

function cleanHex(color?: string, fallback = '242424'): string {
  if (!color || color === 'transparent') return fallback;
  return color.replace('#', '').slice(0, 6).padEnd(6, '0');
}

export async function exportAsPPTX(pres: Presentation): Promise<void> {
  const pptx = new PptxGenJS();
  pptx.title = pres.title;
  pptx.author = pres.ownerName;

  const slideWIn = pres.aspectRatio === '4:3' ? 10 : pres.aspectRatio === 'portrait' ? 7.5 : 13.333;
  const slideHIn = pres.aspectRatio === 'portrait' ? 10 : 7.5;
  pptx.defineLayout({ name: 'TEJAS_CUSTOM', width: slideWIn, height: slideHIn });
  pptx.layout = 'TEJAS_CUSTOM';

  for (const slide of pres.slides) {
    const s = pptx.addSlide();
    if (slide.background.type === 'solid') {
      s.background = { color: cleanHex(slide.background.color, 'FFFFFF') };
    } else if (slide.background.type === 'image' && slide.background.imageSrc) {
      s.background = { data: slide.background.imageSrc };
    } else {
      s.background = { color: cleanHex(slide.background.gradientFrom, 'FFFFFF') };
    }

    if (slide.notes) {
      s.addNotes(slide.notes);
    }

    const sorted = [...slide.objects].sort((a, b) => a.zIndex - b.zIndex);
    for (const obj of sorted) {
      if (!obj.visible) continue;
      const x = pxToIn(obj.x, pres.width, slideWIn);
      const y = pxToIn(obj.y, pres.height, slideHIn);
      const w = pxToIn(obj.width, pres.width, slideWIn);
      const h = pxToIn(obj.height, pres.height, slideHIn);

      if (obj.type === 'text' && obj.textData) {
        s.addText(obj.textData.text, {
          x,
          y,
          w,
          h,
          fontFace: obj.textData.style.fontFamily,
          fontSize: Math.max(8, Math.round(obj.textData.style.fontSize * 0.75)),
          bold: obj.textData.style.fontWeight === 'bold',
          italic: obj.textData.style.fontStyle === 'italic',
          underline: obj.textData.style.textDecoration === 'underline' ? { style: 'sng' } : undefined,
          color: cleanHex(obj.textData.style.color),
          align: obj.textData.style.textAlign === 'justify' ? 'justify' : obj.textData.style.textAlign,
          valign: obj.textData.style.verticalAlign,
          rotate: obj.rotation,
        });
      } else if (obj.type === 'shape' && obj.shapeData) {
        const shapeMap: Record<string, PptxGenJS.ShapeType> = {
          rectangle: pptx.ShapeType.rect,
          rounded_rectangle: pptx.ShapeType.roundRect,
          circle: pptx.ShapeType.ellipse,
          ellipse: pptx.ShapeType.ellipse,
          triangle: pptx.ShapeType.triangle,
          diamond: pptx.ShapeType.diamond,
          arrow_right: pptx.ShapeType.rightArrow,
          arrow_left: pptx.ShapeType.leftArrow,
          star: pptx.ShapeType.star5,
          line: pptx.ShapeType.line,
        };
        s.addShape(shapeMap[obj.shapeData.kind] || pptx.ShapeType.rect, {
          x,
          y,
          w,
          h,
          fill: { color: cleanHex(obj.shapeData.fill, 'C4512D') },
          line:
            obj.shapeData.strokeWidth > 0 && obj.shapeData.stroke !== 'transparent'
              ? { color: cleanHex(obj.shapeData.stroke), width: obj.shapeData.strokeWidth }
              : { type: 'none' },
          rotate: obj.rotation,
        });
      } else if (obj.type === 'image' && obj.imageData?.src) {
        s.addImage({
          data: obj.imageData.src.startsWith('data:') ? obj.imageData.src : undefined,
          path: obj.imageData.src.startsWith('data:') ? undefined : obj.imageData.src,
          x,
          y,
          w,
          h,
          rotate: obj.rotation,
        });
      } else if (obj.type === 'table' && obj.tableData) {
        const rows = obj.tableData.cells.map((row) =>
          row.map((cell) => ({
            text: cell.text,
            options: {
              fill: { color: cleanHex(cell.bgColor, 'FFFFFF') },
              color: cleanHex(cell.textColor, '242424'),
              bold: cell.bold,
              align: cell.align,
            },
          }))
        );
        s.addTable(rows, { x, y, w, h, border: { pt: 1, color: cleanHex(obj.tableData.borderColor) } });
      } else if (obj.type === 'chart' && obj.chartData) {
        const chartTypeMap: Record<string, PptxGenJS.CHART_NAME> = {
          bar: pptx.ChartType.bar,
          column: pptx.ChartType.bar,
          line: pptx.ChartType.line,
          pie: pptx.ChartType.pie,
          doughnut: pptx.ChartType.doughnut,
          area: pptx.ChartType.area,
          scatter: pptx.ChartType.scatter,
          radar: pptx.ChartType.radar,
        };
        const chartSeries = obj.chartData.series.map((ser) => ({
          name: ser.name,
          labels: obj.chartData!.categories,
          values: ser.values,
        }));
        s.addChart(chartTypeMap[obj.chartData.kind] || pptx.ChartType.bar, chartSeries, {
          x,
          y,
          w,
          h,
          showTitle: Boolean(obj.chartData.title),
          title: obj.chartData.title,
          showLegend: obj.chartData.showLegend,
        });
      }
    }
  }

  await pptx.writeFile({ fileName: `${pres.title || 'presentation'}.pptx` });
}

export async function exportAsPDF(pres: Presentation): Promise<void> {
  const orientation = pres.width >= pres.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [pres.width, pres.height],
  });

  pres.slides.forEach((slide, index) => {
    if (index > 0) pdf.addPage([pres.width, pres.height], orientation);
    pdf.setFillColor(slide.background.color || '#FFFFFF');
    pdf.rect(0, 0, pres.width, pres.height, 'F');

    const sorted = [...slide.objects].sort((a, b) => a.zIndex - b.zIndex);
    for (const obj of sorted) {
      if (!obj.visible) continue;
      if (obj.type === 'shape' && obj.shapeData) {
        pdf.setFillColor(obj.shapeData.fill || '#C4512D');
        pdf.rect(obj.x, obj.y, obj.width, obj.height, 'F');
      } else if (obj.type === 'text' && obj.textData) {
        pdf.setTextColor(obj.textData.style.color || '#242424');
        pdf.setFontSize(obj.textData.style.fontSize || 18);
        const lines = pdf.splitTextToSize(obj.textData.text, Math.max(20, obj.width - 20));
        pdf.text(lines, obj.x + 10, obj.y + obj.textData.style.fontSize + 8);
      } else if (obj.type === 'image' && obj.imageData?.src.startsWith('data:image/')) {
        try {
          pdf.addImage(obj.imageData.src, 'PNG', obj.x, obj.y, obj.width, obj.height);
        } catch {
          // skip invalid image format
        }
      }
    }
  });

  pdf.save(`${pres.title || 'presentation'}.pdf`);
}

export function exportAsJSON(pres: Presentation): void {
  const blob = new Blob([JSON.stringify(pres, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${pres.title || 'presentation'}.json`);
}

export function buildHTMLPresentation(pres: Presentation): string {
  const slidesHtml = pres.slides
    .map((slide, idx) => {
      const items = slide.objects
        .filter((o) => o.visible)
        .map((o) => {
          if (o.type === 'text' && o.textData) {
            return `<div style="position:absolute;left:${o.x}px;top:${o.y}px;width:${o.width}px;height:${o.height}px;font-size:${o.textData.style.fontSize}px;color:${o.textData.style.color};font-weight:${o.textData.style.fontWeight};text-align:${o.textData.style.textAlign};white-space:pre-wrap;">${o.textData.text}</div>`;
          }
          if (o.type === 'shape' && o.shapeData) {
            return `<div style="position:absolute;left:${o.x}px;top:${o.y}px;width:${o.width}px;height:${o.height}px;background:${o.shapeData.fill};border:${o.shapeData.strokeWidth}px solid ${o.shapeData.stroke};border-radius:${o.shapeData.kind === 'circle' ? '50%' : `${o.shapeData.cornerRadius}px`};"></div>`;
          }
          if (o.type === 'image' && o.imageData) {
            return `<img src="${o.imageData.src}" style="position:absolute;left:${o.x}px;top:${o.y}px;width:${o.width}px;height:${o.height}px;object-fit:contain;" />`;
          }
          return '';
        })
        .join('');
      return `<section class="slide" data-idx="${idx}" style="display:${
        idx === 0 ? 'block' : 'none'
      };position:relative;width:${pres.width}px;height:${pres.height}px;background:${
        slide.background.color || '#fff'
      };margin:auto;box-shadow:0 6px 24px rgba(0,0,0,.2);overflow:hidden;">${items}</section>`;
    })
    .join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${pres.title}</title><style>body{margin:0;background:#18181b;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Segoe UI,Arial,sans-serif;}</style></head><body>${slidesHtml}<script>let i=0;const s=document.querySelectorAll('.slide');function show(n){s[i].style.display='none';i=(n+s.length)%s.length;s[i].style.display='block';}window.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key===' ')show(i+1);if(e.key==='ArrowLeft')show(i-1);});</script></body></html>`;
}

export function exportAsHTML(pres: Presentation): void {
  const html = buildHTMLPresentation(pres);
  downloadBlob(new Blob([html], { type: 'text/html' }), `${pres.title || 'presentation'}.html`);
}

export function exportSlideAsSVG(slide: Slide, width: number, height: number, title: string): void {
  const els = slide.objects
    .filter((o) => o.visible)
    .map((o) => {
      if (o.type === 'shape' && o.shapeData) {
        return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="${o.shapeData.fill}" stroke="${o.shapeData.stroke}" stroke-width="${o.shapeData.strokeWidth}" />`;
      }
      if (o.type === 'text' && o.textData) {
        return `<text x="${o.x + 12}" y="${o.y + o.textData.style.fontSize + 10}" font-size="${o.textData.style.fontSize}" fill="${o.textData.style.color}">${o.textData.text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
      }
      return '';
    })
    .join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${slide.background.color || '#FFFFFF'}"/>${els}</svg>`;
  downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${title}-slide-${slide.order + 1}.svg`);
}

export function exportSlideAsRaster(
  slide: Slide,
  width: number,
  height: number,
  format: 'png' | 'jpeg',
  title: string
): void {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = slide.background.color || '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  for (const obj of [...slide.objects].sort((a, b) => a.zIndex - b.zIndex)) {
    if (!obj.visible) continue;
    if (obj.type === 'shape' && obj.shapeData) {
      ctx.fillStyle = obj.shapeData.fill;
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    } else if (obj.type === 'text' && obj.textData) {
      ctx.fillStyle = obj.textData.style.color;
      ctx.font = `${obj.textData.style.fontWeight} ${obj.textData.style.fontSize}px ${obj.textData.style.fontFamily}`;
      const lines = obj.textData.text.split('\n');
      lines.forEach((line, li) => {
        ctx.fillText(line, obj.x + 12, obj.y + 12 + obj.textData!.style.fontSize * (li + 1) * 1.2);
      });
    }
  }

  canvas.toBlob(
    (blob) => {
      if (blob) downloadBlob(blob, `${title}-slide-${slide.order + 1}.${format}`);
    },
    format === 'png' ? 'image/png' : 'image/jpeg',
    0.92
  );
}

export async function exportAsZIP(pres: Presentation): Promise<void> {
  const zip = new JSZip();
  zip.file('presentation.json', JSON.stringify(pres, null, 2));
  zip.file('index.html', buildHTMLPresentation(pres));
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${pres.title || 'presentation'}-bundle.zip`);
}

