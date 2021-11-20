<script>

  import Center from '$lib/toolbox/layout/Center.svelte'
  import Cluster from '$lib/toolbox/layout/Cluster.svelte'
  import Icon from '$lib/toolbox/layout/Icon.svelte'
  import Stack from '$lib/toolbox/layout/Stack.svelte'
  import { getContext } from 'svelte'
  import { navData } from '$lib/js/constants'

  const links = getContext(navData).headerData

  $: console.log(`links in Nav.svelte: ${JSON.stringify(links, null, 2)}`)

  let test = [
    { href: '/blog/', text: 'blog' },
    { href: '/about/', text: 'about'},
    { href: '/links/', text: 'links'},
    { href: '/links/', text: 'links'},
    { href: '/links/', text: 'links'},

  ]

</script>

<nav>
  <Center>
    <Stack>
      <ul>
        <Stack>
          {#each links as link}
            {#if link.href === '/'}
              <li class="icon-large">
                <a href={link.href}>
                  <Icon iconId="#goat" label="goat" space={false} />
                </a>
              </li>
            {/if}
          {/each}
          <Cluster wrapperElement="div">
            {#each test as link}
              {#if link.href !== '/'}
                <li>
                  <a href={link.href}>{link.text}</a>
                </li>
              {/if}
            {/each}
          </Cluster>
        </Stack>
      </ul>
      <Cluster wrapperElement="ul">
        <li class="icon-small">
          <Icon iconId="#icon-github" label="view Mike's code on GitHub" />
        </li>
        <li class="icon-small">
          <Icon iconId="#icon-twitter" label="reach out to Mike on Twitter" />
        </li>
        <li class="icon-small">
          <Icon iconId="#icon-stackoverflow" label="view Mike's contributions on Stackoverflow" space={false} />
        </li>
      </Cluster>
      <!-- <p>Mike Lamb @realgoatish </p> -->

    </Stack>
  </Center>
</nav>

<style>
  nav {
    text-align: center;
    color: var(--color-white);
    background-color: rgba(2,0,0,0.5);
    backdrop-filter: blur(4px);
    padding: var(--s-1) var(--s-3);  }

  nav a {
    color: var(--color-white);
    text-decoration: none;
  }

  nav a:hover, 
  nav a:active {
    color: var(--color-white);
    background-color: var(--color-darkish);
  }

  nav :global(.center) {
    --measure: 60ch;
  }

  nav :global(.stack) {
    --space: var(--s-2);
  }

  nav :global(.cluster) {
    justify-content: center;
  }

  nav .icon-large :global(svg) {
    font-size: var(--s4);
  }

  nav .icon-large a {
    border: none;
  }

  nav .icon-small :global(svg) {
    font-size: var(--s2);
  }

  nav :global(.cluster a) {
    width: min-content;
    display: block;
    text-transform: uppercase;
  }
</style>