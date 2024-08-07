<script setup lang="ts">
import { h } from 'vue'
import type { CommandListenerPriority, ElementFormatType } from 'lexical'
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  $isElementNode,
  $selectAll,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  KEY_MODIFIER_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
$isNodeSelection
} from 'lexical'
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText
} from '@lexical/selection'
import {
  $findMatchingParent,
  $getNearestBlockElementAncestorOrThrow,
  $getNearestNodeOfType,
  mergeRegister
} from '@lexical/utils'
import { $isDecoratorBlockNode, INSERT_EMBED_COMMAND, useLexicalComposer } from 'lexical-vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { $isListNode, ListNode } from '@lexical/list'
import { $isHeadingNode } from '@lexical/rich-text'
import { CODE_LANGUAGE_MAP, getLanguageFriendlyName } from '@lexical/code'
import { $isCustomCodeNode } from '../../nodes/CustomCodeNode'
import { $isImageNode } from '../../nodes/ImageNode'
import Divider from './Divider.vue'
import BlockFormatDropDown from './BlockFormatDropDown.vue'
import { blockTypeToBlockName, dropDownActiveClass } from './shared'
import DropDown from '../../ui/DropDown.vue'
import DropDownItem from '../../ui/DropDownItem.vue'
import { INSERT_HORIZONTAL_RULE_COMMAND } from '../../nodes/LexicalHorizontalRuleNode'
import { INSERT_PAGE_BREAK_COMMAND } from '../../nodes/PageBreakNode'
import { getSelectedNode } from '../../utils/getSelectedNode'
import useModal from '../../composables/useModal'
import InsertTableDialog from '../Table/InsertTableDialog.vue'
import { INSERT_BOX_COMMAND } from '../../nodes/BoxNode'
import { INSERT_IMAGE_COMMAND } from '../../nodes/ImageNode'

const { modal, showModal } = useModal()

const CODE_LANGUAGE_FRIENDLY_NAME_MAP = {
  html: 'HTML',
  css: 'CSS',
  js: 'JavaScript',
  sql: 'SQL',
  java: 'Java',
  py: 'Python'
}

const LowPriority: CommandListenerPriority = 1

const toolbarRef = ref<HTMLDivElement | null>(null)
const editor = useLexicalComposer()

const fontSize = ref('15px')
const fontColor = ref<string>('#000')
const bgColor = ref<string>('#fff')
const canUndo = ref(false)
const canRedo = ref(false)
const blockType = ref<keyof typeof blockTypeToBlockName>('paragraph')
const type = ref('')
const selectedElementKey = ref()
const codeLanguage = ref('')
const codeBorder = ref(false)
const codeNumbers = ref(false)
const imageBorder = ref(false)
const imageWidth = ref(100)
const imageOptions = ref('')
const isRTL = ref(false)
const fontFamily = ref<string>('Arial')
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)
const isStrikethrough = ref(false)

const isSubscript = ref(false)
const isSuperscript = ref(false)
const isCode = ref(false)
const isLatex = ref(false)

const elementFormat = ref<ElementFormatType>('left')

