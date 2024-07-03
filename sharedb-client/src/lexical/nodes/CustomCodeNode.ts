import { CodeNode } from '@lexical/code'
import { $applyNodeReplacement } from 'lexical'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  ParagraphNode,
  RangeSelection,
  SerializedElementNode,
  Spread,
  TabNode
} from 'lexical'

import { addClassNamesToElement, isHTMLElement } from '@lexical/utils'

const ID_ATTRIBUTE = 'id'
const BORDER_DATA_ATTRIBUTE = 'data-border'
const NUMBERS_DATA_ATTRIBUTE = 'data-numbers'
const LANGUAGE_DATA_ATTRIBUTE = 'data-language'
const HIGHLIGHT_LANGUAGE_DATA_ATTRIBUTE = 'data-highlight-language'

export type SerializedCustomCodeNode = Spread<
  {
    language: string | null | undefined
    id: string | null | undefined
    border: boolean
    numbers: boolean
  },
  SerializedElementNode
>

export class CustomCodeNode extends CodeNode {
  __id: string | null | undefined
  __border: boolean
  __numbers: boolean
  // inherited __language

  static getType(): string {
    return 'custom-code'
  }

  static clone(node: CustomCodeNode): CustomCodeNode {
    return new CustomCodeNode(node.__language, node.__id, node.__border, node.__numbers, node.__key)
  }

  constructor(
    language?: string | null | undefined,
    id?: string | null | undefined,
    border?: boolean,
    numbers?: boolean,
    key?: NodeKey
  ) {
    super(language, key)
    this.__id = id
    this.__border = border || false
    this.__numbers = numbers || false
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config)
    const id = this.getId()
    if (id) {
      dom.setAttribute(ID_ATTRIBUTE, id)
    }
    dom.setAttribute(BORDER_DATA_ATTRIBUTE, String(this.getBorder()))
    dom.setAttribute(NUMBERS_DATA_ATTRIBUTE, String(this.getNumbers()))
    return dom
  }

  updateDOM(prevNode: CodeNode, dom: HTMLElement, config: EditorConfig): boolean {
    super.updateDOM(prevNode, dom, config)
    dom.setAttribute(BORDER_DATA_ATTRIBUTE, String(this.__border))
    dom.setAttribute(NUMBERS_DATA_ATTRIBUTE, String(this.__numbers))
    return false
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('code');
    addClassNamesToElement(element, editor._config.theme.code);
    element.setAttribute('spellcheck', 'false');
    const language = this.getLanguage();
    if (language) {
      element.setAttribute(LANGUAGE_DATA_ATTRIBUTE, language);

      if (this.getIsSyntaxHighlightSupported()) {
        element.setAttribute(HIGHLIGHT_LANGUAGE_DATA_ATTRIBUTE, language);
      }
    }
    const id = this.getId()
    if (id) {
      element.setAttribute(ID_ATTRIBUTE, id)
    }
    element.setAttribute(BORDER_DATA_ATTRIBUTE, String(this.getBorder()))
    element.setAttribute(NUMBERS_DATA_ATTRIBUTE, String(this.getNumbers()))
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      // Typically <pre> is used for code blocks, and <code> for inline code styles
      // but if it's a multi line <code> we'll create a block. Pass through to
      // inline format handled by TextNode otherwise.
      code: (node: Node) => {
        const isMultiLine =
          node.textContent != null &&
          (/\r?\n/.test(node.textContent) || hasChildDOMNodeTag(node, 'BR'))

        return isMultiLine
          ? {
              conversion: $convertPreElement,
              priority: 1
            }
          : null
      },
      pre: () => ({
        conversion: $convertPreElement,
        priority: 0
      })
    }
  }

  static importJSON(serializedNode: SerializedCustomCodeNode): CustomCodeNode {
    const node = $createCustomCodeNode(
      serializedNode.language,
      serializedNode.id,
      serializedNode.border,
      serializedNode.numbers
    )
    node.setFormat(serializedNode.format)
    node.setIndent(serializedNode.indent)
    node.setDirection(serializedNode.direction)
    return node
  }

  exportJSON(): SerializedCustomCodeNode {
    return {
      ...super.exportJSON(),
      id: this.getId(),
      border: this.getBorder(),
      numbers: this.getNumbers(),
      type: 'custom-code',
      version: 1
    }
  }

  getId(): string | null | undefined {
    return this.getLatest().__id
  }

  getBorder(): boolean {
    return this.getLatest().__border
  }

  getNumbers(): boolean {
    return this.getLatest().__numbers
  }

  setBorder(border: boolean): void {
    const writable = this.getWritable()
    writable.__border = border
  }
  setNumbers(numbers: boolean): void {
    const writable = this.getWritable()
    writable.__numbers = numbers
  }
}

export function $createCustomCodeNode(
  language?: string | null | undefined,
  id?: string | null | undefined,
  border?: boolean,
  numbers?: boolean
): CustomCodeNode {
  return $applyNodeReplacement(new CustomCodeNode(language, id, border, numbers))
}

function $convertPreElement(domNode: HTMLElement): DOMConversionOutput {
  const language = domNode.getAttribute(LANGUAGE_DATA_ATTRIBUTE)
  const id = domNode.getAttribute(ID_ATTRIBUTE)
  const border = domNode.getAttribute(BORDER_DATA_ATTRIBUTE) === 'true'
  const numbers = domNode.getAttribute(NUMBERS_DATA_ATTRIBUTE) === 'true'
  return { node: $createCustomCodeNode(language, id, border, numbers) }
}

function hasChildDOMNodeTag(node: Node, tagName: string) {
  for (const child of node.childNodes) {
    if (isHTMLElement(child) && child.tagName === tagName) {
      return true
    }
    hasChildDOMNodeTag(child, tagName)
  }
  return false
}

export function $isCustomCodeNode(node: LexicalNode | null | undefined): node is CustomCodeNode {
  return node instanceof CustomCodeNode
}
