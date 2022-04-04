<script>

  import Center from '$lib/toolbox/layout/Center.svelte'
  import Cluster from '$lib/toolbox/layout/Cluster.svelte'
  import Icon from '$lib/toolbox/layout/Icon.svelte'
  import Stack from '$lib/toolbox/layout/Stack.svelte'
  import { getContext } from 'svelte'
  import { navData } from '$lib/js/constants'

  const allLinks = getContext(navData)

  // $: console.log(`allLinks in Nav.svelte: ${JSON.stringify(allLinks, null, 2)}`)

</script>

<div>
  <Center andText={true}>
    <Stack space="var(--s-2)">
      <nav>
        <ul>
          <Stack>
            {#each allLinks.navLinks as link}
              {#if link.href === '/'}
                <li class="icon-large">
                  <a href={link.href}>
                    <Icon iconId="#goat" label="goat" space={false} />
                  </a>
                </li>
              {/if}
            {/each}
            <Cluster wrapperElement="div" justify="center" align="center">
              {#each allLinks.navLinks as link}
                {#if link.href !== '/'}
                  <li>
                    <a class="nav-link link-hover-effect" href={link.href}>{link.text}</a>
                  </li>
                {/if}
              {/each}
            </Cluster>
          </Stack>
        </ul>
      </nav>
      <Cluster wrapperElement="ul" justify="center" align="center">
        {#each allLinks.socialLinks as link, i}
          <li class="icon-small">
            <a href={link.href}>
              {#if i === allLinks.socialLinks.length - 1}
                <Icon iconId={link.iconId} label={link.site} space={false} />
              {:else}
                <Icon iconId={link.iconId} label={link.site} />
              {/if}
            </a>
          </li>
        {/each}
      </Cluster>
    </Stack>
  </Center>
</div>


<style>

  div {
    font-size: var(--s1);
    color: var(--color-darkish);
    background-color: var(--color-white);
    padding: var(--s-1) var(--s-3);
  }

  div .icon-large :global(svg) {
    font-size: var(--s5);
  }

  div .icon-small :global(svg) {
    font-size: var(--s3);
  }

  div :global(.cluster a) {
    width: min-content;
    display: block;
    text-transform: uppercase;
  }

</style>