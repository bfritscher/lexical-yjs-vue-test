<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PropType } from 'vue'
import type { LexicalEditor } from 'lexical'

import { INSERT_TABLE_COMMAND } from '@lexical/table'

import Button from '../../ui/Button.vue'
import DialogActions from '../../ui/DialogActions.vue'
import TextInput from '../../ui/TextInput.vue'

const props = defineProps({
  activeEditor: {
    type: Object as PropType<LexicalEditor>,
    required: true
  },
  onClose: {
    type: Function as PropType<() => void>,
    required: true
  }
})

const rows = ref(4)
const columns = ref(4)
const isDisabled = computed(() => {
  return !(
    rows.value &&
    rows.value > 0 &&
    rows.value <= 500 &&
    columns.value &&
    columns.value > 0 &&
    columns.value <= 50
  )
})

const onClick = () => {
  props.activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
    columns: String(columns.value),
    rows: String(rows.value),
    includeHeaders: {
      columns: false,
      rows: false
    }
  })
  props.onClose()
}
</script>
<template>
  <div style="width: '600px'">
    <TextInput
      placeholder="# of rows (1-500)"
      label="Rows"
      v-model.number="rows"
      data-test-id="table-modal-rows"
      type="number"
    />
    <TextInput
      placeholder="# of columns (1-50)"
      label="Columns"
      v-model.number="columns"
      data-test-id="table-modal-columns"
      type="number"
    />
    <DialogActions data-test-id="table-model-confirm-insert">
      <Button :disabled="isDisabled" @click="onClick">Confirm</Button>
    </DialogActions>
  </div>
</template>
