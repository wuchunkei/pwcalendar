# 通過GitHub部署PWCalendar應用程序

本文檔提供了如何將PWCalendar應用程序推送到GitHub，然後在Ubuntu ARM服務器上通過克隆GitHub倉庫進行部署的詳細步驟。本指南包括手動部署和自動部署（使用GitHub Actions和Webhook）兩種方式。

## 1. 將代碼推送到GitHub

### 1.1 創建GitHub倉庫

1. 登錄到您的GitHub賬戶
2. 點擊右上角的"+"按鈕，選擇"New repository"
3. 填寫倉庫名稱，例如"pwcalendar"
4. 選擇是公開還是私有倉庫
5. 點擊"Create repository"

### 1.2 初始化本地Git倉庫並推送

```bash
# 在項目根目錄初始化Git倉庫
git init

# 添加所有文件到暫存區
git add .

# 提交更改
git commit -m "初始提交"

# 添加GitHub倉庫作為遠程源
git remote add origin https://github.com/您的用戶名/pwcalendar.git

# 推送到GitHub
git push -u origin master
```

## 2. 在服務器上部署

### 2.1 準備服務器環境

```bash
# 更新系統包
sudo apt update
sudo apt upgrade -y

# 安裝Node.js和npm
sudo apt install -y nodejs npm

# 安裝Git
sudo apt install -y git

# 安裝構建工具
sudo apt install -y build-essential
```

### 2.2 克隆GitHub倉庫

```bash
# 創建應用目錄
mkdir -p ~/apps
cd ~/apps

# 克隆倉庫
git clone https://github.com/您的用戶名/pwcalendar.git
cd pwcalendar
```

### 2.3 構建應用程序

```bash
# 安裝依賴
npm install

# 構建前端
npm run build

# 構建服務器端代碼
npx tsc --project tsconfig.server.json
```

### 2.4 配置應用程序

1. 編輯配置文件以適應生產環境

```bash
nano src/config.ts
```

2. 修改配置，特別是`baseUrl`，將其設置為您的實際域名或IP地址

```typescript
baseUrl: 'https://您的域名或IP'
```

3. 重新構建服務器代碼

```bash
npx tsc --project tsconfig.server.json
```

### 2.5 設置為系統服務

1. 創建服務文件

```bash
sudo nano /etc/systemd/system/pwcalendar.service
```

2. 添加以下內容（替換`<用戶名>`為您的實際用戶名）

```ini
[Unit]
Description=PWCalendar Application
After=network.target

[Service]
Type=simple
User=<用戶名>
WorkingDirectory=/home/<用戶名>/apps/pwcalendar
ExecStart=/usr/bin/node dist/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

3. 啟用並啟動服務

```bash
sudo systemctl enable pwcalendar.service
sudo systemctl start pwcalendar.service
```

## 3. 設置自動部署

您可以通過以下兩種方式設置自動部署：GitHub Actions（推薦）或自定義Webhook。

### 3.1 使用GitHub Actions自動部署（推薦）

本項目已包含GitHub Actions工作流配置，可以在每次推送到main或master分支時自動部署到您的服務器。

#### 3.1.1 設置GitHub Secrets

1. 在GitHub倉庫頁面，點擊「Settings」→「Secrets and variables」→「Actions」
2. 點擊「New repository secret」添加以下密鑰：
   - `HOST`: 您的服務器IP地址
   - `USERNAME`: 您的服務器用戶名
   - `PORT`: SSH端口（通常為22）
   - `SSH_PRIVATE_KEY`: 您的SSH私鑰內容（使用`cat ~/.ssh/id_rsa`查看）

#### 3.1.2 啟用GitHub Actions

工作流配置文件已位於`.github/workflows/deploy.yml`，當您推送代碼到GitHub時，它將自動運行。您可以在GitHub倉庫的「Actions」選項卡中查看部署狀態。

### 3.2 使用自定義Webhook自動部署

如果您想要在每次推送到GitHub時自動部署，可以設置GitHub Webhook和一個簡單的接收服務器。這需要您的服務器有公網IP或域名。

#### 3.2.1 設置Webhook處理腳本

本項目已包含一個Webhook處理腳本`deploy-webhook.js`，您可以按照以下步驟設置：

1. 將腳本上傳到服務器

```bash
scp deploy-webhook.js <用戶名>@<服務器IP>:~/
```

2. 在服務器上安裝依賴並設置環境變量

```bash
npm install express crypto
export WEBHOOK_SECRET="您的密鑰" # 替換為您的密鑰
export REPO_PATH="/home/<用戶名>/apps/pwcalendar" # 替換為您的倉庫路徑
```

3. 使用PM2啟動Webhook服務

```bash
npm install -g pm2
pm2 start deploy-webhook.js --name="github-webhook"
pm2 save # 保存配置以便開機自啟
```

#### 3.2.2 在GitHub上設置Webhook

1. 在GitHub倉庫頁面，點擊「Settings」→「Webhooks」→「Add webhook」
2. 填寫以下信息：
   - Payload URL: `http://您的服務器IP:9000/webhook`
   - Content type: `application/json`
   - Secret: 輸入與`WEBHOOK_SECRET`相同的密鑰
   - 選擇「Just the push event」
   - 勾選「Active」