function $updateToolbar() {
  const selection = $getSelection()
  if ($isNodeSelection(selection)) {
    blockType.value = 'paragraph'
    const node = selection.getNodes()[0];
    selectedElementKey.value = node.getKey()
    type.value = node.getType()
    if ($isImageNode(node)) {
      imageBorder.value = node.getBorder()
      imageWidth.value = node.getWidth()
      imageOptions.value = node.getOptions() || ''
      
    }
  }
  else if ($isRangeSelection(selection)) {
    const anchorNode = selection.anchor.getNode()
    let element =
      anchorNode.getKey() === 'root'
        ? anchorNode
        : $findMatchingParent(anchorNode, (e) => {
            const parent = e.getParent()
            return parent !== null && $isRootOrShadowRoot(parent)
          })
    if (element === null) element = anchorNode.getTopLevelElementOrThrow()

    const elementKey = element.getKey()
    const elementDOM = editor.getElementByKey(elementKey)

    // Update text format
    isBold.value = selection.hasFormat('bold')
    isItalic.value = selection.hasFormat('italic')
    isUnderline.value = selection.hasFormat('underline')
    isStrikethrough.value = selection.hasFormat('strikethrough')
    isCode.value = selection.hasFormat('code')
    isRTL.value = $isParentElementRTL(selection)
    isLatex.value = selection.hasFormat('highlight')

    if (elementDOM !== null) {
      selectedElementKey.value = elementKey
      if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
        const type = parentList ? parentList.getListType() : element.getListType()
        blockType.value = type
      } else {
        type.value = $isHeadingNode(element) ? element.getTag() : element.getType()

        if (type.value in blockTypeToBlockName) {
          blockType.value = type.value as keyof typeof blockTypeToBlockName
        }

        if ($isCustomCodeNode(element)) {
          const language = element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP
          codeLanguage.value = language ? CODE_LANGUAGE_MAP[language] || language : ''
          codeBorder.value = element.getBorder()
          codeNumbers.value = element.getNumbers()
        }
      }
    }

    // Handle buttons
    fontSize.value = $getSelectionStyleValueForProperty(selection, 'font-size', '15px')
    fontColor.value = $getSelectionStyleValueForProperty(selection, 'color', '#000')
    bgColor.value = $getSelectionStyleValueForProperty(selection, 'background-color', '#fff')
    fontFamily.value = $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial')

    const node = getSelectedNode(selection)
    const parent = node?.getParent()
    elementFormat.value = $isElementNode(node)
      ? node.getFormatType()
      : parent?.getFormatType() || 'left'
  }
}

function getCodeLanguageOptions(): [string, string][] {
  const options: [string, string][] = []

  for (const [lang, friendlyName] of Object.entries(CODE_LANGUAGE_FRIENDLY_NAME_MAP))
    options.push([lang, friendlyName])

  return options
}

const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions()

onMounted(() => {
  const unregisterMergeListener = mergeRegister(
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        $updateToolbar()
      })
    }),
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        $updateToolbar()
        return false
      },
      LowPriority
    ),
    editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload: boolean) => {
        canUndo.value = payload
        return false
      },
      LowPriority
    ),
    editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload: boolean) => {
        canRedo.value = payload
        return false
      },
      LowPriority
    )
  )

  onUnmounted(() => {
    unregisterMergeListener()
  })
})

function applyStyleText(styles: Record<string, string>, skipHistoryStack?: boolean) {
  editor.update(
    () => {
      const selection = $getSelection()
      if (selection !== null) $patchStyleText(selection, styles)
    },
    skipHistoryStack ? { tag: 'historic' } : {}
  )
}

function clearFormatting() {
  editor.update(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      $selectAll()
      selection.getNodes().forEach((node) => {
        if ($isTextNode(node)) {
          node.setFormat(0)
          node.setStyle('')
          $getNearestBlockElementAncestorOrThrow(node).setFormat('')
        }
        if ($isDecoratorBlockNode(node)) node.setFormat('')
      })
    }
  })
}

function onCodeLanguageSelect(value: string) {
  editor.update(() => {
    if (selectedElementKey.value !== null) {
      const node = $getNodeByKey(selectedElementKey.value)
      if ($isCustomCodeNode(node)) node.setLanguage(value)
    }
  })
}

function toggleCodeBorder() {
  editor.update(() => {
    if (selectedElementKey.value !== null) {
      const node = $getNodeByKey(selectedElementKey.value)
      if ($isCustomCodeNode(node)) node.setBorder(!node.getBorder())
    }
  })
}

function toggleCodeNumbers() {
  editor.update(() => {
    if (selectedElementKey.value !== null) {
      const node = $getNodeByKey(selectedElementKey.value)
      if ($isCustomCodeNode(node)) node.setNumbers(!node.getNumbers())
    }
  })
}

function toggleImageBorder() {
  editor.update(() => {
    if (selectedElementKey.value !== null) {
      const node = $getNodeByKey(selectedElementKey.value)
      if ($isImageNode(node)) node.setBorder(!node.getBorder())
    }
  })
}

function setImageWidth(event: InputEvent) {
  const value = parseFloat(event?.target?.value)
  editor.update(() => {
    if (selectedElementKey.value !== null) {
      const node = $getNodeByKey(selectedElementKey.value)
      if ($isImageNode(node)) node.setWidth(value)
    }
  })
}

