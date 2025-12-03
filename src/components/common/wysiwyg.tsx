import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { faBold, faCode, faHeading, faImage, faItalic, faListOl, faListUl, faQuoteRight, faRedo, faStrikethrough, faUndo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from '@tiptap/extension-image';
import { EditorContent, EditorContext, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { FC } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';

interface WysiwygProps {
    title: string;
    content: string;
    onTitleChange: (title: string) => void;
    onContentChange: (content: string) => void;
    onSubmit: () => void;
    onCancel?: () => void;
    isSubmitting?: boolean;
    className?: string;
}

const Wysiwyg: FC<WysiwygProps> = ({ title, content, onTitleChange, onContentChange, onSubmit, onCancel, isSubmitting = false, className = '' }) => {
    const imageInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                allowBase64: true,
                inline: false
            })
        ],
        content,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onContentChange(html);
        },
        immediatelyRender: false
    });

    const providerValue = useMemo(() => ({ editor }), [editor]);

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    const handleSubmit = () => {
        if (!title.trim() || !content.trim() || content === '<p></p>') {
            return;
        }
        onSubmit();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('File không hợp lệ. Vui lòng chọn file ảnh');
            return;
        }

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            toast.error('File quá lớn. Kích thước tối đa là 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            if (editor) {
                editor.chain().focus().setImage({ src: base64String }).run();
            }
        };
        reader.onerror = () => {
            toast.error('Lỗi khi đọc file');
        };
        reader.readAsDataURL(file);

        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleImageButtonClick = () => {
        imageInputRef.current?.click();
    };

    return (
        <EditorContext.Provider value={providerValue}>
            <div className={`rounded-lg border border-stone-200 bg-white shadow-lg dark:border-stone-700 dark:bg-stone-800 ${className}`}>
                <div className='flex flex-col gap-4 p-4'>
                    <div>
                        <Input type='text' value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder='Tiêu đề bài viết...' maxLength={200} disabled={isSubmitting} />
                        <p className='mt-1 text-xs text-stone-500 dark:text-stone-400'>{title.length}/200</p>
                    </div>

                    <div className='rounded-lg border border-stone-200 dark:border-stone-700'>
                        <div className='flex flex-wrap items-center gap-1 border-b border-stone-200 bg-stone-50 p-2 dark:border-stone-700 dark:bg-stone-900'>
                            <button type='button' onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run() || isSubmitting} className={`rounded px-2 py-1.5 transition-colors ${editor.isActive('bold') ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'}`} title='Bold'>
                                <FontAwesomeIcon icon={faBold} className='h-4 w-4' />
                            </button>
                            <button type='button' onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run() || isSubmitting} className={`rounded px-2 py-1.5 transition-colors ${editor.isActive('italic') ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'}`} title='Italic'>
                                <FontAwesomeIcon icon={faItalic} className='h-4 w-4' />
                            </button>
                            <button type='button' onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run() || isSubmitting} className={`rounded px-2 py-1.5 transition-colors ${editor.isActive('strike') ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'}`} title='Strikethrough'>
                                <FontAwesomeIcon icon={faStrikethrough} className='h-4 w-4' />
                            </button>
                            <div className='mx-1 h-6 w-px bg-stone-300 dark:bg-stone-600' />
                            <button type='button' onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} disabled={isSubmitting} className={`rounded px-2 py-1.5 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'}`} title='Heading 1'>
                                <FontAwesomeIcon icon={faHeading} className='h-4 w-4' />
                            </button>
                            <div className='mx-1 h-6 w-px bg-stone-300 dark:bg-stone-600' />
                            <button type='button' onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={isSubmitting} className={`rounded px-2 py-1.5 transition-colors ${editor.isActive('bulletList') ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'}`} title='Bullet List'>
                                <FontAwesomeIcon icon={faListUl} className='h-4 w-4' />
                            </button>
                            <button type='button' onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={isSubmitting} className={`rounded px-2 py-1.5 transition-colors ${editor.isActive('orderedList') ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'}`} title='Ordered List'>
                                <FontAwesomeIcon icon={faListOl} className='h-4 w-4' />
                            </button>
                            <button type='button' onClick={() => editor.chain().focus().toggleBlockquote().run()} disabled={isSubmitting} className={`rounded px-2 py-1.5 transition-colors ${editor.isActive('blockquote') ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'}`} title='Blockquote'>
                                <FontAwesomeIcon icon={faQuoteRight} className='h-4 w-4' />
                            </button>
                            <button type='button' onClick={() => editor.chain().focus().toggleCodeBlock().run()} disabled={isSubmitting} className={`rounded px-2 py-1.5 transition-colors ${editor.isActive('codeBlock') ? 'bg-stone-200 text-stone-900 dark:bg-stone-700 dark:text-stone-100' : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'}`} title='Code Block'>
                                <FontAwesomeIcon icon={faCode} className='h-4 w-4' />
                            </button>
                            <div className='mx-1 h-6 w-px bg-stone-300 dark:bg-stone-600' />
                            <button type='button' onClick={handleImageButtonClick} disabled={isSubmitting} className='rounded px-2 py-1.5 text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800' title='Chèn ảnh'>
                                <FontAwesomeIcon icon={faImage} className='h-4 w-4' />
                            </button>
                            <input ref={imageInputRef} type='file' accept='image/*' onChange={handleImageUpload} className='hidden' disabled={isSubmitting} />
                            <div className='mx-1 h-6 w-px bg-stone-300 dark:bg-stone-600' />
                            <button type='button' onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run() || isSubmitting} className='rounded px-2 py-1.5 text-stone-600 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-stone-400 dark:hover:bg-stone-800' title='Undo'>
                                <FontAwesomeIcon icon={faUndo} className='h-4 w-4' />
                            </button>
                            <button type='button' onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run() || isSubmitting} className='rounded px-2 py-1.5 text-stone-600 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-stone-400 dark:hover:bg-stone-800' title='Redo'>
                                <FontAwesomeIcon icon={faRedo} className='h-4 w-4' />
                            </button>
                        </div>
                        <div className='min-h-[200px] bg-white p-4 dark:bg-stone-800'>
                            <EditorContent editor={editor} className='tiptap-editor [&_.ProseMirror]:outline-none [&_.ProseMirror_*]:my-2 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-stone-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic dark:[&_.ProseMirror_blockquote]:border-stone-600 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:bg-stone-100 [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:text-sm dark:[&_.ProseMirror_code]:bg-stone-800 [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_img]:my-4 [&_.ProseMirror_img]:h-auto [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded [&_.ProseMirror_pre]:bg-stone-900 [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:text-stone-100 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6' />
                        </div>
                    </div>

                    <div className='flex justify-end gap-3'>
                        {onCancel && (
                            <Button variant='outline' onClick={onCancel} disabled={isSubmitting}>
                                Hủy
                            </Button>
                        )}
                        <Button onClick={handleSubmit} disabled={!title.trim() || !content.trim() || content === '<p></p>' || isSubmitting}>
                            {isSubmitting ? 'Đang đăng...' : 'Đăng bài'}
                        </Button>
                    </div>
                </div>
            </div>
        </EditorContext.Provider>
    );
};

export default Wysiwyg;