3. 點擊「Add webhook」完成設置

### 3.3 手動部署腳本（備選方案）

如果您不想使用自動部署，也可以創建一個簡單的手動部署腳本：

```bash
nano ~/deploy.sh
```

添加以下內容：

```bash
#!/bin/bash

# 進入應用目錄
cd ~/apps/pwcalendar

# 拉取最新代碼
git pull

# 安裝依賴
npm install --legacy-peer-deps

# 構建前端
npm run build

# 構建服務器端代碼
npx tsc --project tsconfig.server.json

# 重啟服務
sudo systemctl restart pwcalendar.service

echo "部署完成！"
```

設置執行權限：

```bash
chmod +x ~/deploy.sh
```
        ## 4. 更新應用程序

當您需要更新應用程序時，只需將更改推送到GitHub倉庫：

```bash
git add .
git commit -m "更新：描述您的更改"
git push
```

如果您設置了GitHub Actions或Webhook，應用程序將自動部署。否則，您需要登錄到服務器並運行部署腳本：

```bash
ssh <用戶名>@<服務器IP>
cd ~/apps/pwcalendar
./deploy.sh
```

## 5. 故障排除

### 5.1 檢查服務狀態

```bash
sudo systemctl status pwcalendar
```

### 5.2 查看應用日誌

```bash
journalctl -u pwcalendar -f
```

### 5.3 GitHub Actions問題

如果GitHub Actions部署失敗，請檢查：

1. GitHub Secrets是否正確設置
2. 服務器SSH連接是否正常
3. 在GitHub倉庫的Actions選項卡中查看詳細錯誤信息

### 5.4 Webhook問題

如果Webhook部署失敗，請檢查：

1. Webhook服務是否正在運行：`pm2 status`
2. Webhook日誌：`pm2 logs github-webhook`
3. GitHub倉庫設置中的Webhook配置是否正確
4. 服務器防火牆是否允許9000端口的連接

## 6. 安全注意事項

1. 使用HTTPS保護您的應用程序
2. 定期更新依賴包：`npm audit fix`
3. 使用強密碼保護您的GitHub賬戶和服務器
4. 考慮使用環境變量存儲敏感信息，而不是硬編碼在代碼中
5. 定期備份您的數據庫和配置文件

```

## 4. 更新應用程序

### 4.1 手動更新

當您需要更新應用程序時，只需在本地進行更改，然後推送到GitHub：

```bash
git add .
git commit -m "更新內容描述"
git push
```

然後在服務器上運行：

```bash
~/deploy.sh
```

### 4.2 自動更新

如果您設置了GitHub Webhook，每次推送到GitHub後，應用程序將自動更新。

## 5. 故障排除

### 5.1 檢查服務狀態

```bash
sudo systemctl status pwcalendar.service
```

### 5.2 查看日誌

```bash
journalctl -u pwcalendar.service
```

### 5.3 手動啟動應用程序進行測試

```bash
cd ~/apps/pwcalendar
node dist/server.js
```

## 6. 安全注意事項

1. 如果您的倉庫是公開的，確保不要將敏感信息（如數據庫密碼、API密鑰等）提交到GitHub
2. 考慮使用環境變量或配置文件來存儲敏感信息
3. 確保服務器的防火牆設置正確，只開放必要的端口
4. 定期更新服務器和應用程序依賴包

## 7. 備份策略

定期備份您的數據庫和重要配置文件：

```bash
# 創建備份腳本
nano ~/backup.sh
```

添加以下內容（根據您的實際情況調整）：

```bash
#!/bin/bash

# 設置備份目錄
BACKUP_DIR=~/backups
DATE=$(date +%Y%m%d)

# 創建備份目錄
mkdir -p $BACKUP_DIR

# 備份配置文件
cp ~/apps/pwcalendar/src/config.ts $BACKUP_DIR/config_$DATE.ts

# 如果使用MongoDB，可以添加數據庫備份命令
# mongodump --uri="您的MongoDB連接字符串" --out=$BACKUP_DIR/mongo_$DATE

echo "備份完成：$BACKUP_DIR"
```

設置執行權限並添加到crontab定期執行：

```bash
chmod +x ~/backup.sh
crontab -e
```

添加以下行（每天凌晨2點執行備份）：

```
0 2 * * * ~/backup.sh
```