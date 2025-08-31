import { ObjectId } from 'mongodb';

export interface Project {
    _id: ObjectId;
    name: string;
    description?: string;
    creator: string; // 創建者的郵箱
    editors: string[]; // 編輯者的郵箱列表
    createdAt: Date;
    updatedAt: Date;
}

export interface Event {
    _id: ObjectId;
    projectId: ObjectId;
    title: string;
    description?: string;
    participants: string[]; // 參與者的郵箱列表
    startTime: Date;
    endTime: Date;
    isAllDay: boolean;
    logs: EventLog[];
    createdAt: Date;
    updatedAt: Date;
}

export interface EventLog {
    timestamp: Date;
    timezone: string;
    user: string; // 操作者的郵箱
    action: 'create' | 'update' | 'delete';
    details: string;
}

export interface ProjectInvitation {
    _id: ObjectId;
    projectId: ObjectId;
    inviteeEmail: string;
    role: 'editor';
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
    expiresAt: Date;
}