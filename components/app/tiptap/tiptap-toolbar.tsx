"use client"

import { type Editor, useEditorState } from "@tiptap/react"
import {
  BoldIcon,
  CodeIcon,
  CodeSquareIcon,
  Columns2Icon,
  GlobeIcon,
  Grid3x3Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  QuoteIcon,
  Redo2Icon,
  Rows2Icon,
  StrikethroughIcon,
  TableIcon,
  Trash2Icon,
  Undo2Icon,
  UnlinkIcon,
  UploadIcon,
} from "lucide-react"
import { type ChangeEvent, type ReactNode, useCallback, useRef, useState } from "react"
import { Button } from "~/components/common/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/common/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/common/dropdown-menu"
import { Input } from "~/components/common/input"
import { Kbd } from "~/components/common/kbd"
import { Tooltip } from "~/components/common/tooltip"
import { useCan } from "~/contexts/user-context"
import { useMediaUpload } from "~/hooks/use-media-upload"
import { cx } from "~/lib/utils"
import { ALLOWED_MIMETYPES } from "~/server/shared/media/schema"

interface ToolbarUrlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  confirmLabel: string
  url: string
  onUrlChange: (url: string) => void
  onConfirm: (url: string) => void
}

function ToolbarUrlDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  url,
  onUrlChange: setUrl,
  onConfirm,
}: ToolbarUrlDialogProps) {
  function handleConfirm() {
    if (url.trim()) {
      onConfirm(url.trim())
      setUrl("")
      onOpenChange(false)
    }
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setUrl("")
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Input
          value={url}
          placeholder="https://"
          // oxlint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          onChange={event => setUrl(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.preventDefault()
              handleConfirm()
            }
          }}
        />

        <DialogFooter>
          <DialogClose
            render={<Button size="md" variant="secondary" suffix={<Kbd keys={["esc"]} />} />}
          >
            Cancel
          </DialogClose>

          <Button
            size="md"
            disabled={!url.trim()}
            suffix={<Kbd variant="outline" keys={["enter"]} />}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const toolbarButtonClasses =
  "inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"

interface ToolbarButtonProps {
  icon: ReactNode
  title: string
  /** Keyboard shortcut handled by the editor, shown in the tooltip. */
  shortcut?: string[]
  isActive?: boolean
  disabled?: boolean
  onClick: () => void
}

function ToolbarButton({ icon, title, shortcut, isActive, disabled, onClick }: ToolbarButtonProps) {
  return (
    <Tooltip
      tooltip={
        <>
          {title}
          {shortcut && <Kbd variant="outline" keys={shortcut} />}
        </>
      }
    >
      <button
        type="button"
        aria-label={title}
        aria-pressed={isActive}
        disabled={disabled}
        className={cx(toolbarButtonClasses, isActive && "bg-muted text-foreground")}
        // Prevents the editor from losing focus. The action runs on click so a dialog it
        // opens is not closed by the same pointer's mouseup landing outside it.
        onMouseDown={event => event.preventDefault()}
        onClick={onClick}
      >
        {icon}
      </button>
    </Tooltip>
  )
}

function ToolbarSeparator() {
  return <div className="mx-1 h-6 w-px bg-border" />
}

const headings = [
  { level: 1, icon: <Heading1Icon /> },
  { level: 2, icon: <Heading2Icon /> },
  { level: 3, icon: <Heading3Icon /> },
  { level: 4, icon: <Heading4Icon /> },
  { level: 5, icon: <Heading5Icon /> },
  { level: 6, icon: <Heading6Icon /> },
] as const

interface TiptapToolbarProps {
  editor: Editor | null
  /** Storage path for uploaded images. */
  mediaPath: string
}

