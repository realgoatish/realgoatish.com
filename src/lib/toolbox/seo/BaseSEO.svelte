<script>
	import { page } from '$app/stores';

  // TODO try/catch alone won't work in this comp because your primary threat is undefined errors
  // what's the best approach?

	export let data;

  $: console.log(`prop data in SEO comp: ${JSON.stringify(data, null, 2)}`)

  // initialize variables that will be used in the comp's markup so they're not scoped to the try/catch
  let canonical, 
  websiteUrl, 
  websiteName, 
  pageImageAlt,
  pageDescription,
  pageTitle,
  ogType,
  ogImage,
  ogImageWidth,
  ogImageHeight,
  twitterImage,
  jsonldScript,
  error


    const { global, currentPage } = data;

  // TODO this if statement is just a band-aid hack. need more
  if (currentPage) {

    let webSiteType, webPageType, blogPostingType;

    let isBlogPath = /\/blog\/$/;
    let isBlogPostPath = /\/blog\/[A-Za-z0-9-]+\/$/

    let jsonld = {
      '@context': 'https://schema.org',
      '@graph': []
    };
    // TODO add:
    // - pageDatePublished
    // - pageDateModified
    // - Organization type for main graph
    // - logo ImageObject to be used on Organization type
    // - Person type w/ ID to be used in the main graph, ID referenced as Author in the Article type on Blog posts ***
    // - Article type for Blog posts ***
    // *** we're already using BlogPosting type, which should it be?!
    canonical = global.canonical;
    websiteUrl = global.siteUrl;
    websiteName = global.siteName;
    let publisherId = `${websiteUrl}#organization`;
    let websiteId = `${websiteUrl}#website`;
    let pageId = `${canonical}#webPage`;
    let pageImageId = `${canonical}#primaryimage`;
    let pageImageUrl = currentPage.images.main.url;
    pageImageAlt = currentPage.altText;
    pageTitle = currentPage.title;
    pageDescription = currentPage.description;
    ogType = isBlogPostPath.test($page.url.pathname) ? 'article' : 'website'
    ogImage = currentPage.images.facebook.url;
    ogImageWidth = currentPage.images.facebook.width;
    ogImageHeight = currentPage.images.facebook.height;
    twitterImage = currentPage.images.twitter.url;
    // BlogPosting type data - TODO do we want to use this or Article type?
    let authorName;
    let authorId;
    let authorUrl;
    let dateModified;
    let datePublished;
    let headline;
    let blogPostImage;

    webSiteType = {
      '@type': 'WebSite',
      '@id': websiteId,
      name: websiteName,
      url: websiteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${websiteUrl}?s={search_term_string}`,
        'query-input': 'required name=search_term_string'
      },
      publisher: {
        '@id': publisherId
      }
    };

    webPageType = {
      '@type': 'WebPage',
      '@id': pageId,
      url: canonical,
      inLanguage: global.locale,
      name: `${pageTitle} | ${websiteName}`,
      image: {
        '@type': 'ImageObject',
        '@id': pageImageId,
        url: pageImageUrl
      },
      isPartOf: {
        '@id': websiteId
      },
      primaryImageOfPage: {
        '@id': pageImageId
      },
      description: pageDescription
    };

    // if we're on the /blog/ page...
    if (isBlogPath.test($page.url.pathname)) {

      // add a breadcrumb ID for /blog/
      webPageType['breadcrumb'] = {
        '@id': `${canonical}#breadcrumb`
      };

      // add the actual breadcrumbList in the graph: Home => Blog
      jsonld['@graph'].push({
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            item: {
              '@type': 'WebPage',
              '@id': `${websiteUrl}#webPage`,
              url: websiteUrl,
              name: `Home`
            }
          },
          {
            '@type': 'ListItem',
            position: 2,
            item: {
              '@type': 'WebPage',
              '@id': `${canonical}#webPage`,
              url: canonical,
              name: pageTitle
            }
          }
        ]
      });
    }

    if (currentPage?.blogPosting) {
      authorName = currentPage.blogPosting.authorName;
      authorId = `${websiteUrl}#${authorName
        .toLowerCase()
        .split(' ')
        .join('-')}`;
      authorUrl = currentPage.blogPosting.authorUrl;
      dateModified = currentPage.blogPosting.dateModified;
      datePublished = currentPage.blogPosting.datePublished;
      headline = currentPage.blogPosting.headline;
      blogPostImage = currentPage.blogPosting.image;

      blogPostingType = {
        '@type': 'BlogPosting',
        author: {
          '@type': 'Person',
          '@id': authorId,
          name: authorName,
          url: authorUrl
        },
        dateModified,
        datePublished,
        headline,
        blogPostImage
      };

      jsonld['@graph'].push(webSiteType, webPageType, blogPostingType);
    } else {
      jsonld['@graph'].push(webSiteType, webPageType);
    }



    let jsonldString = JSON.stringify(jsonld);

    jsonldScript = `<script type="application/ld+json">${
      jsonldString + '<'
    }/script>`;

  } else {

    error = true

  }

</script>

<!-- if the global & page-level SEO data came in from the prop & was processed without error, render the comp -->

<svelte:head>

  {#if !error}

    <title>{pageTitle}</title>
    <link rel="canonical" href={canonical} />
    <link rel="alternate" type="application/rss+xml" href={`${websiteUrl}rss.xml`} />
    <meta name="description" content={pageDescription} />
    <meta property="og:description" content={pageDescription} />
    <meta property="og:locale" content={global.locale} />
    <meta property="og:site_name" content={websiteName} />
    <meta property="og:title" content={pageTitle} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content={ogImageWidth} />
    <meta property="og:image:height" content={ogImageHeight} />
    <meta property="og:image:alt" content={pageImageAlt} />
    <meta property="og:type" content={ogType} />
    <meta property="og:url" content={canonical} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:creator" content="@realgoatish" />
    <meta name="twitter:title" content={pageTitle} />
    <meta name="twitter:description" content={pageDescription} />
    <meta name="twitter:image" content={twitterImage} />
    <meta name="twitter:image:alt" content={pageImageAlt} />

  {/if}

</svelte:head>

{#if !error}
  {@html jsonldScript}
{/if}
