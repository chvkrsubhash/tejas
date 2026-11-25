import React, { useState } from 'react';
import { FileText, Loader2, Send, Settings, Sparkles, Square } from 'lucide-react';
import { usePresentationStore } from '../../store/usePresentationStore';
import { createSlide, uid } from '../../data/layouts';
import { getThemeById } from '../../data/themes';

export const AIAssistantPanel: React.FC = () => {
  const {
    activePresentation,
    activeSlideId,
    selectedObjectIds,
    aiConfig,
    addSlide,
    updateObject,
    updateSlide,
    updateAIConfig,
  } = usePresentationStore();

  const [mode, setMode] = useState<'generate' | 'edit' | 'design' | 'settings'>('generate');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('Professionals');
  const [slideCount, setSlideCount] = useState(5);
  const [tone, setTone] = useState('Professional');
  const [scope, setScope] = useState<'selected_object' | 'current_slide' | 'presentation'>('current_slide');
  const [promptText, setPromptText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [docContent, setDocContent] = useState('');
  const [abortCtrl, setAbortCtrl] = useState<AbortController | null>(null);

  if (!activePresentation) return null;
  const activeSlide = activePresentation.slides.find((s) => s.id === activeSlideId);
  const selectedObj = activeSlide?.objects.find((o) => o.id === selectedObjectIds[0]);

  const callAIProvider = async (systemPrompt: string, userPrompt: string): Promise<string> => {
    const controller = new AbortController();
    setAbortCtrl(controller);

    // 1. Try backend proxy first if available
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          provider: aiConfig.provider,
          model: aiConfig.model,
          system_prompt: systemPrompt,
          user_prompt: userPrompt,
          max_tokens: aiConfig.maxTokens,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.content || '';
      }
    } catch {
      // Backend not running; fall through to direct provider if user supplied key or Ollama
    }

    if (aiConfig.provider === 'ollama') {
      const res = await fetch(`${aiConfig.ollamaUrl}/api/generate`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: aiConfig.model || 'llama3.2',
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false,
        }),
      });
      if (!res.ok) throw new Error(`Ollama error (${res.status})`);
      const data = await res.json();
      return data.response || '';
    }

    if (!aiConfig.apiKey) {
      throw new Error(
        'No AI API key configured. Open the Settings tab here or in Dashboard Settings to add a Gemini, Groq, OpenRouter key, or use local Ollama.'
      );
    }

    if (aiConfig.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${
        aiConfig.model || 'gemini-2.5-flash'
      }:generateContent?key=${encodeURIComponent(aiConfig.apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        }),
      });
      if (!res.ok) throw new Error(`Gemini API error (${res.status})`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // Groq or OpenRouter (OpenAI-compatible)
    const endpoint =
      aiConfig.provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${aiConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: aiConfig.maxTokens,
      }),
    });
    if (!res.ok) throw new Error(`${aiConfig.provider} API error (${res.status})`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  };

  const handleGenerateSlides = async () => {
    if (!topic.trim() && !docContent.trim()) return;
    setLoading(true);
    setResponseText('');
    try {
      const sys = `Return ONLY valid JSON array of slides: [{"title": "...", "bullets": ["..."], "notes": "..."}]. Do not invent statistics.`;
      const usr = `Topic: ${topic}\nAudience: ${audience}\nSlides: ${slideCount}\nTone: ${tone}\n${
        docContent ? `Reference Document:\n${docContent.slice(0, 4000)}` : ''
      }`;
      const raw = await callAIProvider(sys, usr);
      setResponseText(raw);

      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Array<{
          title: string;
          bullets: string[];
          notes?: string;
        }>;
        const theme = getThemeById(activePresentation.themeId);
        const generated = parsed.map((item, idx) => {
          const s = createSlide(
            activePresentation.slides.length + idx,
            'title_content',
            theme,
            activePresentation.width,
            activePresentation.height,
            item.title
          );
          if (s.objects[0]?.textData) s.objects[0].textData.text = item.title;
          if (s.objects[1]?.textData) {
            s.objects[1].textData.text = (item.bullets || []).map((b) => `• ${b}`).join('\n');
          }
          s.notes = item.notes || '';
          return s;
        });

        usePresentationStore.setState((st) =>
          st.activePresentation
            ? {
                activePresentation: {
                  ...st.activePresentation,
                  slides: [...st.activePresentation.slides, ...generated],
                },
              }
            : st
        );
      }
      await updateAIConfig({ dailyUsed: aiConfig.dailyUsed + 1 });
    } catch (err) {
      setResponseText((err as Error).message);
    } finally {
      setLoading(false);
      setAbortCtrl(null);
    }
  };

  const handleEditAction = async (instruction: string) => {
    setLoading(true);
    setResponseText('');
    try {
      let contextText = '';
      if (scope === 'selected_object' && selectedObj?.textData) {
        contextText = selectedObj.textData.text;
      } else if (scope === 'current_slide' && activeSlide) {
        contextText = activeSlide.objects
          .filter((o) => o.textData)
          .map((o) => o.textData!.text)
          .join('\n---\n');
      } else {
        contextText = activePresentation.slides
          .map((s, i) => `Slide ${i + 1}: ` + s.objects.map((o) => o.textData?.text || '').join(' '))
          .join('\n');
      }

      const result = await callAIProvider(
        'You are a concise presentation writing assistant. Return clean, ready-to-use slide text.',
        `${instruction}\n\nContent:\n${contextText}`
      );
      setResponseText(result);
    } catch (err) {
      setResponseText((err as Error).message);
    } finally {
      setLoading(false);
      setAbortCtrl(null);
    }
  };

  const applyResponseToSelected = () => {
    if (!responseText || !selectedObj?.textData) return;
    if (!confirm('Replace the selected text box content with this AI response?')) return;
    updateObject(selectedObj.id, {
      textData: { ...selectedObj.textData, text: responseText, html: undefined },
    });
  };

  const applyResponseAsNotes = () => {
    if (!responseText || !activeSlide) return;
    updateSlide(activeSlide.id, { notes: responseText });
  };

  if (!aiConfig.enabled) {
    return (
      <div className="p-4 text-xs text-[#616161] space-y-2">
        <p>AI Assistant is currently disabled.</p>
        <button
          type="button"
          onClick={() => updateAIConfig({ enabled: true })}
          className="px-3 py-1.5 bg-[#C4512D] text-white rounded text-xs"
        >
          Enable AI Assistant
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-xs">
      <div className="flex border-b border-[#DADCE0] bg-[#FAFAFA]">
        {[
          { id: 'generate', label: 'Generate' },
          { id: 'edit', label: 'Rewrite' },
          { id: 'design', label: 'Design' },
          { id: 'settings', label: 'Config' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id as typeof mode)}
            className={`flex-1 py-2 font-medium border-b-2 ${
              mode === t.id ? 'border-[#C4512D] text-[#C4512D] bg-white' : 'border-transparent text-[#616161]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {mode === 'generate' && (
          <>
            <div>
              <label className="block font-medium mb-1">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Renewable Energy Grid Storage"
                className="w-full h-8 border border-[#DADCE0] rounded px-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-medium mb-1">Audience</label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full h-7 border border-[#DADCE0] rounded px-2"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Slides</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={slideCount}
                  onChange={(e) => setSlideCount(Number(e.target.value))}
                  className="w-full h-7 border border-[#DADCE0] rounded px-2"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full h-7 border border-[#DADCE0] rounded px-2"
              >
                <option>Professional</option>
                <option>Academic</option>
                <option>Executive</option>
                <option>Educational</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Reference Document (.txt / .md)
              </label>
              <input
                type="file"
                accept=".txt,.md"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) setDocContent(await f.text());
                }}
                className="w-full text-[11px]"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateSlides}
              disabled={loading}
              className="w-full py-2 rounded bg-[#C4512D] hover:bg-[#A94222] text-white font-medium flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generate Editable Slides</span>
            </button>
          </>
        )}

        {mode === 'edit' && (
          <>
            <div>
              <label className="block font-medium mb-1">Context Scope (Privacy Control)</label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as typeof scope)}
                className="w-full h-7 border border-[#DADCE0] rounded px-2"
              >
                <option value="selected_object">Selected Object Only</option>
                <option value="current_slide">Current Slide</option>
                <option value="presentation">Entire Presentation</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Rewrite Clearer', cmd: 'Rewrite this slide content concisely and professionally.' },
                { label: 'Summarize', cmd: 'Summarize this into 3 crisp bullet points.' },
                { label: 'Expand Bullets', cmd: 'Expand these bullet points with clear explanations.' },
                { label: 'Fix Grammar', cmd: 'Correct grammar and spelling without changing meaning.' },
                { label: 'Speaker Notes', cmd: 'Write presenter speaker notes for this slide.' },
                { label: 'To Bullets', cmd: 'Convert paragraphs into structured bullet points.' },
              ].map((btn) => (
                <button
                  key={btn.label}
                  type="button"
                  disabled={loading}
                  onClick={() => handleEditAction(btn.cmd)}
                  className="px-2 py-1.5 border border-[#DADCE0] rounded hover:bg-[#FCECE6] hover:border-[#C4512D] text-left"
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Custom instruction (e.g., Translate to Hindi)..."
                className="flex-1 h-8 border border-[#DADCE0] rounded px-2"
              />
              <button
                type="button"
                disabled={loading || !promptText.trim()}
                onClick={() => handleEditAction(promptText)}
                className="px-2.5 bg-[#C4512D] text-white rounded"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {mode === 'design' && (
          <div className="space-y-2">
            <p className="text-[#616161]">
              Analyze the current slide for text hierarchy, overcrowding, and visual balance.
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                handleEditAction(
                  'Review this slide content for overcrowding, hierarchy, and suggest the best layout and visual representation.'
                )
              }
              className="w-full py-2 bg-[#C4512D] text-white rounded font-medium"
            >
              Analyze Current Slide
            </button>
          </div>
        )}

        {mode === 'settings' && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1 font-semibold text-[#242424]">
              <Settings className="w-3.5 h-3.5" /> Provider Configuration
            </div>
            <div>
              <label className="block mb-1">Provider</label>
              <select
                value={aiConfig.provider}
                onChange={(e) => updateAIConfig({ provider: e.target.value as typeof aiConfig.provider })}
                className="w-full h-7 border border-[#DADCE0] rounded px-2"
              >
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq</option>
                <option value="openrouter">OpenRouter</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Model</label>
              <input
                type="text"
                value={aiConfig.model}
                onChange={(e) => updateAIConfig({ model: e.target.value })}
                className="w-full h-7 border border-[#DADCE0] rounded px-2"
              />
            </div>
            <div>
              <label className="block mb-1">API Key</label>
              <input
                type="password"
                value={aiConfig.apiKey}
                onChange={(e) => updateAIConfig({ apiKey: e.target.value })}
                className="w-full h-7 border border-[#DADCE0] rounded px-2"
              />
            </div>
            <div className="text-[11px] text-[#616161]">
              Usage today: {aiConfig.dailyUsed} / {aiConfig.dailyLimit}
            </div>
          </div>
        )}

        {loading && abortCtrl && (
          <button
            type="button"
            onClick={() => abortCtrl.abort()}
            className="w-full py-1.5 border border-red-300 text-red-600 rounded flex items-center justify-center gap-1"
          >
            <Square className="w-3 h-3" /> Stop Generation
          </button>
        )}

        {responseText && (
          <div className="border border-[#DADCE0] rounded p-2.5 bg-[#FAFAFA] space-y-2">
            <div className="font-semibold text-[#242424]">AI Response</div>
            <div className="whitespace-pre-wrap text-[11px] text-[#242424] max-h-48 overflow-y-auto">
              {responseText}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedObj?.textData && (
                <button
                  type="button"
                  onClick={applyResponseToSelected}
                  className="px-2 py-1 bg-[#C4512D] text-white rounded text-[11px]"
                >
                  Replace Selected
                </button>
              )}
              <button
                type="button"
                onClick={applyResponseAsNotes}
                className="px-2 py-1 border border-[#DADCE0] bg-white rounded text-[11px]"
              >
                Save as Notes
              </button>
              <button
                type="button"
                onClick={() => addSlide('title_content')}
                className="px-2 py-1 border border-[#DADCE0] bg-white rounded text-[11px]"
              >
                New Slide
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