export function TiptapToolbar({ editor, mediaPath }: TiptapToolbarProps) {
  const { uploadFile } = useMediaUpload(mediaPath)
  const canWriteMedia = useCan("media.write")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlDialogMode, setUrlDialogMode] = useState<"link" | "image" | null>(null)
  const [url, setUrl] = useState("")

  const activeState = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) {
        return null
      }

      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        strike: e.isActive("strike"),
        code: e.isActive("code"),
        headingLevel: headings.find(({ level }) => e.isActive("heading", { level }))?.level,
        bulletList: e.isActive("bulletList"),
        orderedList: e.isActive("orderedList"),
        blockquote: e.isActive("blockquote"),
        codeBlock: e.isActive("codeBlock"),
        link: e.isActive("link"),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        canAddRowBefore: e.can().addRowBefore(),
        canAddRowAfter: e.can().addRowAfter(),
        canAddColumnBefore: e.can().addColumnBefore(),
        canAddColumnAfter: e.can().addColumnAfter(),
        canDeleteRow: e.can().deleteRow(),
        canDeleteColumn: e.can().deleteColumn(),
        canDeleteTable: e.can().deleteTable(),
      }
    },
  })

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files
      if (!files?.length || !editor) {
        return
      }

      for (const file of Array.from(files)) {
        uploadFile(file, uploaded => {
          editor.chain().focus().setImage({ src: uploaded.url }).run()
        })
      }

      // Resets the input so the same file can be selected again.
      event.target.value = ""
    },
    [editor, uploadFile],
  )

  const insertLink = useCallback(() => {
    // Prefills the existing href so a link under the cursor can be edited.
    setUrl(editor?.getAttributes("link").href ?? "")
    setUrlDialogMode("link")
  }, [editor])

  const insertImageFromUrl = useCallback(() => {
    setUrl("")
    setUrlDialogMode("image")
  }, [])

  const handleUrlDialogConfirm = useCallback(
    (url: string) => {
      if (!editor) {
        return
      }

      if (urlDialogMode === "image") {
        editor.chain().focus().setImage({ src: url }).run()
      } else if (urlDialogMode === "link") {
        // Extends the selection to the whole link when the cursor sits inside one.
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
      }

      setUrlDialogMode(null)
    },
    [editor, urlDialogMode],
  )

  if (!editor) {
    return null
  }

  const isEditingLink = urlDialogMode === "link" && !!activeState?.link
  const linkDialogTitle = isEditingLink ? "Edit Link URL" : "Insert Link URL"

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 bg-background border-b rounded-t-md p-1.5"
    >
      <ToolbarButton
        icon={<BoldIcon />}
        title="Bold"
        shortcut={["mod", "B"]}
        isActive={activeState?.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        icon={<ItalicIcon />}
        title="Italic"
        shortcut={["mod", "I"]}
        isActive={activeState?.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        icon={<StrikethroughIcon />}
        title="Strikethrough"
        shortcut={["mod", "shift", "S"]}
        isActive={activeState?.strike}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />

      <ToolbarSeparator />

      <ToolbarButton
        icon={<CodeIcon />}
        title="Inline Code"
        shortcut={["mod", "E"]}
        isActive={activeState?.code}
        onClick={() => editor.chain().focus().toggleCode().run()}
      />

      <ToolbarSeparator />

      {headings.map(({ level, icon }) => (
        <ToolbarButton
          key={level}
          icon={icon}
          title={`Heading ${level}`}
          shortcut={["mod", "alt", String(level)]}
          isActive={activeState?.headingLevel === level}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
        />
      ))}

      <ToolbarSeparator />

      <ToolbarButton
        icon={<ListIcon />}
        title="Bullet List"
        shortcut={["mod", "shift", "8"]}
        isActive={activeState?.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        icon={<ListOrderedIcon />}
        title="Ordered List"
        shortcut={["mod", "shift", "7"]}
        isActive={activeState?.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />

      <ToolbarSeparator />

      <ToolbarButton
        icon={<QuoteIcon />}
        title="Blockquote"
        shortcut={["mod", "shift", "B"]}
        isActive={activeState?.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        icon={<CodeSquareIcon />}
        title="Code Block"
        shortcut={["mod", "alt", "C"]}
        isActive={activeState?.codeBlock}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />

      <ToolbarSeparator />

      <ToolbarButton
        icon={<LinkIcon />}
        title={activeState?.link ? "Edit Link" : "Insert Link"}
        isActive={activeState?.link}
        onClick={insertLink}
      />

      {activeState?.link && (
        <ToolbarButton
          icon={<UnlinkIcon />}
          title="Remove Link"
          onClick={() => editor.chain().focus().unsetLink().run()}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          title="Insert Image"
          aria-label="Insert Image"
          className={toolbarButtonClasses}
        >
          <ImageIcon />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuItem disabled={!canWriteMedia} onClick={() => fileInputRef.current?.click()}>
            <UploadIcon />
            Upload from computer
          </DropdownMenuItem>

          <DropdownMenuItem onClick={insertImageFromUrl}>
            <GlobeIcon />
            Insert from URL
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIMETYPES.join(",")}
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <DropdownMenu>
        <DropdownMenuTrigger title="Table" aria-label="Table" className={toolbarButtonClasses}>
          <TableIcon />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          >
            <Grid3x3Icon />
            Insert Table
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!activeState?.canAddRowBefore}
            onClick={() => editor.chain().focus().addRowBefore().run()}
          >
            <Rows2Icon />
            Add Row Before
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!activeState?.canAddRowAfter}
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            <Rows2Icon />
            Add Row After
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!activeState?.canAddColumnBefore}
            onClick={() => editor.chain().focus().addColumnBefore().run()}
          >
            <Columns2Icon />
            Add Column Before
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!activeState?.canAddColumnAfter}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            <Columns2Icon />
            Add Column After
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!activeState?.canDeleteRow}
            onClick={() => editor.chain().focus().deleteRow().run()}
          >
            <Trash2Icon />
            Delete Row
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!activeState?.canDeleteColumn}
            onClick={() => editor.chain().focus().deleteColumn().run()}
          >
            <Trash2Icon />
            Delete Column
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!activeState?.canDeleteTable}
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            <Trash2Icon />
            Delete Table
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolbarSeparator />

      <ToolbarButton
        icon={<MinusIcon />}
        title="Horizontal Rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      />

      <ToolbarSeparator />

      <ToolbarButton
        icon={<Undo2Icon />}
        title="Undo"
        shortcut={["mod", "Z"]}
        disabled={!activeState?.canUndo}
        onClick={() => editor.chain().focus().undo().run()}
      />
      <ToolbarButton
        icon={<Redo2Icon />}
        title="Redo"
        shortcut={["mod", "shift", "Z"]}
        disabled={!activeState?.canRedo}
        onClick={() => editor.chain().focus().redo().run()}
      />

      <ToolbarUrlDialog
        open={urlDialogMode !== null}
        title={urlDialogMode === "image" ? "Insert Image URL" : linkDialogTitle}
        confirmLabel={isEditingLink ? "Save" : "Insert"}
        url={url}
        onOpenChange={isOpen => !isOpen && setUrlDialogMode(null)}
        onUrlChange={setUrl}
        onConfirm={handleUrlDialogConfirm}
      />
    </div>
  )
}
