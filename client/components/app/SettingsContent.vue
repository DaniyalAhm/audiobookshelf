<template>
  <div class="bg-bg rounded-md shadow-lg border border-white/5 p-2 sm:p-4 mb-8">
    <div class="flex items-center mb-2">
      <slot name="header-prefix"></slot>
      <h1 class="text-xl">{{ headerText }}</h1>

      <slot name="header-items"></slot>
    </div>

    <p v-if="description" id="settings-description" class="mb-6 text-black-500" v-html="description" />

    <slot></slot>
  </div>
</template>

<script>
export default {
  props: {
    headerText: String,
    description: String,
    note: String
  },
  methods: {}
}
</script>

