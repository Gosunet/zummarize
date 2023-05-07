import { JSDOM } from 'jsdom'

export function parseDevToArticle(htmlAsString: string) {
  return parseArticle(htmlAsString, 'article > div > div > p')
}

export function parseMediumArticle(htmlAsString: string) {
  return parseArticle(htmlAsString, 'section > * > div > p')
}

export function parseUnknownArticle(htmlAsString: string) {
	const containsArticleTag = /<article/.exec(htmlAsString)
	if(containsArticleTag) {
    return parseArticle(htmlAsString, 'article p')
	} else {
    return parseArticle(htmlAsString, 'p')
  }
}

export function parseArticle(htmlAsString: string, querySelector: string) {
  const dom = new JSDOM(htmlAsString)
  // dom.window.document.querySelector("p")?.textContent; // 'Hello world'
  // const document = new DOMParser().parseFromString(htmlAsString, "text/html")
  const document = dom.window.document
  return Array.from(document.querySelectorAll(querySelector))
    .map((b) => b.innerHTML.replace(/<[^>]*>/g, ''))
    .join()
}