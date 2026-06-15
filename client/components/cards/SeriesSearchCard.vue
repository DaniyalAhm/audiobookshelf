<template>
  <div class="search-card">
    <covers-group-cover :name="name" :book-items="bookItems" :width="60" :height="60" :book-cover-aspect-ratio="bookCoverAspectRatio" />
    <div class="grow px-2 seriesSearchCardContent h-full">
      <p class="truncate text-sm">{{ name }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    series: {
      type: Object,
      default: () => {}
    },
    bookItems: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {}
  },
  computed: {
    bookCoverAspectRatio() {
      return this.$store.getters['libraries/getBookCoverAspectRatio']
    },
    name() {
      return this.series.name
    }
  },
  methods: {},
  mounted() {}
}
</script>

