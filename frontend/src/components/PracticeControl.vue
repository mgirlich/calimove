<template>
  <q-btn size="1.2em">
    <div class="column">
      <div class="col"><q-icon :name="icon"></q-icon></div>
      <div class="col text-caption">{{ label }}</div>
    </div>
  </q-btn>
</template>


<script lang="ts">
export default {
  props: ['label', 'icon']
}
</script>
