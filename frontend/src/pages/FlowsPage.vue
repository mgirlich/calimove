<template>
  <div
    v-for="flow in flows"
    :key="flow.flow_id"
    class="q-mb-xl">
    <div>
      <router-link
        :to="`/flows/${flow.flow_id}`"
        custom
        v-slot="{ navigate }"
      >
        <h2
          class="cursor-pointer text-h4"
          @click="navigate"
          role="link"
          style="width: fit-content; margin: auto;"
          >
          Level {{ flow.level }} - Flow {{ flow.name }}
        </h2>
      </router-link>
    </div>

    <q-separator />

    <div class="row justify-center" style="margin-top: 1em;">
      <ExerciseCard
        v-for="exercise, i in flow.exercises"
        class="col-2"
        style="margin: 1em 1em;"

        :key="`${flow.flow_id}_${exercise.exercise_id}`"
        :exercise_id="exercise.exercise_id"
        :name="`${i + 1}. ${exercise.name}`"
        :lecture_id="exercise.lecture_id"
        :mod_lecture_id="exercise.mod_lecture_id"
        :level_flows="[]"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import ExerciseCard from '../components/ExerciseCard.vue';
import { Flow } from '../components/models';
import { api } from 'src/boot/axios';

const flows = ref<Array<Flow>>([]);

onMounted(() => {
  api.get('/flows')
    .then((resp) => {
      flows.value = resp.data;
    })
    .catch((err) => {
      console.log(err);
    })
})
</script>
