import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Download, Printer, Trash2, Video, X } from 'lucide-react';
import { usePresentationStore } from '../../store/usePresentationStore';
import { PermissionRole } from '../../types/presentation';
import {
  exportAsHTML,
  exportAsJSON,
  exportAsPDF,
  exportAsPPTX,
  exportAsZIP,
  exportSlideAsRaster,
  exportSlideAsSVG,
} from '../../services/exportService';
import { SlideRenderer } from '../canvas/SlideRenderer';

const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({
  title,
  onClose,
  children,
  wide,
}) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className={`bg-white border border-[#DADCE0] rounded-md shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} overflow-hidden`}>
      <div className="h-10 px-4 border-b border-[#DADCE0] flex items-center justify-between bg-[#FAFAFA]">
        <span className="text-xs font-semibold text-[#242424]">{title}</span>
        <button type="button" onClick={onClose} className="p-1 hover:bg-[#E5E7EB] rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 text-xs max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

export const ShortcutsModal: React.FC = () => {
  const { showShortcutsModal, setModal } = usePresentationStore();
  if (!showShortcutsModal) return null;
  const rows = [
    ['Ctrl + M', 'New slide'],
    ['Ctrl + S', 'Save presentation'],
    ['Ctrl + Z / Ctrl + Y', 'Undo / Redo'],
    ['Ctrl + C / V / X', 'Copy / Paste / Cut'],
    ['Ctrl + D', 'Duplicate selected object'],
    ['Ctrl + G / Ctrl + Shift + G', 'Group / Ungroup objects'],
    ['Delete', 'Delete selected object'],
    ['Arrow / Shift + Arrow', 'Nudge object (1px / 10px)'],
    ['F5', 'Start presentation'],
    ['Escape', 'Exit presentation or selection'],
  ];
  return (
    <ModalShell title="Keyboard Shortcuts" onClose={() => setModal('shortcuts', false)}>
      <div className="divide-y divide-[#ECEEF1]">
        {rows.map(([k, d]) => (
          <div key={k} className="py-2 flex items-center justify-between">
            <span className="text-[#616161]">{d}</span>
            <kbd className="px-2 py-0.5 bg-[#F3F4F6] border border-[#DADCE0] rounded font-mono text-[11px]">{k}</kbd>
          </div>
        ))}
      </div>
    </ModalShell>
  );
};

