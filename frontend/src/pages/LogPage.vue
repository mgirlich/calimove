<template>
  <h2>Your Workout Log</h2>
  <div
    v-for="execution in executions"
    :key="execution.execution_id"
    class="row">
    {{ execution.finished_at }} - {{ execution.level }} {{ execution.name }}
  </div>
</template>


<script setup lang="ts">
import { api } from 'src/boot/axios';
import { Execution } from 'src/components/models';
import { onMounted, ref } from 'vue';

const executions = ref<Array<Execution>>([]);

onMounted(() => {
  api.get('/executions')
    .then((resp) => {
      executions.value = resp.data;
    })
    .catch((err) => {
      console.log(err);
    })
})
</script>
