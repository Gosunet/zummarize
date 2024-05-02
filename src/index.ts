import { Request, Response } from 'express'
import { EnvelopedEvent, ReactionAddedEvent } from '@slack/bolt'
// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
import { WebClient, LogLevel } from '@slack/web-api'
import Groq from 'groq-sdk'
import { parseMediumArticle, parseDevToArticle, parseUnknownArticle } from './parseArticle'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SLACK_TOKEN: string
      GROQ_API_KEY: string
    }
  }
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function computearticle(
  req: Request<never, void, EnvelopedEvent<ReactionAddedEvent>>,
  res: Response,
) {
  if (req.body.event.reaction !== 'robot_face') {
    return
  }

  const token = process.env.SLACK_TOKEN

  // WebClient instantiates a client that can call API methods
  // When using Bolt, you can use either `app.client` or the `client` passed to listeners.
  const client = new WebClient(token, {
    // LogLevel can be imported and used to make debugging simpler
    logLevel: LogLevel.DEBUG,
  })

  // Store message

  // Fetch conversation history using the ID and a TS from the last example
  async function fetchMessage(id: string, ts: string) {
    try {
      // Call the conversations.history method using the built-in WebClient
      const result = await client.conversations.history({
        // The token you used to initialize your app
        channel: id,
        // In a more realistic app, you may store ts data in a db
        latest: ts,
        // Limit results
        inclusive: true,
        limit: 1,
      })

      if (!result.messages) throw new Error('fail to retrive message')

      // There should only be one result (stored in the zeroth index)
      return result.messages[0].text
      // Print message text
    } catch (error) {
      console.error(error, req.body.event.event_ts)
      throw error
    }
  }

  if (req.body.event.item.type !== 'message') {
    throw new Error(`${req.body.event.event_ts} Not a Message`)
  }

  // Fetch message using a channel ID and message TS
  const message = await fetchMessage(
    req.body.event.item.channel,
    req.body.event.item.ts,
  )
  console.log('message récupéré de slack')

  const urls = message?.match(
    /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/,
  )
  if (!urls?.length) {
    throw new Error('No URL founded')
  }
  const url = urls[0]
  console.log('url match:', url)

  const content = await fetch(url).then((r) => r.text())
  console.log('Content get from URL ')
  let article: string
  if (url.match('medium')) {
    article = parseMediumArticle(content)
  } else if (url.match('dev.to')) {
    article = parseDevToArticle(content)
  } else {
    article = parseUnknownArticle(content)
  }
  console.log('Article get from content ', req.body.event.event_ts)

  const response = await groq.chat.completions.create({
    "messages": [
      {
        "role": "system",
        "content": "Tu es un développeur confirmé. Et tu écris des tweets résumant ta veille technologique. Tu utilises des emojis."
      },
      {
        "role": "user",
        "content": `Peux tu me donner un tweet valide en français limité à 100 caractères espaces inclus résumant cet article : \n"${article}"`
          .replace(/\s+/gm, ' ')
          .split(' ')
          .slice(0, 2323)
          .join(' '),
      }
    ],
    "model": "llama3-8b-8192",
    "temperature": 0.68,
    "max_tokens": 2320,
    "top_p": 1,
    "stream": false,
    "stop": null
  });

  const groqResponse = response.choices.pop()
  console.log(
    req.body.event.event_ts,
    'GROQ RESPONSE : ' + JSON.stringify(groqResponse?.message?.content),
  )

  await client.chat.postMessage({
    channel: req.body.event.item.channel,
    thread_ts: req.body.event.item.ts,
    text: groqResponse?.message?.content,
  })
}

export async function zummarizefunction(
  req: Request<never, void, EnvelopedEvent<ReactionAddedEvent>>,
  res: Response,
) {
  console.log(JSON.stringify(req.body))
  const p = fetch(`https://europe-west1-zummarize-brest.cloudfunctions.net/computearticle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  })
  res.send(req.body.challenge)
  await p
}
