<script setup lang="ts">
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $isTableSelection,
  getTableObserverFromTableElement,
  TableCellNode,
} from '@lexical/table'

import type { HTMLTableElementWithWithTableSelectionState, TableSelection } from '@lexical/table'

import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from 'lexical'
import { onMounted, onUnmounted, ref, watchEffect } from 'vue'
import { useLexicalComposer } from 'lexical-vue'

const props = defineProps({
  anchorElem: {
    type: Object,
    required: true
  }
})

const editor = useLexicalComposer()

const dropDownRef = ref<HTMLDivElement | null>(null)
const tableCellNode = ref<TableCellNode | null>(null)
const selectionCounts = ref({ columns: 1, rows: 1 })
const menuButtonRef = ref<HTMLDivElement | null>(null)
const menuRootRef = ref<HTMLDivElement | null>(null)
const isMenuOpen = ref(false)

function computeSelectionCount(selection: TableSelection): {
  columns: number;
  rows: number;
} {
  const selectionShape = selection.getShape();
  return {
    columns: selectionShape.toX - selectionShape.fromX + 1,
    rows: selectionShape.toY - selectionShape.fromY + 1,
  };
}

onMounted(() => {
  const unregister = editor.registerMutationListener(TableCellNode, (nodeMutations) => {
    if (!tableCellNode.value) return;
    const nodeUpdated = nodeMutations.get(tableCellNode.value.getKey()) === 'updated'

    if (nodeUpdated) {
      editor.getEditorState().read(() => {
        tableCellNode.value = tableCellNode.value.getLatest()
      })
    }
  })

  onUnmounted(() => {
    unregister()
  })
})

watchEffect(() => {
  const menuButtonElement = menuRootRef.value
  const dropDownElement = dropDownRef.value
  const rootElement = editor.getRootElement()

  if (menuButtonElement != null && dropDownElement != null && rootElement != null) {
    const rootEleRect = rootElement.getBoundingClientRect()
    const menuButtonRect = menuButtonElement.getBoundingClientRect()
    dropDownElement.style.opacity = '1'
    const dropDownElementRect = dropDownElement.getBoundingClientRect()
    const margin = 5
    let leftPosition = 20 //  menuButtonRect.right + margin
    /*
    if (
      leftPosition + dropDownElementRect.width > window.innerWidth ||
      leftPosition + dropDownElementRect.width > rootEleRect.right
    ) {
      const position = menuButtonRect.left - dropDownElementRect.width - margin
      leftPosition = (position < 0 ? margin : position) + window.scrollX
    }
      */
    dropDownElement.style.left = `${leftPosition}px`

    let topPosition = 5; //margin // menuButtonRect.top
    /*
    if (topPosition + dropDownElementRect.height > window.innerHeight) {
      const position = menuButtonRect.bottom - dropDownElementRect.height
      topPosition = (position < 0 ? margin : position) + window.scrollX
    }
      */
    dropDownElement.style.top = `${topPosition}px`
  }
})

function handleClickOutside(event: MouseEvent) {
  if (
    dropDownRef.value != null &&
    menuRootRef.value != null &&
    !dropDownRef.value.contains(event.target as Node)
  ) {
    isMenuOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
})

const clearTableSelection = () => {
  editor.update(() => {
    if (tableCellNode.value.isAttached()) {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode.value)
      const tableElement = editor.getElementByKey(
        tableNode.getKey()
      ) as HTMLTableElementWithWithTableSelectionState

      if (!tableElement) {
        throw new Error('Expected to find tableElement in DOM')
      }

      const tableSelection = getTableObserverFromTableElement(tableElement)
      if (tableSelection !== null) {
        tableSelection.clearHighlight()
      }

      tableNode.markDirty()
      tableCellNode.value = tableCellNode.value.getLatest()
    }

    const rootNode = $getRoot()
    rootNode.selectStart()
  })
}

const insertTableRowAtSelection = (shouldInsertAfter: boolean) => {
  editor.update(() => {
    for (let i = 0; i < selectionCounts.value.rows; i++) {
      $insertTableRow__EXPERIMENTAL(shouldInsertAfter)
    }
    isMenuOpen.value = false
  })
}

const insertTableColumnAtSelection = (shouldInsertAfter: boolean) => {
  editor.update(() => {
    for (let i = 0; i < selectionCounts.value.columns; i++) {
      $insertTableColumn__EXPERIMENTAL(shouldInsertAfter)
    }
    isMenuOpen.value = false
  })
}

const deleteTableRowAtSelection = () => {
  editor.update(() => {
    $deleteTableRow__EXPERIMENTAL()
    clearTableSelection()
    isMenuOpen.value = false
  })
}

