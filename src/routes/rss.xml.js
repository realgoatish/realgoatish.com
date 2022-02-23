import dotenv from 'dotenv'
dotenv.config()

const { BASE_PATH, BLOG_PATH } = process.env

export async function get() {

  const res = await fetch(`${BASE_PATH}/api/blog/getAllPosts`)
  const blogPageData = await res.json()

  const { page, pageSEO } = blogPageData.pageData
  const { allPostsData } = blogPageData

  console.log(`blogPageData on rss feed server: ${JSON.stringify(blogPageData, null, 2)}`)

  const render = (posts) => `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0">
  <channel>
    <title><![CDATA[ ${page.title} ]]></title>
    <link><![CDATA[ ${BASE_PATH}${BLOG_PATH} ]]></link>
    <description><![CDATA[ ${pageSEO.description} ]]></description>
    <image>
      <url>${BASE_PATH}/favicon.png</url>
      <title><![CDATA[ ${page.title} ]]></title>
      <link><![CDATA[ ${BASE_PATH}${BLOG_PATH} ]]></link>
    </image>
    ${posts.map(post => `
      <item>
        <title><![CDATA[ ${post.title} ]]></title>
        <link><![CDATA[ ${BASE_PATH}${post.href} ]]></link>
        <description><![CDATA[ ${post.subTitle} ]]></description>
        <pubDate>${post.feedPublicationDate}</pubDate>
      </item>
    `).join('\n')}
  </channel>
  </rss>`

  return {
    status: 200,
    headers: {
      'Cache-Control': `max-age=0, s-max-age=${600}`,
      'Content-Type': 'application/xml'
    },
    body: render(allPostsData)
  }
}