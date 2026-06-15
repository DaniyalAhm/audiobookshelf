<template>
  <div class="inline-flex">
    <button :aria-labelledby="labeledBy" :aria-label="label" role="switch" type="button" class="relative inline-flex shrink-0 items-center rounded-full border transition-colors duration-150 ease-out outline-hidden focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-60" :aria-checked="toggleValue" :disabled="disabled" :class="[sizeClasses.track, trackClass]" @click="clickToggle">
      <span class="pointer-events-none inline-block rounded-full bg-white transition-transform duration-150 ease-out" :class="[sizeClasses.thumb, thumbClass]" />
    </button>
  </div>
</template>

<script>
export default {
  props: {
    value: Boolean,
    onColor: {
      type: String,
      default: 'primary'
    },
    offColor: {
      type: String,
      default: 'secondary'
    },
    disabled: Boolean,
    labeledBy: String,
    label: String,
    size: {
      type: String,
      default: 'md'
    }
  },
  computed: {
    toggleValue: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    },
    sizeClasses() {
      if (this.size === 'sm') {
        return {
          track: 'h-5 w-9',
          thumb: 'h-4 w-4'
        }
      }
      return {
        track: 'h-6 w-11',
        thumb: 'h-5 w-5'
      }
    },
    trackClass() {
      if (this.toggleValue) return this.colorClass(this.onColor, true)
      return this.colorClass(this.offColor, false)
    },
    thumbClass() {
      if (this.size === 'sm') return this.toggleValue ? 'translate-x-4' : 'translate-x-0.5'
      return this.toggleValue ? 'translate-x-5' : 'translate-x-0.5'
    }
  },
  methods: {
    colorClass(color, isOn) {
      const colors = {
        primary: 'bg-primary border-primary',
        accent: 'bg-primary border-primary',
        success: 'bg-success border-success',
        error: isOn ? 'bg-error border-error' : 'bg-error/20 border-error/50',
        warning: 'bg-warning border-warning',
        secondary: 'bg-secondary-bg border-black-200',
        bg: 'bg-secondary-bg border-black-200'
      }
      return colors[color] || (isOn ? 'bg-primary border-primary' : 'bg-secondary-bg border-black-200')
    },
    clickToggle() {
      if (this.disabled) return
      this.toggleValue = !this.toggleValue
    }
  }
}
</script>