function setImageOptions(event: InputEvent) {
  const value = event?.target?.value
  editor.update(() => {
    if (selectedElementKey.value !== null) {
      const node = $getNodeByKey(selectedElementKey.value)
      if ($isImageNode(node)) node.setOptions(value)
    }
  })
}

const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, ''>]: {
    icon: string
    name: string
  }
} = {
  left: {
    icon: 'left-align',
    name: 'Left Align'
  },
  center: {
    icon: 'center-align',
    name: 'Center Align'
  },
  right: {
    icon: 'right-align',
    name: 'Right Align'
  },
  justify: {
    icon: 'justify-align',
    name: 'Justify Align'
  }
}
</script>

<template>
  <div ref="toolbarRef" class="toolbar">
    <button
      :disabled="!canUndo"
      class="toolbar-item spaced"
      aria-label="Undo"
      @click="editor.dispatchCommand(UNDO_COMMAND, undefined)"
    >
      <i class="format undo" />
    </button>
    <button
      :disabled="!canRedo"
      class="toolbar-item spaced"
      aria-label="Redo"
      @click="editor.dispatchCommand(REDO_COMMAND, undefined)"
    >
      <i class="format redo" />
    </button>
    <Divider />
    <BlockFormatDropDown :block-type="blockType" :editor="editor" />
    <Divider />
    <template v-if="blockType === 'custom-code'">
    <DropDown
      button-class-name="toolbar-item code-language"
      :button-label="getLanguageFriendlyName(codeLanguage)"
      button-aria-label="Select language"
    >
      <DropDownItem
        v-for="[value, name] in CODE_LANGUAGE_OPTIONS"
        :key="value"
        :class="`item ${dropDownActiveClass(value === codeLanguage)}`"
        @click="onCodeLanguageSelect(value)"
      >
        <span class="text">{{ name }}</span>
      </DropDownItem>
    </DropDown>
      <Divider />
      <label><input type="checkbox" :checked="codeNumbers" @input="() => toggleCodeNumbers()" /> Line Numbers</label>
      <label><input type="checkbox" :checked="codeBorder" @input="() => toggleCodeBorder()" /> Border</label>
    </template>
    <template v-else-if="type === 'image'">
      <label><input type="checkbox" :checked="imageBorder" @input="toggleImageBorder" /> Border</label>
      <label><input type="number"  min="1" max="100" :value="imageWidth" @change="setImageWidth" /> width</label>
      <label><input type="text" :value="imageOptions" @input="setImageOptions" /> Options</label>
    </template>
    <template v-else>
      <button
        :class="`toolbar-item spaced ${isBold ? 'active' : ''}`"
        aria-label="Format Bold"
        type="button"
        @click="editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')"
      >
        <i class="format bold" />
      </button>
      <button
        :class="`toolbar-item spaced ${isItalic ? 'active' : ''}`"
        type="button"
        aria-label="Format Italics"
        @click="editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')"
      >
        <i class="format italic" />
      </button>
      <button
        :class="`toolbar-item spaced ${isUnderline ? 'active' : ''}`"
        type="button"
        aria-label="Format Underline"
        @click="editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')"
      >
        <i class="format underline" />
      </button>
      <button
        :class="`toolbar-item spaced ${isStrikethrough ? 'active' : ''}`"
        type="button"
        aria-label="Format Strikethrough"
        @click="editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')"
      >
        <i class="format strikethrough" />
      </button>
      <button
        :class="`toolbar-item spaced ${elementFormat === 'center' ? 'active' : ''}`"
        type="button"
        aria-label="Center text alignment"
        @click="
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, elementFormat === 'center' ? '' : 'center')
        "
      >
        <i class="icon center-align" />
      </button>
      <button
        :class="`toolbar-item spaced ${isCode ? 'active' : ''}`"
        type="button"
        aria-label="Insert Code"
        @click="editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')"
      >
        <i class="format code" />
      </button>
      <button
        :class="`toolbar-item spaced ${isLatex ? 'active' : ''}`"
        type="button"
        aria-label="Insert Latex"
        @click="editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight')"
      >
        LaTeX
      </button>
      <button
        :class="`toolbar-item spaced`"
        type="button"
        aria-label="Insert Image"
        @click="editor.dispatchCommand(INSERT_IMAGE_COMMAND, undefined)"
      >
        <i class="format image" />
      </button>      
      <Divider />
      <DropDown
        button-class-name="toolbar-item spaced"
        button-label=""
        button-aria-label="Formatting options for additional text styles"
        button-icon-class-name="icon dropdown-more"
      >
        <DropDownItem
          :class="`item ${dropDownActiveClass(isStrikethrough)}`"
          title="Strikethrough"
          aria-label="Format text with a strikethrough"
          @click="editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')"
        >
          <i class="icon strikethrough" />
          <span class="text">Strikethrough</span>
        </DropDownItem>
        <DropDownItem
          :class="`item ${dropDownActiveClass(isSubscript)}`"
          title="Strikethrough"
          aria-label="Format text with a subscript"
          @click="editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript')"
        >
          <i class="icon subscript" />
          <span class="text">Subscript</span>
        </DropDownItem>
        <DropDownItem
          :class="`item ${dropDownActiveClass(isSuperscript)}`"
          title="Strikethrough"
          aria-label="Format text with a superscript"
          @click="editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript')"
        >
          <i class="icon superscript" />
          <span class="text">Superscript</span>
        </DropDownItem>
        <DropDownItem
          :class="`item ${dropDownActiveClass(isSuperscript)}`"
          title="Clear text formatting"
          aria-label="Clear all text formatting"
          @click="clearFormatting"
        >
          <i class="icon clear" />
          <span class="text">Clear Formatting</span>
        </DropDownItem>
      </DropDown>
      <Divider />
      <DropDown
        button-class-name="toolbar-item spaced"
        button-label="Insert"
        button-aria-label="Insert specialized editor node"
        button-icon-class-name="icon plus"
      >
        <DropDownItem
          class="item"
          title="Horizontal Rule"
          aria-label="Insert a horizontal rule"
          @click="editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)"
        >
          <i class="icon horizontal-rule" />
          <span class="text">Horizontal Rule</span>
        </DropDownItem>
        <DropDownItem
          class="item"
          title="Box"
          aria-label="Insert a box"
          @click="editor.dispatchCommand(INSERT_BOX_COMMAND, undefined)"
        >
          <i class="icon " />
          <span class="text">Box</span>
        </DropDownItem>
        <DropDownItem
          class="item"
          title="Table"
          aria-label="Insert a table"
          @click="
            showModal('Insert Table', (onClose: () => void) =>
              h(InsertTableDialog, { activeEditor: editor, onClose })
            )
          "
        >
          <i class="icon table" />
          <span class="text">Table</span>
        </DropDownItem>
        <DropDownItem
          class="item"
          title="Page Break"
          aria-label="Insert a page break"
          @click="editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined)"
        >
          <i class="icon page-break" />
          <span class="text">Page Break</span>
        </DropDownItem>
      </DropDown>
      <Divider />
      <DropDown
        v-if="elementFormat"
        :button-label="ELEMENT_FORMAT_OPTIONS[elementFormat].name"
        :button-icon-class-name="`icon ${ELEMENT_FORMAT_OPTIONS[elementFormat].icon}`"
        button-class-name="toolbar-item spaced alignment"
        button-aria-label="Formatting options for text alignment"
      >
        <DropDownItem
          v-for="(option, key) in ELEMENT_FORMAT_OPTIONS"
          @click="() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, key)"
          class="item"
        >
          <i :class="`icon ${option.icon}`"></i>
          <span class="text">{{ option.name }}</span>
        </DropDownItem>
        <Divider />
        <DropDownItem
          @click="() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)"
          class="item"
        >
          <i class="icon outdent"></i>
          <span class="text">Outdent</span>
        </DropDownItem>
        <DropDownItem
          @click="() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)"
          class="item"
        >
          <i class="icon indent"></i>
          <span class="text">Indent</span>
        </DropDownItem>
      </DropDown>
    </template>
  </div>
  <component :is="modal" />
</template>
