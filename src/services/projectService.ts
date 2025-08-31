import { MongoClient, ObjectId } from 'mongodb';
import { config } from '../config';
import { Project, ProjectInvitation } from '../types/project';
import nodemailer from 'nodemailer';

const client = new MongoClient(config.mongodb.uri);
const db = client.db(config.mongodb.dbName);
const projects = db.collection<Project>('projects');
const invitations = db.collection<ProjectInvitation>('project_invitations');

const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass
    }
});

export const projectService = {
    // 創建新項目
    async createProject(name: string, description: string | undefined, creatorEmail: string): Promise<Project> {
        const project: Omit<Project, '_id'> = {
            name,
            description,
            creator: creatorEmail,
            editors: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await projects.insertOne(project as any);
        return { ...project, _id: result.insertedId };
    },

    // 獲取項目詳情
    async getProject(projectId: string): Promise<Project | null> {
        const project = await projects.findOne({ _id: new ObjectId(projectId) });
        return project;
    },

    // 更新項目
    async updateProject(projectId: string, updates: Partial<Project>): Promise<boolean> {
        const result = await projects.updateOne(
            { _id: new ObjectId(projectId) },
            { $set: { ...updates, updatedAt: new Date() } }
        );
        return result.modifiedCount > 0;
    },

    // 刪除項目
    async deleteProject(projectId: string): Promise<boolean> {
        const result = await projects.deleteOne({ _id: new ObjectId(projectId) });
        return result.deletedCount > 0;
    },

    // 獲取用戶的所有項目（作為創建者或編輯者）
    async getUserProjects(userEmail: string): Promise<Project[]> {
        return await projects.find({
            $or: [
                { creator: userEmail },
                { editors: userEmail }
            ]
        }).toArray();
    },

    // 發送項目邀請
    async inviteEditor(projectId: string, inviteeEmail: string): Promise<boolean> {
        const project = await this.getProject(projectId);
        if (!project) return false;

        // 檢查是否已經是編輯者
        if (project.editors.includes(inviteeEmail)) {
            return false;
        }

        // 創建邀請記錄
        const invitation: Omit<ProjectInvitation, '_id'> = {
            projectId: new ObjectId(projectId),
            inviteeEmail,
            role: 'editor',
            status: 'pending',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天後過期
        };

        // 插入邀請並獲取結果
        const result = await invitations.insertOne(invitation as any);
        const invitationId = result.insertedId;

        // 發送邀請郵件
        const confirmUrl = `${config.baseUrl || 'https://localhost:3000'}/api/projects/invitations/${invitationId}/accept`;
        const rejectUrl = `${config.baseUrl || 'https://localhost:3000'}/api/projects/invitations/${invitationId}/reject`;
        
        const mailOptions = {
            from: config.smtp.auth.user,
            to: inviteeEmail,
            subject: `邀請加入項目：${project.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
                    <h2 style="color: #333;">項目邀請</h2>
                    <p>您好，</p>
                    <p>您被邀請加入項目「<strong>${project.name}</strong>」作為編輯者。</p>
                    <p>項目創建者：${project.creator}</p>
                    <div style="margin: 30px 0;">
                        <a href="${confirmUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px;">接受邀請</a>
                        <a href="${rejectUrl}" style="display: inline-block; background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">拒絕邀請</a>
                    </div>
                    <p style="color: #777; font-size: 12px;">此邀請將在7天後過期。如果按鈕無法點擊，請複製以下鏈接到瀏覽器地址欄：</p>
                    <p style="color: #777; font-size: 12px;">接受邀請：${confirmUrl}</p>
                    <p style="color: #777; font-size: 12px;">拒絕邀請：${rejectUrl}</p>
                </div>
            `
        };

        try {
            await transporter.sendMail(mailOptions);
            return true;
        } catch (error) {
            console.error('發送邀請郵件失敗:', error);
            return false;
        }
    },

    // 處理邀請（接受或拒絕）
    async handleInvitation(invitationId: string, accept: boolean): Promise<boolean> {
        const invitation = await invitations.findOne({ _id: new ObjectId(invitationId) }) as ProjectInvitation;
        if (!invitation || invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
            return false;
        }

        if (accept) {
            // 將用戶添加到項目的編輯者列表
            await projects.updateOne(
                { _id: invitation.projectId },
                { $addToSet: { editors: invitation.inviteeEmail } }
            );
        }

        // 更新邀請狀態
        await invitations.updateOne(
            { _id: new ObjectId(invitationId) },
            { $set: { status: accept ? 'accepted' : 'rejected' } }
        );

        return true;
    },

    // 獲取用戶的待處理邀請
    async getPendingInvitations(userEmail: string): Promise<ProjectInvitation[]> {
        return await invitations.find({
            inviteeEmail: userEmail,
            status: 'pending',
            expiresAt: { $gt: new Date() }
        }).toArray();
    }
};