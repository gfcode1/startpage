import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const API = 'https://api.github.com/repos/plenaryapp/awesome-rss-feeds/contents'
const RAW = 'https://raw.githubusercontent.com/plenaryapp/awesome-rss-feeds/master'

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function parseOpml(xml) {
  const feeds = []
  const outlineRegex = /<outline\s[^>]*\/>/g
  const textRegex = /text="([^"]*)"/
  const titleRegex = /title="([^"]*)"/
  const xmlUrlRegex = /xmlUrl="([^"]*)"/
  const typeRegex = /type="([^"]*)"/
  const descriptionRegex = /description="([^"]*)"/

  let match
  while ((match = outlineRegex.exec(xml)) !== null) {
    const el = match[0]
    if (!xmlUrlRegex.test(el)) continue

    const url = el.match(xmlUrlRegex)[1]
    const title = (el.match(titleRegex) || el.match(textRegex))?.[1] || url
    const type = el.match(typeRegex)?.[1] || 'rss'

    if (type !== 'rss') continue

    feeds.push({ title, url })
  }

  return feeds
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.json()
}

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
  return res.text()
}

async function getOpmlFiles(dir) {
  const items = await fetchJson(`${API}/${dir}`)
  return items.filter((i) => i.name.endsWith('.opml')).map((i) => i.name)
}

function hashUrl(url) {
  let h = 0
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) - h) + url.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h).toString(36).slice(0, 4)
}

async function main() {
  const allFeeds = []
  const seenUrls = new Set()
  const seenIds = new Set()

  const countryFiles = await getOpmlFiles('countries/with_category')
  const categoryFiles = await getOpmlFiles('recommended/with_category')

  for (const file of countryFiles) {
    const countryName = file.replace('.opml', '')
    const xml = await fetchText(`${RAW}/countries/with_category/${encodeURIComponent(file)}`)
    const feeds = parseOpml(xml)
    for (const f of feeds) {
      if (seenUrls.has(f.url)) continue
      seenUrls.add(f.url)
      let id = slugify(f.title)
      if (seenIds.has(id)) id = `${id}-${hashUrl(f.url)}`
      seenIds.add(id)
      allFeeds.push({
        id,
        title: f.title,
        url: f.url,
        category: 'News',
        country: countryName,
        language: 'en',
      })
    }
  }

  for (const file of categoryFiles) {
    const categoryName = file.replace('.opml', '')
    const xml = await fetchText(`${RAW}/recommended/with_category/${encodeURIComponent(file)}`)
    const feeds = parseOpml(xml)
    for (const f of feeds) {
      if (seenUrls.has(f.url)) continue
      seenUrls.add(f.url)
      let id = slugify(f.title)
      if (seenIds.has(id)) id = `${id}-${hashUrl(f.url)}`
      seenIds.add(id)
      allFeeds.push({
        id,
        title: f.title,
        url: f.url,
        category: categoryName,
      })
    }
  }

  allFeeds.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title))

  const catalog = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    total: allFeeds.length,
    feeds: allFeeds,
  }

  const outPath = resolve(__dirname, '../src/apps/news/news-catalog.json')
  writeFileSync(outPath, JSON.stringify(catalog, null, 2))
  console.log(`Generated catalog with ${allFeeds.length} feeds → ${outPath}`)
}

main().catch(console.error)
