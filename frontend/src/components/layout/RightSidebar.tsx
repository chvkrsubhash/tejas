import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Lock, Trash2, Unlock, X } from 'lucide-react';
import { usePresentationStore } from '../../store/usePresentationStore';
import { AnimationTrigger, ChartKind, TransitionEffect } from '../../types/presentation';
import { AIAssistantPanel } from '../ai/AIAssistantPanel';
import { uid } from '../../data/layouts';

export const RightSidebar: React.FC = () => {
  const {
    activePresentation,
    activeSlideId,
    selectedObjectIds,
    rightPanelTab,
    setRightPanelTab,
    updateObject,
    selectObject,
    updateSlide,
    applyTransitionToAll,
    updateAnimation,
    removeAnimation,
    reorderAnimations,
    addComment,
    replyToComment,
    toggleResolveComment,
  } = usePresentationStore();

  const [commentText, setCommentText] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  if (!activePresentation || !rightPanelTab) return null;

  const slide = activePresentation.slides.find((s) => s.id === activeSlideId);
  const selectedObj = slide?.objects.find((o) => o.id === selectedObjectIds[0]);

  const panelTitles: Record<string, string> = {
    format: 'Format Object',
    slide: 'Slide Properties',
    animations: 'Animation Pane',
    transitions: 'Slide Transitions',
    selection: 'Selection Pane',
    comments: 'Comments',
    ai: 'AI Assistant',
  };

  return (
    <aside className="w-72 bg-white border-l border-[#DADCE0] flex flex-col shrink-0 select-none z-20">
      <div className="h-9 px-3 border-b border-[#DADCE0] flex items-center justify-between bg-[#FAFAFA]">
        <span className="text-xs font-semibold text-[#242424]">{panelTitles[rightPanelTab]}</span>
        <button
          type="button"
          onClick={() => setRightPanelTab(null)}
          className="p-1 rounded hover:bg-[#E5E7EB] text-[#616161]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === 'ai' && <AIAssistantPanel />}

        {rightPanelTab === 'format' && (
          <div className="p-3 space-y-4 text-xs">
            {!selectedObj ? (
              <div className="text-[#616161]">Select an object on the slide to format its properties.</div>
            ) : (
              <>
                <div className="space-y-2">
                  <div className="font-semibold text-[#616161] uppercase text-[10px]">Position & Size</div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[11px] text-[#616161]">X</span>
                      <input
                        type="number"
                        value={Math.round(selectedObj.x)}
                        onChange={(e) => updateObject(selectedObj.id, { x: Number(e.target.value) })}
                        className="w-full h-7 border border-[#DADCE0] rounded px-2"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-[#616161]">Y</span>
                      <input
                        type="number"
                        value={Math.round(selectedObj.y)}
                        onChange={(e) => updateObject(selectedObj.id, { y: Number(e.target.value) })}
                        className="w-full h-7 border border-[#DADCE0] rounded px-2"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-[#616161]">Width</span>
                      <input
                        type="number"
                        value={Math.round(selectedObj.width)}
                        onChange={(e) => updateObject(selectedObj.id, { width: Math.max(20, Number(e.target.value)) })}
                        className="w-full h-7 border border-[#DADCE0] rounded px-2"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-[#616161]">Height</span>
                      <input
                        type="number"
                        value={Math.round(selectedObj.height)}
                        onChange={(e) => updateObject(selectedObj.id, { height: Math.max(20, Number(e.target.value)) })}
                        className="w-full h-7 border border-[#DADCE0] rounded px-2"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[11px] text-[#616161]">Rotation (°)</span>
                      <input
                        type="number"
                        value={selectedObj.rotation}
                        onChange={(e) => updateObject(selectedObj.id, { rotation: Number(e.target.value) })}
                        className="w-full h-7 border border-[#DADCE0] rounded px-2"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-[#616161]">Opacity (%)</span>
                      <input
                        type="number"
                        min={10}
                        max={100}
                        value={Math.round(selectedObj.opacity * 100)}
                        onChange={(e) => updateObject(selectedObj.id, { opacity: Number(e.target.value) / 100 })}
                        className="w-full h-7 border border-[#DADCE0] rounded px-2"
                      />
                    </label>
                  </div>
                </div>

                {selectedObj.shapeData && (
                  <div className="space-y-2 border-t border-[#DADCE0] pt-3">
                    <div className="font-semibold text-[#616161] uppercase text-[10px]">Shape Style</div>
                    <div className="flex items-center justify-between">
                      <span>Fill Color</span>
                      <input
                        type="color"
                        value={selectedObj.shapeData.fill}
                        onChange={(e) =>
                          updateObject(selectedObj.id, {
                            shapeData: { ...selectedObj.shapeData!, fill: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Outline Color</span>
                      <input
                        type="color"
                        value={selectedObj.shapeData.stroke === 'transparent' ? '#000000' : selectedObj.shapeData.stroke}
                        onChange={(e) =>
                          updateObject(selectedObj.id, {
                            shapeData: { ...selectedObj.shapeData!, stroke: e.target.value },
                          })
                        }
                      />
                    </div>
                    <label className="block">
                      <span className="text-[11px] text-[#616161]">Outline Width</span>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={selectedObj.shapeData.strokeWidth}
                        onChange={(e) =>
                          updateObject(selectedObj.id, {
                            shapeData: { ...selectedObj.shapeData!, strokeWidth: Number(e.target.value) },
                          })
                        }
                        className="w-full h-7 border border-[#DADCE0] rounded px-2"
                      />
                    </label>
                  </div>
                )}

                {selectedObj.imageData && (
                  <div className="space-y-2 border-t border-[#DADCE0] pt-3">
                    <div className="font-semibold text-[#616161] uppercase text-[10px]">Image Adjustments</div>
                    <label className="block">
                      <span>Brightness ({selectedObj.imageData.brightness}%)</span>
                      <input
                        type="range"
                        min={40}
                        max={160}
                        value={selectedObj.imageData.brightness}
                        onChange={(e) =>
                          updateObject(selectedObj.id, {
                            imageData: { ...selectedObj.imageData!, brightness: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-[#C4512D]"
                      />
                    </label>
                    <label className="block">
                      <span>Contrast ({selectedObj.imageData.contrast}%)</span>
                      <input
                        type="range"
                        min={40}
                        max={160}
                        value={selectedObj.imageData.contrast}
                        onChange={(e) =>
                          updateObject(selectedObj.id, {
                            imageData: { ...selectedObj.imageData!, contrast: Number(e.target.value) },
                          })
                        }
                        className="w-full accent-[#C4512D]"
                      />
                    </label>
                    <label className="block">
                      <span>Alt Text (Accessibility)</span>
                      <input
                        type="text"
                        value={selectedObj.altText || ''}
                        onChange={(e) => updateObject(selectedObj.id, { altText: e.target.value })}
                        className="w-full h-7 border border-[#DADCE0] rounded px-2"
                      />
                    </label>
                  </div>
                )}

                {selectedObj.chartData && (
                  <div className="space-y-2 border-t border-[#DADCE0] pt-3">
                    <div className="font-semibold text-[#616161] uppercase text-[10px]">Chart Data Editor</div>
                    <label className="block">
                      <span className="text-[11px] text-[#616161]">Chart Type</span>
                      <select
                        value={selectedObj.chartData.kind}
                        onChange={(e) =>
                          updateObject(selectedObj.id, {
                            chartData: { ...selectedObj.chartData!, kind: e.target.value as ChartKind },
                          })
                        }
                        className="w-full h-7 border border-[#DADCE0] rounded px-2"
                      >
                        <option value="column">Column</option>
                        <option value="bar">Bar</option>
                        <option value="stacked_bar">Stacked Bar</option>
                        <option value="line">Line</option>
                        <option value="area">Area</option>
                        <option value="pie">Pie</option>
                        <option value="doughnut">Doughnut</option>
                        <option value="scatter">Scatter</option>
                        <option value="radar">Radar</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-[#616161]">Title</span>
                      <input
                        type="text"
                        value={selectedObj.chartData.title}
                        onChange={(e) =>
                          updateObject(selectedObj.id, {
                            chartData: { ...selectedObj.chartData!, title: e.target.value },
                          })
                        }
                        className="w-full h-7 border border-[#DADCE0] rounded px-2"
                      />
                    </label>
                    <div className="space-y-1">
                      <div className="text-[11px] font-medium">Categories & Values</div>
                      {selectedObj.chartData.categories.map((cat, ci) => (
                        <div key={ci} className="flex items-center gap-1">
                          <input
                            type="text"
                            value={cat}
                            onChange={(e) => {
                              const cats = [...selectedObj.chartData!.categories];
                              cats[ci] = e.target.value;
                              updateObject(selectedObj.id, {
                                chartData: { ...selectedObj.chartData!, categories: cats },
                              });
                            }}
                            className="w-20 h-6 border border-[#DADCE0] rounded px-1"
                          />
                          {selectedObj.chartData!.series.map((ser, si) => (
                            <input
                              key={si}
                              type="number"
                              value={ser.values[ci] ?? 0}
                              onChange={(e) => {
                                const series = selectedObj.chartData!.series.map((s, idx) => {
                                  if (idx !== si) return s;
                                  const vals = [...s.values];
                                  vals[ci] = Number(e.target.value);
                                  return { ...s, values: vals };
                                });
                                updateObject(selectedObj.id, {
                                  chartData: { ...selectedObj.chartData!, series },
                                });
                              }}
                              className="w-14 h-6 border border-[#DADCE0] rounded px-1 text-center"
                            />
                          ))}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const cats = [...selectedObj.chartData!.categories, `Item ${selectedObj.chartData!.categories.length + 1}`];
                          const series = selectedObj.chartData!.series.map((s) => ({
                            ...s,
                            values: [...s.values, 50],
                          }));
                          updateObject(selectedObj.id, {
                            chartData: { ...selectedObj.chartData!, categories: cats, series },
                          });
                        }}
                        className="text-[11px] text-[#C4512D] hover:underline"
                      >
                        + Add Category Row
                      </button>
                    </div>
                  </div>
                )}

                {selectedObj.tableData && (
                  <div className="space-y-2 border-t border-[#DADCE0] pt-3">
                    <div className="font-semibold text-[#616161] uppercase text-[10px]">Table Structure</div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const td = selectedObj.tableData!;
                          const newRow = Array.from({ length: td.cols }).map((_, c) => ({
                            id: uid('cell'),
                            text: `New ${c + 1}`,
                            bgColor: '#FFFFFF',
                            textColor: '#242424',
                            align: 'left' as const,
                          }));
                          updateObject(selectedObj.id, {
                            tableData: {
                              ...td,
                              rows: td.rows + 1,
                              rowHeights: [...td.rowHeights, 52],
                              cells: [...td.cells, newRow],
                            },
                          });
                        }}
                        className="flex-1 py-1 border border-[#DADCE0] rounded hover:bg-[#F3F4F6]"
                      >
                        + Add Row
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const td = selectedObj.tableData!;
                          const cells = td.cells.map((row, ri) => [
                            ...row,
                            {
                              id: uid('cell'),
                              text: ri === 0 ? `Header ${td.cols + 1}` : 'Cell',
                              bgColor: ri === 0 ? '#1E3A5F' : '#FFFFFF',
                              textColor: ri === 0 ? '#FFFFFF' : '#242424',
                              bold: ri === 0,
                              align: 'left' as const,
                            },
                          ]);
                          updateObject(selectedObj.id, {
                            tableData: {
                              ...td,
                              cols: td.cols + 1,
                              colWidths: [...td.colWidths, 140],
                              cells,
                            },
                          });
                        }}
                        className="flex-1 py-1 border border-[#DADCE0] rounded hover:bg-[#F3F4F6]"
                      >
                        + Add Col
                      </button>
                    </div>
                  </div>
                )}

                {selectedObj.diagramData && (
                  <div className="space-y-2 border-t border-[#DADCE0] pt-3">
                    <div className="font-semibold text-[#616161] uppercase text-[10px]">Diagram Nodes</div>
                    {selectedObj.diagramData.nodes.map((node, idx) => (
                      <div key={node.id} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={node.label}
                          onChange={(e) => {
                            const nodes = selectedObj.diagramData!.nodes.map((n, i) =>
                              i === idx ? { ...n, label: e.target.value } : n
                            );
                            updateObject(selectedObj.id, {
                              diagramData: { ...selectedObj.diagramData!, nodes },
                            });
                          }}
                          className="flex-1 h-7 border border-[#DADCE0] rounded px-2"
                        />
                        <input
                          type="color"
                          value={node.fill.startsWith('#') ? node.fill : '#C4512D'}
                          onChange={(e) => {
                            const nodes = selectedObj.diagramData!.nodes.map((n, i) =>
                              i === idx ? { ...n, fill: e.target.value } : n
                            );
                            updateObject(selectedObj.id, {
                              diagramData: { ...selectedObj.diagramData!, nodes },
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {rightPanelTab === 'slide' && slide && (
          <div className="p-3 space-y-3 text-xs">
            <div className="font-semibold text-[#616161] uppercase text-[10px]">Background</div>
            <select
              value={slide.background.type}
              onChange={(e) =>
                updateSlide(slide.id, {
                  background: { ...slide.background, type: e.target.value as 'solid' | 'gradient' | 'image' },
                })
              }
              className="w-full h-7 border border-[#DADCE0] rounded px-2"
            >
              <option value="solid">Solid Color</option>
              <option value="gradient">Linear Gradient</option>
              <option value="image">Image URL</option>
            </select>

            {slide.background.type === 'solid' && (
              <div className="flex items-center justify-between">
                <span>Background Color</span>
                <input
                  type="color"
                  value={slide.background.color}
                  onChange={(e) =>
                    updateSlide(slide.id, { background: { ...slide.background, color: e.target.value } })
                  }
                />
              </div>
            )}

            {slide.background.type === 'gradient' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>From</span>
                  <input
                    type="color"
                    value={slide.background.gradientFrom || '#FFFFFF'}
                    onChange={(e) =>
                      updateSlide(slide.id, {
                        background: { ...slide.background, gradientFrom: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>To</span>
                  <input
                    type="color"
                    value={slide.background.gradientTo || '#E2E8F0'}
                    onChange={(e) =>
                      updateSlide(slide.id, {
                        background: { ...slide.background, gradientTo: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {slide.background.type === 'image' && (
              <input
                type="text"
                placeholder="https://..."
                value={slide.background.imageSrc || ''}
                onChange={(e) =>
                  updateSlide(slide.id, {
                    background: { ...slide.background, imageSrc: e.target.value },
                  })
                }
                className="w-full h-7 border border-[#DADCE0] rounded px-2"
              />
            )}
          </div>
        )}

        {rightPanelTab === 'transitions' && slide && (
          <div className="p-3 space-y-3 text-xs">
            <div>
              <label className="block font-medium mb-1">Effect</label>
              <select
                value={slide.transition.effect}
                onChange={(e) =>
                  updateSlide(slide.id, {
                    transition: { ...slide.transition, effect: e.target.value as TransitionEffect },
                  })
                }
                className="w-full h-7 border border-[#DADCE0] rounded px-2 capitalize"
              >
                {['none', 'fade', 'push', 'wipe', 'split', 'reveal', 'cover', 'uncover', 'zoom', 'dissolve'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Duration (ms)</label>
              <input
                type="number"
                step={100}
                min={100}
                max={5000}
                value={slide.transition.duration}
                onChange={(e) =>
                  updateSlide(slide.id, {
                    transition: { ...slide.transition, duration: Number(e.target.value) },
                  })
                }
                className="w-full h-7 border border-[#DADCE0] rounded px-2"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={slide.transition.advanceOnClick}
                onChange={(e) =>
                  updateSlide(slide.id, {
                    transition: { ...slide.transition, advanceOnClick: e.target.checked },
                  })
                }
                className="accent-[#C4512D]"
              />
              <span>Advance on mouse click</span>
            </label>
            <button
              type="button"
              onClick={() => applyTransitionToAll(slide.transition)}
              className="w-full py-1.5 bg-[#C4512D] text-white rounded font-medium"
            >
              Apply to All Slides
            </button>
          </div>
        )}

        {rightPanelTab === 'animations' && slide && (
          <div className="p-3 space-y-2 text-xs">
            {slide.animations.length === 0 ? (
              <div className="text-[#616161]">
                No animations on this slide. Select an object and choose an animation from the Animations tab.
              </div>
            ) : (
              slide.animations.map((anim, idx) => (
                <div key={anim.id} className="border border-[#DADCE0] rounded p-2 space-y-1.5 bg-[#FAFAFA]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold truncate">
                      {idx + 1}. {anim.objectName}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => reorderAnimations(slide.id, idx, idx - 1)}
                        className="p-0.5 hover:bg-[#E5E7EB] rounded disabled:opacity-30"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === slide.animations.length - 1}
                        onClick={() => reorderAnimations(slide.id, idx, idx + 1)}
                        className="p-0.5 hover:bg-[#E5E7EB] rounded disabled:opacity-30"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAnimation(slide.id, anim.id)}
                        className="p-0.5 hover:bg-red-50 text-red-600 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#C4512D] capitalize">
                    {anim.category}: {anim.effect.replace('_', ' ')}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      value={anim.trigger}
                      onChange={(e) =>
                        updateAnimation(slide.id, anim.id, { trigger: e.target.value as AnimationTrigger })
                      }
                      className="h-6 border border-[#DADCE0] rounded px-1 text-[11px] bg-white"
                    >
                      <option value="on_click">On Click</option>
                      <option value="with_previous">With Previous</option>
                      <option value="after_previous">After Previous</option>
                    </select>
                    <input
                      type="number"
                      step={100}
                      min={100}
                      value={anim.duration}
                      onChange={(e) => updateAnimation(slide.id, anim.id, { duration: Number(e.target.value) })}
                      className="h-6 border border-[#DADCE0] rounded px-1 text-[11px]"
                      title="Duration (ms)"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {rightPanelTab === 'selection' && slide && (
          <div className="p-2 space-y-1 text-xs">
            {[...slide.objects]
              .sort((a, b) => b.zIndex - a.zIndex)
              .map((obj) => (
                <div
                  key={obj.id}
                  onClick={() => selectObject(obj.id)}
                  className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${
                    selectedObjectIds.includes(obj.id) ? 'bg-[#FCECE6] text-[#C4512D]' : 'hover:bg-[#F3F4F6]'
                  }`}
                >
                  <span className="truncate flex-1">{obj.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateObject(obj.id, { visible: !obj.visible });
                      }}
                      className="p-0.5 hover:bg-white rounded"
                    >
                      {obj.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 opacity-50" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateObject(obj.id, { locked: !obj.locked });
                      }}
                      className="p-0.5 hover:bg-white rounded"
                    >
                      {obj.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 opacity-50" />}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {rightPanelTab === 'comments' && slide && (
          <div className="p-3 space-y-3 text-xs">
            <div className="space-y-1.5">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment to this slide..."
                className="w-full h-16 border border-[#DADCE0] rounded p-2 resize-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!commentText.trim()) return;
                  addComment(slide.id, commentText, selectedObj?.id);
                  setCommentText('');
                }}
                className="w-full py-1.5 bg-[#C4512D] text-white rounded font-medium"
              >
                Post Comment
              </button>
            </div>
            <div className="space-y-2">
              {activePresentation.comments
                .filter((c) => c.slideId === slide.id)
                .map((c) => (
                  <div
                    key={c.id}
                    className={`border rounded p-2 space-y-1.5 ${
                      c.resolved ? 'bg-[#F9FAFB] opacity-60 border-[#DADCE0]' : 'bg-white border-[#DADCE0]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{c.authorName}</span>
                      <button
                        type="button"
                        onClick={() => toggleResolveComment(c.id)}
                        className="text-[11px] text-emerald-700 flex items-center gap-0.5"
                      >
                        <Check className="w-3 h-3" /> {c.resolved ? 'Reopen' : 'Resolve'}
                      </button>
                    </div>
                    <p>{c.text}</p>
                    {c.replies.map((r) => (
                      <div key={r.id} className="pl-2 border-l-2 border-[#DADCE0] text-[11px]">
                        <span className="font-semibold">{r.authorName}: </span>
                        {r.text}
                      </div>
                    ))}
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Reply..."
                        value={replyDrafts[c.id] || ''}
                        onChange={(e) => setReplyDrafts({ ...replyDrafts, [c.id]: e.target.value })}
                        className="flex-1 h-6 border border-[#DADCE0] rounded px-1.5 text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const txt = replyDrafts[c.id];
                          if (txt?.trim()) {
                            replyToComment(c.id, txt);
                            setReplyDrafts({ ...replyDrafts, [c.id]: '' });
                          }
                        }}
                        className="px-2 bg-[#F3F4F6] border border-[#DADCE0] rounded text-[11px]"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

