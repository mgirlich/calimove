<template>
  <div class="card-link">
    <LectureLink :lectureId="lectureId" style="padding-right: 4px;">Video</LectureLink>
    <LectureLink v-if="modLectureId" :lectureId="modLectureId" style="padding-left: 4px;">Mods</LectureLink>
  </div>
</template>

<script setup lang="ts">
import LectureLink from './LectureLink.vue';

defineProps({
  lectureId: Number,
  modLectureId: Number,
});
</script>

<style>
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
</style>
