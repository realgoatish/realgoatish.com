import { initApi, getGlobalLayoutData } from '$lib/js/utils';


export async function get(request) {
	const res = await initApi(request, request.locals.ctx.endpoint).then(
    function(api) {
      return getGlobalLayoutData(api)
    }
	).then(res => {
    if (res.results[0]) {

      // let test = res.results[0]

      // console.log(JSON.stringify(test, null, 2))

      let body = res.results[0].data.body

      let linkSlice = body
        .filter(slice => slice.slice_type === "links")[0]

      // console.log(JSON.stringify(linkSlice, null, 2))


      navLinks = linkSlice.items.map(item => {
        console.log(JSON.stringify(item, null, 2))
       return { 
        //  href: request.locals.DOM.Link.url(item.nav_link, linkResolver), 
         href: request.locals.DOM.Link.url(item.nav_link, request.locals.ctx.linkResolver), 
         text: item.nav_link.uid === 'blog' ? 'writing' : item.nav_link.uid
        }
      })

      console.log(JSON.stringify(navLinks, null, 2))

    }
  })

	return {
		status: 200,
		body: navLinks
	};
}
