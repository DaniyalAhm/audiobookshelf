<template>
  <div class="inline-flex overflow-hidden rounded-xl border border-black-200 bg-bg">
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      :disabled="disabled"
      class="border-r border-black-200 px-4 py-1 text-sm transition-all duration-200 ease-out last:border-r-0 outline-hidden focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60"
      :class="item.value === value ? 'bg-primary text-black-700' : 'bg-fg text-secondary-text hover:bg-secondary-bg hover:text-black-500'"
      @click.stop="clickBtn(item.value)"
    >
      {{ item.text }}
    </button>
  </div>
</template>

<script>
export default {
  props: {
    value: [String, Number],
    /**
     * [{ "text", "", "value": "" }]
     */
    items: {
      type: Array,
      default: Object
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {}
  },
  computed: {},
  methods: {
    clickBtn(value) {
      this.$emit('input', value)
    }
  },
  mounted() {}
}
</script>
