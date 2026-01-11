import YooptaEditor, { createYooptaEditor, YooptaContentValue, YooptaOnChangeOptions } from '@yoopta/editor'

import Paragraph from '@yoopta/paragraph'
import Blockquote from '@yoopta/blockquote'
import Embed from '@yoopta/embed'
import Link from '@yoopta/link'
import Callout from '@yoopta/callout'
import { NumberedList, BulletedList, TodoList } from '@yoopta/lists'
import { Bold, Italic, CodeMark, Underline, Strike, Highlight } from '@yoopta/marks'
import { HeadingOne, HeadingThree, HeadingTwo } from '@yoopta/headings'
import Code from '@yoopta/code'
import Divider from '@yoopta/divider'
import ActionMenuList, { DefaultActionMenuRender } from '@yoopta/action-menu-list'
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar'
import LinkTool, { DefaultLinkToolRender } from '@yoopta/link-tool'

import { useMemo, useRef } from 'react'

const plugins = [
  Paragraph,
  Divider.extend({
    elementProps: {
      divider: props => ({
        ...props,
        color: '#007aff',
      }),
    },
  }),
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  Blockquote,
  Callout,
  NumberedList,
  BulletedList,
  TodoList,
  Code,
  Link,
  Embed,
]

const TOOLS = {
  ActionMenu: {
    render: DefaultActionMenuRender,
    tool: ActionMenuList,
  },
  Toolbar: {
    render: DefaultToolbarRender,
    tool: Toolbar,
  },
  LinkTool: {
    render: DefaultLinkToolRender,
    tool: LinkTool,
  },
}

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight]

type EditorProps = {
  value?: YooptaContentValue
  onChange?: (value: YooptaContentValue, options: YooptaOnChangeOptions) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function Editor({ value, onChange, placeholder, className, autoFocus = false }: EditorProps) {
  const editor = useMemo(() => createYooptaEditor(), [])
  const selectionRef = useRef(null)

  const handleChange = (newValue: YooptaContentValue, options: YooptaOnChangeOptions) => {
    onChange?.(newValue, options)
  }

  return (
    <div className={className} ref={selectionRef}>
      <YooptaEditor
        editor={editor}
        plugins={plugins}
        tools={TOOLS}
        marks={MARKS}
        selectionBoxRoot={selectionRef}
        value={value}
        onChange={handleChange}
        autoFocus={autoFocus}
        placeholder={placeholder}
      />
    </div>
  )
}
