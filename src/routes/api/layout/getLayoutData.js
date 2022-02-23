import { initApi, getGlobalLayoutData } from '$lib/js/utils';


export async function get(request) {
	const res = await initApi(request, request.locals.ctx.endpoint).then(
    function(api) {
      return getGlobalLayoutData(api)
    }
	).then(res => {
    if (res.results[0]) {

      console.log(`response in getLayoutData before processing: ${JSON.stringify(res.results[0], null, 2)}`)

      let body = res.results[0].data.body

      let [rawSocialLinks] = body
        .filter(slice => slice.primary.link_cluster_type === "Social")
        
      let processedSocialLinks = rawSocialLinks.items.map(item => {
        return {
          href: item.link.url, 
          site: item.external_link_id,
          iconId: `#icon-${item.external_link_id.toLowerCase()}`
        }
      })

      let seo = body
        .filter(slice => slice.slice_type === 'seo')
        .map(item => {
          return {
            siteName: item.primary.site_name,
            siteDescription: item.primary.site_description,
            logo: item.primary.site_logo.url,
            sameAs: processedSocialLinks.map(x => {
              return x.href
            }),
            // phone: ,
            // email: ,
            locale: 'en_US'
          }
        })

      let [globalSEO] = seo

      let [rawNavLinks] = body
        .filter(slice => slice.primary.link_cluster_type === "Nav")


      let processedNavLinks = rawNavLinks.items.map(item => {
        return { 
          href: request.locals.DOM.Link.url(item.link, request.locals.ctx.linkResolver), 
          text: item.link.uid
        }
      })

      return {
        headerData: {
          navLinks: processedNavLinks,
          socialLinks: processedSocialLinks
        },
        globalSEO
      }
    }
  })

	return {
		status: 200,
		body: res
	};
}
