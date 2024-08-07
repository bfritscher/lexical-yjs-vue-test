<script setup lang="ts">
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'
import { useLexicalComposer, useLexicalNodeSelection } from 'lexical-vue'
import { addClassNamesToElement, mergeRegister, removeClassNamesFromElement } from '@lexical/utils'

import {
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_DELETE_COMMAND,
  KEY_BACKSPACE_COMMAND,
  $getNodeByKey,
  $isNodeSelection,
  $getSelection
} from 'lexical'
import { $isImageNode } from './ImageNode'

const props = defineProps({
  nodeKey: String,
  border: Boolean,
  width: Number
})

const { nodeKey } = props

const editor = useLexicalComposer()
const imgRef = ref(null)

const { isSelected, setSelected, clearSelection } = useLexicalNodeSelection(props.nodeKey)

const $onDelete = (event) => {
  if (isSelected.value && $isNodeSelection($getSelection())) {
    event.preventDefault()
    const node = $getNodeByKey(nodeKey)
    if ($isImageNode(node)) {
      node.remove()
      return true
    }
  }
  return false
}

const registerCommands = () => {
  const clickCommand = editor.registerCommand(
    CLICK_COMMAND,
    (event) => {
      if (event.target === imgRef.value) {
        if (event.shiftKey) {
          setSelected(!isSelected.value)
        } else {
          clearSelection()
          setSelected(true)
        }
        return true
      }
      return false
    },
    COMMAND_PRIORITY_LOW
  )

  const deleteCommand = editor.registerCommand(KEY_DELETE_COMMAND, $onDelete, COMMAND_PRIORITY_LOW)

  const backspaceCommand = editor.registerCommand(
    KEY_BACKSPACE_COMMAND,
    $onDelete,
    COMMAND_PRIORITY_LOW
  )

  return mergeRegister(clickCommand, deleteCommand, backspaceCommand)
}

watchEffect(() => {
  const span = editor.getElementByKey(nodeKey)
  if (span) {
    span.style.width = `${props.width}%`
  }
})

onMounted(() => {
  const unregisterCommands = registerCommands()

  // Cleanup
  onUnmounted(() => {
    unregisterCommands()
  })
})
</script>
<template>
  <img
    ref="imgRef"
    :class="{ focused: isSelected, border: border }"
    src="https://playground.lexical.dev/assets/yellow-flower-vav9Hsve.jpg"
  />
</template>
