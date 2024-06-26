<script setup lang="ts">
import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import 'quill/dist/quill.snow.css'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import tinycolor from 'tinycolor2'
import { WebsocketProvider } from 'y-websocket'

import { computed, onMounted, ref, watch } from 'vue'

import { v4 as uuidv4 } from 'uuid'

Quill.register('modules/cursors', QuillCursors)

declare module 'quill' {
  interface Range {
    name: string // Add the new property here
  }
}

const editorContainer = ref(null)
const presencesIndex = ref({})
let awareness = null
let ydoc = null

const init = {
  sections: [
    {
      id: uuidv4(),
      title: 'Section 1',
      content: 'Section 1 content',
      level: 2,
      questions: [
        {
          id: uuidv4(),
          title: 'Question 1',
          content: 'Question 1 content',
          level: 2,
          answers: [
            {
              id: uuidv4(),
              content: 'Answer 1 content',
              correct: true
            },
            {
              id: uuidv4(),
              content: 'Answer 2 content',
              correct: false
            }
          ]
        },
        {
          id: uuidv4(),
          content: 'Question 2 content',
          answers: [
            {
              id: uuidv4(),
              content: 'Answer 1 content',
              correct: false
            },
            {
              id: uuidv4(),
              content: 'Answer 2 content',
              correct: true
            }
          ]
        }
      ]
    }
  ]
}

function examToYdoc(exam, ydoc) {
  const ysections = ydoc.getMap('sections')
  const yquestions = ydoc.getMap('questions')
  const yanswers = ydoc.getMap('answers')
  exam.sections.forEach((section, sindex) => {
    ysections.set(
      section.id,
      new Y.Map(
        Object.entries({
          title: section.title,
          content: section.content,
          level: section.level,
          order: sindex
        })
      )
    )
    section.questions.forEach((question, qindex) => {
      yquestions.set(
        question.id,
        new Y.Map(
          Object.entries({
            title: question.title,
            content: question.content,
            level: question.level,
            order: qindex,
            section: section.id
          })
        )
      )
      question.answers.forEach((answer, aindex) => {
        yanswers.set(
          answer.id,
          new Y.Map(
            Object.entries({
              content: answer.content,
              correct: answer.correct,
              order: aindex,
              question: question.id
            })
          )
        )
      })
    })
  })
  return ydoc
}

function ydocToExam(ydoc) {
  const sections = []
  const sectionIndex = {}
  const questionIndex = {}
  const answerIndex = {}
  const ysections = ydoc.getMap('sections')
  const yquestions = ydoc.getMap('questions')
  const yanswers = ydoc.getMap('answers')
  // TODO handle updates of vue.js
  ysections.observeDeep((event, transaction) => console.log('ysections', event, transaction))
  yquestions.observe((event, transaction) => console.log('yquestions', event, transaction))
  yanswers.observe((event, transaction) => console.log('yanswers', event, transaction))
  ysections.forEach((data, sid) => {
    const section = {
      id: sid,
      title: data.get('title'),
      content: data.get('content'),
      level: data.get('level'),
      questions: []
    }
    sectionIndex[section.id] = section
    sections.splice(data.get('order'), 0, section)
  })
  yquestions.forEach((data, qid) => {
    const question = {
      id: qid,
      title: data.get('title'),
      content: data.get('content'),
      level: data.get('level'),
      answers: []
    }
    questionIndex[question.id] = question
    sectionIndex[data.get('section')].questions.splice(data.get('order'), 0, question)
  })
  yanswers.forEach((data, aid) => {
    const answer = {
      id: aid,
      content: data.get('content'),
      correct: data.get('correct')
    }
    answerIndex[answer.id] = answer
    questionIndex[data.get('question')].answers.splice(data.get('order'), 0, answer)
  })
  return { sections }
}

const editor = ref(init)

import { createEditor } from 'lexical'

