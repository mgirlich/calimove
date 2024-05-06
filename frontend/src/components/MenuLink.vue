<template>
  <q-item
    clickable
    tag="a"
    :href="link"
    class="menu-item"
  >
    <q-item-section
      v-if="icon"
      avatar
    >
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
defineOptions({
  name: 'MenuLink'
});

export interface MenuLinkProps {
  title: string;
  link?: string;
  icon?: string;
};

withDefaults(defineProps<MenuLinkProps>(), {
  link: '#',
  icon: '',
});
</script>

<style>
.menu-item .q-item__section--side {
  padding-right: 5px;
  min-width: 0px;
}
</style>
