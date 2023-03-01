import { Request, Response } from 'express'
import { EnvelopedEvent, ReactionAddedEvent } from '@slack/bolt'
import { Configuration, OpenAIApi } from 'openai'

// Require the Node Slack SDK package (github.com/slackapi/node-slack-sdk)
import {
  WebClient,
  LogLevel,
  ConversationsHistoryResponse,
} from '@slack/web-api'

type GetElementFromArray<T> = T extends Array<infer I> ? I : never
type Challenge = string

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
  req: Request<never, Challenge, EnvelopedEvent<ReactionAddedEvent>>,
  res: Response,
) {
  console.log(req.body)

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

  // Fetch message using a channel ID and message TS
  const message = await fetchMessage(
    req.body.event.item.channel,
    req.body.event.event_ts,
  )

  const openAiResult = await openai.createCompletion({
    model: 'code-davinci-002',
    prompt:
      'Peux tu me donner un tweet valide en français limité à 100 caractères espaces inclus résumant cet article : ' +
      message,
    temperature: 0,
    max_tokens: 60,
    top_p: 1.0,
    frequency_penalty: 0.5,
    presence_penalty: 0.0,
    stop: ['You:'],
  })

  console.log(openAiResult)

  // Send an HTTP response
  res.send(req.body.challenge)
}
