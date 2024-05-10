<template>
  <a :href="lectureUrl" class="q-link" target="_blank">
    <slot></slot>
    <q-icon :name="laExternalLinkAltSolid" style="padding-left: 3px; padding-bottom: 3px;"/>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { laExternalLinkAltSolid } from '@quasar/extras/line-awesome';

const props = defineProps({
  lectureId: Number,
  extra: String,
});

const lectureUrl = computed(() => {
  let url = `https://www.calimove.com/courses/1467532/lectures/${props.lectureId}`;
  if (props.extra) {
    url = url + props.extra;
  }
  return url;
});
</script>

<style>

</style>
