import matter from 'gray-matter'
import { readFileSync } from 'fs'
import glob from 'glob'

export const pageSize = 5

export function getNumPages() {
  const total = getNumTotal()
  const numPages = Math.ceil(total / pageSize)
  return numPages
}

export function getNumTotal() {
  return glob.sync('content/**/*.md').length
}

function makeSlug(filename) {
  return filename.split('/')[1]
    .slice(0, -3)
    .trim()
}

export function getSlugs(from = 0, to = 5, compare = defaultCompare) {
  return getArticles(from, to, compare)
    .map(md => md.data.slug)
}

export const defaultCompare = (a, b) => b - a

export function getArticles(from = 0, to = 5, compare = defaultCompare, tags = undefined) {
  if (to === -1) {
    to = undefined
  }

  return glob.sync('content/**/*.md')
    .map(getArticleFromFile)
    .sort((a, b) => compare(Date.parse(a.data.date), Date.parse(b.data.date)))
    .slice(from, to)
    .filter(article => !tags || articleHasTag(article, tags))
}

function getArticleFromFile(filename) {
  const str = readFileSync(filename)

  const excerpt_separator = '<!--more-->'
  const md = matter(str, { excerpt_separator })
  md.content = md.content.replace(excerpt_separator, '')

  if (!md.data.slug) {
    md.data.slug = makeSlug(filename)
  }

  return md
}

export function getArticleFromSlug(slug) {
  return getArticleFromFile(`content/${slug}.md`)
}

function articleHasTag(article, tags) {
  if (!article.data.tags || !tags) {
    return false
  }

  return tags.find(tag => article.data.tags.includes(tag))
}

export function getAllTags() {
  const tags = getArticles(0, -1)
    .map(({ data }) => data.tags ? data.tags : [])
    .flat(1)

  return Array.from(new Set(tags)).sort()
}
