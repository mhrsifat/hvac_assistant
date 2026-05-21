import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/AdminLayout';
import { Transition } from '@headlessui/react';
import { Form, Head, usePage } from '@inertiajs/react';
import UnderlineExtension from '@tiptap/extension-underline';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import type { LucideIcon } from 'lucide-react';
import {
  Bold,
  CheckCircle2,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote as TextQuote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';
import { useEffect, useRef } from 'react';


type StaticPageContent = {
  body?: string | null;
};

type StaticPage = {
  type: string;
  title: string;
  slug: string;
  status: string;
  content?: StaticPageContent | null;
};

type StaticPageEditorProps = {
  pageTitle: string;
  pageDescription: string;
  action: string;
  icon: LucideIcon;
};

export default function StaticPageEditor({
  pageTitle,
  pageDescription,
  action,
  icon: Icon,
}: StaticPageEditorProps) {
  const { page } = usePage<{ page: StaticPage }>().props;
  const contentInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      UnderlineExtension,
    ],
    content: page.content?.body ?? '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none min-h-[30rem] px-4 py-4 bg-white dark:bg-zinc-950/40 outline-none overflow-y-auto text-sm leading-relaxed focus:outline-none [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-3 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-2 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-600 [&_blockquote]:dark:text-zinc-400 [&_code]:bg-zinc-100 [&_code]:dark:bg-zinc-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded',
      },
    },
    onUpdate: () => {
      if (contentInputRef.current && editor) {
        contentInputRef.current.value = editor.getHTML();
      }
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.setContent(page.content?.body ?? '');

    if (contentInputRef.current) {
      contentInputRef.current.value = editor.getHTML();
    }
  }, [editor, page.content?.body]);

  return (
    <AdminLayout title={pageTitle}>
      <Head title={pageTitle} />

      <h1 className="sr-only">{pageTitle}</h1>

      <div className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8 transition-all duration-200">
        <div className="flex items-start gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-900">
          <div className="hidden rounded-xl border border-zinc-200/70 bg-zinc-50 p-3 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 sm:block">
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <Heading
              variant="small"
              title={pageTitle}
              description={pageDescription}
            />
          </div>
        </div>

        <Form
          action={action}
          method="post"
          options={{ preserveScroll: true }}
          className="space-y-6 pt-6"
          onSubmit={() => {
            if (editor && contentInputRef.current) {
              contentInputRef.current.value = editor.getHTML();
            }
          }}
        >
          {({ processing, recentlySuccessful, errors }) => (
            <>
              <input type="hidden" name="type" value={page.type} />
              <input type="hidden" name="slug" value={page.slug} />

              <input ref={contentInputRef} type="hidden" name="content" defaultValue={editor?.getHTML() ?? ''} />

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Page title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={page.title}
                  className="h-11 focus-visible:ring-2"
                  required
                />
                <InputError message={errors.title} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Content</Label>

                <div className="flex flex-col w-full rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/30 focus-within:ring-2 focus-within:ring-zinc-950/10 dark:focus-within:ring-zinc-50/10 focus-within:border-zinc-400 dark:focus-within:border-zinc-700 transition-all duration-200">
                  {editor && (
                    <div className="flex flex-wrap items-center gap-1 p-2 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 select-none">
                      <Button
                        type="button"
                        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        title="Bold"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        title="Italic"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        title="Underline"
                      >
                        <Underline className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        title="Strike-through"
                      >
                        <Strikethrough className="h-4 w-4" />
                      </Button>

                      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                      <Button
                        type="button"
                        variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        title="Heading 1"
                      >
                        <Heading1 className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        title="Heading 2"
                      >
                        <Heading2 className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        title="Heading 3"
                      >
                        <Heading3 className="h-4 w-4" />
                      </Button>

                      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                      <Button
                        type="button"
                        variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        title="Bullet List"
                      >
                        <List className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        title="Numbered List"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        title="Blockquote"
                      >
                        <TextQuote className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant={editor.isActive('code') ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().toggleCode().run()}
                        title="Code Snippet"
                      >
                        <Code className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Horizontal Rule"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        title="Undo"
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        title="Redo"
                      >
                        <Redo2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <EditorContent editor={editor} />
                </div>

                <InputError message={errors.content} />
              </div>

              <div className="flex items-center gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-900">
                <Button disabled={processing} className="px-6 h-10 shadow-sm font-medium">
                  {processing ? 'Saving...' : 'Save changes'}
                </Button>

                <Transition
                  show={recentlySuccessful}
                  enter="transition ease-in-out duration-300"
                  enterFrom="opacity-0 translate-x-[-10px]"
                  enterTo="opacity-100 translate-x-0"
                  leave="transition ease-in-out duration-300"
                  leaveTo="opacity-0"
                >
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Changes saved successfully
                  </p>
                </Transition>
              </div>
            </>
          )}
        </Form>
      </div>
    </AdminLayout>
  );
}