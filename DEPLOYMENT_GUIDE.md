# 🔥 Burner Design Pro 部署指南

> **目标**：让网站能从公网访问，通过 Lemon Squeezy 的 KYC / 合规审核。

---

## 总体架构

```
用户浏览器
    │
    ▼
┌─────────────────┐   (HTTPS)   ┌────────────────────┐
│   前端 (Vercel)  │ ◀────────▶ │   后端 (Render)    │
│ burnerdesignpro- │             │ burner-design-pro- │
│ xxx.vercel.app   │             │ xxx.onrender.com   │
└─────────────────┘             └────────────────────┘
         │                                │
         ▼                                ▼
    静态页面（React/Vite）          FastAPI + Python
    订阅 / 登录 / 计算器页面          用户认证 / 支付 Webhook / 计算 API
```

---

## 📦 配置文件清单（已由 Agent 创建）

| 文件 | 作用 |
|------|------|
| `frontend/vercel.json` | Vercel SPA 路由重写配置 |
| `backend/render.yaml` | Render 后端 Blueprint（可选，也可手动配置） |
| `backend/Procfile` | 兼容 Heroku/Railway 等平台的启动命令 |
| `backend/requirements.txt` | Python 依赖（已存在） |

---

## 🚀 部署步骤

### 第 1 步：部署后端（Render，免费，约 3 分钟）

1. 打开 https://render.com，用 GitHub 账号登录
2. 点击 **New +** → **Web Service**
3. 选择你的仓库：`Tigerking-tech/Burner-Design-Pro`
4. 填写配置：
   - **Name:** `burner-design-pro-api`
   - **Environment:** Python
   - **Region:** 选离你近的（Singapore 或 Frankfurt）
   - **Branch:** `trae/solo-agent-TN4Qes`
   - **Root Directory:** `backend`  ← ⚠️ **必须填这个！**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free
5. **Advanced → Environment Variables**（按下面表格填，稍后会解释每个值）

点击 **Create Web Service**，等待 1–3 分钟后，你会得到一个形如：
```
https://burner-design-pro-api-xxxx.onrender.com
```
👉 **把这个 URL 保存下来**，稍后要用。

**重要**：Render 的免费实例会休眠。首次请求可能需要 30 秒唤醒。建议部署完确认后再打开一个页面唤醒它。

---

### 第 2 步：部署前端（Vercel，免费，约 2 分钟）

1. 打开 https://vercel.com，用 GitHub 账号登录
2. 点击 **Add New → Project**，选择你的仓库
3. 配置：
   - **Project Name:** `burner-design-pro`
   - **Framework Preset:** Vite
   - **Root Directory:** 点击 "Edit" → 输入 `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. **Environment Variables**（关键！）：
   - **Key:** `VITE_API_URL`
   - **Value:** 第 1 步得到的后端地址，例如：
     ```
     https://burner-design-pro-api-xxxx.onrender.com
     ```
     注意：**不要带尾部的 `/`**，也不要加 `/api`。代码会自动拼接 `/api`。
5. 点击 **Deploy**
6. 完成后你会得到前端域名，例如：`https://burner-design-pro.vercel.app`
7. 👉 **把这个 URL 也保存下来**

---

### 第 3 步：让两端互相认识（配置 CORS + APP_URL）

后端必须明确允许前端域名访问。

1. 回到 Render Dashboard，点击你的后端服务 → **Environment**
2. 修改环境变量：

| Key | Value | 说明 |
|-----|-------|------|
| `ALLOWED_ORIGINS` | `https://burner-design-pro.vercel.app` | 填入你第 2 步得到的前端域名 |
| `APP_URL` | `https://burner-design-pro.vercel.app` | 同上（用于支付成功后的跳转） |
| `ENVIRONMENT` | `production` | |
| `DEBUG` | `false` | |
| `ADMIN_EMAIL` | `你选择的管理员邮箱` | |
| `ADMIN_PASSWORD` | `一个强密码（至少 8 位，含大小写数字）` | |
| `ADMIN_FULL_NAME` | `你的名字或公司名` | |
| `CREEM_API_KEY` | （稍后填，见第 4 步） | Lemon Squeezy API Key |
| `CREEM_TEST_MODE` | `true`（先用测试环境验证） | 测试完改为 `false` |
| `CREEM_PRO_PRODUCT_ID` | （稍后填） | 产品 ID |
| `CREEM_WEBHOOK_SECRET` | （稍后填） | Webhook 签名密钥 |

