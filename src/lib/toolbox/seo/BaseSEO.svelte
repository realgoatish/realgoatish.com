<script>
	import { page } from '$app/stores';

	export let data;

	const { global, currentPage } = data;

	let webSiteType, webPageType, blogPostingType;

  let isBlogPath = /\/blog\/$/;
	let isBlogPostPath = /\/blog\/[A-Za-z0-9-]+\/$/

	let jsonld = {
		'@context': 'https://schema.org',
		'@graph': []
	};
	let canonical = global.canonical;
	let websiteUrl = global.siteUrl;
	let websiteName = global.siteName;
	let websiteId = `${websiteUrl}#website`;
	let pageId = `${canonical}#webPage`;
	let pageImageId = `${canonical}#primaryimage`;
	let pageImageUrl = currentPage.images.main.url;
	let pageImageAlt = currentPage.altText;
	let pageTitle = currentPage.title;
	let pageDescription = currentPage.description;
  let ogType = isBlogPostPath.test($page.url.pathname) ? 'article' : 'website'
	let ogImage = currentPage.images.facebook.url;
	let ogImageWidth = currentPage.images.facebook.width;
	let ogImageHeight = currentPage.images.facebook.height;
	let twitterImage = currentPage.images.twitter.url;
	let authorName;
	let authorId;
	let authorUrl;
	let dateModified;
	let datePublished;
	let headline;
	let blogPostImage;

	// need publisherId too

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
			'@id': `${websiteUrl}#westmont`
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

	if (isBlogPath.test($page.url.pathname)) {
		console.log('IT WORKS!!!');

		webPageType['breadcrumb'] = {
			'@id': `${canonical}#breadcrumb`
		};

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

	// let example = {
	// 	'@context': 'https://schema.org',
	// 	'@graph': [
	// 		{
	// 			'@type': 'Place',
	// 			'@id': 'https://naluseo.com/#place',
	// 			address: {
	// 				'@type': 'PostalAddress',
	// 				streetAddress: '399 Market St Suite 360',
	// 				addressLocality: 'Philadelphia',
	// 				addressRegion: 'PA',
	// 				postalCode: '19106'
	// 			}
	// 		},
	// 		{
	// 			'@type': 'Organization',
	// 			'@id': 'https://naluseo.com/#organization',
	// 			name: 'Nalu SEO',
	// 			url: 'https://naluseo.com',
	// 			email: 'info@naluseo.com',
	// 			address: {
	// 				'@type': 'PostalAddress',
	// 				streetAddress: '399 Market St Suite 360',
	// 				addressLocality: 'Philadelphia',
	// 				addressRegion: 'PA',
	// 				postalCode: '19106'
	// 			},
	// 			logo: {
	// 				'@type': 'ImageObject',
	// 				'@id': 'https://naluseo.com/#logo',
	// 				url: 'https://naluseo.com/wp-content/uploads/2020/02/NaluSEOIMG-1.png',
	// 				caption: 'Nalu SEO',
	// 				inLanguage: 'en-US',
	// 				width: '998',
	// 				height: '968'
	// 			},
	// 			contactPoint: [
	// 				{
	// 					'@type': 'ContactPoint',
	// 					telephone: '1-800-930-4518',
	// 					contactType: 'customer support'
	// 				}
	// 			],
	// 			location: { '@id': 'https://naluseo.com/#place' }
	// 		},
	// 		{
	// 			'@type': 'WebSite',
	// 			'@id': 'https://naluseo.com/#website',
	// 			url: 'https://naluseo.com',
	// 			name: 'Nalu SEO',
	// 			publisher: { '@id': 'https://naluseo.com/#organization' },
	// 			inLanguage: 'en-US',
	// 			potentialAction: {
	// 				'@type': 'SearchAction',
	// 				target: 'https://naluseo.com/?s={search_term_string}',
	// 				'query-input': 'required name=search_term_string'
	// 			}
	// 		},
	// 		{
	// 			'@type': 'ImageObject',
	// 			'@id':
	// 				'https://naluseo.com/wp-content/uploads/2020/02/NaluSEOIMG-1.png',
	// 			url: 'https://naluseo.com/wp-content/uploads/2020/02/NaluSEOIMG-1.png',
	// 			width: '998',
	// 			height: '968',
	// 			caption: 'Nalu Services Logo',
	// 			inLanguage: 'en-US'
	// 		},
	// 		{
	// 			'@type': 'Person',
	// 			'@id': 'https://naluseo.com/author/dean-colomban/',
	// 			name: 'Dean Colomban',
	// 			url: 'https://naluseo.com/author/dean-colomban/',
	// 			image: {
	// 				'@type': 'ImageObject',
	// 				'@id':
	// 					'https://naluseo.com/wp-content/litespeed/avatar/c988f92d5e9a159e192319d7d6cc662c.jpg',
	// 				url: 'https://naluseo.com/wp-content/litespeed/avatar/c988f92d5e9a159e192319d7d6cc662c.jpg',
	// 				caption: 'Dean Colomban',
	// 				inLanguage: 'en-US'
	// 			},
	// 			worksFor: { '@id': 'https://naluseo.com/#organization' }
	// 		},
	// 		{
	// 			'@type': 'WebPage',
	// 			'@id': 'https://naluseo.com/#webpage',
	// 			url: 'https://naluseo.com/',
	// 			name: 'Affordable SEO Service and Brand Management',
	// 			datePublished: '2019-10-09T19:31:41-05:00',
	// 			dateModified: '2021-05-26T17:11:27-05:00',
	// 			author: { '@id': 'https://naluseo.com/author/dean-colomban/' },
	// 			isPartOf: { '@id': 'https://naluseo.com/#website' },
	// 			primaryImageOfPage: {
	// 				'@id':
	// 					'https://naluseo.com/wp-content/uploads/2020/02/NaluSEOIMG-1.png'
	// 			},
	// 			inLanguage: 'en-US'
	// 		},
	// 		{
	// 			'@type': 'Article',
	// 			headline: 'Affordable SEO Service and Brand Management',
	// 			datePublished: '2019-10-09GMT-050019:31:41-05:00',
	// 			dateModified: '2021-05-26GMT-050017:11:27-05:00',
	// 			author: { '@type': 'Person', name: 'Dean Colomban' },
	// 			description:
	// 				"The internet is like the Ocean, grand and constant. Nalu's Affordable SEO Expert Services and Brand Management catch every wave. Nalu It!",
	// 			name: 'Affordable SEO Service and Brand Management',
	// 			'@id': 'https://naluseo.com/#schema-5057',
	// 			isPartOf: { '@id': 'https://naluseo.com/#webpage' },
	// 			publisher: { '@id': 'https://naluseo.com/#organization' },
	// 			image: {
	// 				'@id':
	// 					'https://naluseo.com/wp-content/uploads/2020/02/NaluSEOIMG-1.png'
	// 			},
	// 			inLanguage: 'en-US',
	// 			mainEntityOfPage: { '@id': 'https://naluseo.com/#webpage' }
	// 		}
	// 	]
	// };

	// let breadcrumbExample = {
	// 	'@context': 'https://schema.org',
	// 	'@graph': [
	// 		{
	// 			'@type': 'Place',
	// 			'@id': 'https://naluseo.com/#place',
	// 			address: {
	// 				'@type': 'PostalAddress',
	// 				streetAddress: '399 Market St Suite 360',
	// 				addressLocality: 'Philadelphia',
	// 				addressRegion: 'PA',
	// 				postalCode: '19106'
	// 			}
	// 		},
	// 		{
	// 			'@type': 'Organization',
	// 			'@id': 'https://naluseo.com/#organization',
	// 			name: 'Nalu SEO',
	// 			url: 'https://naluseo.com',
	// 			email: 'info@naluseo.com',
	// 			address: {
	// 				'@type': 'PostalAddress',
	// 				streetAddress: '399 Market St Suite 360',
	// 				addressLocality: 'Philadelphia',
	// 				addressRegion: 'PA',
	// 				postalCode: '19106'
	// 			},
	// 			logo: {
	// 				'@type': 'ImageObject',
	// 				'@id': 'https://naluseo.com/#logo',
	// 				url: 'https://naluseo.com/wp-content/uploads/2020/02/NaluSEOIMG-1.png',
	// 				caption: 'Nalu SEO',
	// 				inLanguage: 'en-US',
	// 				width: '998',
	// 				height: '968'
	// 			},
	// 			contactPoint: [
	// 				{
	// 					'@type': 'ContactPoint',
	// 					telephone: '1-800-930-4518',
	// 					contactType: 'customer support'
	// 				}
	// 			],
	// 			location: { '@id': 'https://naluseo.com/#place' }
	// 		},
	// 		{
	// 			'@type': 'WebSite',
	// 			'@id': 'https://naluseo.com/#website',
	// 			url: 'https://naluseo.com',
	// 			name: 'Nalu SEO',
	// 			publisher: { '@id': 'https://naluseo.com/#organization' },
	// 			inLanguage: 'en-US'
	// 		},
	// 		{
	// 			'@type': 'ImageObject',
	// 			'@id':
	// 				'https://naluseo.com/wp-content/uploads/2020/06/1st-Month-Organic-Results-Thank-You-Nalu.png',
	// 			url: 'https://naluseo.com/wp-content/uploads/2020/06/1st-Month-Organic-Results-Thank-You-Nalu.png',
	// 			width: '1074',
	// 			height: '757',
	// 			caption: '1st Month Organic Results',
	// 			inLanguage: 'en-US'
	// 		},
	// 		{
	// 			'@type': 'BreadcrumbList',
	// 			'@id':
	// 				'https://naluseo.com/affordable-local-seo-service-that-works/#breadcrumb',
	// 			itemListElement: [
	// 				{
	// 					'@type': 'ListItem',
	// 					position: '1',
	// 					item: { '@id': 'https://naluseo.com', name: 'Home' }
	// 				},
	// 				{
	// 					'@type': 'ListItem',
	// 					position: '2',
	// 					item: {
	// 						'@id':
	// 							'https://naluseo.com/affordable-local-seo-service-that-works/',
	// 						name: 'Affordable Local SEO Service That Works!'
	// 					}
	// 				}
	// 			]
	// 		},
	// 		{
	// 			'@type': 'Person',
	// 			'@id': 'https://naluseo.com/author/dean-colomban/',
	// 			name: 'Dean Colomban',
	// 			url: 'https://naluseo.com/author/dean-colomban/',
	// 			image: {
	// 				'@type': 'ImageObject',
	// 				'@id':
	// 					'https://naluseo.com/wp-content/litespeed/avatar/c988f92d5e9a159e192319d7d6cc662c.jpg',
	// 				url: 'https://naluseo.com/wp-content/litespeed/avatar/c988f92d5e9a159e192319d7d6cc662c.jpg',
	// 				caption: 'Dean Colomban',
	// 				inLanguage: 'en-US'
	// 			},
	// 			worksFor: { '@id': 'https://naluseo.com/#organization' }
	// 		},
	// 		{
	// 			'@type': 'WebPage',
	// 			'@id':
	// 				'https://naluseo.com/affordable-local-seo-service-that-works/#webpage',
	// 			url: 'https://naluseo.com/affordable-local-seo-service-that-works/',
	// 			name: 'Affordable Local SEO Service That Works! - Nalu SEO',
	// 			datePublished: '2020-09-07T17:25:00-05:00',
	// 			dateModified: '2020-09-08T02:04:09-05:00',
	// 			author: { '@id': 'https://naluseo.com/author/dean-colomban/' },
	// 			isPartOf: { '@id': 'https://naluseo.com/#website' },
	// 			primaryImageOfPage: {
	// 				'@id':
	// 					'https://naluseo.com/wp-content/uploads/2020/06/1st-Month-Organic-Results-Thank-You-Nalu.png'
	// 			},
	// 			inLanguage: 'en-US',
	// 			breadcrumb: {
	// 				'@id':
	// 					'https://naluseo.com/affordable-local-seo-service-that-works/#breadcrumb'
	// 			}
	// 		},
	// 		{
	// 			'@type': 'Article',
	// 			headline: 'Affordable Local SEO Service That Works! - Nalu SEO',
	// 			keywords: 'Local SEO Service That Works',
	// 			datePublished: '2020-09-07T17:25:00-05:00',
	// 			dateModified: '2020-09-08T02:04:09-05:00',
	// 			author: { '@id': 'https://naluseo.com/author/dean-colomban/' },
	// 			publisher: { '@id': 'https://naluseo.com/#organization' },
	// 			description:
	// 				'Maximize your Local SEO, with Local SEO service that works. Control all your digital facts across Google, Facebook, Yelp, Apple, over 100 places. This Works!',
	// 			name: 'Affordable Local SEO Service That Works! - Nalu SEO',
	// 			'@id':
	// 				'https://naluseo.com/affordable-local-seo-service-that-works/#richSnippet',
	// 			isPartOf: {
	// 				'@id':
	// 					'https://naluseo.com/affordable-local-seo-service-that-works/#webpage'
	// 			},
	// 			image: {
	// 				'@id':
	// 					'https://naluseo.com/wp-content/uploads/2020/06/1st-Month-Organic-Results-Thank-You-Nalu.png'
	// 			},
	// 			inLanguage: 'en-US',
	// 			mainEntityOfPage: {
	// 				'@id':
	// 					'https://naluseo.com/affordable-local-seo-service-that-works/#webpage'
	// 			}
	// 		}
	// 	]
	// };

	let jsonldString = JSON.stringify(jsonld);

	let jsonldScript = `<script type="application/ld+json">${
		jsonldString + '<'
	}/script>`;
</script>

<svelte:head>
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
</svelte:head>

{@html jsonldScript}
