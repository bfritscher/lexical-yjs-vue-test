<script setup lang="ts">
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposer } from 'lexical-vue'
import { onMounted, onUnmounted } from 'vue'
import { $wrapNodeInElement } from '@lexical/utils'
import {
  $insertNodes,
  $isRootOrShadowRoot,
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR
} from 'lexical'

import { $createImageNode, ImageNode } from '../nodes/ImageNode'
import { INSERT_IMAGE_COMMAND } from '../nodes/ImageNode'

const editor = useLexicalComposer()

let unregisterListener: () => void

onMounted(() => {
  if (!editor.hasNodes([ImageNode])) {
    throw new Error('ImagePlugin: ImageNode is not registered on editor')
  }

  unregisterListener = editor.registerCommand(
    INSERT_IMAGE_COMMAND,
    (payload) => {
        // TODO from payload or default
      const imageNode = $createImageNode({
        id: 'image',
        border: false,
        width: 80,
        name: 'test'
      })
      $insertNodes([imageNode])
      if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
        $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd()
      }

      return true
    },
    COMMAND_PRIORITY_EDITOR
  )
})
onUnmounted(() => {
  unregisterListener?.()
})
</script>
<template />
