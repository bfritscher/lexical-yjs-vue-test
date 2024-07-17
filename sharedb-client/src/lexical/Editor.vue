<script setup lang="ts">
import { ref } from 'vue'
import {
  LexicalAutoFocusPlugin,
  LexicalHistoryPlugin,
  LexicalListPlugin,
  LexicalRichTextPlugin,
  LexicalTabIndentationPlugin,
  LexicalTablePlugin,
  LexicalCollaborationPlugin
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
import ImagePlugin from './plugins/ImagePlugin.vue'

import { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'

import type { LexicalEditor } from 'lexical'


import type { CreateEditorArgs } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot, $insertNodes } from 'lexical'


import PlaygroundEditorTheme from './themes/PlaygroundEditorTheme'
import PlaygroundNodes from './nodes/PlaygroundNodes'
import './assets/style.css'

import { LexicalOnChangePlugin } from 'lexical-vue';
import {$generateHtmlFromNodes} from '@lexical/html';

import { onMounted } from 'vue';
// import {flushSync, createPortal} from "react-dom";
// import renderLexicalEditor from './LexicalRoot';
// import 'lexical-playground/src/index.css'; 
//createPortal
import { LexicalComposer } from 'lexical-vue'

const config: CreateEditorArgs = {
  theme: PlaygroundEditorTheme,
  nodes: [
    ...PlaygroundNodes,
  ],
  editable: true,
  editorState: null as any,
  //editorState: prepopulatedRichText as any,
}

function onError(error: Error) {
  console.error(error);
}

onMounted(() => {
  const container = document.getElementById('lexical-editor');
  // renderLexicalEditor(container);
});

import {$generateNodesFromDOM} from '@lexical/html';
import { html2Latex } from '../html2latex'
const latex = ref('');
const html = ref('');
function change(state, editor) {
  editor.update(() => {
    latex.value = html2Latex($generateHtmlFromNodes(editor));
  });
  editorRef.value = editor;
}


import {$setSelection, $createRangeSelection, $createNodeSelection} from 'lexical';

function importHtml() {


  editorRef.value.update(() => {
  // In the browser you can use the native DOMParser API to parse the HTML string.
  const parser = new DOMParser();
  const dom = parser.parseFromString(html.value, 'text/html');
  
  // Once you have the DOM instance it's easy to generate LexicalNodes.
  const nodes = $generateNodesFromDOM(editorRef.value, dom);

  // Select the root
  $getRoot().clear().select();

  // Insert them at a selection.
  $insertNodes(nodes);
  $setSelection(null);
});
}
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
  <LexicalComposer :initial-config="config" @error="onError">
    <div class="editor-shell">
      <ToolbarPlugin />
      <div class="editor-container" ref="editorContainer">
        <div className="editor-inner">
          <LexicalRichTextPlugin>
            <template #contentEditable>
              <div class="editor-scroller">
                <div class="editor" ref="editorRef">
                  <ContentEditable />
                </div>
              </div>
            </template>
            <template #placeholder>
              <div class="editor-placeholder">Enter some text...</div>
            </template>
          </LexicalRichTextPlugin>
          <!-- <LexicalHistoryPlugin /> -->
          <LexicalTabIndentationPlugin />
          <LexicalAutoFocusPlugin />
          <CodeHighlightPlugin />
          <LexicalListPlugin />
          <LexicalTablePlugin />
          <ListMaxIndentLevelPlugin :max-depth="3" />
          <DraggableBlockPlugin :anchorElem="editorRef" v-if="editorRef" />
          <TableActionMenuPlugin :anchorElem="editorRef" v-if="editorRef" />
          <LexicalHorizontalRulePlugin />
          <TreeViewPlugin />
          <PageBreakPlugin />
          <BoxPlugin />
          <ImagePlugin />
          <!--
          <LexicalCollaborationPlugin
            id="test"
            :provider-factory="providerFactory"
            :initial-editor-state="initialEditorState"
            :cursors-container-ref="editorContainer"
            cursor-color="#FF0000"
            username="Test"
            :should-bootstrap="true"
          />
          -->
        </div>
      </div>
    </div>
    <LexicalOnChangePlugin @change="change" />
  </LexicalComposer>
  <textarea v-model="html"></textarea> <button @click="importHtml">Import HTML</button>
  <pre>
    {{ latex }}
  </pre>
  <hr />
  <div>
    <div id="lexical-editor"></div>
  </div>
</template>
