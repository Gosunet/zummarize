import {
  parseDevToArticle,
  parseMediumArticle,
  parseUnknownArticle,
} from './parseArticle'
import { readFileSync } from 'fs'
import { join } from 'path'
import env from 'dotenv'

env.config()

describe('parseArticle', () => {
  describe('dev.to', () => {
    it('should parse', () => {
      const rawHtml = readFileSync(
        join(process.cwd(), '__tests__/fixtures/dev-to.html'),
        { encoding: 'utf8' },
      ).toString()
      const parsedArticle = parseDevToArticle(rawHtml)
      expect(parsedArticle).not.toContain('<div')
      expect(parsedArticle.length).toBeGreaterThan(0)
    })
  })

  describe('medium.com', () => {
    it('should parse', () => {
      const rawHtml = readFileSync(
        join(process.cwd(), '__tests__/fixtures/medium-com.html'),
        { encoding: 'utf8' },
      ).toString()
      const parsedArticle = parseMediumArticle(rawHtml)
      expect(parsedArticle).not.toContain('<div')
      expect(parsedArticle).toBeDefined()
      expect(parsedArticle.length).toBeGreaterThan(0)
    })
  })

  describe('unknown source', () => {
    it('should parse', () => {
      const rawHtml = readFileSync(
        join(process.cwd(), '__tests__/fixtures/info-q.html'),
        { encoding: 'utf8' },
      ).toString()
      const parsedArticle = parseUnknownArticle(rawHtml)
      expect(parsedArticle).not.toContain('<div')
      expect(parsedArticle).toBeDefined()
      expect(parsedArticle.length).toBeGreaterThan(0)
    })

    describe('when the content does not have an article tag', () => {
      it('should parse', () => {
        const rawHtml = readFileSync(
          join(process.cwd(), '__tests__/fixtures/no-articles.html'),
          { encoding: 'utf8' },
        ).toString()
        const parsedArticle = parseUnknownArticle(rawHtml)
        expect(parsedArticle).not.toContain('<div')
        expect(parsedArticle).toBeDefined()
        expect(parsedArticle.length).toBeGreaterThan(0)
      })
    })
  })
})
