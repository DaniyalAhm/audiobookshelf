<template>
  <nuxt-link v-if="to" :to="to" class="abs-btn text-center" :disabled="disabled || loading" :class="classList" @click.native="click">
    <slot />
    <div v-if="loading" class="text-white/100 absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/30 rounded-xl">
      <svg class="animate-spin" style="width: 24px; height: 24px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
      </svg>
    </div>
  </nuxt-link>
  <button v-else class="abs-btn" :disabled="disabled || loading" :type="type" :class="classList" @mousedown.prevent @click="click">
    <slot />
    <div v-if="loading" class="text-white/100 absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/30 rounded-xl">
      <span v-if="progress">{{ progress }}</span>
      <svg v-else class="animate-spin" style="width: 24px; height: 24px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
      </svg>
    </div>
  </button>
</template>

<script>
export default {
  props: {
    to: String,
    color: {
      type: String,
      default: 'bg-primary'
    },
    type: {
      type: String,
      default: ''
    },
    paddingX: Number,
    paddingY: Number,
    small: Boolean,
    loading: Boolean,
    disabled: Boolean,
    progress: String
  },
  data() {
    return {}
  },
  computed: {
    classList() {
      var list = []
      list.push(this.loading ? 'text-white/0' : 'text-white')
      
      // Modern color classes using Tailwind's built-in colors
      switch (this.color) {
        case 'bg-primary':
          list.push('bg-primary hover:bg-primary-dark')
          break
        case 'bg-accent':
          list.push('bg-accent hover:bg-accent-dark')
          break
        case 'bg-success':
          list.push('bg-success hover:bg-success-dark')
          break
        case 'bg-error':
          list.push('bg-error hover:bg-error-dark')
          break
        default:
          list.push(this.color)
      }
      
      if (this.small) {
        list.push('text-sm')
        if (this.paddingX === undefined) list.push('px-4')
        if (this.paddingY === undefined) list.push('py-2')
      } else {
        if (this.paddingX === undefined) list.push('px-6')
        if (this.paddingY === undefined) list.push('py-3')
      }
      
      if (this.paddingX !== undefined) {
        list.push(`px-${this.paddingX}`)
      }
      if (this.paddingY !== undefined) {
        list.push(`py-${this.paddingY}`)
      }
      
      return list
    }
  },
  methods: {
    click(e) {
      this.$emit('click', e)
    }
  },
  mounted() {}
}
</script>
