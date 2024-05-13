<template>
  <q-layout view="hHh lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Calimove
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      side="left"
      show-if-above
      bordered
      :width=150
    >
      <q-list>
        <MenuLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MenuLink, { MenuLinkProps } from 'components/MenuLink.vue';
import { laHeartbeatSolid, laChalkboardTeacherSolid, laGripVerticalSolid, laChartLineSolid } from '@quasar/extras/line-awesome';

defineOptions({
  name: 'MainLayout'
});


const linksList: MenuLinkProps[] = [
  {
    title: 'Practice',
    icon: laHeartbeatSolid, // or dumbbell
    link: '/flows/next/'
  },
  {
    title: 'Flows',
    icon: laGripVerticalSolid, // or laListSolid,
    link: '/flows/'
  },
  {
    title: 'Exercises',
    icon: laChalkboardTeacherSolid, // or laSchoolSolid,
    link: '/exercises/'
  },
  {
    title: 'Log',
    icon: laChartLineSolid,
    link: '/log/'
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>


<style>
.q-page-container {
  margin-left: 1em;
  margin-right: 1em;
}
</style>
