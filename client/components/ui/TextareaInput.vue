<template>
  <textarea ref="input" v-model="inputValue" :rows="rows" :readonly="readonly" :disabled="disabled" :placeholder="placeholder" dir="auto" class="py-2 px-3 rounded-lg bg-fg text-black-500 placeholder:text-secondary-text focus:border-primary focus:outline-hidden" :class="transparent ? '' : 'border border-black-200'" @change="change" />
</template>

<script>
export default {
  props: {
    value: [String, Number],
    placeholder: String,
    readonly: Boolean,
    rows: {
      type: Number,
      default: 2
    },
    transparent: Boolean,
    disabled: Boolean
  },
  data() {
    return {}
  },
  computed: {
    inputValue: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    }
  },
  methods: {
    change(e) {
      this.$emit('change', e.target.value)
    },
    blur() {
      if (this.$refs.input && this.$refs.input.blur) {
        this.$refs.input.blur()
      }
    }
  },
  mounted() {}
}
</script>

