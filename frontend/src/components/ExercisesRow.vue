<template>
  <div class="exercises row justify-center" style="margin-top: 1em;">
    <ExerciseCard
      v-for="exercise, i in exercises"

      :key="`${id}_${exercise.exercise_id}`"
      :exercise_id="exercise.exercise_id"
      :name="cardTitle(exercise.name, i)"
      :lecture_id="exercise.lecture_id"
      :mod_lecture_id="exercise.mod_lecture_id"
      :flows="isExercise(exercise) ? exercise.flows : []"

      class="exercise-card col-xs-6 col-sm-4 col-md-2 col-lg-2"
      style="padding: 1em 1em;"
    />
  </div>
</template>

<script setup lang="ts">
import { ExerciseBase, Exercise } from '../components/models';
import ExerciseCard from './ExerciseCard.vue';

const props = defineProps({
  exercises: Array<ExerciseBase>,
  id: Number,
  numbered: Boolean,
});

function cardTitle(name: string, i: number) {
  if (props.numbered) {
    return `${i + 1}. ${name}`
  } else {
    return name
  }
};

function isExercise(exercise: ExerciseBase): exercise is Exercise {
  return 'flows' in exercise
}
</script>

<style>
@media (min-width: 1024px) {
  .exercises .exercise-card {
    flex-basis: 20%;
  }
}
</style>
