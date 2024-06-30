import { ElementNode, $createParagraphNode } from 'lexical';

import type {
    DOMConversionMap,
    DOMConversionOutput,
    LexicalNode,
    SerializedLexicalNode,
    NodeKey,
    LexicalCommand,
    RangeSelection,
  } from 'lexical'
  
  import { createCommand } from 'lexical'

export const INSERT_BOX_COMMAND: LexicalCommand<undefined> = createCommand('INSERT_BOX_COMMAND')

export class BoxNode extends ElementNode {
  static getType(): string {
    return 'box';
  }

  static clone(node: BoxNode): BoxNode {
    return new BoxNode(node.__key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('box');
    return dom;
  }

  updateDOM(prevNode: BoxNode, dom: HTMLElement): boolean {
    // Returning false tells Lexical that this node does not need its
    // DOM element replacing with a new copy from createDOM.
    return false;
  }

  // TODO import DOM / json export

}

export function $createBoxNode(): BoxNode {
    return new BoxNode().append($createParagraphNode())
}
  
export function $isBoxNode(node: LexicalNode | null | undefined): node is BoxNode {
    return node instanceof BoxNode
}
