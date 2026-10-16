import pino from 'pino'
import env from './env.js'

const logger = pino({
    level: env.NODE_ENV === 'prod' ? 'info' : 'debug',
});

export default logger;