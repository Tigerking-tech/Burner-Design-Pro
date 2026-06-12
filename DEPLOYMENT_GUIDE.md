# 🔥 Burner Design Pro 部署指南（Creem 支付）

> **目标**：让网站从公网可访问 → 通过 Creem 审核 → 正式收款。

---

## 总体架构

```
用户浏览器
    │
    ▼
┌─────────────────┐   (HTTPS)   ┌────────────────────┐
│   前端 (Vercel)  │ ◀────────▶ │   后端 (Render)    │
│ burner-design-   │             │ burner-design-pro- │
│ pro.vercel.app   │             │ xxx.onrender.com   │
└─────────────────┘             └────────────────────┘
         │                                │
         ▼                                ▼
    静态页面（React/Vite）          FastAPI + Python
    订阅 / 登录 / 计算器页面          用户认证 / Creem Webhook / 计算 API
```

---

## 📦 配置文件清单（已由 Agent 创建）

| 文件 | 作用 |
|------|------|
| `frontend/vercel.json` | Vercel SPA 路由重写配置（刷新 /privacy-policy 等页面不会 404） |
| `backend/render.yaml` | Render 后端 Blueprint（可选，也可手动配置） |
| `backend/Procfile` | 兼容 Heroku/Railway 等平台 |
| `backend/requirements.txt` | Python 依赖（已存在） |

---

## 🚀 部署步骤

### 第 1 步：部署后端（Render，免费，约 3 分钟）

> 先部署后端，拿到后端地址才能在前端里配置 API URL。

1. 打开 https://render.com，用 GitHub 账号登录
2. 点击 **New +** → **Web Service**
3. 选择你的仓库：`Tigerking-tech/Burner-Design-Pro`
4. 填写配置（**Root Directory 必须填**！）：
   - **Name:** `burner-design-pro-api`
   - **Environment:** Python
   - **Region:** Singapore（离中国最近）
   - **Branch:** `trae/solo-agent-TN4Qes`
   - **Root Directory:** `backend`  ← ⚠️ **必须填这个**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free（或 Starter，$7/月，更稳定不睡眠）

5. **Advanced → Environment Variables**，先只填这几个（其他的之后补）：

   | Key | Value | 说明 |
   |-----|-------|------|
   | `ENVIRONMENT` | `production` | |
   | `DEBUG` | `false` | |
   | `ALLOWED_ORIGINS` | （先留空，等前端部署完再填） | 允许访问的前端域名 |
   | `APP_URL` | （先留空，等前端部署完再填） | 支付成功后跳回的地址 |
   | `ADMIN_EMAIL` | 你的邮箱，例如 `you@example.com` | |
   | `ADMIN_PASSWORD` | 至少 8 位的强密码 | |
   | `ADMIN_FULL_NAME` | 你的名字 | |

6. 点击 **Create Web Service**，等待 1–2 分钟
7. 部署完成后，你会得到一个形如：
   ```
   https://burner-design-pro-api-xxxx.onrender.com
   ```
   👉 **把这个 URL 复制保存下来**（下文简称 "后端地址"）

**提示**：Render Free 实例如果 15 分钟没收到请求会休眠，第一次唤醒可能要 30 秒。部署完后可以手动在浏览器打开 `https://你的后端地址/health`，返回 `{"status":"healthy"}` 就是 OK 的。

---

### 第 2 步：部署前端（Vercel，免费，约 2 分钟）

1. 打开 https://vercel.com，用 GitHub 账号登录
2. 点击 **Add New → Project**，选择你的仓库 `Tigerking-tech/Burner-Design-Pro`
3. 配置（**Root Directory 必须填对**！）：
   - **Project Name:** `burner-design-pro`
   - **Framework Preset:** Vite（自动识别）
   - **Root Directory:** 点击 "Edit" → 输入 `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Environment Variables**（**关键！** 在 Vercel 部署页面底部 "Environment Variables" 区域）：

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://burner-design-pro-api-xxxx.onrender.com`（第 1 步得到的后端地址，**不要**带 `/api`，也**不要**带尾 `/`） |

5. 点击 **Deploy**
6. 等待 1–2 分钟后，你会得到前端地址，例如：
   ```
   https://burner-design-pro.vercel.app
   ```
   👉 **把这个 URL 也保存下来**（下文简称 "前端地址"）

