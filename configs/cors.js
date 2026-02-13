import dotenv from 'dotenv';
dotenv.config();

const corsConfig = {
    origin: process.env.CORS_ORIGIN,
    methods: ['*'],
    allowedHeaders: ['*'],
    credentials: true,
};

export default corsConfig;