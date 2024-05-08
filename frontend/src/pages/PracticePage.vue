<template>
  <HeadlineNavigation
    :title="`Level ${ level } - Flow ${ flowName }`"
    :link="`/flows/${flowId}`"
    linkTitle="Workouts"
  />

  <q-separator />

  <div class="text-center">
    <LectureLink :lectureId="lectureId" extra="#lecture_content_complete_button">Follow along video</LectureLink>
  </div>

  <div class="row q-mt-md q-mx-auto justify-center">
    <q-card style="width: 40em;">
      <q-card-section>
        <h3 class="text-h5" style="height: 100%" v-if="curExercise">{{ curExercise.name }}</h3>
      </q-card-section>
      <q-card-section>
        <div class="row">
          <div class="col" v-if="curExercise">
            <div class="row justify-center"><q-img style="max-width: 16em;" :src="`/exercise_images/exercise_${curExercise.exercise_id}.png`"></q-img></div>
            <div class="row justify-center">
              <LectureLink :lectureId="curExercise.lecture_id">Video</LectureLink>
              <LectureLink v-if="curExercise.mod_lecture_id" :lectureId="curExercise.mod_lecture_id">Mods</LectureLink>
            </div>
          </div>

          <div class="col">
            <div class="column items-center" style="height: 100%">
              <div class="col content-center">
                <p class="text-weight-bold text-h2" style="letter-spacing: 3px;">
                  {{ timeFormatted }}
                </p>
              </div>
              <div class="col content-center">
                <a class="text-h5" style="text-transform: uppercase;">{{ stateText }}</a>
              </div>
              <div class="col row content-center">
                <set-rep-box name="Rep" :i="curRep" :n="nReps"></set-rep-box>
                <set-rep-box name="Set" :i="curSet" :n="nSets"></set-rep-box>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator class="q-mt-md" style="margin-top: 0;"/>

      <q-card-section>
        <div class="row justify-center">
          <q-btn-group class="justify-center">
            <practiceControl @click="handlePrevRepClick()" :icon=laBackwardSolid label="Rep" />
            <practiceControl
              @click="toggleTimer()"
              :icon="timerControl.icon"
              :label="timerControl?.label" style="width: 4em;"
            />
            <practiceControl @click="handleNextRepClick()" :icon=laForwardSolid label="Rep" />
          </q-btn-group>
        </div>
      </q-card-section>
    </q-card>
  </div>

  <q-dialog v-model="showLoggedWorkout" position="standard">
    <q-card><q-card-section>Workout successfully logged</q-card-section></q-card>
    <!-- TODO redirect? Where to? -->
  </q-dialog>

  <div class="row q-my-lg justify-center">
    <q-btn @click="logWorkout()">Log Workout</q-btn>
  </div>

</template>


<script setup lang="ts">
import { api } from 'src/boot/axios';
import { computed, onBeforeMount, ref } from 'vue';
import { useRoute } from 'vue-router';
import { laBackwardSolid, laForwardSolid, laPlaySolid, laPauseSolid } from '@quasar/extras/line-awesome';

import { WorkoutExercise } from 'src/components/models';
import SetRepBox from '../components/SetRepBox.vue';
import PracticeControl from '../components/PracticeControl.vue';
import HeadlineNavigation from '../components/HeadlineNavigation.vue';
import LectureLink from 'src/components/LectureLink.vue';
import { CountdownTimer, TimerState } from 'src/utils/CountdownTimer';
import { useWakeLock } from 'src/utils/Wakelock';


const SECONDS_INITIAL = 8;
const SECONDS_REST = 15;
const wakeLock = useWakeLock()


enum PracticeState {
  ready = 1,
  workout,
  rest,
  finished,
};

const route = useRoute();
const workoutId = route.params.workout_id;

const flowId = ref<number>();
const lectureId = ref<number>();
const level = ref<string>();
const flowName = ref<string>();
const nSets = ref<number>();
const nReps = ref<number>();
const exercises = ref<Array<WorkoutExercise>>([]);

const practiceState = ref(PracticeState.ready);
const curExerciseIdx = ref(0);
const curRep = ref(1);
const curSet = ref(1);

const timer = ref(new CountdownTimer(SECONDS_INITIAL, handleTimerFinished, 5));

const showLoggedWorkout = ref(false);
const successfullyLogged = ref(false);


async function getExercises() {
  await api.get(`/workouts/${workoutId}`)
    .then((resp) => {
      lectureId.value = resp.data.lecture_id;
      flowId.value = resp.data.flow.flow_id;
      level.value = resp.data.flow.level;
      flowName.value = resp.data.flow.name;
      nSets.value = resp.data.n_sets;
      nReps.value = resp.data.n_reps;
      exercises.value = resp.data.exercises;
    })
    .catch((err) => {
      console.log(err);
    })
};

