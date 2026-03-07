<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuth } from '../../composables/useAuth'
import { useWakeLock } from '../../composables/useWakeLock'
import flowsData from '../../data/flows.json'
import workoutsData from '../../data/workouts.json'
import { db } from '../../lib/supabase'
import type { Flow, Workout, WorkoutExercise } from '../../types/data'
import { CountdownTimer } from '../../utils/CountdownTimer'

const SECONDS_INITIAL = 8
const SECONDS_REST = 8
const SECONDS_ALERT = 3
const BASE_URL = 'https://www.calimove.com/courses/1467532/lectures'

type PracticeState = 'ready' | 'workout' | 'rest' | 'finished'

const route = useRoute()
const router = useRouter()
const wakeLock = useWakeLock()
const { user } = useAuth()

// ── Static data ───────────────────────────────────────────────────────────────

const workoutId = Number(route.params.workout_id)
const workout = (workoutsData as Workout[]).find((w) => w.workout_id === workoutId)
const flow = workout ? (flowsData as Flow[]).find((f) => f.flow_id === workout.flow_id) : undefined
const exercises: WorkoutExercise[] =
  workout && flow
    ? flow.exercises.map((ex, i) => Object.assign({}, ex, { duration: workout.durations[i] ?? 0 }))
    : []

// ── Practice state ────────────────────────────────────────────────────────────

const practiceState = ref<PracticeState>('ready')
const curExerciseIdx = ref<number>(0)
const curRep = ref<number>(1)
const curSet = ref<number>(1)

// ── Timer reactive state ──────────────────────────────────────────────────────

const msLeft = ref<number>(SECONDS_INITIAL * 1000)
const isRunning = ref<boolean>(false)

// ── UI state ──────────────────────────────────────────────────────────────────

const showLogModal = ref<boolean>(false)
const logging = ref<boolean>(false)
const logError = ref<string | null>(null)

// ── Audio ─────────────────────────────────────────────────────────────────────

const beepAudio = new Audio('/beep.mp3')

function playAlert() {
  beepAudio.play().catch(() => {})
  if ('vibrate' in navigator) navigator.vibrate(200)
}

// ── Timer ─────────────────────────────────────────────────────────────────────

let timer: CountdownTimer | null = null

function createTimer(seconds: number): CountdownTimer {
  timer?.destroy()
  msLeft.value = seconds * 1000
  const t = new CountdownTimer(
    seconds,
    handleTimerFinished,
    (ms) => {
      msLeft.value = ms
    },
    playAlert,
    SECONDS_ALERT,
  )
  timer = t
  return t
}

function handleTimerFinished() {
  isRunning.value = false

  let nextSeconds: number
  if (practiceState.value === 'ready' || practiceState.value === 'rest') {
    practiceState.value = 'workout'
    nextSeconds = curExercise.value?.duration ?? 0
  } else {
    // workout phase ended — advance rep/exercise/set
    nextRep()
    if (practiceState.value === 'finished') {
      void wakeLock.release()
      saveState()
      showLogModal.value = true
      return
    }
    nextSeconds = SECONDS_REST // nextRep always sets state to 'rest' when not finished
  }

  const t = createTimer(nextSeconds)
  saveState()
  t.start()
  isRunning.value = true
}

function nextRep() {
  const nReps = workout?.n_reps ?? 1
  const nSets = workout?.n_sets ?? 1
  const isLastRep = curRep.value === nReps
  const isLastExercise = curExerciseIdx.value === exercises.length - 1
  const isLastSet = curSet.value === nSets

  practiceState.value = 'rest'

  if (!isLastRep) {
    curRep.value++
    return
  }

  if (isLastExercise) {
    if (isLastSet) {
      practiceState.value = 'finished'
      return
    }
    curSet.value++
    curExerciseIdx.value = 0
  } else {
    curExerciseIdx.value++
  }
  curRep.value = 1
}

function resetToReady() {
  practiceState.value = 'ready'
  createTimer(SECONDS_INITIAL)
  isRunning.value = false
  void wakeLock.release()
  saveState()
}

// ── Controls ──────────────────────────────────────────────────────────────────

function toggleTimer() {
  if (!timer || practiceState.value === 'finished') return
  timer.toggle()
  isRunning.value = timer.isRunning
  if (isRunning.value) {
    void wakeLock.request()
  } else {
    void wakeLock.release()
  }
}

