<script setup lang="ts">
import * as Y from 'yjs'
import tinycolor from 'tinycolor2'
import { WebsocketProvider } from 'y-websocket'
import { type Awareness } from 'y-protocols/awareness'

import { computed, onMounted, ref, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const presencesIndex = ref({})
let awareness: Awareness | null = null
let ydoc: Y.Doc | null = null

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


/*
vue.js -> yjs
yjs -> vue.js
yjs.update -> vue.js

awareness bug?

*/

const sectionIndex = ref({});
  const questionIndex = ref({});
  const answerIndex = ref({});

const editor = computed(() => {
  return {
    sections: Object.values(sectionIndex.value).toSorted((a, b) => a.order - b.order).map((section) => {
      return {
        ...section,
        questions: Object.values(questionIndex.value)
          .filter((question) => question.section === section.id)
          .toSorted((a, b) => a.order - b.order)
          .map((question) => {
            return {
              ...question,
              answers: Object.values(answerIndex.value)
                .filter((answer) => answer.question === question.id)
                .toSorted((a, b) => a.order - b.order)
            }
          })
      }
    })
  }
})

function makeQuestion(data, qid) {
  const question = {
      id: qid,
      title: data.get('title'),
      content: data.get('content'),
      level: data.get('level'),
      section: data.get('section'),
    }
    questionIndex.value[question.id] = question
}

function bindYdocToExam(ydoc: Y.Doc) {
  const ysections = ydoc.getMap('sections')
  const yquestions = ydoc.getMap('questions')
  const yanswers = ydoc.getMap('answers')
  
  ysections.observeDeep((events: Y.YEvent<any>[]) => {
    console.log('ysections', events)
    events.forEach((event) => {
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add') {
          console.log(`Property "${key}" was added. Initial value: "${event.target.get(key).toJson()}".`)
        } else if (change.action === 'update') {
          sectionIndex.value[event.target._item.parentSub][key] = event.target.get(key)
        } else if (change.action === 'delete') {
          delete sectionIndex.value[key]
        }
      })
    })
  })

  yquestions.observeDeep((events: Y.YEvent<any>[]) => {
    console.log('yquestions', events)
    events.forEach((event) => {
      event.changes.keys.forEach((change, key) => {
        if (change.action === 'add') {
          makeQuestion(event.target.get(key), key)
        } else if (change.action === 'update') {
          questionIndex.value[event.target._item.parentSub][key] = event.target.get(key)
        } else if (change.action === 'delete') {
          delete questionIndex.value[key]
        }
      })
    })
  })

  yanswers.observe((event, transaction) => {
    console.log('yanswers', event)
  });
  ysections.forEach((data, sid) => {
    const section = {
      id: sid,
      title: data.get('title'),
      content: data.get('content'),
      level: data.get('level'),
    }
    sectionIndex.value[section.id] = section
  })
  yquestions.forEach((data, qid) => {
    makeQuestion(data, qid)
  })
  yanswers.forEach((data, aid) => {
    const answer = {
      id: aid,
      content: data.get('content'),
      correct: data.get('correct')
    }
    answerIndex.value[answer.id] = answer
  })
}

onMounted(() => {
  ydoc = new Y.Doc()
  const provider = new WebsocketProvider(
    'ws://localhost:8080/ws', // use the public ws server
    'demo2',
    ydoc
  )
  awareness = provider.awareness
  awareness.on('change', (data) => {
    console.log('awareness', data, awareness?.getStates())
    const index = {}
    awareness?.getStates().forEach((value, key) => {
      if (key !== awareness?.clientID) {
        index[value.location] = value
      }
    })
    presencesIndex.value = index
  })

  provider.on('sync', (isSynced: boolean) => {
    console.log('synced', isSynced)
    if (ydoc?.getMap('sections').size === 0) {
      console.log('init')
      examToYdoc(init, ydoc)
      console.log('ydoc', ydoc)
    }
    bindYdocToExam(ydoc)
  })

  provider.awareness.setLocalStateField('user', {
    name: 'Typing Jimmy',
    color: 'blue'
  })
})

function addQuestion(section) {
  const question = {
    id: uuidv4(),
    title: 'New question title' + (section.questions.length + 1),
    content: 'New question content' + (section.questions.length + 1),
    level: 2,
    section: section.id,
    order: section.questions.length - 1, // TODO compute max order
  }
  ydoc?.getMap('questions').set(question.id, new Y.Map(Object.entries(question)))
}

function removeQuestion(question) {
  // TODO delete all answers in transaction
  ydoc?.getMap('questions').delete(question.id)
}

function addAnswer(question) {
  const answer = {
    id: uuidv4(),
    content: 'New answer content' + (question.answers.length + 1),
    correct: false,
    order: question.answers.length - 1,
    question: question.id
  }
  ydoc?.getMap('answers').set(answer.id, new Y.Map(Object.entries(answer)))
}

function setPresenceE(id: string) {
  awareness?.setLocalStateField('location', id)
}

function updateSection(section, attribute, value) {
  // local update
  console.log('updateSection', section, attribute, value)
  section[attribute] = value
  ydoc?.getMap('sections').get(section.id).set(attribute, value)
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
        <button @click="removeQuestion(question)">
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
          addQuestion(section)
        "
      >
        add question
      </button>
    </div>
  </div>
</template>

<style scoped>
.presence {
  background-color: lightgreen;
}
</style>