export const ShareModal: React.FC = () => {
  const {
    activePresentation,
    showShareModal,
    setModal,
    addPermission,
    updatePermission,
    removePermission,
    setShareLink,
  } = usePresentationStore();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<PermissionRole>('editor');

  if (!showShareModal || !activePresentation) return null;

  return (
    <ModalShell title="Share & Permissions" onClose={() => setModal('share', false)}>
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Invite by email..."
            className="flex-1 h-8 border border-[#DADCE0] rounded px-2"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as PermissionRole)}
            className="h-8 border border-[#DADCE0] rounded px-2"
          >
            <option value="editor">Editor</option>
            <option value="commenter">Commenter</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            type="button"
            onClick={() => {
              if (!email.trim()) return;
              addPermission(email, email.split('@')[0], role);
              setEmail('');
            }}
            className="px-3 bg-[#C4512D] text-white rounded font-medium"
          >
            Invite
          </button>
        </div>

        <div className="divide-y divide-[#ECEEF1] border border-[#DADCE0] rounded">
          {activePresentation.permissions.map((p) => (
            <div key={p.id} className="px-3 py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-[11px] text-[#616161]">{p.email}</div>
              </div>
              <div className="flex items-center gap-2">
                {p.role === 'owner' ? (
                  <span className="text-[11px] font-semibold text-[#C4512D]">Owner</span>
                ) : (
                  <>
                    <select
                      value={p.role}
                      onChange={(e) => updatePermission(p.id, e.target.value as PermissionRole)}
                      className="h-6 border border-[#DADCE0] rounded px-1 text-[11px]"
                    >
                      <option value="editor">Editor</option>
                      <option value="commenter">Commenter</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removePermission(p.id)}
                      className="text-red-600 p-1 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-[#DADCE0] pt-3 flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={activePresentation.shareLinkEnabled}
              onChange={(e) => setShareLink(e.target.checked, activePresentation.shareLinkRole)}
              className="accent-[#C4512D]"
            />
            <span>Enable shareable link</span>
          </label>
          {activePresentation.shareLinkEnabled && (
            <select
              value={activePresentation.shareLinkRole}
              onChange={(e) => setShareLink(true, e.target.value as PermissionRole)}
              className="h-7 border border-[#DADCE0] rounded px-2"
            >
              <option value="viewer">Anyone with link: Viewer</option>
              <option value="commenter">Anyone with link: Commenter</option>
              <option value="editor">Anyone with link: Editor</option>
            </select>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

export const ExportModal: React.FC = () => {
  const { activePresentation, activeSlideId, showExportModal, setModal } = usePresentationStore();
  if (!showExportModal || !activePresentation) return null;
  const slide = activePresentation.slides.find((s) => s.id === activeSlideId) || activePresentation.slides[0];

  return (
    <ModalShell title="Export Presentation" onClose={() => setModal('export', false)}>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'PowerPoint (.pptx)', fn: () => exportAsPPTX(activePresentation) },
          { label: 'PDF Document (.pdf)', fn: () => exportAsPDF(activePresentation) },
          { label: 'HTML Slideshow (.html)', fn: () => exportAsHTML(activePresentation) },
          { label: 'Structured JSON (.json)', fn: () => exportAsJSON(activePresentation) },
          { label: 'ZIP Archive (.zip)', fn: () => exportAsZIP(activePresentation) },
          {
            label: 'Current Slide (PNG)',
            fn: () => slide && exportSlideAsRaster(slide, activePresentation.width, activePresentation.height, 'png', activePresentation.title),
          },
          {
            label: 'Current Slide (JPEG)',
            fn: () => slide && exportSlideAsRaster(slide, activePresentation.width, activePresentation.height, 'jpeg', activePresentation.title),
          },
          {
            label: 'Current Slide (SVG)',
            fn: () => slide && exportSlideAsSVG(slide, activePresentation.width, activePresentation.height, activePresentation.title),
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.fn}
            className="flex items-center gap-2 px-3 py-2.5 border border-[#DADCE0] rounded hover:border-[#C4512D] hover:bg-[#FCECE6]/40 text-left font-medium"
          >
            <Download className="w-4 h-4 text-[#C4512D]" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </ModalShell>
  );
};

export const PrintModal: React.FC = () => {
  const { activePresentation, showPrintModal, setModal } = usePresentationStore();
  const [layout, setLayout] = useState<'full' | 'handouts' | 'notes'>('full');
  const [grayscale, setGrayscale] = useState(false);

  if (!showPrintModal || !activePresentation) return null;

  return (
    <ModalShell title="Print & Handouts" onClose={() => setModal('print', false)} wide>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as typeof layout)}
              className="h-8 border border-[#DADCE0] rounded px-2"
            >
              <option value="full">Full-Page Slides</option>
              <option value="handouts">Handouts (2 per row)</option>
              <option value="notes">Slides with Speaker Notes</option>
            </select>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} />
              <span>Grayscale</span>
            </label>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-[#C4512D] text-white rounded font-medium flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
        </div>

        <div
          className={`border border-[#DADCE0] p-4 rounded bg-[#F9FAFB] max-h-96 overflow-y-auto ${
            grayscale ? 'grayscale' : ''
          } ${layout === 'handouts' ? 'grid grid-cols-2 gap-3' : 'space-y-4'}`}
        >
          {activePresentation.slides.map((s, idx) => (
            <div key={s.id} className="bg-white border border-[#DADCE0] p-2 rounded">
              <SlideRenderer
                slide={s}
                width={activePresentation.width}
                height={activePresentation.height}
                scale={layout === 'handouts' ? 240 / activePresentation.width : 420 / activePresentation.width}
                master={activePresentation.masters[0]}
                slideIndex={idx}
              />
              {layout === 'notes' && (
                <div className="mt-2 pt-2 border-t border-[#ECEEF1] text-[11px] text-[#616161]">
                  {s.notes || 'No speaker notes.'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ModalShell>
  );
};

export const FindReplaceModal: React.FC = () => {
  const { activePresentation, showFindReplaceModal, setModal } = usePresentationStore();
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [status, setStatus] = useState('');

  if (!showFindReplaceModal || !activePresentation) return null;

  const handleReplaceAll = () => {
    if (!findText) return;
    let count = 0;
    const slides = activePresentation.slides.map((s) => ({
      ...s,
      objects: s.objects.map((o) => {
        if (o.textData && o.textData.text.includes(findText)) {
          count++;
          return {
            ...o,
            textData: {
              ...o.textData,
              text: o.textData.text.split(findText).join(replaceText),
              html: undefined,
            },
          };
        }
        return o;
      }),
    }));
    usePresentationStore.setState({ activePresentation: { ...activePresentation, slides } });
    setStatus(`Replaced ${count} occurrence(s).`);
  };

  return (
    <ModalShell title="Find & Replace" onClose={() => setModal('findReplace', false)}>
      <div className="space-y-3">
        <input
          type="text"
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          placeholder="Find text..."
          className="w-full h-8 border border-[#DADCE0] rounded px-2"
        />
        <input
          type="text"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="Replace with..."
          className="w-full h-8 border border-[#DADCE0] rounded px-2"
        />
        <button
          type="button"
          onClick={handleReplaceAll}
          className="w-full py-2 bg-[#C4512D] text-white rounded font-medium"
        >
          Replace All Across Presentation
        </button>
        {status && <div className="text-emerald-700 font-medium">{status}</div>}
      </div>
    </ModalShell>
  );
};

export const AccessibilityModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { activePresentation } = usePresentationStore();
  if (!open || !activePresentation) return null;

  const issues: string[] = [];
  activePresentation.slides.forEach((s, idx) => {
    const hasTitle = s.objects.some((o) => o.placeholderRole === 'title' && o.textData?.text.trim());
    if (!hasTitle) issues.push(`Slide ${idx + 1}: Missing slide title placeholder.`);
    s.objects.forEach((o) => {
      if (o.type === 'image' && !o.altText?.trim()) {
        issues.push(`Slide ${idx + 1}: Image "${o.name}" is missing alternative text.`);
      }
      if (o.type === 'text' && o.textData && o.textData.style.fontSize < 14) {
        issues.push(`Slide ${idx + 1}: Text "${o.name}" uses small font (${o.textData.style.fontSize}px < 14px).`);
      }
    });
  });

  return (
    <ModalShell title="Accessibility Checker" onClose={onClose}>
      {issues.length === 0 ? (
        <div className="flex items-center gap-2 text-emerald-700 py-4">
          <CheckCircle className="w-5 h-5" />
          <span>No accessibility issues detected across {activePresentation.slides.length} slide(s).</span>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((iss, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{iss}</span>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
};

export const RevisionsModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { activePresentation, createRevision, restoreRevision } = usePresentationStore();
  const [label, setLabel] = useState('');
  if (!open || !activePresentation) return null;

  return (
    <ModalShell title="Version History" onClose={onClose}>
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Snapshot label (e.g., Before Q4 review)..."
            className="flex-1 h-8 border border-[#DADCE0] rounded px-2"
          />
          <button
            type="button"
            onClick={() => {
              createRevision(label);
              setLabel('');
            }}
            className="px-3 bg-[#C4512D] text-white rounded font-medium"
          >
            Save Version
          </button>
        </div>
        <div className="divide-y divide-[#ECEEF1] border border-[#DADCE0] rounded">
          {activePresentation.revisions.length === 0 ? (
            <div className="p-4 text-center text-[#616161]">No saved snapshots yet.</div>
          ) : (
            activePresentation.revisions.map((r) => (
              <div key={r.id} className="p-2.5 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.label}</div>
                  <div className="text-[11px] text-[#616161]">
                    {r.authorName} • {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    restoreRevision(r.id);
                    onClose();
                  }}
                  className="px-2.5 py-1 border border-[#DADCE0] rounded hover:bg-[#F3F4F6]"
                >
                  Restore
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </ModalShell>
  );
};

export const RecordingModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [recording, setRecording] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [err, setErr] = useState('');

  if (!open) return null;

  const startRec = async () => {
    setErr('');
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const mr = new MediaRecorder(display);
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setDownloadUrl(URL.createObjectURL(blob));
        display.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      setRecorder(mr);
      setRecording(true);
    } catch (e) {
      setErr((e as Error).message || 'Screen/microphone permission denied.');
    }
  };

  return (
    <ModalShell title="Record Presentation" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-[#616161]">
          Capture your slide show and microphone audio using browser screen recording. Permissions will be requested when you start.
        </p>
        {err && <div className="p-2 bg-red-50 text-red-700 rounded">{err}</div>}
        {!recording ? (
          <button
            type="button"
            onClick={startRec}
            className="w-full py-2 bg-[#C4512D] text-white rounded font-medium flex items-center justify-center gap-1.5"
          >
            <Video className="w-4 h-4" /> Start Recording
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              recorder?.stop();
              setRecording(false);
            }}
            className="w-full py-2 bg-red-600 text-white rounded font-medium"
          >
            Stop Recording
          </button>
        )}
        {downloadUrl && (
          <a
            href={downloadUrl}
            download="tejas-presentation-recording.webm"
            className="block text-center py-2 border border-[#DADCE0] rounded hover:bg-[#F3F4F6] font-medium"
          >
            Download Recording (.webm)
          </a>
        )}
      </div>
    </ModalShell>
  );
};

