<script>
  import { Center } from '@realgoatish/svelte-every-layout'
  import Nav from '$lib/ui/nav/Nav.svelte'


  let string = `&copy; Mike Lamb - ${new Date().getFullYear()}`
</script>

<footer>
  <Center andText={true} max={"var(--measure)"}>
    <div>
      {@html string}
    </div>
  </Center>
</footer>

<style>
  footer {
    padding: var(--s3);
    background-color: var(--color-darkish);
    color: var(--color-white);
  }
</style>