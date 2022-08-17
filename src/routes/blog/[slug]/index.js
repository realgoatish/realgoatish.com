import { initApi, getPost, monthMap } from '$lib/js/utils';


export async function get(event) {

  const { slug } = event.params

	const pageData = await initApi(event.request, event.locals.ctx.endpoint).then(
    function(api) {
      return getPost(api, slug)
    }
	).then(result => {

    let postSections, title, subTitle, publicationDate

    if (result.results[0]) {

      console.log(`result before processing in [slug].js: ${JSON.stringify(result, null, 2)}`)

      let seoDatePublished = event.locals.DOM.Date(result.results[0].first_publication_date)

      let seoDateModified = event.locals.DOM.Date(result.results[0].last_publication_date)

      let body = result.results[0].data.body

      let seo = body
        .filter(slice => slice.slice_type === 'seo')
        .map(slice => {
          return {
            title: slice.primary.seo_title,
            description: slice.primary.seo_description,
            altText: slice.primary.seo_image.alt,
            images: slice.primary.seo_image.facebook.dimensions
              ? {
                  main: {
                    url: slice.primary.seo_image.url
                  },
                  facebook: {
                    width: slice.primary.seo_image.facebook.dimensions.width,
                    height: slice.primary.seo_image.facebook.dimensions.height,
                    url: slice.primary.seo_image.facebook.url
                  },
                  twitter: {
                    width: slice.primary.seo_image.twitter.dimensions.width,
                    height: slice.primary.seo_image.twitter.dimensions.height,
                    url: slice.primary.seo_image.twitter.url
                  }
                }
              : null,
            blogPosting: {
              authorName: slice.primary.seo_author_name,
              authorUrl: slice.primary.seo_author_url,
              dateModified: seoDateModified,
              datePublished: seoDatePublished,
              headline: slice.primary.seo_title,
              image: slice.primary.seo_image["4x3"].dimensions 
                ? [
                    slice.primary.seo_image["4x3"].url,
                    slice.primary.seo_image["16x9"].url,
                    slice.primary.seo_image["1x1"].url
                  ]
                : null
            }
          }
        })

      const [pageSEO] = seo

      title = result.results[0].data.post_title

      subTitle = result.results[0].data.post_subtitle

      publicationDate = `${monthMap[seoDatePublished.getMonth()]} ${seoDatePublished.getDate()}, ${seoDatePublished.getFullYear()}`


      postSections = body
        .filter(slice => {
          return slice.slice_type === 'post_block' || slice.slice_type === 'embed_media'
        })
        .map(slice => {
          if (slice.slice_type === 'post_block') {
            let [blockItems] = slice.items.map(item => {
              return {
                postBlockLayout: item.post_block_layout,
                title: item.post_block_title
                  ? item.post_block_title
                  : null,
                text: item.post_block_text[0]
                  ? event.locals.DOM.RichText.asHtml(item.post_block_text, event.locals.ctx.linkResolver)
                  : null,
                image: item.post_block_image.desktop.dimensions
                  ? [
                      { width: item.post_block_image.desktop.dimensions.width, src: item.post_block_image.desktop.url },
                      { width: item.post_block_image.tablet.dimensions.width, src: item.post_block_image.tablet.url },
                      { width: item.post_block_image.mobile.dimensions.width, src: item.post_block_image.mobile.url }
                    ]
                  : null,
                altText: item.post_block_image.alt
                  ? item.post_block_image.alt
                  : null
              }
            })
            return blockItems
          } 
          else if (slice.slice_type === 'embed_media') {
            return {
              postBlockLayout: 'Embed Media',
              title: null,
              text: slice.primary.media_link.html,
              image: null,
              altText: null
            }
          }

        })

      return {
        post: {
          title,
          subTitle,
          publicationDate,
          postSections
        },
        pageSEO
      }

    }


  })

	return {
		status: 200,
		body: pageData
	};
}