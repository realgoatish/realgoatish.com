import { initApi, getHomePageData } from '$lib/js/utils';


export async function get(event) {

  let response

  try {

    response = await initApi(event.request, event.locals.ctx.endpoint).then(
      function(api) {
        return getHomePageData(api)
      }
    ).then(res => {
      try {

        if (res.results[0]) {
    
          let body = res.results[0].data.body
    
          let lastMod = res.results[0].last_publication_date.substring(0, 10)
    
          let heroSection = body
            .filter(slice => slice.slice_type === "hero_section")
            .map(slice => {
              return {
                header: slice.primary.header
                  .split(' ')
                  .join('<br>'),
                text: slice.primary.text
                  .split(', ')
                  .join(',<br>'),
                images: slice.primary.image.desktop.dimensions
                  ? [
                      { width: slice.primary.image.dimensions.width, src: slice.primary.image.url },
                      { width: slice.primary.image.desktop.dimensions.width, src: slice.primary.image.desktop.url },
                      { width: slice.primary.image.tablet.dimensions.width, src: slice.primary.image.tablet.url },
                      { width: slice.primary.image.mobile.dimensions.width, src: slice.primary.image.mobile.url },
    
                    ]
                  : null
    
              }
            })
    
          let aboutSection = body
            .filter(slice => slice.slice_type === 'about_section')
            .map(slice => {
              return {
                title: slice.primary.title,
                summary: event.locals.DOM.RichText.asHtml(slice.primary.summary, event.locals.ctx.linkResolver),
                sections: slice.items.map(item => {
                  return {
                    header: item.header,
                    description: event.locals.DOM.RichText.asHtml(item.description, event.locals.ctx.linkResolver)
                  }
                })
              }
            })
    
          let seo = body
            .filter(slice => slice.slice_type === 'regular_page_seo')
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
                  : null
              }
            })
    
          const [ hero ] = heroSection
          const [ about ] = aboutSection
          const [ pageSEO ] = seo
    
          return {
            lastMod,
            hero,
            about,
            pageSEO
          }
        }
      } catch (e) {
        return {
          status: 550,
          body: new Error(`Failed during during processing of home page data after Prismic API response`)
        }
      }
    })
    
  } catch (e) {
    return {
      status: 502,
      body: new Error(`Failed during Prismic API call in index@home.js`)
    }
  }

	return {
		status: 200,
		body: response
	};
}