import { registerAs } from '@nestjs/config';

export const OpenAIConfig = registerAs('openai', () => ({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
}));

export default OpenAIConfig;
