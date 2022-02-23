import Prismic from '@prismicio/client';

/**
 * Detect if a browser supports a CSS property/value combo
 * @param {string} property
 * @param {string} value
 * @returns {boolean}
 */
export function isDeclarationSupported(property, value) {
	let prop = property + ':',
		el = document.createElement('test'),
		mStyle = el.style;
	el.style.cssText = prop + value;
	return mStyle[property];
}

export function linkResolver(doc) {
	if (doc.type === 'posts_page') {
		return '/' + doc.uid + '/';
	} else if (doc.type === 'blog_post') {
    return '/blog/' + doc.uid + '/'
  }

	return '/';
}

export function initApi(req, endpoint) {
	return Prismic.getApi(endpoint, {
		req: req
	});
}

export function getGlobalLayoutData(api) {
  return api.query([
    Prismic.Predicates.at('my.global_content.uid', 'global-layout')
  ])
}

export function getHomePageData(api) {
  return api.query([
    Prismic.Predicates.at('my.home_page.uid', 'home')
  ])
}

export function getAllPostsPageData(api) {
  return api.query([
    Prismic.Predicates.at('my.posts_page.uid', 'blog')
  ])
}

export function getAllPosts(api) {
  return api.query(
    Prismic.Predicates.at('document.type', 'blog_post'),
    { orderings : '[document.first_publication_date desc]' }
  )
}

export function getPost(api, slug) {
  return api.query([
    Prismic.Predicates.at('my.blog_post.uid', `${slug}`)
  ])
}

export function getAllRoutes(api) {
  return api.query(
    Prismic.Predicates.not('document.type', 'global_content')
  )
}

export const monthMap = {
  0: "January",
  1: "February",
  2: "March",
  3: "April",
  4: "May",
  5: "June",
  6: "July",
  7: "August",
  8: "September",
  9: "October",
  10: "November",
  11: "December"
}
