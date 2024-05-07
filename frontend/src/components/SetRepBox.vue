<template>
  <div
    class="q-px-md q-py-sm bg-grey-2 setrepbox"
  >
    <p class="q-my-none" style="text-transform: uppercase;">{{ name }}</p>
    <p class="text-weight-bold" style="letter-spacing: 1px; margin-bottom: 0px;">
      <!-- <a class="text-accent">{{ i }}</a> / {{ n }} -->
      <a class="text-deep-orange-6">{{ i }}</a> / {{ n }}
    </p>
  </div>
</template>


<script lang="ts">
export default {
  props: ['name', 'i', 'n'],
}
</script>

<style>
.setrepbox {
  text-align: center;
  border-radius: 3px;
  height: 4em;
}

.setrepbox + .setrepbox {
  margin-left: 1em;
}
</style>
