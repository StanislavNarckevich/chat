import createMiddleware from 'next-intl/middleware';
import {routing} from './routing';

export default createMiddleware(routing);

export const config = {
    // Применять middleware ко всем путям, кроме API, _next, и статики
    matcher: ['/', '/(ru|en)/:path*', '/api/:path*'],
};