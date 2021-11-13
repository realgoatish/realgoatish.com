<script>
  import '@fontsource/fira-sans'
  import '../app.css'
</script>

<svelte:head>
  <meta name="robots" content="noindex">
</svelte:head>

<slot />

<style>
  :global(h1, h2, h3, h4, h5, h6) {
  font-family: 'Fira Sans';
}
</style>