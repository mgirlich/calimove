<template>
  <HeadlineNavigation
    :title="`Level ${ level } - Flow ${ name }`"
    link="/flows"
    linkTitle="Choose another flow"
  />

  <q-separator />


  <div class="row justify-center q-pt-md">
    <q-btn
      v-for="workout in workouts"
      rounded
      style="margin: 0em 1em;"
      :key="workout.workout_id"
      :color="workoutChosen === workout.workout_id ? 'primary' : 'secondary'"
      @click="workoutChosen = workout.workout_id"
    >
      <WorkoutDetailChip
        :time_active="workout.time_active"
        :time_break="workout.time_break"
        :n_sets="workout.n_sets"
        :n_reps="workout.n_reps"
      />
    </q-btn>
  </div>

  <div class="row justify-center" style="margin-top: 2em;">
    <router-link
      :to="`/practice/${workoutChosen}`"
      custom
      v-slot="{ navigate }"
    >
      <q-btn @click="((event: Event) => navigate(event as MouseEvent))" role="link">Start Workout</q-btn>
    </router-link>
  </div>

  <div class="row justify-center" style="margin-top: 1em;">
    <ExerciseCard
      v-for="exercise, i in exercises"
      class="col-2"
      style="margin: 1em 1em;"

      :key="exercise.exercise_id"
      :exercise_id="exercise.exercise_id"
      :name="`${i + 1}. ${exercise.name}`"
      :lecture_id="exercise.lecture_id"
      :mod_lecture_id="exercise.mod_lecture_id"
      :level_flows="null"
    />
  </div>
</template>


<script setup lang="ts">
import { onBeforeMount, ref, Ref } from 'vue';
import { useRoute } from 'vue-router';

import ExerciseCard from '../components/ExerciseCard.vue';
import HeadlineNavigation from '../components/HeadlineNavigation.vue';
import WorkoutDetailChip from '../components/WorkoutDetailChip.vue';
import { api } from '../boot/axios';

interface Exercise {
  exercise_id: number
  name: string
  lecture_id: number
  mod_lecture_id: number | undefined
  level_flows: []
}

interface Workout {
  workout_id: number
  time_active: number
  time_break: number
  n_sets: number
  n_reps: number
}

const route =useRoute()

const flow_id = ref(route.params.flow_id)

const level: Ref<number | undefined> = ref(undefined)
const name: Ref<string | undefined> = ref(undefined)
const nSets: Ref<number | undefined> = ref(undefined)
const nReps: Ref<number | undefined> = ref(undefined)
const exercises = ref([] as Exercise[])
const workouts = ref([] as Workout[])

const workoutChosen: Ref<number | undefined> = ref(undefined)

async function getFlow() {
  const resp = await api.get(`/flows/${flow_id.value}`)
  level.value = resp.data.level;
  name.value = resp.data.name;
  nSets.value = resp.data.n_sets;
  nReps.value = resp.data.n_reps;
  exercises.value = resp.data.exercises;
  workouts.value = resp.data.workouts;

  const idx_middle = Math.ceil(workouts.value.length / 2) - 1;
  workoutChosen.value = workouts.value[idx_middle].workout_id;
}


onBeforeMount(() => {
  getFlow();
})
</script>
