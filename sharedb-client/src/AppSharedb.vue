<script setup lang="ts">
import 'quill/dist/quill.snow.css'
import ReconnectingWebSocket from 'reconnecting-websocket'
import ShareDB from 'sharedb/lib/client'
import richText from 'rich-text'
import * as json1 from 'ot-json1'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import tinycolor from 'tinycolor2'
import ObjectID from 'bson-objectid'
import { computed, onMounted, ref, watch } from 'vue'

import diffMatchPatch from 'diff-match-patch'
import * as textUnicode from 'ot-text-unicode'
import jsondiff from 'json0-ot-diff'
import { v4 as uuidv4 } from 'uuid';

function diff(a, b) {
  return jsondiff(a, b, diffMatchPatch, json1, textUnicode)
}

declare module 'quill' {
  interface Range {
    name: string // Add the new property here
  }
}

declare module 'sharedb/lib/client' {
  interface Connection {
    bindToSocket(socket: ReconnectingWebSocket): void
  }
}

let docEditor = null
let localPresenceE = null

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
const editor = ref(null)
const isRemote = ref(false)

const presences = ref({});
const presencesIndex = computed(() => Object.values(presences.value).reduce((acc, val) => {
  acc[val.id] = val
  return acc
}, {}))

onMounted(() => {
  ShareDB.types.register(richText.type)
  ShareDB.types.register(json1.type)
  Quill.register('modules/cursors', QuillCursors)

  const connectionButton = document.getElementById('client-connection')
  connectionButton.addEventListener('click', function () {
    toggleConnection(connectionButton)
  })

  const nameInput = document.getElementById('name') as HTMLInputElement

  const colors = {}

  const collection = 'examples'
  const id = 'richtext'
  const presenceId = new ObjectID().toString()

  const socket = new ReconnectingWebSocket('ws://' + window.location.host + '/ws', [], {
    // ShareDB handles dropped messages, and buffering them while the socket
    // is closed has undefined behavior
    maxEnqueuedMessages: 0
  })
  const connection = new ShareDB.Connection(socket)
  docEditor = connection.get('editor', 'project-id')
  docEditor.fetch(function (err) {
    if (err) throw err
    if (docEditor.type === null) {
      docEditor.create(init, 'json1')
    }
  })
  docEditor.subscribe(function (err) {
    if (err) throw err
    editor.value = docEditor.data
    docEditor.on('op', function (op, source) {
      console.log('op', op, source)
      if (source) return
      isRemote.value = true
      editor.value = json1.type.apply(editor.value, op)
    })
  })
  const presenceE = connection.getPresence('app')
  presenceE.subscribe(function (error) {
    if (error) throw error
  })
  localPresenceE = presenceE.create()
  presenceE.on('receive', function (id, value) {
    console.log('receive', id, value)
    if (value === null) {
      delete presences.value[id]
    } else {
      presences.value[id] = value
    }
  })

  const doc = connection.get(collection, id)

  doc.subscribe(function (err) {
    if (err) throw err
    initialiseQuill(doc)
  })

  function initialiseQuill(doc) {
    const quill = new Quill('#editor', {
      theme: 'snow',
      modules: { 
        cursors: true,
        syntax: true,
     }
    })
    const cursors = quill.getModule('cursors') as QuillCursors

    quill.setContents(doc.data)

    quill.on('text-change', function (delta, oldDelta, source) {
      if (source !== 'user') return
      doc.submitOp(delta)
    })

    doc.on('op', function (op, source) {
      if (source) return
      quill.updateContents(op)
    })

    const presence = doc.connection.getDocPresence(collection, id)
    presence.subscribe(function (error) {
      if (error) throw error
    })
    const localPresence = presence.create(presenceId)

    quill.on('selection-change', function (range, oldRange, source) {
      // We only need to send updates if the user moves the cursor
      // themselves. Cursor updates as a result of text changes will
      // automatically be handled by the remote client.
      if (source !== 'user') return
      // Ignore blurring, so that we can see lots of users in the
      // same window. In real use, you may want to clear the cursor.
      if (!range) return
      // In this particular instance, we can send extra information
      // on the presence object. This ability will vary depending on
      // type.
      range.name = nameInput.value
      localPresence.submit(range, function (error) {
        if (error) throw error
      })
    })

    presence.on('receive', function (id, range) {
      colors[id] = colors[id] || tinycolor.random().toHexString()
      const name = (range && range.name) || 'Anonymous'
      cursors.createCursor(id, name, colors[id])
      cursors.moveCursor(id, range)
    })

    return quill
  }

  function toggleConnection(button) {
    if (button.classList.contains('connected')) {
      button.classList.remove('connected')
      button.textContent = 'Connect'
      disconnect()
    } else {
      button.classList.add('connected')
      button.textContent = 'Disconnect'
      connect()
    }
  }

  function disconnect() {
    doc.connection.close()
  }

  function connect() {
    const socket = new ReconnectingWebSocket('ws://' + window.location.host + '/ws')
    doc.connection.bindToSocket(socket)
  }
})

function addAnswer(question) {
  const before = JSON.parse(JSON.stringify(editor.value))
  question.answers.push({
    id: uuidv4(),
    content: 'New answer content' + (question.answers.length + 1),
    correct: false
  })
}

watch(
  () => JSON.parse(JSON.stringify(editor.value)),
  (value, old) => {
    if (old === null) return
    if (isRemote.value) {
      isRemote.value = false
      return
    }
    console.log(value, old)
    const ops = diff(old, value)
    console.log(ops)
    docEditor.submitOp(ops)
  },
  { deep: true }
)

function setPresenceE(id) {
  localPresenceE.submit({ id: id }, function (error) {
    if (error) throw error
  })
}
</script>

<template>
  <!-- Include your favorite highlight.js stylesheet -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css" rel="stylesheet">

<!-- Include the highlight.js library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <div class="controls">
    <input type="text" placeholder="Enter your name..." id="name" />
    <button id="client-connection" class="connected">Disconnect</button>
  </div>

  <div>Open a new window to see another client!</div>

  <div v-if="editor">
    <div v-for="section in editor.sections">
      <h1 @click="setPresenceE(section.id)" :class="{presence: presencesIndex[section.id]}">{{ section.title }}</h1>
      <input type="number" v-model.number="section.level" />
      <div v-for="question in section.questions">
        <h2 @click="setPresenceE(question.id)" :class="{presence: presencesIndex[question.id]}">{{ question.title }}</h2>
        <button @click="section.questions.splice(section.questions.indexOf(question), 1)">remove</button>
        <div v-for="answer in question.answers">
          <p @click="setPresenceE(answer.id)" :class="{presence: presencesIndex[answer.id]}">{{ answer.content }}</p>
          <button @click="answer.correct = !answer.correct">{{ answer.correct ? 'correct' : 'incorrect' }}</button>
          <button @click="question.answers.splice(question.answers.indexOf(answer), 1)">remove</button>
        </div>
        <button @click="addAnswer(question)">add answer</button>
      </div>
      <button @click="section.questions.push({ id: uuidv4(), content: 'New question content', answers: [] })">add question</button>
    </div>
  </div>

  <div id="editor"></div>
</template>

<style scoped>
.presence {
  background-color: lightgreen;
}
</style>
