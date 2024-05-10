<template>
    <q-card class="col-2" style="margin: 1em 1em;">
        <q-card-section style="padding-top: 10px; padding-bottom: 10px;">
            <h3 class="text-h6">{{ name }}</h3>
        </q-card-section>
        <q-card-section>
            <div style="width: 70%; margin: auto;"><q-img :src="`/exercise_images/exercise_${exercise_id}.png`" width="100%"></q-img></div>
            <div class="card-link">
                <LectureLink :lectureId="lecture_id">Video</LectureLink>
                <LectureLink v-if="mod_lecture_id" :lectureId="mod_lecture_id">Mods</LectureLink>
            </div>
            <div v-if="flows">
                <q-chip v-for="flow in flows" dense clickable
                  :key="flow.flow_id"
                  @click="onLevelFlowChipClick(flow)">
                    {{ flow.level }}{{ flow.name }}
                </q-chip>
            </div>
        </q-card-section>
    </q-card>
</template>

<script setup lang="ts">
import { FlowBase } from '../components/models';
import LectureLink from './LectureLink.vue';

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

.card-link {
  width: 100%;
  margin: auto;
  text-align: center;
  padding-top: 0.5em;
  font-family: Roboto,-apple-system,Avenir,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;
}

.card-link a{
  font-weight: 700;
  font-size: 16;
  letter-spacing: 0.7;
}

.mod-video {
  padding-left: 1em;
}
</style>
