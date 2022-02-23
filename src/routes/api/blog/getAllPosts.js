import { initApi, getAllPostsPageData, getAllPosts, monthMap } from '$lib/js/utils';


export async function get(event) {

	const pageData = await initApi(event.request, event.locals.ctx.endpoint).then(
    function(api) {
      return getAllPostsPageData(api)
    }
	).then(result => {
    if (result.results[0]) {

      // console.log(`pageData on getAllPosts.js: ${JSON.stringify(result.results[0], null, 2)}`)

      let data = result.results[0].data

      let page = {
        title: data.page_title,
        subTitle: data.page_subtitle,
        lastMod: result.results[0].last_publication_date.substring(0, 10)
      }

      let [pageSEO] = data.body.map(slice => {
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
            : null
        }
      })

      return {
        page,
        pageSEO
      }
    }
  })

  const allPostsData = await initApi(event.request, event.locals.ctx.endpoint).then(
    function(api) {
      return getAllPosts(api)
    }
	).then(result => {
    // console.log(`allPostsData result before processing: ${JSON.stringify(result, null, 2)}`)
    if (result.results[0]) {
      let postsData = result.results.map(post => {
        let createdAt = event.locals.DOM.Date(post.first_publication_date)
        // console.log(``)
        return {
          title: post.data.post_title,
          subTitle: post.data.post_subtitle,
          lastMod: post.last_publication_date.substring(0, 10),
          tags: post.tags.map(tag => `#${tag}`),
          images: post.data.body
            .reduce((result, current) => {
              if (current.slice_type === 'post_block') {
                result.push(...current.items)
              }
              return result
            }, [])
            .reduce((result, current) => {
              if (current.post_block_image.url) {
                result.push({ url: current.post_block_image.url, alt: current.post_block_image.alt })
              } 
              if (current.post_block_text.some(element => element.type === 'image')) {
                let inTextImages = current.post_block_text
                  .filter(item => item.type === 'image')
                  .map(item => { 
                    return { 
                      url: item.url, alt: item.alt 
                    }
                  })
                result.push(...inTextImages)
              }
              return result
            }, []),
          href: `/blog/${post.uid}/`,
          feedPublicationDate: createdAt.toUTCString(),
          publicationDate: createdAt.getFullYear === new Date().getFullYear
            ? `${monthMap[createdAt.getMonth()]} ${createdAt.getDate()}`
            : `${monthMap[createdAt.getMonth()]} ${createdAt.getDate()}, ${createdAt.getFullYear()}`
        }
      })
      return postsData
    }
  })

	return {
		status: 200,
		body: {
      pageData,
      allPostsData
    }
	};
}