3. 保存后，Render 会**自动重启**后端服务。

---

### 第 4 步：在 Lemon Squeezy 后台配置

登录 https://app.lemonsqueezy.com/，做以下几件事：

#### 4a. Store Settings → 填写产品 URL

- **Website URL:** `https://burner-design-pro.vercel.app`
- **Store name:** Burner Design Pro
- **Business name:** 你注册的公司名 / 或你的名字
- **Support email:** `support@burnerdesignpro.com`

#### 4b. 创建产品

- **Products → Add product**
- Product name: `Burner Design Pro - Annual`
- Price: `$99.00 / year`（订阅）
- **Billing period:** `Every year`
- 创建后记录下 **Product ID**（形如 `263854`）

#### 4c. 获取 API Key

- **Settings → API**
- **Generate new API key** → 保存（形如 `eyJhbG...`）

#### 4d. 配置 Webhook

- **Settings → Webhooks**
- **+ New webhook**
  - **URL:** `https://burner-design-pro-api-xxxx.onrender.com/api/webhooks/creem`  ← ⚠️ 注意路径是 `/api/webhooks/creem`
  - **Events to send:** 勾选全部（尤其是 `subscription_created`, `payment_success`）
- 创建后记录下 **Signing secret**（形如 `whsec_xxxx...`）

#### 4e. 把第 4 步的 3 个值填入后端

回到 Render → 后端服务 → **Environment**，填入：

| Key | Value |
|-----|-------|
| `CREEM_API_KEY` | `eyJhbG...` |
| `CREEM_PRO_PRODUCT_ID` | `263854`（你创建的产品 ID） |
| `CREEM_WEBHOOK_SECRET` | `whsec_xxxx...` |

---

### 第 5 步：验证整个链路

1. **打开前端地址**：`https://burner-design-pro.vercel.app`
2. **注册一个测试账号**，登录后导航到 **Pricing**
3. 点击 **Subscribe**，使用 Lemon Squeezy 提供的**测试卡**完成支付：
   - 卡号：`4242 4242 4242 4242`
   - 日期：任意未来日期（如 `12/30`）
   - CVC：任意 3 位（如 `123`）
4. 支付完成后应该自动跳回你的网站，**Subscription 状态变为 Active**
5. 检查后端日志，确认收到了 `subscription_created` Webhook

一切正常后，在 Render 的环境变量中把 `CREEM_TEST_MODE` 改为 `false`，重启后端。

---

### 第 6 步：把自定义域名指向网站（可选，但更专业）

如果你已经拥有 `burnerdesignpro.com`：

1. **Vercel → 项目 → Settings → Domains**，添加 `burnerdesignpro.com` 和 `www.burnerdesignpro.com`
2. 按 Vercel 的指引在你的域名注册商（如 GoDaddy / Aliyun / Cloudflare）添加两条 DNS 记录
3. Vercel 会自动签发 HTTPS 证书（通常 1-2 分钟搞定）
4. 然后把 Render 后端也设置自定义域名（Settings → Custom Domains），例如 `api.burnerdesignpro.com`
5. 更新两处配置：
   - Vercel 前端的 `VITE_API_URL` → `https://api.burnerdesignpro.com`
   - Render 后端的 `APP_URL` 和 `ALLOWED_ORIGINS` → `https://burnerdesignpro.com`

---

## ✅ 通过 Lemon Squeezy 审核的 Checklist

1. ✅ **产品页/定价页可访问**：`https://burner-design-pro.vercel.app/subscription`
2. ✅ **产品描述和功能列表匹配实际产品**
3. ✅ **Privacy Policy 页面可访问**：`https://burner-design-pro.vercel.app/privacy-policy`
4. ✅ **Terms of Service 页面可访问**：`https://burner-design-pro.vercel.app/terms-of-service`
5. ✅ **Footer 有清晰的版权和联系信息**
6. ✅ **店铺设置中 Website URL 填写为真实域名**
7. ✅ **支持邮箱为真实可回复地址**

确认以上后，在 Lemon Squeezy **Store settings → Payout Accounts** 点击 **Request re-review**（重新审核）。通常 1–3 个工作日会有结果。

---

## 🔄 后续更新：Git Push 即自动部署

配置好 Vercel 和 Render 后，**以后你每次**：
```bash
git push origin trae/solo-agent-TN4Qes
```
Vercel 和 Render 都会**自动拉取、重新构建、部署**，几分钟内新版本就上线了。