function handleNextClick() {
  if (practiceState.value === 'finished') return
  const nReps = workout?.n_reps ?? 1
  const nSets = workout?.n_sets ?? 1
  const isLastRep = curRep.value === nReps
  const isLastExercise = curExerciseIdx.value === exercises.length - 1
  const isLastSet = curSet.value === nSets

  if (!isLastRep) {
    curRep.value++
  } else if (!isLastExercise) {
    curExerciseIdx.value++
    curRep.value = 1
  } else if (!isLastSet) {
    curSet.value++
    curExerciseIdx.value = 0
    curRep.value = 1
  }
  // At the very end, stay put — let the timer finish naturally to auto-log

  resetToReady()
}

function handlePrevClick() {
  if (practiceState.value === 'finished') return
  const nReps = workout?.n_reps ?? 1
  const isFirstRep = curRep.value === 1
  const isFirstExercise = curExerciseIdx.value === 0
  const isFirstSet = curSet.value === 1

  if (!isFirstRep) {
    curRep.value--
  } else if (!isFirstExercise) {
    curExerciseIdx.value--
    curRep.value = nReps
  } else if (!isFirstSet) {
    curSet.value--
    curExerciseIdx.value = exercises.length - 1
    curRep.value = nReps
  }
  // At the very start, just reset to ready

  resetToReady()
}

function handleKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space' && !e.isComposing) {
    e.preventDefault()
    toggleTimer()
  }
}

// ── Computed ──────────────────────────────────────────────────────────────────

const curExercise = computed(() => exercises[curExerciseIdx.value])

