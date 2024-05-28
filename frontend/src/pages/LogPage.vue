<template>
  <StatsRow
    heading="Overall Statistics"
    :stats="topRowStats"
    chipWidth="10em"
  />

  <StatsRow
    heading="Weekday Distribution"
    :stats="weekDayStats"
    chipWidth="6em"
    class="q-mt-xl"
  />
</template>

<script setup lang="ts">
import { api } from 'src/boot/axios';
import { computed, onMounted, ref } from 'vue';

import StatsRow from 'components/StatsRow.vue';

const maxStreak = ref<number>(0);
const curStreak = ref<number>(0);
const total = ref<number>(0);
const weekdayCount = ref<object>({});

const weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const topRowStats = computed(() => {
  return [
    { n: maxStreak, text: 'Longest Streak' },
    { n: curStreak, text: 'Current Streak' },
    { n: total, text: 'Total Workouts' },
  ];
});

const weekDayStats = computed(() => {
  const out = [];
  const expected = 1 / 7;

  for (const key in weekdayCount.value) {
    const weekday = weekdays[key as keyof typeof weekdays];
    const n = weekdayCount.value[key as keyof typeof weekdayCount.value];
    var diff = Math.round(100 * (expected - n / total.value));
    var diffText;
    if (diff > 0) {
      diffText = `+${diff}%`;
    } else {
      diffText = `${diff}%`;
    }
    out.push({ n: diffText, text: weekday });
  }

  console.log(out);
  return out;
});

onMounted(() => {
  api
    .get('/executions')
    .then((resp) => {
      maxStreak.value = resp.data.max_streak;
      curStreak.value = resp.data.cur_streak;
      total.value = resp.data.total;
      weekdayCount.value = resp.data.weekday_count;
    })
    .catch((err) => {
      console.log(err);
    });
});
</script>
