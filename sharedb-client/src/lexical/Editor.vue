<script setup lang="ts">
import { ref } from 'vue'
import {
  LexicalAutoFocusPlugin,
  LexicalHistoryPlugin,
  LexicalListPlugin,
  LexicalRichTextPlugin,
  LexicalTabIndentationPlugin,
  LexicalTablePlugin,
  LexicalCollaborationPlugin,

} from 'lexical-vue'



import TreeViewPlugin from './plugins/TreeViewPlugin.vue'
import ToolbarPlugin from './plugins/ToolbarPlugin/index.vue'
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin.vue'
import ListMaxIndentLevelPlugin from './plugins/ListMaxIndentLevelPlugin.vue'
import ContentEditable from './plugins/ContentEditable.vue'
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin.vue'
import LexicalHorizontalRulePlugin from './plugins/LexicalHorizontalRulePlugin.vue'
import PageBreakPlugin from './plugins/PageBreakPlugin.vue'
import TableActionMenuPlugin from './plugins/Table/TableActionMenuPlugin.vue'
import BoxPlugin from './plugins/BoxPlugin.vue'

import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'

import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import type { LexicalEditor } from 'lexical'

function providerFactory(id: string, yjsDocMap: Map<string, Y.Doc>) {
  const doc = new Y.Doc()
  yjsDocMap.set(id, doc)

  const provider = new WebsocketProvider('ws://localhost:8080', id, doc)

  return provider as any
}

function initialEditorState(editor: LexicalEditor): void {
  const root = $getRoot()
  const paragraph = $createParagraphNode()
  const text = $createTextNode('Welcome to collab!')
  paragraph.append(text)
  root.append(paragraph)
}

const editorContainer = ref<HTMLElement | null>(null)
const editorRef = ref<HTMLElement | null>(null)
</script>

<template>
  <ToolbarPlugin />
  <div class="editor-container"  ref="editorContainer">
    <div className="editor-inner">
      <LexicalRichTextPlugin>
        <template #contentEditable>
          <div class="editor-scroller">
            <div class="editor" ref="editorRef">
              <ContentEditable  />
            </div>
          </div>
        </template>
        <template #placeholder>
          <div class="editor-placeholder">
            Enter some text...
          </div>
        </template>
      </LexicalRichTextPlugin>
      <!-- <LexicalHistoryPlugin /> -->
      <LexicalTabIndentationPlugin />
      <LexicalAutoFocusPlugin />
      <CodeHighlightPlugin />
      <LexicalListPlugin />
      <LexicalTablePlugin />
      <ListMaxIndentLevelPlugin :max-depth="3" />
      <DraggableBlockPlugin :anchorElem="editorRef"  v-if="editorRef"/>
      <TableActionMenuPlugin :anchorElem="editorRef" v-if="editorRef"/>
      <LexicalHorizontalRulePlugin />
      <TreeViewPlugin />
      <PageBreakPlugin />
      <BoxPlugin />
      <LexicalCollaborationPlugin
        id="test"
        :provider-factory="providerFactory"
        :initial-editor-state="initialEditorState"
        :cursors-container-ref="editorContainer"
        cursor-color="#FF0000"
        username="Test"
        :should-bootstrap="true"
      />
    </div>
  </div>
</template>
