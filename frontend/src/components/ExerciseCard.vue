<template>
    <q-card class="col-2" style="margin: 1em 1em;">
        <q-card-section style="padding-top: 10px; padding-bottom: 10px;">
            <h3 class="text-h6">{{ name }}</h3>
        </q-card-section>
        <q-card-section>
            <!-- <q-img :src="`/src/assets/exercise_images/exercise_${exercise_id}.png`" width="100%"></q-img> -->
            <div style="width: 70%; margin: auto;"><q-img :src="`/exercise_images/exercise_${exercise_id}.png`" width="100%"></q-img></div>
            <div class="card-link">
                <a class="q-link" :href="lecture_link(lecture_id)">Video</a>
                <template v-if="mod_lecture_id"><a class="q-link mod-video" :href="lecture_link(mod_lecture_id)">Mods</a></template>
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

function lecture_link(lecture_id?: number) {
  return `https://www.calimove.com/courses/1467532/lectures/${lecture_id}`
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
