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
		return '/' + doc.uid;
	} else if (doc.type === 'blog_post') {
    return '/blog/' + doc.uid
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

