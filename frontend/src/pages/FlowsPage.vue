<template>
  <div
    v-for="flow in flows"
    :key="flow.flow_id"
    class="q-mb-xl">
    <div>
      <router-link
        :to="`/flows/${flow.flow_id}`"
        custom
        v-slot="{ navigate }"
      >
        <h2
          class="cursor-pointer text-h4"
          @click="navigate"
          role="link"
          style="width: fit-content; margin: auto;"
          >
          Level {{ flow.level }} - Flow {{ flow.name }}
        </h2>
      </router-link>
    </div>

    <q-separator />

    <ExercisesRow
      :id="flow.flow_id"
      :exercises="flow.exercises"
      numbered
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

import ExercisesRow from 'src/components/ExercisesRow.vue';
import { Flow } from '../components/models';
import { api } from 'src/boot/axios';

const flows = ref<Array<Flow>>([]);

onMounted(() => {
  api.get('/flows')
    .then((resp) => {
      flows.value = resp.data;
    })
    .catch((err) => {
      console.log(err);
    })
})
</script>
