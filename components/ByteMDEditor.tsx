'use client'

import { Editor } from '@bytemd/react'
import gfm from '@bytemd/plugin-gfm'
import highlight from '@bytemd/plugin-highlight'
import frontmatter from '@bytemd/plugin-frontmatter'
import 'bytemd/dist/index.css'
import 'highlight.js/styles/github.css'
import { forwardRef, useImperativeHandle, useRef, useCallback, useEffect } from 'react'

interface ByteMDEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export interface ByteMDEditorRef {
  insertText: (text: string) => void
  saveCursor: () => void
}

const plugins = [
  gfm(),
  highlight(),
  frontmatter(),
]

const ByteMDEditor = forwardRef<ByteMDEditorRef, ByteMDEditorProps>(
  ({ value, onChange, placeholder }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const savedCursorRef = useRef<{ line: number; ch: number } | null>(null)
    const cmInstanceRef = useRef<any>(null)

    useEffect(() => {
      if (containerRef.current) {
        const cmElement = containerRef.current.querySelector('.CodeMirror')
        if (cmElement && (cmElement as any).CodeMirror) {
          cmInstanceRef.current = (cmElement as any).CodeMirror
          console.log('Found CodeMirror instance')
        }
      }
    }, [value])

    const saveCursor = useCallback(() => {
      console.log('saveCursor called')
      
      if (cmInstanceRef.current) {
        const cm = cmInstanceRef.current
        const cursor = cm.getDoc().getCursor()
        savedCursorRef.current = { line: cursor.line, ch: cursor.ch }
        console.log('Saved cursor:', savedCursorRef.current)
        return
      }
      
      if (containerRef.current) {
        const cmElement = containerRef.current.querySelector('.CodeMirror')
        if (cmElement && (cmElement as any).CodeMirror) {
          cmInstanceRef.current = (cmElement as any).CodeMirror
          const cm = cmInstanceRef.current
          const cursor = cm.getDoc().getCursor()
          savedCursorRef.current = { line: cursor.line, ch: cursor.ch }
          console.log('Saved cursor (from DOM):', savedCursorRef.current)
        } else {
          console.log('CodeMirror not found in DOM')
        }
      } else {
        console.log('containerRef.current is null')
      }
    }, [])

    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        console.log('insertText called')
        console.log('savedCursorRef.current:', savedCursorRef.current)
        console.log('cmInstanceRef.current:', cmInstanceRef.current)
        
        if (cmInstanceRef.current) {
          try {
            const cm = cmInstanceRef.current
            const doc = cm.getDoc()
            const cursor = savedCursorRef.current || doc.getCursor()
            console.log('Using cursor:', cursor)
            doc.replaceRange(text, cursor)
            cm.focus()
            savedCursorRef.current = null
            return
          } catch (e) {
            console.error('Insert error:', e)
          }
        }
        
        if (containerRef.current) {
          const cmElement = containerRef.current.querySelector('.CodeMirror')
          if (cmElement && (cmElement as any).CodeMirror) {
            try {
              const cm = (cmElement as any).CodeMirror
              const doc = cm.getDoc()
              const cursor = savedCursorRef.current || doc.getCursor()
              console.log('Using cursor (from DOM):', cursor)
              doc.replaceRange(text, cursor)
              cm.focus()
              savedCursorRef.current = null
              return
            } catch (e) {
              console.error('Insert error (DOM):', e)
            }
          }
        }
        
        console.log('Falling back to append')
        onChange(value + text)
      },
      saveCursor
    }), [value, onChange, saveCursor])

    return (
      <div ref={containerRef} className="bytemd-editor">
        <Editor
          value={value}
          onChange={onChange}
          plugins={plugins}
          placeholder={placeholder}
          mode="split"
        />
      </div>
    )
  }
)

ByteMDEditor.displayName = 'ByteMDEditor'

export default ByteMDEditor
