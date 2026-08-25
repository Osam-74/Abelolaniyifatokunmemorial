'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState } from 'react';

const BUTTONS = [
  { id: 'bold', label: 'B', title: 'Bold', className: 'font-bold' },
  { id: 'italic', label: 'I', title: 'Italic', className: 'italic' },
  { id: 'strike', label: 'S', title: 'Strikethrough', className: 'line-through' },
  { id: 'h2', label: 'H', title: 'Heading', className: 'font-display' },
  { id: 'bulletList', label: '•', title: 'Bulleted list', className: '' },
  { id: 'orderedList', label: '1.', title: 'Numbered list', className: '' },
  { id: 'blockquote', label: '❝', title: 'Quote', className: '' },
] as const;

export default function RichTextEditor({
  name,
  placeholder = 'Write your memory…',
}: {
  name: string;
  placeholder?: string;
}) {
  const [html, setHtml] = useState('');

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'min-h-[220px] px-4 py-3 focus:outline-none prose-editor',
        'aria-label': placeholder,
      },
    },
    onUpdate: ({ editor: instance }) => setHtml(instance.getHTML()),
  });

  useEffect(() => () => editor?.destroy(), [editor]);

  const run = (id: string) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    switch (id) {
      case 'bold': chain.toggleBold().run(); break;
      case 'italic': chain.toggleItalic().run(); break;
      case 'strike': chain.toggleStrike().run(); break;
      case 'h2': chain.toggleHeading({ level: 2 }).run(); break;
      case 'bulletList': chain.toggleBulletList().run(); break;
      case 'orderedList': chain.toggleOrderedList().run(); break;
      case 'blockquote': chain.toggleBlockquote().run(); break;
    }
  };

  const isActive = (id: string) => {
    if (!editor) return false;
    if (id === 'h2') return editor.isActive('heading', { level: 2 });
    return editor.isActive(id);
  };

  return (
    <div className="overflow-hidden rounded-sm border border-ink/16 bg-white focus-within:border-deep">
      <div className="flex flex-wrap gap-0.5 border-b border-ink/10 bg-mist/35 px-2 py-1.5">
        {BUTTONS.map((button) => (
          <button
            key={button.id}
            type="button"
            title={button.title}
            aria-pressed={isActive(button.id)}
            onClick={() => run(button.id)}
            className={`h-8 min-w-8 rounded px-2 text-sm transition-colors ${button.className} ${
              isActive(button.id) ? 'bg-ink text-mist' : 'text-ink/65 hover:bg-ink/10'
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>

      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html === '<p></p>' ? '' : html} />
    </div>
  );
}
