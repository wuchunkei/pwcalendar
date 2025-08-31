import { MongoClient } from 'mongodb';
import { config } from '../config';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import type { ApiResponse } from '../types/user';

const client = new MongoClient(config.mongodb.uri);
const db = client.db(config.mongodb.dbName);
const users = db.collection('users');

const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass
    }
});

const generateTempPassword = () => {
    return crypto.randomBytes(4).toString('hex');
};

const hashPassword = (password: string) => {
    return crypto.createHash('md5').update(password).digest('hex');
};

export const userService = {
    async register(email: string, name: string): Promise<ApiResponse> {
        try {
            // 檢查郵箱是否已註冊
            const existingUser = await users.findOne({ email });
            if (existingUser) {
                return { success: false, message: '該郵箱已被註冊' };
            }

            // 生成臨時密碼
            const tempPassword = generateTempPassword();
            const hashedPassword = hashPassword(tempPassword);

            // 創建用戶
            await users.insertOne({
                email,
                name,
                password: hashedPassword,
                isFirstLogin: true,
                createdAt: new Date()
            });

            // 發送臨時密碼郵件
            await transporter.sendMail({
                from: config.smtp.auth.user,
                to: email,
                subject: '您的臨時密碼',
                text: `您好 ${name}，

您的臨時密碼是: ${tempPassword}

首次登錄後請立即修改此密碼。

此致
Pictureworks團隊`
            });

            return { success: true, message: '註冊成功，請查看郵箱獲取密碼' };
        } catch (error) {
            console.error('註冊失敗:', error);
            return { success: false, message: '註冊失敗，請稍後重試' };
        }
    },

    async login(email: string, password: string): Promise<ApiResponse<{ isFirstLogin: boolean }>> {
        try {
            const user = await users.findOne({ email });
            if (!user) {
                return { success: false, message: '用戶不存在' };
            }

            const hashedPassword = hashPassword(password);
            if (user.password !== hashedPassword) {
                return { success: false, message: '密碼錯誤' };
            }

            return { 
                success: true,
                data: { isFirstLogin: user.isFirstLogin }
            };
        } catch (error) {
            console.error('登錄失敗:', error);
            return { success: false, message: '登錄失敗，請稍後重試' };
        }
    },

    async changePassword(email: string, oldPassword: string, newPassword: string): Promise<ApiResponse> {
        try {
            const user = await users.findOne({ email });
            if (!user) {
                return { success: false, message: '用戶不存在' };
            }

            const hashedOldPassword = hashPassword(oldPassword);
            if (user.password !== hashedOldPassword) {
                return { success: false, message: '原密碼錯誤' };
            }

            const hashedNewPassword = hashPassword(newPassword);
            await users.updateOne(
                { email },
                { 
                    $set: { 
                        password: hashedNewPassword,
                        isFirstLogin: false,
                        updatedAt: new Date()
                    }
                }
            );

            return { success: true, message: '密碼修改成功' };
        } catch (error) {
            console.error('修改密碼失敗:', error);
            return { success: false, message: '修改密碼失敗，請稍後重試' };
        }
    }
};