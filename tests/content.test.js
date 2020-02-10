import { getSlugs, getArticles, getAllTags } from '../content'

test('get default slugs', () => {
  expect(getSlugs().length).toBe(5)
})

test('get first slug', () => {
  const slugs = getSlugs(0, 1, (a, b) => a - b)
  expect(slugs.length).toBe(1)
  expect(slugs[0]).toBe('entity_composer_templates')
})

test('get default articles', () => {
  const articles = getArticles()
  expect(articles.length).toBe(5)
})

test('get first article', () => {
  const articles = getArticles(0, 1, (a, b) => a - b)
  expect(articles.length).toBe(1)

  const { canonical, date, slug, tags, title } = articles[0].data
  expect(slug).toBe('entity_composer_templates')
  expect(canonical).toBe('https://mercury-ecommerce.com/resources/how-to-import-entity-composer-templates');
  expect(date).toBe('2018-08-29')
  expect(tags).toStrictEqual(['XC9'])
  expect(title).toBe('Programmatically adding Entity Composer templates')
})

test('get first article with tag', () => {
  const articles = getArticles(0, 1, (a, b) => a - b, ['XC9'])
  expect(articles.length).toBe(1)

  const { slug, tags } = articles[0].data
  expect(slug).toBe('entity_composer_templates')
  expect(tags).toStrictEqual(['XC9'])
})

test('get no article with tag', () => {
  const articles = getArticles(0, 1, (a, b) => a - b, ['paard'])
  expect(articles.length).toBe(0)
})

test('get all tags', () => {
  const tags = getAllTags()
  expect(tags.length).toBe(7)
  expect(tags).toStrictEqual(['Azure', 'Docker', 'Identity', 'JSS', 'Sitecore', 'Sitecore9', 'XC9'])
})
