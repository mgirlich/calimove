<template>
  <!--
    TODO
    * add multi-select filter for flows?
    * add filter for level?
    * add checkbox filter for "has mods"?
    * auto comlete for search
   -->
  <div><q-input v-model="inputExerciseName" label="Exercise name" /></div>
  <div class="row justify-center" style="margin-top: 1em;">
    <ExerciseCard
      v-for="exercise in exercisesFiltered"
      :key="exercise.exercise_id"
      :exercise_id="exercise.exercise_id"
      :name="exercise.name"
      :lecture_id="exercise.lecture_id"
      :mod_lecture_id="exercise.mod_lecture_id"
      :flows="exercise.flows"
    />
  </div>
</template>


<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { Exercise } from '../components/models';
import ExerciseCard from '../components/ExerciseCard.vue';
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
</style>
