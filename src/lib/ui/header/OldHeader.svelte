<script>
  import Frame from '$lib/toolbox/layout/Frame.svelte'
  import Image from '$lib/toolbox/layout/Image.svelte'
  import Center from '$lib/toolbox/layout/Center.svelte'
  import Imposter from '$lib/toolbox/layout/Imposter.svelte'
  import Box from '$lib/toolbox/layout/Box.svelte'
  import Cluster from '$lib/toolbox/layout/Cluster.svelte'
  import Switcher from '$lib/toolbox/layout/Switcher.svelte'
  import Icon from '$lib/toolbox/layout/Icon.svelte'
  import Header from '$lib/ui/header/OldHeader.svelte'
  import HeadingTag from '$lib/toolbox/heading-tag/HeadingTag.svelte'
  import Stack from '$lib/toolbox/layout/Stack.svelte'



  export let links
  export let backgroundImage

  let test = [
    { href: '/blog/', text: 'blog' },
    { href: '/about/', text: 'about'},
    { href: '/links/', text: 'links'}
  ]

</script>

<header>
  <div id="hero-wrapper">
    <div id="hero">
      <Frame>
        <Image
          images={backgroundImage}
          altText={"test alt text"}
        />
      </Frame>
      <Imposter>
        <Stack>
          <Box>
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
          </Box>
          <div class="greeting">
            <h1>Hi, my name is Mike</h1>
          </div>
        </Stack>


      </Imposter>

    </div>
  </div>
</header>

<style>
	:global(h1, h2, h3, h4, h5, h6) {
		font-family: 'Fira Sans';
	}

  header {
    min-height: 100vh;
    /* max-width: var(--measure); */
    --measure: 75ch;
    margin: 0 auto;
  }

  header a {
    color: var(--color-white);
    text-decoration: none;
    border-bottom: 2px solid #17c3b2;
  }

  header a:hover, header a:active {
    color: #fe6d73;
  }

  header #hero {
    min-height: 100vh;
    max-width: var(--measure);
    margin: 0 auto;
    position: relative;
  }

  header :global(.frame) {
    height: 100vh;
  }

  header :global(.frame img) {
    object-position: 50% 100%;
  }

  header :global(.imposter) {
    width: 100%;
    height: 100%;
  }

  header :global(.imposter > .stack) {
    height: 100%;
  }

  header :global(.imposter > .stack > .box) {
    /* height: 100%; */
    --background-color: transparent;
    text-align: center;
    color: var(--color-white);
    background-color: rgba(2,0,0,0.5);
    backdrop-filter: blur(4px);
    padding: var(--s-1) var(--s-3);
    margin-bottom: auto;
  }

  header :global(.greeting) {
    /* margin: 0 auto; */
    background-color: rgb(254, 249, 239);
    /* backdrop-filter: blur(8px); */
    /* border: 2px solid #ffcb77;
    border-radius: 8px 8px 0 0;
    border-bottom: none;
    width: fit-content; */
    padding: var(--s0);
    color: #227c9d;
    font-weight: 800;
    line-height: 1;
    --font-size-big: var(--s4);
    /* text-shadow: 2px 2px #227c9d; */
  }

  /* header nav {
    text-align: center;
    color: var(--color-white);
    background-color: rgba(2,0,0,0.5);
    backdrop-filter: blur(4px);
    padding: var(--s-1) var(--s-3);
  } */

  header :global(.center) {
    --measure: 60ch;
  }

  header :global(.stack) {
    --space: var(--s-2);
  }

  header :global(.cluster) {
    justify-content: center;
  }

  header :global(.icon-large svg) {
    font-size: var(--s4);
  }

  header :global(.icon-large a) {
    border: none;
  }

  header :global(.icon-small svg) {
    font-size: var(--s2);
  }

  header :global(.cluster a) {
    width: min-content;
    display: block;
    /* color: var(--color-white); */
    text-transform: uppercase;
    /* text-decoration: none; */
  }

</style>
