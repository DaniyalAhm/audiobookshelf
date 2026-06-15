<template>
  <div class="search-card">
    <div class="w-10 h-10 flex items-center justify-center">
      <span class="material-symbols text-2xl text-gray-200">category</span>
    </div>
    <div class="grow px-2 tagSearchCardContent h-full">
      <p class="truncate text-sm">{{ genre }}</p>
      <p class="text-xs text-gray-400">{{ $getString('LabelXItems', [numItems]) }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    genre: String,
    numItems: Number
  },
  data() {
    return {}
  },
  computed: {},
  methods: {},
  mounted() {}
}
</script>

