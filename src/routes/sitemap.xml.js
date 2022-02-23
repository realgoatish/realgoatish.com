import { initApi, getAllRoutes } from '$lib/js/utils'
import dotenv from 'dotenv'
dotenv.config()

const { BASE_PATH, BLOG_PATH } = process.env

export async function get() {
  const getHomePageData = await fetch(`${BASE_PATH}/api/home/getHomePageData`)
  const home = await getHomePageData.json()

  const getPostsPageData = await fetch(`${BASE_PATH}/api/blog/getAllPosts`)
  const posts = await getPostsPageData.json()

  // console.log(`homePageData on sitemap server: ${JSON.stringify(home, null, 2)}`)

  const homePageData = {
    lastMod: home.lastMod,
    url: `${BASE_PATH}/`,
    image: home.hero.images[0].src
  }

  const postsPageData = {
    lastMod: posts.pageData.page.lastMod,
    url: `${BASE_PATH}${BLOG_PATH}`
  }

  const allPostsData = posts.allPostsData.map(item => {
    return {
      lastMod: item.lastMod,
      url: `${BASE_PATH}${item.href}`,
      images: item.images
    }
  })

  const render = () => `<?xml version="1.0" encoding="UTF-8" ?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url>
      <loc><![CDATA[${homePageData.url}]]></loc>
      <lastMod>${homePageData.lastMod}</lastMod>
      <image:image>
        <image:loc><![CDATA[${homePageData.image}]]></image:loc>
      </image:image>
    </url>
    <url>
      <loc><![CDATA[${postsPageData.url}]]></loc>
      <lastMod>${postsPageData.lastMod}</lastMod>
    </url>${allPostsData.map(page => {
      if (page.images[0]) {
        return `
    <url>
      <loc><![CDATA[${page.url}]]></loc>
      <lastMod>${page.lastMod}</lastMod>${page.images.map(item => 
     `
      <image:image>
        <image:loc><![CDATA[${item.url}]]></image:loc>
        <image:caption><![CDATA[${item.alt}]]></image:caption>
      </image:image>`).join('')}
    </url>`
  } else {
    return `
    <url>
      <loc><![CDATA[${page.url}]]></loc>
      <lastMod>${page.lastMod}</lastMod>
    </url>`
  }
}).join('')}
  </urlset>`

  console.dirxml(`${render()}`)

  return {
    status: 200,
    headers: {
      'Cache-Control': `max-age=0, s-max-age=${600}`,
      'Content-Type': 'application/xml'
    },
    body: render()
  }
}