/**
 * GitHub Webhook處理腳本
 * 用於自動部署PWCalendar應用
 * 
 * 使用方法:
 * 1. 安裝依賴: npm install express crypto child_process
 * 2. 配置GitHub webhook: 設置webhook URL為 http://您的服務器IP:9000/webhook
 * 3. 設置webhook密鑰，並在下方SECRET變量中填入相同的值
 * 4. 運行腳本: node deploy-webhook.js
 * 5. 建議使用PM2保持腳本運行: pm2 start deploy-webhook.js --name="github-webhook"
 */

const express = require('express');
const crypto = require('crypto');
const { exec } = require('child_process');
const app = express();

// 配置
const PORT = process.env.PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret'; // 替換為您的GitHub webhook密鑰
const REPO_PATH = process.env.REPO_PATH || '/home/ubuntu/pwcalendar'; // 替換為您的倉庫路徑

app.use(express.json());

// 驗證GitHub簽名
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature) return false;
  
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// 執行部署腳本
function deploy() {
  console.log('開始部署...');
  
  const commands = [
    `cd ${REPO_PATH}`,
    'git pull',
    'npm ci --legacy-peer-deps',
    'npm run build',
    'npx tsc --project tsconfig.server.json',
    'sudo systemctl restart pwcalendar'
  ];
  
  exec(commands.join(' && '), (error, stdout, stderr) => {
    if (error) {
      console.error(`部署錯誤: ${error}`);
      return;
    }
    
    console.log(`部署輸出: ${stdout}`);
    if (stderr) {
      console.error(`部署錯誤輸出: ${stderr}`);
    }
    
    console.log('部署完成!');
  });
}

// Webhook端點
app.post('/webhook', (req, res) => {
  // 驗證請求來自GitHub
  if (!verifySignature(req)) {
    console.error('無效的簽名');
    return res.status(401).send('無效的簽名');
  }
  
  // 只處理push事件
  const event = req.headers['x-github-event'];
  if (event !== 'push') {
    return res.status(200).send(`已接收${event}事件，但不需要部署`);
  }
  
  // 檢查分支（只在主分支上部署）
  const branch = req.body.ref;
  if (branch !== 'refs/heads/main' && branch !== 'refs/heads/master') {
    return res.status(200).send(`推送到${branch}分支，但只在main或master分支上部署`);
  }
  
  // 開始部署
  deploy();
  
  return res.status(200).send('部署進程已啟動');
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`Webhook服務器運行在端口 ${PORT}`);
});