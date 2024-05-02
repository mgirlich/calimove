<template>
  <q-layout view="lHh Lpr lFf">
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

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          Essential Links
        </q-item-label>

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

defineOptions({
  name: 'MainLayout'
});

const linksList: MenuLinkProps[] = [
  {
    title: 'Practice',
    icon: 'fa-solid fa-dumbbell',
    link: '/flows/0/'
  },
  {
    title: 'Exercises',
    icon: 'fa-regular fa-circle-question',
    link: '/exercises/'
  },
  {
    title: 'Log',
    icon: 'fa-solid fa-table-list',
    link: '/log/'
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>
