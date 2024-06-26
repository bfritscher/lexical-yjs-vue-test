<script setup lang="ts">
import { onMounted } from 'vue';
// import {flushSync, createPortal} from "react-dom";
// import renderLexicalEditor from './LexicalRoot';
// import 'lexical-playground/src/index.css'; 
//createPortal
import { LexicalComposer } from 'lexical-vue'
import Editor from './lexical/Editor.vue';

import type { CreateEditorArgs } from 'lexical'
import { $createParagraphNode, $createTextNode, $getRoot } from 'lexical'
import { $createHeadingNode } from '@lexical/rich-text'
import { $createListItemNode, $createListNode } from '@lexical/list'

import PlaygroundEditorTheme from './lexical/themes/PlaygroundEditorTheme'
import PlaygroundNodes from './lexical/nodes/PlaygroundNodes'
import './lexical/assets/style.css'

import { LexicalOnChangePlugin } from 'lexical-vue';
import {$generateHtmlFromNodes} from '@lexical/html';


function prepopulatedRichText() {
  const root = $getRoot()
  if (root.getFirstChild() === null) {
    const heading = $createHeadingNode('h1')
    heading.append($createTextNode('Welcome to the playground'))
    root.append(heading)
    const paragraph = $createParagraphNode()
    paragraph.append(
      $createTextNode('The playground is a demo environment built with '),
      $createTextNode('lexical-vue').toggleFormat('code'),
      $createTextNode('.'),
      $createTextNode(' Try typing in '),
      $createTextNode('some text').toggleFormat('bold'),
      $createTextNode(' with '),
      $createTextNode('different').toggleFormat('italic'),
      $createTextNode(' formats.'),
    )
    root.append(paragraph)
    const paragraph2 = $createParagraphNode()
    paragraph2.append(
      $createTextNode(
        'Make sure to check out the various plugins in the toolbar. You can also use #hashtags or @-mentions too!',
      ),
    )
    root.append(paragraph2)
    const paragraph3 = $createParagraphNode()
    paragraph3.append(
      $createTextNode(`If you'd like to find out more about Lexical, you can:`),
    )
    root.append(paragraph3)
    const list = $createListNode('bullet')
    list.append(
      $createListItemNode().append(
        $createTextNode(`Visit the `),
        $createTextNode(` for documentation and more information.`),
      ),
      $createListItemNode().append(
        $createTextNode(`Check out the code on our `),
        $createTextNode(`.`),
      ),
      $createListItemNode().append(
        $createTextNode(`Playground code can be found `),
        $createTextNode(`.`),
      ),
      $createListItemNode().append(
        $createTextNode(`Join our `),
        $createTextNode(` and chat with the team.`),
      ),
    )
    root.append(list)
    const paragraph4 = $createParagraphNode()
    paragraph4.append(
      $createTextNode(
        `Lastly, we're constantly adding cool new features to this playground. So make sure you check back here when you next get a chance :).`,
      ),
    )
    root.append(paragraph4)
  }
}

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
import { html2Latex } from './html2latex'
const latex = ref('');
function change(state, editor) {
  editor.update(() => {
    latex.value = html2Latex($generateHtmlFromNodes(editor));
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
