<template>
  <div class="row">
    <router-link
      v-if="link"
      :to="link"
      custom
      v-slot="{ navigate }"
    >
      <a
        class="col-2 cursor-pointer"
        @click="navigate"
        role="link"
        >
        <q-icon :name="laArrowLeftSolid" class="q-pr-sm"/>{{ linkTitle }}
      </a>
    </router-link>
    <h2 class="text-h4" style="width: fit-content; margin: auto;">{{ title }}</h2>
    <div class="col-2"></div>
  </div>

  <q-separator />
</template>

<script setup lang="ts">
import { laArrowLeftSolid } from '@quasar/extras/line-awesome';

defineOptions({
  name: 'HeadlineNavigation'
});

export interface HeadlineNavigationProps {
  title: string;
  link?: string;
  linkTitle?: string;
};

withDefaults(defineProps<HeadlineNavigationProps>(), {
  title: '',
  link: undefined,
  linkTitle: undefined,
});
</script>

<style>
.menu-item .q-item__section--side {
  padding-right: 5px;
  min-width: 0px;
}
</style>
