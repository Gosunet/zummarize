import Groq from 'groq-sdk'

describe('groq call', () => {
  it('should work', async () => {

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    
    await expect(
      groq.chat.completions.create({
        "messages": [
          {
            "role": "system",
            "content": "Tu es un développeur confirmé. Et tu écris des tweets résumant ta veille technologique. Tu utilises des emojis."
          },
          {
            "role": "user",
            "content": `Peux tu me donner un tweet valide en français limité à 100 caractères espaces inclus résumant cet article : https://unfix.com/blog/whats-next-after-agile`
          }
        ],
        "model": "llama3-8b-8192",
        "temperature": 0.68,
        "max_tokens": 2320,
        "top_p": 1,
        "stream": false,
        "stop": null
      })
    ).resolves.toBeDefined()
  })
})
