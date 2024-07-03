/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type { Component } from 'vue'
import { h } from 'vue'
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedEditor,
  SerializedLexicalNode,
  Spread,
  LexicalCommand
} from 'lexical'

import { $applyNodeReplacement, DecoratorNode, createCommand } from 'lexical'
import ImageComponent from './ImageComponent.vue'

export const INSERT_IMAGE_COMMAND: LexicalCommand<undefined> = createCommand('INSERT_IMAGE_COMMAND')

export interface ImagePayload {
  id: string
  border: boolean
  width: number
  name: string
  options?: string
  key?: NodeKey
}

const ID_ATTRIBUTE = 'id'
const BORDER_DATA_ATTRIBUTE = 'data-border'
const OPTIONS_DATA_ATTRIBUTE = 'data-options'
const WIDTH_DATA_ATTRIBUTE = 'data-width'

function $convertImageElement(domNode: HTMLElement): DOMConversionOutput {
  const node = $createImageNode({
    id: domNode.getAttribute(ID_ATTRIBUTE) || '',
    border: domNode.getAttribute(BORDER_DATA_ATTRIBUTE) === 'true',
    width: parseFloat(domNode.getAttribute(WIDTH_DATA_ATTRIBUTE) || '1'),
    name: domNode.getAttribute('alt') || '',
    options: domNode.getAttribute(OPTIONS_DATA_ATTRIBUTE) || ''
  })
  return { node }
}

export type SerializedImageNode = Spread<
  {
    id: string
    border: boolean
    width: number
    name: string
    options?: string
  },
  SerializedLexicalNode
>

export class ImageNode extends DecoratorNode<Component> {
  __id: string
  __border: boolean
  __width: number
  __name: string
  __options?: string

  static getType(): string {
    return 'image'
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__id,
      node.__border,
      node.__width,
      node.__name,
      node.__options,
      node.__key
    )
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { id, border, width, name, options } = serializedNode
    const node = $createImageNode({
      id,
      border,
      width,
      name,
      options
    })
    return node
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img')
    element.setAttribute('id', this.__id)
    element.setAttribute('alt', this.__name)
    element.setAttribute(WIDTH_DATA_ATTRIBUTE, this.__width.toString())
    element.setAttribute(BORDER_DATA_ATTRIBUTE, this.__border.toString())
    element.setAttribute(OPTIONS_DATA_ATTRIBUTE, this.__options || '')
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: $convertImageElement,
        priority: 0
      })
    }
  }

  constructor(
    id: string,
    border: boolean,
    width: number,
    name: string,
    options?: string,
    key?: NodeKey
  ) {
    super(key)
    this.__id = id
    this.__border = border
    this.__width = width
    this.__name = name
    this.__options = options
  }

  exportJSON(): SerializedImageNode {
    return {
      id: this.__id,
      border: this.__border,
      width: this.__width,
      name: this.__name,
      options: this.__options,
      type: 'image',
      version: 1
    }
  }

  getBorder(): boolean {
    return this.getLatest().__border
  }
  getId(): string {
    return this.getLatest().__id
  }
  getName(): string {
    return this.getLatest().__name
  }
  getOptions(): string | undefined {
    return this.getLatest().__options
  }
  getWidth(): number {
    return this.getLatest().__width
  }

  setBorder(border: boolean): void {
    const writable = this.getWritable()
    writable.__border = border
  }
  setWidth(width: number): void {
    const writable = this.getWritable()
    writable.__width = width
  }
  setOptions(options: string): void {
    const writable = this.getWritable()
    writable.__options = options
  }
  setName(name: string): void {
    const writable = this.getWritable()
    writable.__name = name
  }
  // View

  createDOM(config: EditorConfig): HTMLElement {
    const img = document.createElement('span')
    const theme = config.theme
    const className = theme.image
    if (className !== undefined) {
      img.className = className
    }
    return img
  }

  updateDOM(): false {
    return false
  }

  decorate(): Component {
    return h(ImageComponent, { nodeKey: this.__key, border: this.__border, width: this.__width })
  }
}

export function $createImageNode({
  id,
  border,
  width,
  name,
  options,
  key
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(new ImageNode(id, border, width, name, options, key))
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode
}
