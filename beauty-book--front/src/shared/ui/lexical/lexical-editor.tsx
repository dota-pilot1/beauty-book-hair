"use client"

import { useCallback, useEffect, useRef } from 'react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { CodeNode, CodeHighlightNode, registerCodeHighlighting } from '@lexical/code'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode } from '@lexical/link'
import { type EditorState } from 'lexical'
import { editorTheme } from './theme'
import { LexicalToolbar } from './toolbar'
import { ImageNode } from './nodes/image-node'
import { DragDropImagePlugin, ImagePlugin } from './plugins/image-plugin'
import { uploadImageToS3 } from './utils/upload-image'

type LexicalEditorProps = {
  initialState?: string
  onChange?: (state: string) => void
  placeholder?: string
  minHeight?: string
  readOnly?: boolean
}

function CodeHighlightPlugin() {
  const [editor] = useLexicalComposerContext()
  useEffect(() => registerCodeHighlighting(editor), [editor])
  return null
}

function EditablePlugin({ readOnly }: { readOnly: boolean }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    editor.setEditable(!readOnly)
  }, [editor, readOnly])
  return null
}

function InitialContentPlugin({ initialState }: { initialState?: string }) {
  const [editor] = useLexicalComposerContext()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (!initialState) return

    try {
      const parsed = JSON.parse(initialState)
      if (!parsed?.root) return
      const editorState = editor.parseEditorState(initialState)
      queueMicrotask(() => editor.setEditorState(editorState))
    } catch {
      // not valid Lexical JSON — start empty
    }
  }, [editor, initialState])

  return null
}

export function LexicalEditor({
  initialState,
  onChange,
  placeholder = '내용을 입력하세요...',
  minHeight = '200px',
  readOnly = false,
}: LexicalEditorProps) {
  const handleChange = useCallback(
    (editorState: EditorState) => {
      onChange?.(JSON.stringify(editorState.toJSON()))
    },
    [onChange],
  )

  const initialConfig = {
    namespace: 'BoardEditor',
    theme: editorTheme,
    editable: !readOnly,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      ImageNode,
    ],
    onError: (error: Error) => {
      console.error('Lexical error:', error)
    },
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="flex flex-col">
        {!readOnly && <LexicalToolbar onImageUpload={uploadImageToS3} />}
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="px-5 py-4 text-sm text-foreground outline-none leading-relaxed"
                style={{ minHeight }}
              />
            }
            placeholder={
              !readOnly ? (
                <div className="absolute top-4 left-5 text-sm text-muted-foreground pointer-events-none">
                  {placeholder}
                </div>
              ) : null
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        {!readOnly && <HistoryPlugin />}
        <ListPlugin />
        <LinkPlugin />
        <CodeHighlightPlugin />
        {!readOnly && <ImagePlugin />}
        {!readOnly && <DragDropImagePlugin onUpload={uploadImageToS3} />}
        <OnChangePlugin onChange={handleChange} />
        <InitialContentPlugin initialState={initialState} />
        <EditablePlugin readOnly={readOnly} />
      </div>
    </LexicalComposer>
  )
}
