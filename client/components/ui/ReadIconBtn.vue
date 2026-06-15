<template>
  <button :aria-label="isRead ? $strings.MessageMarkAsNotFinished : $strings.MessageMarkAsFinished" class="icon-btn h-9 w-9" :class="borderless ? '' : 'bg-primary border border-black-200'" @click="clickBtn">
    <div class="w-5 h-5 relative">
      <span v-if="isRead" class="material-symbols fill text-xl text-success">beenhere</span>
      <span v-else class="material-symbols text-xl text-white">beenhere</span>
    </div>
  </button>
</template>

<script>
export default {
  props: {
    isRead: Boolean,
    disabled: Boolean,
    borderless: Boolean
  },
  data() {
    return {}
  },
  computed: {},
  methods: {
    clickBtn(e) {
      e.stopPropagation()
      if (this.disabled) {
        e.preventDefault()
        return
      }
      this.$emit('click')
    }
  },
  mounted() {}
}
</script>

