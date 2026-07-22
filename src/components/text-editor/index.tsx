// src/Tiptap.tsx
import { useEditor, EditorContent, EditorContext } from '@tiptap/react'
import { FloatingMenu, BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Heading from './extensions/headings'
import { useMemo } from 'react'



const TextEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit.configure({
      paragraph: {
        HTMLAttributes: {
          class: 'text-md'
        }
      },
      bulletList: {
        HTMLAttributes: {
          class: 'list-disc'
        }
      },
      orderedList: {
        HTMLAttributes: {
          class: 'list-decimal'
        }
      },
      link: {
        HTMLAttributes: {
          class: 'text-blue-500 hover:underline' //actually make these look better prolly.
        }
      },
      strike: {
        HTMLAttributes: {
          class: 'line-through'
        }
      },
      bold: {
        HTMLAttributes: {
          class: 'font-bold text-blue-400'
        }
      },
      italic: {
        HTMLAttributes: {
          class: 'italic'
        }
      },
      heading: false
    }), Heading.configure({
            levels: [1, 2, 3, 4, 5, 6],
          })], // define your extension array
    content: '<p>Hello World!</p>', // initial content

  })

  // Memoize the provider value to avoid unnecessary re-renders
  const providerValue = useMemo(() => ({ editor }), [editor])

  return (
    <>
      <EditorContext.Provider value={providerValue}>
        <EditorContent className="p-5 border border-secondary rounded-xl" editor={editor} />
        {/*<FloatingMenu editor={editor}>This is the floating menu</FloatingMenu>
        <BubbleMenu editor={editor}>This is the bubble menu</BubbleMenu>*/}
      </EditorContext.Provider>
      <pre>{editor.getHTML()}</pre>
    </>
  )
}

export default TextEditor
