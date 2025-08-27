import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    issuer: process.env.JWT_ISSUER || 'app.auth',
    audienceApi: process.env.JWT_AUDIENCE_API || 'app.api',
    audienceRefresh: process.env.JWT_AUDIENCE_REFRESH || 'app.refresh',
}));