onMounted(() => {
  const config = {
    namespace: 'MyEditor',
    theme: {},
    onError: console.error
  }

  const editor = createEditor(config)

  editor.setRootElement(editorContainer.value)

  ydoc = new Y.Doc()
  const provider = new WebsocketProvider(
    'ws://localhost:8080/ws', // use the public ws server
    'demo2',
    ydoc
  )
  awareness = provider.awareness
  awareness.on('change', (data) => {
    console.log('awareness', data, awareness.getStates())
    const index = {}
    awareness.getStates().forEach((value, key) => {
      if (key !== awareness.clientID) {
        index[value.location] = value
      }
    })
    presencesIndex.value = index
  })

  provider.on('sync', (isSynced) => {
    console.log('synced', isSynced)
    const yeditor = ydoc.getMap('editor')
    if (ydoc.getMap('sections').size === 0) {
      console.log('init')
      examToYdoc(init, ydoc)
      console.log('ydoc', ydoc)
    }
    editor.value = ydocToExam(ydoc)
  })

  /*
  const ytext = ydoc.getText('quill')
  const quill = new Quill(editorContainer.value, {
    modules: {
      cursors: true,
      toolbar: [
        [{ header: [1, 2, false] }],
        ['bold', 'italic', 'underline'],
        ['image', 'code-block']
      ],
      history: {
        userOnly: true
      }
    },
    placeholder: 'Start collaborating...',
    theme: 'snow' // or 'bubble'
  })

  const binding = new QuillBinding(ytext, quill, provider.awareness)
  */
  provider.awareness.setLocalStateField('user', {
    name: 'Typing Jimmy',
    color: 'blue'
  })
})

function addAnswer(question) {
  const answer = {
    id: uuidv4(),
    content: 'New answer content' + (question.answers.length + 1),
    correct: false,
    order: question.answers.length - 1,
    question: question.id
  }
  ydoc.getMap('answers').set(answer.id, new Y.Map(Object.entries(answer)))
}

function setPresenceE(id) {
  awareness.setLocalStateField('location', id)
}

function updateSection(section, attribute, value) {
  // local update
  console.log('updateSection', section, attribute, value)
  section[attribute] = value
  ydoc.getMap('sections').get(section.id).set(attribute, value)
}
</script>

<template>
  <div class="controls">
    <input type="text" placeholder="Enter your name..." id="name" />
    <button id="client-connection" class="connected">Disconnect</button>
  </div>

  <div>Open a new window to see another client!</div>

  <div v-if="editor">
    <div v-for="section in editor.sections">
      <h1 @click="setPresenceE(section.id)" :class="{ presence: presencesIndex[section.id] }">
        {{ section.title }}
      </h1>
      <input
        type="number"
        :value="section.level"
        @input="(event) => updateSection(section, 'level', event.target.value)"
      />
      <div v-for="question in section.questions">
        <h2 @click="setPresenceE(question.id)" :class="{ presence: presencesIndex[question.id] }">
          {{ question.title }}
        </h2>
        <button @click="section.questions.splice(section.questions.indexOf(question), 1)">
          remove
        </button>
        <div v-for="answer in question.answers">
          <p @click="setPresenceE(answer.id)" :class="{ presence: presencesIndex[answer.id] }">
            {{ answer.content }}
          </p>
          <button @click="answer.correct = !answer.correct">
            {{ answer.correct ? 'correct' : 'incorrect' }}
          </button>
          <button @click="question.answers.splice(question.answers.indexOf(answer), 1)">
            remove
          </button>
        </div>
        <button @click="addAnswer(question)">add answer</button>
      </div>
      <button
        @click="
          section.questions.push({ id: uuidv4(), content: 'New question content', answers: [] })
        "
      >
        add question
      </button>
    </div>
  </div>

  <div ref="editorContainer"></div>
</template>

<style scoped>
.presence {
  background-color: lightgreen;
}
</style>
