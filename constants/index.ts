export const appName = 'Little Eleven\'s Life'
export const appDescription = 'Little Eleven\'s Life'

export const iconfontUrl = '//at.alicdn.com/t/c/font_178634_5lx1rpvocj2.js'

let _proxyBaseURL = 'https://baby-eat-api.farr1102work.workers.dev'

// 部署你自己的 Cloudflare Worker 后：
// 方式 A: 设置环境变量 NUXT_API_PROXY_URL（推荐）
// 方式 B: 修改下面的默认值
//
// 查看你的 Worker URL: wrangler deploy 后会显示
// 例如: https://baby-eat-api.your-subdomain.workers.dev

// eslint-disable-next-line node/prefer-global/process
if (process.env.API_ENV === 'local')
  _proxyBaseURL = 'http://localhost:8787'

// 部署 Cloudflare Worker 后，替换为实际的 Workers URL
// 例如: https://baby-eat-api.your-subdomain.workers.dev
if (process.env.NUXT_API_PROXY_URL)
  _proxyBaseURL = process.env.NUXT_API_PROXY_URL

export const proxyBaseURL = _proxyBaseURL
