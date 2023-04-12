import {
  parseDevToArticle,
  parseMediumArticle,
  parseUnknownArticle,
} from './parseArticle'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Configuration, OpenAIApi } from 'openai'
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
      it('should throw', () => {
        const rawHtml = readFileSync(
          join(process.cwd(), '__tests__/fixtures/no-articles.html'),
          { encoding: 'utf8' },
        ).toString()
        expect(() => parseUnknownArticle(rawHtml)).toThrowError()
      })
    })
  })
})

describe('openAi call', () => {
  it('should work', async () => {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const openai = new OpenAIApi(configuration)
    const rawHtml = readFileSync(
      join(process.cwd(), '__tests__/fixtures/info-q.html'),
      { encoding: 'utf8' },
    ).toString()
    const parsedArticle = parseUnknownArticle(rawHtml)


    await expect(
      openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Tu es un développeur confirmé.' },
          {
            role: 'user',
            content: `Peux tu me donner un tweet valide en français limité à 100 caractères espaces inclus résumant cet article :\n"${parsedArticle}"`
							.replace(/\s+/gm, ' ')
              .split(' ')
              .slice(0, 2323)
              .join(' '),
          },
        ],
        temperature: 0.7,
      }),
    ).resolves.toBeDefined()
  })
})
