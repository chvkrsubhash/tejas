import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import { TextData } from '../../types/presentation';

interface RichTextEditorProps {
  data: TextData;
  onChange: (text: string, html: string) => void;
  onBlur: () => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ data, onChange, onBlur }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: data.html || data.text.split('\n').map((l) => `<p>${l || '<br>'}</p>`).join(''),
    autofocus: 'end',
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getText(), ed.getHTML());
    },
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBlur();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onBlur]);

  const st = data.style;

  return (
    <div
      className="w-full h-full overflow-auto cursor-text"
      style={{
        padding: `${data.padding}px`,
        fontFamily: st.fontFamily,
        fontSize: `${st.fontSize}px`,
        fontWeight: st.fontWeight,
        fontStyle: st.fontStyle,
        textDecoration: st.textDecoration,
        color: st.color,
        letterSpacing: `${st.letterSpacing}px`,
        lineHeight: st.lineHeight,
        textAlign: st.textAlign,
        direction: st.direction,
        backgroundColor: data.backgroundColor || 'transparent',
      }}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <EditorContent editor={editor} className="w-full h-full" />
    </div>
  );
};