const timeFormatted = computed(() => {
  const totalSeconds = Math.ceil(msLeft.value / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const stateText = computed<string>(() => {
  if (practiceState.value === 'finished') return 'Done!'
  if (!isRunning.value && practiceState.value === 'ready') return 'Get ready…'
  if (!isRunning.value) return 'Paused'
  if (practiceState.value === 'ready') return 'Get ready…'
  if (practiceState.value === 'workout') return 'Go!'
  return msLeft.value > SECONDS_ALERT * 1000 ? 'Rest' : 'Get ready…'
})

const stateColorClass = computed<string>(() => {
  if (practiceState.value === 'workout' && isRunning.value) return 'text-primary'
  if (practiceState.value === 'finished') return 'text-primary'
  return 'text-muted'
})

const progress = computed(() => {
  if (!workout || exercises.length === 0) return 0
  const total = workout.n_sets * exercises.length * workout.n_reps
  const current =
    (curSet.value - 1) * exercises.length * workout.n_reps +
    curExerciseIdx.value * workout.n_reps +
    (curRep.value - 1)
  return total > 0 ? Math.round((current / total) * 100) : 0
})

// ── localStorage ──────────────────────────────────────────────────────────────

const STORAGE_KEY = 'practice-state'

interface SavedState {
  workoutId: number
  exerciseIdx: number
  repIdx: number // 0-based
  setIdx: number // 0-based
}

function saveState() {
  const saved: SavedState = {
    workoutId,
    exerciseIdx: curExerciseIdx.value,
    repIdx: curRep.value - 1,
    setIdx: curSet.value - 1,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as SavedState
    if (saved.workoutId !== workoutId) return
    const nReps = workout?.n_reps ?? 1
    const nSets = workout?.n_sets ?? 1
    if (saved.exerciseIdx >= 0 && saved.exerciseIdx < exercises.length) {
      curExerciseIdx.value = saved.exerciseIdx
    }
    if (saved.repIdx >= 0 && saved.repIdx < nReps) {
      curRep.value = saved.repIdx + 1
    }
    if (saved.setIdx >= 0 && saved.setIdx < nSets) {
      curSet.value = saved.setIdx + 1
    }
  } catch {
    // ignore parse errors
  }
}

// ── Log workout ───────────────────────────────────────────────────────────────

async function logWorkout() {
  if (!workout) return
  logging.value = true
  logError.value = null
  const { error } = await db.from('executions').insert({
    workout_id: workout.workout_id,
    flow_id: workout.flow_id,
    user_id: user.value?.id,
  })
  logging.value = false
  if (error) {
    logError.value = error.message
    return
  }
  showLogModal.value = false
  localStorage.removeItem(STORAGE_KEY)
  await router.push('/log')
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  window.addEventListener('keyup', handleKeyUp)
  loadState()
  createTimer(SECONDS_INITIAL)
})

onUnmounted(() => {
  window.removeEventListener('keyup', handleKeyUp)
  timer?.destroy()
  void wakeLock.release()
})
</script>

<template>
  <UContainer class="page-content space-y-6 max-w-2xl">
    <div v-if="workout && flow">
      <!-- Top bar -->
      <div class="flex items-center justify-between gap-2 mb-6">
        <UButton
          :to="`/flows/${flow.flow_id}`"
          variant="ghost"
          icon="i-lucide-arrow-left"
          size="sm"
          color="neutral"
        >
          Level {{ flow.level }} · Flow {{ flow.name }}
        </UButton>
        <UButton
          :to="`${BASE_URL}/${workout.lecture_id}#lecture_content_complete_button`"
          target="_blank"
          variant="ghost"
          size="sm"
          color="neutral"
          icon="i-lucide-video"
        >
          Follow along
        </UButton>
      </div>

      <!-- Exercise name -->
      <h1 class="text-2xl font-semibold min-h-10">{{ curExercise?.name }}</h1>

      <!-- Timer card -->
      <UCard>
        <div class="flex flex-col items-center gap-5 py-4">
          <p class="text-7xl font-mono font-bold tabular-nums tracking-tight">
            {{ timeFormatted }}
          </p>
          <p
            class="text-lg uppercase tracking-widest font-semibold transition-colors"
            :class="stateColorClass"
          >
            {{ stateText }}
          </p>
          <div class="flex gap-10 text-center">
            <div>
              <p class="text-3xl font-bold tabular-nums">
                {{ curRep
                }}<span class="text-base font-normal text-muted">/{{ workout.n_reps }}</span>
              </p>
              <p class="text-xs uppercase text-muted tracking-wider mt-0.5">Rep</p>
            </div>
            <div>
              <p class="text-3xl font-bold tabular-nums">
                {{ curSet
                }}<span class="text-base font-normal text-muted">/{{ workout.n_sets }}</span>
              </p>
              <p class="text-xs uppercase text-muted tracking-wider mt-0.5">Set</p>
            </div>
          </div>
        </div>
        <!-- Progress bar -->
        <div class="h-2 rounded-full bg-elevated overflow-hidden">
          <div
            class="h-full bg-primary rounded-full transition-all duration-300"
            :style="{ width: `${progress}%` }"
          />
        </div>
        <p class="text-xs text-muted text-right">{{ progress }}%</p>
      </UCard>

      <!-- Controls -->
      <div class="flex justify-center items-center gap-4 mt-2">
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-skip-back"
          size="lg"
          :disabled="practiceState === 'finished'"
          @click="handlePrevClick"
        />
        <UButton
          :icon="isRunning ? 'i-lucide-pause' : 'i-lucide-play'"
          size="lg"
          class="min-w-28"
          :disabled="practiceState === 'finished'"
          @click="toggleTimer"
        >
          {{ isRunning ? 'Pause' : 'Play' }}
        </UButton>
        <UButton
          variant="outline"
          color="neutral"
          icon="i-lucide-skip-forward"
          size="lg"
          :disabled="practiceState === 'finished'"
          @click="handleNextClick"
        />
      </div>

      <!-- Exercise image + links -->
      <div v-if="curExercise" class="flex flex-col items-center gap-3 pt-4">
        <img
          :src="`/exercise_images/exercise_${curExercise.exercise_id}.png`"
          :alt="curExercise.name"
          class="w-48 h-48 object-cover rounded-lg"
        />
        <div class="flex gap-2">
          <UButton
            :to="`${BASE_URL}/${curExercise.lecture_id}`"
            target="_blank"
            variant="soft"
            size="sm"
            icon="i-lucide-play"
          >
            Video
          </UButton>
          <UButton
            v-if="curExercise.mod_lecture_id"
            :to="`${BASE_URL}/${curExercise.mod_lecture_id}`"
            target="_blank"
            variant="soft"
            size="sm"
            color="neutral"
            icon="i-lucide-settings-2"
          >
            Mods
          </UButton>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20 text-muted">Workout not found.</div>
  </UContainer>

  <!-- Auto-log modal shown on workout completion -->
  <UModal v-model:open="showLogModal" title="Workout complete!">
    <template #body>
      <p class="text-muted">Log this workout to your training history?</p>
      <p v-if="logError" class="text-sm text-red-500 mt-2">{{ logError }}</p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton variant="ghost" color="neutral" @click="() => void router.push('/log')">
          Skip
        </UButton>
        <UButton :loading="logging" @click="logWorkout">Log workout</UButton>
      </div>
    </template>
  </UModal>
</template>
