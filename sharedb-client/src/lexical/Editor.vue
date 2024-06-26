<script setup lang="ts">
import { ref } from 'vue'
import {
  LexicalAutoFocusPlugin,
  LexicalHistoryPlugin,
  LexicalListPlugin,
  LexicalRichTextPlugin,
  LexicalTabIndentationPlugin,
  LexicalTablePlugin,
} from 'lexical-vue'



import TreeViewPlugin from './plugins/TreeViewPlugin.vue'
import ToolbarPlugin from './plugins/ToolbarPlugin/index.vue'
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin.vue'
import ListMaxIndentLevelPlugin from './plugins/ListMaxIndentLevelPlugin.vue'
import ContentEditable from './plugins/ContentEditable.vue'
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin.vue'
import LexicalHorizontalRulePlugin from './plugins/LexicalHorizontalRulePlugin.vue'
import PageBreakPlugin from './plugins/PageBreakPlugin.vue'

const editorContainer = ref<HTMLElement | null>(null)
</script>

<template>
  <ToolbarPlugin />
  <div class="editor-container" >
    <div className="editor-inner">
      <LexicalRichTextPlugin>
        <template #contentEditable>
          <div class="editor-scroller">
            <div class="editor" ref="editorContainer">
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
      <LexicalHistoryPlugin />
      <LexicalTabIndentationPlugin />
      <LexicalAutoFocusPlugin />
      <CodeHighlightPlugin />
      <LexicalListPlugin />
      <LexicalTablePlugin />
      <ListMaxIndentLevelPlugin :max-depth="3" />
      <DraggableBlockPlugin :anchorElem="editorContainer" />
      <LexicalHorizontalRulePlugin />
      <TreeViewPlugin />
      <PageBreakPlugin />
    </div>
  </div>
</template>
