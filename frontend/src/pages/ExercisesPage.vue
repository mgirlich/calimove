<template>
  <!--
    TODO
    * add multi-select filter for flows?
    * add filter for level?
    * add checkbox filter for "has mods"?
    * auto comlete for search
   -->
  <div><q-input v-model="inputExerciseName" label="Exercise name" /></div>
  <ExercisesRow
    :id="0"
    :exercises="exercisesFiltered"
  />
</template>


<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { Exercise } from '../components/models';
import ExercisesRow from 'src/components/ExercisesRow.vue';
import { api } from 'src/boot/axios';

const exercises = ref<Array<Exercise>>([]);
const exercisesFiltered = ref<Array<Exercise>>([]);
const inputExerciseName = ref();

watch(inputExerciseName, async(newName: string) => {
  const searchName = newName.toLowerCase();
  if (searchName.length == 0) {
    exercisesFiltered.value = exercises.value;
  } else {
    exercisesFiltered.value = exercises.value.filter((exercise) => exercise.name.toLowerCase().includes(searchName));
  }
})

onMounted(() => {
  api.get('/exercises')
    .then((resp) => {
      exercises.value = resp.data;
      exercisesFiltered.value = exercises.value;
    })
    .catch((err) => {
      console.log(err);
    })
})
</script>

<style>
h2 {
  margin-top: 0.25em;
  margin-bottom: 0.25em;
}

@media (min-width: 1440px) {
  .exercises .exercise-card {
    flex-basis: 20%;
  }
}
</style>
