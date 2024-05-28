<template>
  <div>
    <h2 class="text-h5 text-center q-mb-sm">{{ heading }}</h2>
    <slot></slot>
    <div class="row justify-center q-gutter-md">
      <q-card
        v-for="stat in stats"
        :key="stat.text"
        class="items-center justify-center column"
        :style="{ width: chipWidth }"
      >
        <a style="font-size: 2em">{{ stat.n }}</a>
        <div>{{ stat.text }}</div>
      </q-card>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps(['heading', 'stats', 'chipWidth']);
</script>
