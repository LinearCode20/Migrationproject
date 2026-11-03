"use client"

import Image from "@tiptap/extension-image"
import { TableKit } from "@tiptap/extension-table"
import Typography from "@tiptap/extension-typography"
import { Markdown } from "@tiptap/markdown"
import { type Editor, EditorContent, Extension, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { type ComponentProps, useEffect } from "react"
import { TiptapToolbar } from "~/components/app/tiptap/tiptap-toolbar"
import { boxVariants } from "~/components/common/box"
import type { FormFieldControlProps } from "~/components/common/field"
import { proseContentClasses } from "~/components/common/prose"
import { cx } from "~/lib/utils"

interface TiptapEditorProps extends Omit<ComponentProps<"div">, "onChange"> {
  value?: string
  onUpdate?: (editor: Editor) => void
  mediaPath?: string
  /** The field's id and aria attributes, set on the editable area that takes focus. */
  controlProps?: FormFieldControlProps
}

export function TiptapEditor({
  className,
  value,
  onUpdate: onUpdateProp,
  mediaPath = "",
  controlProps,
  ...props
}: TiptapEditorProps) {
  // ProseMirror takes string attributes, so a cleared `aria-invalid` is left out.
  const attributes = Object.fromEntries(
    Object.entries(controlProps ?? {}).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, String(value)]],
    ),
  )

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
        },
      }),
      Image,
      TableKit.configure({
        table: { resizable: false },
      }),
      Typography,
      Markdown,
      Extension.create({
        addKeyboardShortcuts: () => ({ "Mod-Enter": () => true }),
      }),
    ],
    immediatelyRender: false,
    editorProps: { attributes },
    content: value,
    contentType: "markdown",
    onUpdate: ({ editor }) => {
      onUpdateProp?.(editor)
    },
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return
    }

    const currentMarkdown = editor.getMarkdown()
    if (value !== currentMarkdown) {
      editor.commands.setContent(value ?? "", { contentType: "markdown" })
    }
  }, [editor, value])

  return (
    <div
      className={cx(boxVariants({ fieldFocus: true }), "flex flex-col rounded-md", className)}
      {...props}
    >
      <TiptapToolbar editor={editor} mediaPath={mediaPath} />
      <EditorContent
        editor={editor}
        className={cx(
          "max-w-none bg-background rounded-b-md outline-none",
          "[&_.tiptap]:min-h-75 [&_.tiptap]:p-4 [&_.tiptap]:outline-none",
          "[&_.ProseMirror-selectednode]:outline [&_.ProseMirror-selectednode]:outline-2 [&_.ProseMirror-selectednode]:outline-primary [&_.ProseMirror-selectednode]:rounded-sm",
          ...proseContentClasses,
        )}
      />
    </div>
  )
}
