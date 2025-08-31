import express from 'express';
import cors from 'cors';
import { userService } from './services/userService';
import { projectService } from './services/projectService';
import { eventService } from './services/eventService';

const app = express();

app.use(cors());
app.use(express.json());

// 用戶認證相關路由
app.post('/api/register', async (req, res) => {
    const { email, name } = req.body;
    try {
        const result = await userService.register(email, name);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: '註冊失敗' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await userService.login(email, password);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: '登錄失敗' });
    }
});

app.post('/api/change-password', async (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    try {
        const result = await userService.changePassword(email, oldPassword, newPassword);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: '密碼修改失敗' });
    }
});

// 項目管理相關路由
app.post('/api/projects', async (req, res) => {
    const { name, description, creatorEmail } = req.body;
    try {
        const project = await projectService.createProject(name, description, creatorEmail);
        res.json({ success: true, data: project });
    } catch (error) {
        res.status(500).json({ success: false, message: '創建項目失敗' });
    }
});

app.get('/api/projects/:id', async (req, res) => {
    try {
        const project = await projectService.getProject(req.params.id);
        if (project) {
            res.json({ success: true, data: project });
        } else {
            res.status(404).json({ success: false, message: '項目不存在' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '獲取項目失敗' });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    try {
        const success = await projectService.updateProject(req.params.id, req.body);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: '項目不存在' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '更新項目失敗' });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        const success = await projectService.deleteProject(req.params.id);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: '項目不存在' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '刪除項目失敗' });
    }
});

app.get('/api/user/projects', async (req, res) => {
    const userEmail = req.query.email as string;
    try {
        const projects = await projectService.getUserProjects(userEmail);
        res.json({ success: true, data: projects });
    } catch (error) {
        res.status(500).json({ success: false, message: '獲取項目列表失敗' });
    }
});

app.post('/api/projects/:id/invite', async (req, res) => {
    const { inviteeEmail } = req.body;
    try {
        const success = await projectService.inviteEditor(req.params.id, inviteeEmail);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: '發送邀請失敗' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '發送邀請失敗' });
    }
});

app.post('/api/invitations/:id/handle', async (req, res) => {
    const { accept } = req.body;
    try {
        const success = await projectService.handleInvitation(req.params.id, accept);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(400).json({ success: false, message: '處理邀請失敗' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '處理邀請失敗' });
    }
});

// 通過郵件鏈接接受邀請
app.get('/api/projects/invitations/:id/accept', async (req, res) => {
    try {
        const success = await projectService.handleInvitation(req.params.id, true);
        if (success) {
            res.redirect('/#/projects?invitation=accepted');
        } else {
            res.redirect('/#/projects?invitation=failed');
        }
    } catch (error) {
        console.error('接受邀請失敗:', error);
        res.redirect('/#/projects?invitation=error');
    }
});

// 通過郵件鏈接拒絕邀請
app.get('/api/projects/invitations/:id/reject', async (req, res) => {
    try {
        const success = await projectService.handleInvitation(req.params.id, false);
        if (success) {
            res.redirect('/#/projects?invitation=rejected');
        } else {
            res.redirect('/#/projects?invitation=failed');
        }
    } catch (error) {
        console.error('拒絕邀請失敗:', error);
        res.redirect('/#/projects?invitation=error');
    }
});

app.get('/api/user/invitations', async (req, res) => {
    const userEmail = req.query.email as string;
    try {
        const invitations = await projectService.getPendingInvitations(userEmail);
        res.json({ success: true, data: invitations });
    } catch (error) {
        res.status(500).json({ success: false, message: '獲取邀請列表失敗' });
    }
});

// 事件管理相關路由
app.post('/api/events', async (req, res) => {
    try {
        const event = await eventService.createEvent(req.body);
        res.json({ success: true, data: event });
    } catch (error) {
        res.status(500).json({ success: false, message: '創建事件失敗' });
    }
});

app.get('/api/events/:id', async (req, res) => {
    try {
        const event = await eventService.getEvent(req.params.id);
        if (event) {
            res.json({ success: true, data: event });
        } else {
            res.status(404).json({ success: false, message: '事件不存在' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '獲取事件失敗' });
    }
});

app.put('/api/events/:id', async (req, res) => {
    const { userEmail, ...updates } = req.body;
    try {
        const success = await eventService.updateEvent(req.params.id, updates, userEmail);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: '事件不存在' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '更新事件失敗' });
    }
});

app.delete('/api/events/:id', async (req, res) => {
    const { userEmail } = req.body;
    try {
        const success = await eventService.deleteEvent(req.params.id, userEmail);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: '事件不存在' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: '刪除事件失敗' });
    }
});

app.get('/api/projects/:id/events', async (req, res) => {
    try {
        const events = await eventService.getProjectEvents(req.params.id);
        res.json({ success: true, data: events });
    } catch (error) {
        res.status(500).json({ success: false, message: '獲取事件列表失敗' });
    }
});

// ICS 日曆訂閱
app.get('/api/projects/:id/calendar.ics', async (req, res) => {
    try {
        const icsContent = await eventService.generateICS(req.params.id);
        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename=calendar.ics');
        res.send(icsContent);
    } catch (error) {
        res.status(500).json({ success: false, message: '生成日曆失敗' });
    }
});

import https from 'https';
import fs from 'fs';
import path from 'path';

const port = 3000;

// 檢查是否存在SSL證書文件
let httpsServer;
try {
    // 嘗試讀取證書文件
    const keyPath = path.resolve(__dirname, '../ssl/key.pem');
    const certPath = path.resolve(__dirname, '../ssl/cert.pem');
    
    console.log('SSL證書路徑:', keyPath);
    console.log('檢查證書文件是否存在:', fs.existsSync(keyPath), fs.existsSync(certPath));
    
    const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
    };
    
    // 創建HTTPS服務器
    httpsServer = https.createServer(options, app);
    httpsServer.listen(port, () => {
        console.log(`HTTPS服務器運行在 https://localhost:${port}`);
    });
} catch (error) {
    // 如果沒有證書，使用HTTP服務器
    console.warn('SSL證書錯誤:', error);
    console.warn('未找到SSL證書，使用HTTP服務器');
    console.warn('要使用HTTPS，請先生成SSL證書');
    app.listen(port, () => {
        console.log(`HTTP服務器運行在 http://localhost:${port}`);
    });
}