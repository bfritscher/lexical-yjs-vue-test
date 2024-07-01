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

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  const img = domNode as HTMLImageElement
  const { alt: altText, src, width } = img
  // TODO Add border and options
  const node = $createImageNode({
    id: src,
    border: false,
    width: width,
    name: altText
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
    element.setAttribute('src', this.__id)
    element.setAttribute('alt', this.__name)
    element.setAttribute('width', this.__width.toString())
    element.setAttribute('data-border', this.__border.toString())
    // TODO: Add border and options
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
  /*
  TODO setters
    setWidthAndHeight(
      width: 'inherit' | number,
      height: 'inherit' | number,
    ): void {
      const writable = this.getWritable();
      writable.__width = width;
      writable.__height = height;
    }
    */
  setBorder(border: boolean): void {
    const writable = this.getWritable()
    writable.__border = border
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
    return h(ImageComponent, { nodeKey: this.__key, border: this.__border })
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
