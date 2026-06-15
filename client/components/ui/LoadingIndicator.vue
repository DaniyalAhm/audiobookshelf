<template>
  <div :class="hasSlotContent ? 'w-auto' : 'w-40'">
    <div class="bg-bg border border-black-200 py-2 px-5 rounded-lg flex items-center flex-col box-shadow-md">
      <div class="loader-dots block relative w-20 h-5 mt-2">
        <div class="absolute top-0 mt-1 w-3 h-3 rounded-full bg-green-500"></div>
        <div class="absolute top-0 mt-1 w-3 h-3 rounded-full bg-green-500"></div>
        <div class="absolute top-0 mt-1 w-3 h-3 rounded-full bg-green-500"></div>
        <div class="absolute top-0 mt-1 w-3 h-3 rounded-full bg-green-500"></div>
      </div>
      <slot>
        <div class="text-black-500 text-xs font-light mt-2 text-center">{{ message }}</div>
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      default: null
    }
  },
  computed: {
    message() {
      return this.text || this.$strings.MessagePleaseWait
    },
    hasSlotContent() {
      return this.$slots.default && this.$slots.default.length > 0
    }
  }
}
</script>

