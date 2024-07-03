<script setup lang="ts">
import { onMounted } from 'vue';
// import {flushSync, createPortal} from "react-dom";
// import renderLexicalEditor from './LexicalRoot';
// import 'lexical-playground/src/index.css'; 
//createPortal
import { LexicalComposer } from 'lexical-vue'
import Editor from './lexical/Editor.vue';

import type { CreateEditorArgs } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot, $insertNodes } from 'lexical'


import PlaygroundEditorTheme from './lexical/themes/PlaygroundEditorTheme'
import PlaygroundNodes from './lexical/nodes/PlaygroundNodes'
import './lexical/assets/style.css'

import { LexicalOnChangePlugin } from 'lexical-vue';
import {$generateHtmlFromNodes} from '@lexical/html';

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

import { ref } from 'vue';
import {$generateNodesFromDOM} from '@lexical/html';
import { html2Latex } from './html2latex'
const latex = ref('');
const html = ref('');
const editorRef = ref(null);
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
</script>

<template>
  <LexicalComposer :initial-config="config" @error="onError">
    <div class="editor-shell">
      <Editor />
    </div>
    <LexicalOnChangePlugin @change="change" />
  </LexicalComposer>
  <textarea v-model="html"></textarea> <button @click="importHtml">Import HTML</button>
  <pre>
    {{ latex }}
  </pre>
  <hr>
  <div>
    <div id="lexical-editor"></div>
  </div>
</template>

<style scoped>
.presence {
  background-color: lightgreen;
}
</style>
