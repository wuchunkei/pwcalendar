import { MongoClient, ObjectId } from 'mongodb';
import { config } from '../config';
import { Event, EventLog } from '../types/project';

const client = new MongoClient(config.mongodb.uri);
const db = client.db(config.mongodb.dbName);
const events = db.collection<Event>('events');

export const eventService = {
    // 創建新事件
    async createEvent(data: {
        projectId: string;
        title: string;
        description?: string;
        participants: string[];
        startTime: Date;
        endTime: Date;
        isAllDay: boolean;
        creatorEmail: string;
    }): Promise<Event> {
        const event: Omit<Event, '_id'> = {
            projectId: new ObjectId(data.projectId),
            title: data.title,
            description: data.description,
            participants: data.participants,
            startTime: data.startTime,
            endTime: data.endTime,
            isAllDay: data.isAllDay,
            logs: [{
                timestamp: new Date(),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                user: data.creatorEmail,
                action: 'create',
                details: '創建了此事件'
            }],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await events.insertOne(event as any);
        return { ...event, _id: result.insertedId };
    },

    // 獲取事件詳情
    async getEvent(eventId: string): Promise<Event | null> {
        return await events.findOne({ _id: new ObjectId(eventId) });
    },

    // 更新事件
    async updateEvent(eventId: string, updates: Partial<Event>, userEmail: string): Promise<boolean> {
        const event = await this.getEvent(eventId);
        if (!event) return false;

        // 創建更新日誌
        const log: EventLog = {
            timestamp: new Date(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            user: userEmail,
            action: 'update',
            details: this.generateUpdateDetails(event, updates)
        };

        const result = await events.updateOne(
            { _id: new ObjectId(eventId) },
            { 
                $set: { ...updates, updatedAt: new Date() },
                $push: { logs: log }
            }
        );

        return result.modifiedCount > 0;
    },

    // 刪除事件
    async deleteEvent(eventId: string, userEmail: string): Promise<boolean> {
        const event = await this.getEvent(eventId);
        if (!event) return false;

        // 記錄刪除操作
        const log: EventLog = {
            timestamp: new Date(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            user: userEmail,
            action: 'delete',
            details: '刪除了此事件'
        };

        // 將事件標記為已刪除（軟刪除）
        const result = await events.updateOne(
            { _id: new ObjectId(eventId) },
            { 
                $set: { deleted: true, updatedAt: new Date() },
                $push: { logs: log }
            }
        );

        return result.modifiedCount > 0;
    },

    // 獲取項目的所有事件
    async getProjectEvents(projectId: string): Promise<Event[]> {
        return await events.find({
            projectId: new ObjectId(projectId),
            deleted: { $ne: true }
        }).sort({ startTime: 1 }).toArray();
    },

    // 生成更新詳情
    generateUpdateDetails(oldEvent: Event, updates: Partial<Event>): string {
        const changes: string[] = [];

        if (updates.title && updates.title !== oldEvent.title) {
            changes.push(`將標題從「${oldEvent.title}」更改為「${updates.title}」`);
        }

        if (updates.description !== undefined && updates.description !== oldEvent.description) {
            if (!oldEvent.description && updates.description) {
                changes.push('添加了描述');
            } else if (oldEvent.description && !updates.description) {
                changes.push('移除了描述');
            } else {
                changes.push('更新了描述');
            }
        }

        if (updates.startTime && updates.startTime !== oldEvent.startTime) {
            changes.push(`更改了開始時間`);
        }

        if (updates.endTime && updates.endTime !== oldEvent.endTime) {
            changes.push(`更改了結束時間`);
        }

        if (updates.isAllDay !== undefined && updates.isAllDay !== oldEvent.isAllDay) {
            changes.push(updates.isAllDay ? '設置為全天事件' : '取消了全天事件');
        }

        if (updates.participants) {
            const added = updates.participants.filter(p => !oldEvent.participants.includes(p));
            const removed = oldEvent.participants.filter(p => !updates.participants.includes(p));

            if (added.length > 0) {
                changes.push(`添加了參與者：${added.join('、')}`);
            }
            if (removed.length > 0) {
                changes.push(`移除了參與者：${removed.join('、')}`);
            }
        }

        return changes.join('；');
    },

    // 生成 ICS 格式的日曆訂閱內容
    async generateICS(projectId: string): Promise<string> {
        const events = await this.getProjectEvents(projectId);
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//PW Calendar//NONSGML v1.0//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        for (const event of events) {
            const startDate = this.formatICSDate(event.startTime, event.isAllDay);
            const endDate = this.formatICSDate(event.endTime, event.isAllDay);

            icsContent = icsContent.concat([
                'BEGIN:VEVENT',
                `UID:${event._id.toString()}`,
                `DTSTAMP:${this.formatICSDate(new Date())}`,
                `DTSTART${event.isAllDay ? ';VALUE=DATE' : ''}:${startDate}`,
                `DTEND${event.isAllDay ? ';VALUE=DATE' : ''}:${endDate}`,
                `SUMMARY:${event.title}`,
                event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
                `ATTENDEE:${event.participants.join(',')}`,
                'END:VEVENT'
            ].filter(Boolean));
        }

        icsContent.push('END:VCALENDAR');
        return icsContent.join('\r\n');
    },

    // 格式化日期為 ICS 格式
    formatICSDate(date: Date, isAllDay: boolean = false): string {
        if (isAllDay) {
            return date.toISOString().replace(/[-:]/g, '').split('T')[0];
        }
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }
};