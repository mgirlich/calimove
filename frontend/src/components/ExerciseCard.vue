<template>
    <div class="q-pa-sm">
    <q-card class="col-2">
        <q-card-section style="padding-top: 10px; padding-bottom: 10px;">
            <h3 class="text-h6">{{ name }}</h3>
        </q-card-section>
        <q-card-section class="q-pa-sm">
            <div style="width: 90%; margin: auto;"><q-img :src="`/exercise_images/exercise_${exercise_id}.png`" width="100%"></q-img></div>
            <ExerciseLinks
              :lectureId="lecture_id"
              :modLectureId="mod_lecture_id"
            />
            <div v-if="flows">
                <q-chip v-for="flow in flows" dense clickable
                  :key="flow.flow_id"
                  @click="onLevelFlowChipClick(flow)">
                    {{ flow.level }}{{ flow.name }}
                </q-chip>
            </div>
        </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { FlowBase } from '../components/models';
import ExerciseLinks from './ExerciseLinks.vue';

defineProps({
  exercise_id: Number,
  name: String,
  lecture_id: Number,
  mod_lecture_id: Number,
  flows: Array<FlowBase>
});

function onLevelFlowChipClick(flow: FlowBase) {
  console.log(`${flow.level} - ${flow.name}`)
}
</script>

<style>
h3 {
  margin-block-start: 0em;
  margin-block-end: 0em;
  height: 2em;
  text-align: center;
  line-height: 1.5rem;
}
</style>
