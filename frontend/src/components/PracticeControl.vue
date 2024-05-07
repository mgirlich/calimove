<template>
  <q-btn>
    <div style="font-size: x-small;">
      <div style="margin-bottom: -0.6em;"><q-icon :name="icon"></q-icon></div>
      <div class="text-caption" style="font-size: 1em;">{{ label }}</div>
    </div>
  </q-btn>
</template>


<script lang="ts">
export default {
  props: ['label', 'icon']
}
</script>