---

### 第 3 步：让前后端互通（填 CORS 和 APP_URL）

1. 回到 https://render.com/ → 找到你的后端服务 → 点击 **Environment**
2. 修改/补充环境变量：

   | Key | Value |
   |-----|-------|
   | `ALLOWED_ORIGINS` | `https://burner-design-pro.vercel.app`（第 2 步得到的前端地址） |
   | `APP_URL` | `https://burner-design-pro.vercel.app`（同上） |

3. 点击 **Save Changes**，Render 会自动重启后端

---

### 第 4 步：在 Creem 后台配置产品

登录你的 Creem 账号（https://creem.io/dashboard）

#### 4a. 完善店铺信息（合规用）

- **Store settings → General**
  - Store name: `Burner Design Pro`
  - Website URL: `https://burner-design-pro.vercel.app`（第 2 步得到的前端地址）
  - Support email: `support@burnerdesignpro.com`
  - Business description: 写一段英文描述你的产品，例如：
    ```
    Professional engineering calculators for combustion, orifice plate flow rate, flame temperature, insulation thickness and emission analysis.
    ```
- **Store settings → Payout Accounts**：确保提现账户已设置好

#### 4b. 创建订阅产品（如果还没有的话）

- **Products → Add product**
  - Product name: `Burner Design Pro`
  - Price: `$99.00 / year`（或 `$19.00 / month`，你之前倾向年订阅）
  - Billing period: `Every year`（或 `Every month`）
  - Product type: `Subscription`
- 创建完成后，**复制 Product ID**（形如 `prod_xxxxxxxxx` 或数字，Creem 不同版本有差异，以 dashboard 实际显示为准）

#### 4c. 获取 API Key

- **Developers → API Keys**（或 "Settings → API"）
- 点击 **Generate new API key**
- 复制保存（形如 `live_xxxx` / `test_xxxx` 的长字符串）

#### 4d. 设置 Webhook

- **Developers → Webhooks**（或 "Settings → Webhooks"）
- 点击 **+ New webhook**（或 "Add webhook"）
- **Webhook URL（Endpoint URL）:**
  ```
  https://burner-design-pro-api-xxxx.onrender.com/api/webhooks/creem
  ```
  ⚠️ 注意：路径是 `/api/webhooks/creem`，不要写错。
- **Events to send:** 勾选全部（尤其 `subscription_created`, `subscription_activated`, `payment_completed`, `payment_success`, `subscription_cancelled`）
- 创建后，复制 **Signing secret**（形如 `whsec_xxx...` 或 `sign_xxxx`）

---

### 第 5 步：把 Creem 凭据填入后端

回到 https://render.com/ → 后端服务 → **Environment**，补充：

| Key | Value |
|-----|-------|
| `CREEM_API_KEY` | 第 4c 步生成的 API key |
| `CREEM_TEST_MODE` | `true`（先用测试环境跑通，验证完改为 `false`） |
| `CREEM_PRO_PRODUCT_ID` | 第 4b 步得到的 Product ID（数字或 prod_ 开头的字符串） |
| `CREEM_WEBHOOK_SECRET` | 第 4d 步得到的 Signing secret |

点击 **Save Changes**，Render 会自动重启后端。

---

### 第 6 步：验证整个流程

1. 打开 `https://burner-design-pro.vercel.app`
2. 首页能正常打开 → 点击导航栏 "Sign Up" → 注册一个测试账号 → 登录
3. 登录后进入 **Subscription** 页（或直接点 Subscribe）
4. 点击 **Subscribe** → 跳转到 Creem 托管结账页
5. 使用 Creem 提供的**测试卡**完成支付：
   - Card number: `4242 4242 4242 4242`
   - Expiry: 任意未来月/年（如 `12/28`）
   - CVC: 任意 3 位（如 `123`）
6. 支付完成后应该自动跳回你的网站
7. 在你的网站点 **Account / Subscription**，状态应为 **Active**
8. 在 Creem dashboard → Customers / Subscriptions 也能看到这个订阅

一切正常后，回到 Render → 后端 → **Environment**，把 `CREEM_TEST_MODE` 改为 `false`，保存 → 重启后端，就可以正式收款了。