const deleteTableAtSelection = () => {
  editor.update(() => {
    const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode.value)
    tableNode.remove()

    clearTableSelection()
    isMenuOpen.value = false
  })
}

const deleteTableColumnAtSelection = () => {
  editor.update(() => {
    $deleteTableColumn__EXPERIMENTAL()
    clearTableSelection()
    isMenuOpen.value = false
  })
}

watchEffect(() => {
  const menuButtonDOM = menuButtonRef.value as HTMLButtonElement | null
  if (menuButtonDOM != null && tableCellNode.value != null) {
    const tableCellNodeDOM = editor.getElementByKey(tableCellNode.value.getKey())

    if (tableCellNodeDOM != null) {
      const tableCellRect = tableCellNodeDOM.getBoundingClientRect()
      const menuRect = menuButtonDOM.getBoundingClientRect()
      const anchorRect = props.anchorElem.getBoundingClientRect()

      const top = tableCellRect.top - anchorRect.top + 4
      const left = tableCellRect.right - menuRect.width - 10 - anchorRect.left

      menuButtonDOM.style.opacity = '1'
      menuButtonDOM.style.transform = `translate(${left}px, ${top}px)`
    } else {
      menuButtonDOM.style.opacity = '0'
      menuButtonDOM.style.transform = 'translate(-10000px, -10000px)'
    }
  }

  const prevTableCellDOM = ref(tableCellNode.value)

  if (prevTableCellDOM.value !== tableCellNode.value) {
    isMenuOpen.value = false
  }

  prevTableCellDOM.value = tableCellNode.value
})
function $moveMenu() {
  const menu = menuButtonRef.value
  const selection = $getSelection()
  const nativeSelection = window.getSelection()
  const activeElement = document.activeElement

  if (selection == null || menu == null) {
    tableCellNode.value = null
    return
  }

  const rootElement = editor.getRootElement()

  if (
    $isRangeSelection(selection) &&
    rootElement !== null &&
    nativeSelection !== null &&
    rootElement.contains(nativeSelection.anchorNode)
  ) {
    const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(selection.anchor.getNode())

    if (tableCellNodeFromSelection == null) {
      tableCellNode.value = null
      return
    }

    const tableCellParentNodeDOM = editor.getElementByKey(tableCellNodeFromSelection.getKey())

    if (tableCellParentNodeDOM == null) {
      tableCellNode.value = null
      return
    }
    tableCellNode.value = tableCellNodeFromSelection
  } else if (!activeElement) {
    tableCellNode.value = null
  }
}

onMounted(() => {
  const unregister = editor.registerUpdateListener(() => {
    editor.getEditorState().read(() => {
      $moveMenu()
    })
  })
  onUnmounted(() => {
    unregister()
  })
})

watchEffect(() => {
  if(isMenuOpen.value) {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isTableSelection(selection)) {
        selectionCounts.value = computeSelectionCount(selection);
      }
    });
  }
})

</script>
<template>
  <Teleport :to="anchorElem">
    <div class="table-cell-action-button-container" ref="menuButtonRef">
      <button
        v-if="tableCellNode"
        type="button"
        class="table-cell-action-button chevron-down"
        @click.stop="isMenuOpen = !isMenuOpen"
        ref="menuRootRef"
      >
        <i class="chevron-down" />
      </button>
      <div class="dropdown" v-if="isMenuOpen" ref="dropDownRef" @click.stop>
        <button
          type="button"
          class="item"
          @click="insertTableRowAtSelection(true)"
          data-test-id="table-insert-row-below"
        >
          <span class="text">
            Insert {{ selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows` }}
            below
          </span>
        </button>
        <hr />
        <button
          type="button"
          class="item"
          @click="insertTableColumnAtSelection(true)"
          data-test-id="table-insert-column-after"
        >
          <span class="text">
            Insert {{ selectionCounts.columns === 1 ? 'column' : `${selectionCounts.columns} columns` }}
            right
          </span>
        </button>
        <hr />
        <button
          type="button"
          class="item"
          @click="deleteTableColumnAtSelection()"
          data-test-id="table-delete-columns"
        >
          <span class="text">Delete column</span>
        </button>
        <button
          type="button"
          class="item"
          @click="deleteTableRowAtSelection()"
          data-test-id="table-delete-rows"
        >
          <span class="text">Delete row</span>
        </button>
        <button
          type="button"
          class="item"
          @click="deleteTableAtSelection()"
          data-test-id="table-delete"
        >
          <span class="text">Delete table</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>
