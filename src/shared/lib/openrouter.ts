import { OpenRouter } from '@openrouter/sdk'

let openRouterInstance: OpenRouter | null = null

/**
 * Gets or creates OpenRouter client instance.
 * Uses OPENROUTER_API_KEY from environment variables.
 */
export function getOpenRouterClient(): OpenRouter {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable is required')
  }

  if (!openRouterInstance) {
    openRouterInstance = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    })
  }

  return openRouterInstance
}
