// src/config/email.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
    resendApiKey: process.env.RESEND_API_KEY,
    fromAddress: process.env.MAIL_FROM_ADDRESS || 'onboarding@resend.dev',
    appName: 'BeeMath',
    appUrl: process.env.APP_URL || 'http://localhost:3001',
}));
