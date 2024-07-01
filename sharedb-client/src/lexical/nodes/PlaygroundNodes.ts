import type { Klass, LexicalNode } from 'lexical'
import { HeadingNode } from '@lexical/rich-text'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { ListItemNode, ListNode } from '@lexical/list'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import { HorizontalRuleNode } from './LexicalHorizontalRuleNode'
import { PageBreakNode } from './PageBreakNode'
import { BoxNode } from './BoxNode'
import { ImageNode } from './ImageNode'

const PlaygroundNodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  ListNode,
  ListItemNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  HorizontalRuleNode,
  PageBreakNode,
  BoxNode,
  ImageNode,
]

export default PlaygroundNodes
