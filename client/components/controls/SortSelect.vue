<template>
  <div ref="wrapper" class="relative" v-click-outside="clickOutside">
    <button type="button" class="select-trigger-btn" aria-haspopup="menu" :aria-expanded="showMenu" @click.prevent="showMenu = !showMenu">
      <span class="flex items-center justify-between">
        <span class="block truncate text-xs" :class="!selectedText ? 'text-secondary-text' : ''">{{ selectedText }}</span>
        <span class="material-symbols text-lg text-primary" :aria-label="descending ? $strings.LabelSortDescending : $strings.LabelSortAscending">{{ descending ? 'expand_more' : 'expand_less' }}</span>
      </span>
    </button>

    <ul v-show="showMenu" class="absolute z-10 mt-1 w-full bg-bg border border-black-200 shadow-lg max-h-80 rounded-md py-1 ring-1 ring-black/5 overflow-auto focus:outline-hidden text-sm" role="menu">
      <template v-for="item in items">
        <li :key="item.value" class="select-none relative py-2 pr-9 cursor-pointer hover:bg-white/5" :class="item.value === selected ? 'bg-white/5 text-primary' : 'text-black-500 hover:text-white'" role="menuitem" @click="clickedOption(item.value)">
          <div class="flex items-center">
            <span class="font-normal ml-3 block truncate">{{ item.text }}</span>
          </div>
          <span v-if="item.value === selected" class="text-primary absolute inset-y-0 right-0 flex items-center pr-4">
            <span class="material-symbols text-xl" :aria-label="descending ? $strings.LabelSortDescending : $strings.LabelSortAscending">{{ descending ? 'expand_more' : 'expand_less' }}</span>
          </span>
        </li>
      </template>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    value: String,
    descending: Boolean,
    items: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      showMenu: false
    }
  },
  computed: {
    selected: {
      get() {
        return this.value
      },
      set(val) {
        this.$emit('input', val)
      }
    },
    selectedDesc: {
      get() {
        return this.descending
      },
      set(val) {
        this.$emit('update:descending', val)
      }
    },
    selectedText() {
      var _selected = this.selected
      if (!_selected) return ''
      var _sel = this.items.find((i) => i.value === _selected)
      if (!_sel) return ''
      return _sel.text
    }
  },
  methods: {
    clickOutside() {
      this.showMenu = false
    },
    clickedOption(val) {
      if (this.selected === val) {
        this.selectedDesc = !this.selectedDesc
      } else {
        this.selected = val
      }
      this.showMenu = false
      this.$nextTick(() => this.$emit('change', val))
    }
  }
}
</script>
