import { registerAs } from '@nestjs/config';

export const MistralConfig = registerAs('mistral', () => ({
  apiKey: process.env.MISTRAL_API_KEY,
  model: process.env.MISTRAL_MODEL || 'mistral-ocr-latest',
}));

export default MistralConfig;
