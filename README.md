# PWCalendar

一個基於React和Node.js的日曆應用，專為PictureWorks設計，用於管理和協調團隊事件。

## 功能特點

- 事件管理：創建、編輯和刪除事件
- 用戶認證：基於電子郵件的用戶認證系統
- 項目管理：將事件組織到不同的項目中
- 響應式設計：適配桌面和移動設備
- HTTPS支持：安全的數據傳輸

## 技術棧

- 前端：React, Material-UI, React Router
- 後端：Node.js, Express
- 數據庫：MongoDB
- 安全：HTTPS, 環境變量配置

## 快速開始

### 開發環境

1. 克隆倉庫

```bash
git clone https://github.com/您的用戶名/pwcalendar.git
cd pwcalendar
```

2. 安裝依賴

```bash
npm install --legacy-peer-deps
```

3. 創建環境變量文件

```bash
cp .env.example .env
# 編輯.env文件，填入您的配置
```

4. 啟動開發服務器

```bash
npm run dev
```

應用將在 https://localhost:3000 運行。

### 生產環境部署

我們提供了多種部署選項：

1. [Ubuntu ARM服務器部署指南](./DEPLOY.md)
2. [通過GitHub部署指南](./GITHUB_DEPLOY.md)

## 項目結構

```
├── dist/               # 構建輸出目錄
├── public/             # 靜態資源
├── src/                # 源代碼
│   ├── components/     # React組件
│   ├── pages/          # 頁面組件
│   ├── services/       # API服務
│   ├── types/          # TypeScript類型定義
│   ├── config.ts       # 配置文件
│   ├── server.ts       # 後端服務器
│   └── main.tsx        # 前端入口點
├── .env.example        # 環境變量示例
├── package.json        # 項目依賴
└── tsconfig.json       # TypeScript配置
```

## 貢獻指南

1. Fork倉庫
2. 創建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟Pull Request

## 許可證

[MIT](LICENSE)