onBeforeMount(() => {
  getExercises();

  addEventListener('keyup', (event) => {
    if (event.isComposing || event.keyCode === 32) {
      toggleTimer();
      return;
    }
  });
});

function toggleTimer() {
  timer.value.toggle();
  if (timer.value.getState() === TimerState.ticking) {
    wakeLock.request();
  } else {
    wakeLock.release();
  }
};


const stateText = computed(() => {
  switch (timer.value.getState()) {
    case TimerState.ready:
      return 'Get ready...'
    case TimerState.paused:
      return 'Paused'
    case TimerState.finished:
      return 'Finished'
    case TimerState.ticking:
      if (practiceState.value === PracticeState.ready) {
        return 'Get ready...'
      } else if (practiceState.value === PracticeState.workout) {
        return 'Go!'
      } else {
        if (timer.value.getTimeLeft() >= 5 * 1000) {
          return 'Rest'
        } else {
          return 'Get ready...'
        }
      }
  }

  return 'Undefined'
});

const timeFormatted = computed(() => {
  const timeLeft = timer.value.getTimeLeft() / 1000;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.round(timeLeft % 60);

  const minsStr = minutes.toString().padStart(2, '0');
  const secsStr = seconds.toString().padStart(2, '0');

  return `${minsStr}:${secsStr}`
});

const timerControl = computed(() => {
  switch (timer.value.getState()) {
    case TimerState.ready:
    case TimerState.paused:
      return {label: 'Play', icon: laPlaySolid}
    case TimerState.ticking:
      return {label: 'Pause', icon: laPauseSolid}
    case TimerState.finished:
      // this should not really happen
      return {label: 'Play', icon: laPlaySolid}
    default:
      throw new Error('Unexpected timer state');
  }
});

const curExercise = computed(() => {
  if (!exercises.value) {
    return undefined;
  }

  return exercises.value[curExerciseIdx.value];
});

function handleTimerFinished() {
  nextCycle();

  if (practiceState.value == PracticeState.finished) {
    return;
  }

  if (practiceState.value === PracticeState.rest) {
    setTimer(SECONDS_REST);
  } else {
    setTimer(curExercise.value?.duration || 0);
  }
  timer.value.start();
};

function nextCycle() {
  if (practiceState.value === PracticeState.ready) {
    practiceState.value = PracticeState.workout;
    return;
  }

  if (practiceState.value === PracticeState.rest) {
    practiceState.value = PracticeState.workout;
    return;
  }

  nextRep();
};

function nextRep(fromClick=false) {
  const isLastSet = (curSet.value === nSets.value);
  const isLastExercise = (curExerciseIdx.value === exercises.value.length - 1);
  const isLastRep = (curRep.value === nReps.value);

  practiceState.value = PracticeState.rest;
  if (!isLastRep) {
    curRep.value += 1;
    return;
  }

  if (isLastExercise) {
    if (isLastSet) {
      if (!fromClick) {
        finishPractice();
      }
      return
    }

    curSet.value += 1;
    curExerciseIdx.value = 0;
    curRep.value = 1;
  } else {
    curExerciseIdx.value += 1;
    curRep.value = 1;
  }
};

function prevRep() {
  const isFirstSet = (curSet.value === 1);
  const isFirstExercise = (curExerciseIdx.value === 0);
  const isFirstRep = (curRep.value === 1);

  practiceState.value = PracticeState.rest;

  if (!isFirstRep) {
    curRep.value -= 1;
    return;
  }

  if (isFirstExercise) {
    if (isFirstSet) {
      practiceState.value = PracticeState.ready;
      return;
    }

    curSet.value -= 1;
    curExerciseIdx.value = exercises.value.length - 1;
    curRep.value = nReps.value || 0;
  } else {
    curExerciseIdx.value -= 1;
    curRep.value = nReps.value || 0;
  }
};

function handleNextRepClick() {
  nextRep(true);
  practiceState.value = PracticeState.ready;
  setTimer(SECONDS_INITIAL);
};

function handlePrevRepClick() {
  prevRep();
  practiceState.value = PracticeState.ready;
  setTimer(SECONDS_INITIAL);
};

function setTimer(nSeconds: number) {
  timer.value.clearTimer();
  timer.value = new CountdownTimer(nSeconds, handleTimerFinished, 5);
};

function logWorkout() {
  api.post('/executions', {workout_id: workoutId})
  .then(() => {
    showLoggedWorkout.value = true;
    successfullyLogged.value = true;
    console.log('Successfully logged workout')
  })
  .catch((err) => {
    console.log(err);
  })
};

function finishPractice() {
  practiceState.value = PracticeState.finished;
}
</script>
