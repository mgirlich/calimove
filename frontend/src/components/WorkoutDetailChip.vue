<template>
  <div class="workoutchip">
    <div class="row text-left">
      <a class="col"><q-icon :name="laHourglassStartSolid" /> {{ Math.round(time_total / 60) }}</a>
      <a class="col"><q-icon :name="laCouchSolid" /> {{ Math.round(time_break / 60) }}</a>
    </div>
    <div class="row text-left">
      <a class="col"><q-icon :name="laRetweetSolid" /> {{ n_sets }}</a>
      <a class="col"><q-icon :name="laDumbbellSolid" /> {{ n_reps }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { laCouchSolid, laHourglassStartSolid, laDumbbellSolid, laRetweetSolid } from '@quasar/extras/line-awesome';

const props = defineProps({
  time_active: { type: Number, required: true },
  time_break: { type: Number, required: true },
  n_sets: { type: Number, required: true },
  n_reps: { type: Number, required: true },
});

const time_total = computed(() => {
  return props.time_active + props.time_break;
})
</script>

<style>
.workoutchip {
  min-width: 8em;
}

.workoutchip .a {
  margin-right: 0px;
}
</style>