**如果测试失败怎么办？**
- 在 Render 后端服务的 **Logs** 里搜索 `[payment]` 或 `[webhook]`，通常会有错误提示
- 检查 `CREEM_API_KEY` 是否正确，是 `test_` 还是 `live_` 开头
- 检查 `CREEM_TEST_MODE` 是否与 API key 类型一致（test key 对应 true）
- 检查 webhook URL 是否能从公网访问（在浏览器打开 `https://后端地址/api/webhooks/creem` 应该能看到 FastAPI 的 "Method Not Allowed" 提示，说明路由存在）

---

### 第 7 步（可选）：把自定义域名指向网站

如果你已经拥有 `burnerdesignpro.com` 或其他域名：

1. 在 Vercel → **项目 → Settings → Domains**，添加 `burnerdesignpro.com`（或者 `www.burnerdesignpro.com`）
2. 按 Vercel 的指引在你的域名注册商（GoDaddy / 阿里云 / Cloudflare 等）添加 DNS 记录（通常是一条 A 记录或 CNAME，Vercel 会给具体 IP/域名）
3. Vercel 会自动签发 HTTPS 证书，约 1-2 分钟
4. 同样地，Render 后端也可以设自定义域名，例如 `api.burnerdesignpro.com`（在 Render → 后端 → Settings → Custom Domains）
5. 改完后记得更新两处配置：
   - Vercel 前端的 `VITE_API_URL` → `https://api.burnerdesignpro.com`
   - Render 后端的 `APP_URL` 和 `ALLOWED_ORIGINS` → `https://burnerdesignpro.com`

---

## ✅ 通过 Creem 审核的 Checklist

> Creem 合规团队会检查以下内容（按重要性排序）：

| 检查项 | 访问地址 | 状态 |
|-------|---------|------|
| 网站主页能从公网打开 | `https://burner-design-pro.vercel.app` | ✅ 代码已实现 |
| 定价/订阅页能从公网打开 | `https://burner-design-pro.vercel.app/subscription` | ✅ 代码已实现 |
| 产品描述与实际功能一致 | 首页 / Pricing | ✅ 代码已实现 |
| Privacy Policy 页面 | `https://burner-design-pro.vercel.app/privacy-policy` | ✅ 代码已实现 |
| Terms of Service 页面 | `https://burner-design-pro.vercel.app/terms-of-service` | ✅ 代码已实现 |
| Footer 有清晰版权行 | 首页底部 | ✅ 代码已实现 |
| 支持邮箱为真实可回复地址 | Creem dashboard 填写 | ⚠️ 需要你手动在 Creem 后台填 |
| Creem 后台 Store settings 的 Website URL | `https://burner-design-pro.vercel.app` | ⚠️ 需要你填 |

确认以上全部通过后，在 Creem 后台 **Store settings → Compliance / Payout / Business verification** 按要求提交资料即可（如果之前已通过了商户验证，则只需确认店铺信息）。

---

## 🔄 后续更新：Git Push 即自动部署

配置好 Vercel 和 Render 后，**以后你每次**：
```bash
git push origin trae/solo-agent-TN4Qes
```
Vercel 和 Render 都会**自动拉取最新代码 → 重新构建 → 部署**，几分钟内新版本就上线了。

---

## 💡 常见问题速查

| 症状 | 可能原因 | 解决方式 |
|-----|---------|---------|
| 前端打开白屏/一片黑 | 前端构建失败或 `VITE_API_URL` 写错 | 去 Vercel 项目 → Deployments → 查看 Build Logs |
| 订阅页点击 Subscribe 报错 | 后端还没填 `CREEM_PRO_PRODUCT_ID` | 去 Render → Environment → 检查并保存 |
| 支付完但订阅没生效 | Webhook 没送达或签名校验失败 | 1. 确认 Render 后端地址能从公网访问；2. 检查 `CREEM_WEBHOOK_SECRET` 是否与 Creem dashboard 一致；3. Creem dashboard → Webhooks → 查看 Delivery Logs |
| Render 后端隔一段时间就慢 | Free 计划 15 分钟无请求自动休眠 | 升级到 Starter（$7/月），或用 UptimeRobot 每 10 分钟 ping 一次 |
| 刷新 /privacy-policy 或 /terms-of-service 出现 404 | Vercel 未配置 SPA rewrite | 已在 `frontend/vercel.json` 中配置（如果无效请确认文件已推送） |
