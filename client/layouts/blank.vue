<template>
  <div class="text-black-500 max-h-screen h-screen overflow-hidden bg-bg">
    <Nuxt />
  </div>
</template>

<script>
export default {
  mounted() {
    document.body.classList.remove('app-bar', 'app-bar-and-toolbar')
    document.body.classList.add('no-bars')
  }
}
</script>