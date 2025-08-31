# 部署指南 - PWCalendar 應用程序

本文檔提供將 PWCalendar 應用程序部署到 Ubuntu ARM 服務器的詳細步驟。

## 前提條件

- Ubuntu ARM 服務器（已安裝 Node.js 16+ 和 npm）
- SSH 訪問權限（用戶名、密碼或密鑰）
- 服務器上已安裝 unzip 工具（如果沒有，可以運行 `sudo apt-get install unzip`）

## 部署步驟

### 1. 在本地構建應用程序

```bash
# 構建前端應用程序
npm run build

# 構建服務器端代碼
npx tsc --project tsconfig.server.json
```

### 2. 使用部署腳本

#### Windows 環境

```bash
# 使用密碼認證
deploy.bat <用戶名> <服務器IP>

# 使用密鑰認證
deploy.bat <用戶名> <服務器IP> <密鑰路徑>
```

#### Linux/Mac 環境

```bash
# 先給腳本添加執行權限
chmod +x deploy.sh

# 使用密碼認證
./deploy.sh <用戶名> <服務器IP>

# 使用密鑰認證
./deploy.sh <用戶名> <服務器IP> <密鑰路徑>
```

### 3. 在服務器上啟動應用程序

```bash
cd ~/pwcalendar
./start.sh
```

## 手動部署步驟

如果您不想使用部署腳本，可以按照以下步驟手動部署：

1. 構建應用程序
   ```bash
   npm run build
   npx tsc --project tsconfig.server.json
   ```

2. 創建部署包
   ```bash
   mkdir -p deploy
   cp -r dist deploy/
   cp -r ssl deploy/
   cp package.json deploy/
   cp package-lock.json deploy/
   ```

3. 創建啟動腳本
   ```bash
   echo '#!/bin/bash
   npm install --production
   node server.js' > deploy/start.sh
   chmod +x deploy/start.sh
   ```

4. 壓縮部署包
   ```bash
   tar -czf pwcalendar-deploy.tar.gz -C deploy .
   # 或在 Windows 上使用 zip
   # zip -r pwcalendar-deploy.zip deploy/*
   ```

5. 上傳到服務器
   ```bash
   scp pwcalendar-deploy.tar.gz <用戶名>@<服務器IP>:~/
   # 或使用密鑰
   # scp -i <密鑰路徑> pwcalendar-deploy.tar.gz <用戶名>@<服務器IP>:~/
   ```

6. 在服務器上解壓並啟動
   ```bash
   ssh <用戶名>@<服務器IP>
   mkdir -p ~/pwcalendar
   tar -xzf ~/pwcalendar-deploy.tar.gz -C ~/pwcalendar
   cd ~/pwcalendar
   chmod +x start.sh
   ./start.sh
   ```

## 配置 Nginx（可選）

如果您想使用 Nginx 作為反向代理，可以按照以下步驟配置：

1. 安裝 Nginx
   ```bash
   sudo apt-get update
   sudo apt-get install nginx
   ```

2. 創建 Nginx 配置文件
   ```bash
   sudo nano /etc/nginx/sites-available/pwcalendar
   ```

3. 添加以下配置
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass https://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. 啟用配置並重啟 Nginx
   ```bash
   sudo ln -s /etc/nginx/sites-available/pwcalendar /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 設置為系統服務（推薦）

部署包中包含了 `pwcalendar.service` 文件，您可以使用它將應用程序設置為系統服務，確保應用程序在服務器重啟後自動啟動：

1. 編輯服務文件，將 `<用戶名>` 替換為您的實際用戶名
   ```bash
   cd ~/pwcalendar
   sudo nano pwcalendar.service
   # 將 <用戶名> 替換為您的實際用戶名
   ```

2. 將服務文件複製到系統目錄
   ```bash
   sudo cp pwcalendar.service /etc/systemd/system/
   ```

3. 啟用並啟動服務
   ```bash
   sudo systemctl enable pwcalendar.service
   sudo systemctl start pwcalendar.service
   ```

4. 檢查服務狀態
   ```bash
   sudo systemctl status pwcalendar.service
   ```

## 使用 PM2 管理應用程序（可選）

如果您不想使用系統服務，也可以使用 PM2 來管理應用程序：

1. 安裝 PM2
   ```bash
   npm install -g pm2
   ```

2. 使用 PM2 啟動應用程序
   ```bash
   cd ~/pwcalendar
   pm2 start server.js --name "pwcalendar"
   ```

3. 設置開機自啟動
   ```bash
   pm2 startup
   pm2 save
   ```

## 故障排除

### 1. 無法連接到服務器

- 確認服務器 IP 地址是否正確
- 確認 SSH 端口是否開放（默認為 22）
- 檢查防火牆設置

### 2. 應用程序無法啟動

- 檢查 Node.js 版本（建議使用 16+）
- 檢查是否安裝了所有依賴 `npm install --production`
- 檢查日誌文件 `cat ~/pwcalendar/npm-debug.log`

### 3. 無法訪問應用程序

- 確認應用程序是否正在運行 `ps aux | grep node`
- 檢查服務器防火牆是否允許 3000 端口的訪問
- 如果使用 Nginx，檢查 Nginx 配置和日誌

## 更新應用程序

要更新已部署的應用程序，只需重新運行部署腳本即可。腳本會覆蓋現有文件並重新啟動應用程序。