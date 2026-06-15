<template>
  <div class="inline-flex">
    <input v-model="input" type="range" :min="min" :max="max" :step="step" />

    <p class="text-sm ml-2">{{ input }}%</p>
  </div>
</template>

<script>
export default {
  props: {
    value: [String, Number],
    min: Number,
    max: Number,
    step: Number
  },
  data() {
    return {}
  },
  computed: {
    input: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    }
  },
  methods: {},
  mounted() {}
}
</script>

