import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

interface RichTextEditorProps {
    value: string
    onChange: (val: string) => void
    placeholder?: string
    minHeight?: number
    maxLength?: number
}

const MenuButton = ({
    onClick,
    isActive = false,
    icon,
    title,
}: {
    onClick: () => void
    isActive?: boolean
    icon: string
    title: string
}) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title}
        tabIndex={0}
        className={`w-7 h-7 flex items-center justify-center rounded transition-colors text-[16px]
            ${isActive
                ? 'bg-slate-200 text-slate-800'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
    >
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
    </button>
)

export const RichTextEditor = ({
    value,
    onChange,
    placeholder = 'Start writing...',
    minHeight = 180,
}: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Placeholder.configure({ placeholder }),
        ],
        content: value || '',
        onUpdate: ({ editor: ed }) => {
            const html = ed.getHTML()
            // We pass the HTML up, the parent will block the "Save" button 
            // and show the red character count if it exceeds maxLength.
            onChange(html)
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none',
                style: `min-height: ${minHeight}px; padding: 16px;`,
            },
        },
    })

    // Sync external value changes (e.g., form reset or loading new data)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value || '', false)
        }
    }, [value, editor])

    if (!editor) return null

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-all shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-slate-100 bg-slate-50/80">
                <MenuButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    icon="format_bold"
                    title="Bold"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    icon="format_italic"
                    title="Italic"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    icon="strikethrough_s"
                    title="Strikethrough"
                />

                <div className="w-px h-4 bg-slate-200 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    icon="format_h1"
                    title="Heading 1"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    icon="format_h2"
                    title="Heading 2"
                />

                <div className="w-px h-4 bg-slate-200 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    icon="format_list_bulleted"
                    title="Bullet List"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    icon="format_list_numbered"
                    title="Ordered List"
                />

                <div className="w-px h-4 bg-slate-200 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    icon="format_quote"
                    title="Blockquote"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    isActive={editor.isActive('codeBlock')}
                    icon="code"
                    title="Code Block"
                />

                <div className="w-px h-4 bg-slate-200 mx-1" />

                <MenuButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    icon="horizontal_rule"
                    title="Horizontal Rule"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().undo().run()}
                    icon="undo"
                    title="Undo"
                />
                <MenuButton
                    onClick={() => editor.chain().focus().redo().run()}
                    icon="redo"
                    title="Redo"
                />
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />

            <style>{`
                .tiptap p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #94a3b8;
                    pointer-events: none;
                    height: 0;
                    font-style: normal;
                }
                .tiptap {
                    font-size: 14px;
                    line-height: 1.7;
                    color: #334155;
                }
                .tiptap h1 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0 0.3em; }
                .tiptap h2 { font-size: 1.25em; font-weight: 700; margin: 0.5em 0 0.3em; }
                .tiptap h3 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0 0.3em; }
                .tiptap ul { list-style: disc; padding-left: 1.5em; margin: 0.4em 0; }
                .tiptap ol { list-style: decimal; padding-left: 1.5em; margin: 0.4em 0; }
                .tiptap li { margin: 0.15em 0; }
                .tiptap blockquote {
                    border-left: 3px solid #e2e8f0;
                    padding-left: 1em;
                    margin: 0.5em 0;
                    color: #64748b;
                    font-style: italic;
                }
                .tiptap pre {
                    background: #f1f5f9;
                    border-radius: 6px;
                    padding: 0.75em 1em;
                    margin: 0.5em 0;
                    overflow-x: auto;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.875em;
                }
                .tiptap code {
                    background: #f1f5f9;
                    border-radius: 3px;
                    padding: 0.15em 0.3em;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.9em;
                }
                .tiptap hr {
                    border: none;
                    border-top: 1px solid #e2e8f0;
                    margin: 1em 0;
                }
                .tiptap p { margin: 0.3em 0; }
                .tiptap strong { font-weight: 700; }
            `}</style>
        </div>
    )
}
