import { Request, Response } from 'express'
import { EnvelopedEvent, ReactionAddedEvent } from '@slack/bolt'
import { Configuration, OpenAIApi } from 'openai'
import { parseDevToArticle, parseMediumArticle, parseUnknownArticle } from "./parseArticle";
// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
import { WebClient, LogLevel } from '@slack/web-api'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SLACK_TOKEN: string
      OPENAI_API_KEY: string
    }
  }
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

export async function zummarizefunction(
  req: Request<never, void, EnvelopedEvent<ReactionAddedEvent>>,
  res: Response,
) {
  console.log(JSON.stringify(req.body))
  res.send(req.body.challenge)

  if (req.body.event.reaction !== 'robot_face') {
    // return
    throw new Error(`Not good event : ${req.body.event.reaction}`)
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
      console.error(error)
      throw error
    }
  }

  if (req.body.event.item.type !== 'message') {
    throw new Error('Not a Message')
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
  console.log('Article get from content ')

  const openAiResult = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      {"role": "system", "content": "Tu es un développeur confirmé."},
      {"role": "user", "content": ` Peux tu me donner un tweet valide en français limité à 100 caractères espaces inclus résumant cet article :\n"${article}"`},
    ],
    temperature: 0.7
    // stop: ['You:'],
  })

  const openApiMessage = openAiResult.data.choices.pop()
  console.log('OPEN AI RESPONSE : ' + JSON.stringify(openApiMessage?.message?.content))

  await client.chat.postMessage({
    channel: req.body.event.item.channel,
    thread_ts: req.body.event.item.ts,
    text: openApiMessage?.message?.content,
  })
  // Send an HTTP response
}
