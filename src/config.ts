import dotenv from 'dotenv';

// 加載環境變量
dotenv.config();

interface Config {
    mongodb: {
        uri: string;
        dbName: string;
    };
    smtp: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
            user: string;
            pass: string;
        };
    };
    emailDomain: string;
    baseUrl?: string;
}

// 從環境變量獲取配置，如果不存在則使用默認值
export const config: Config = {
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb+srv://wuchunkei:FoGGy20021109!@picturemap.ef0ym3m.mongodb.net/?retryWrites=true&w=majority&appName=PictureMap',
        dbName: process.env.MONGODB_DB_NAME || 'pwcalendar'
    },
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || 'wuchunkei.john@gmail.com', // Gmail郵箱地址
            pass: process.env.SMTP_PASS || 'xiwatuunftjiocig' // Gmail應用密碼
        }
    },
    emailDomain: process.env.EMAIL_DOMAIN || '@pictureworks.com',
    baseUrl: process.env.BASE_URL || 'https://localhost:3000'
};

// 在開發環境中輸出配置信息（不包含敏感信息）
if (process.env.NODE_ENV !== 'production') {
    console.log('MongoDB配置:', { dbName: config.mongodb.dbName });
    console.log('SMTP配置:', { host: config.smtp.host, port: config.smtp.port, secure: config.smtp.secure });
    console.log('應用配置:', { emailDomain: config.emailDomain, baseUrl: config.baseUrl });
}