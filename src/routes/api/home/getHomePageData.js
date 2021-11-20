import { initApi, getHomePageData } from '$lib/js/utils';


export async function get(request) {
	const res = await initApi(request, request.locals.ctx.endpoint).then(
    function(api) {
      return getHomePageData(api)
    }
	).then(res => {
    if (res.results[0]) {

      let body = res.results[0].data.body

      let heroImage = body
        .filter(slice => slice.slice_type === "hero_section")
        .map(slice => {
          return {
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

        const [ hero ] = heroImage


      return {
        hero
      }
    }
  })

	return {
		status: 200,
		body: res
	};
}