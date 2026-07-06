# 🎓 超级详细部署指南 - 从零开始

**难度等级：⭐ 零基础小白专用**

这份指南会手把手教您，每一步都有详细说明！

---

## 📋 目录

1. [第一步：准备账号](#第一步准备账号)
2. [第二步：上传代码到GitHub](#第二步上传代码到github)
3. [第三步：部署后端到Railway](#第三步部署后端到railway)
4. [第四步：部署前端到Vercel](#第四步部署前端到vercel)
5. [第五步：测试您的网站](#第五步测试您的网站)
6. [常见问题解答](#常见问题解答)

---

## 📸 第一步：准备账号

### 1.1 注册 GitHub 账号（代码仓库）

GitHub 就像一个云端文件夹，用来存放您的代码。

**操作步骤：**

1. 打开浏览器（推荐Chrome）
2. 在地址栏输入：`https://github.com`
3. 点击页面上的 **"Sign up"** 按钮（橙色的）

![GitHub首页](https://github.githubassets.com/images/modules/site/home-campaign/hero-screenshot.png)

4. **创建账户**：
   - 输入您的邮箱地址
   - 创建一个密码（至少8位，要记住！）
   - 创建一个用户名（这个很重要，会显示在您的项目URL中）
   - 输入验证码
   - 点击 **"Create account"**

5. **验证邮箱**：
   - 去您的邮箱收件箱找验证邮件
   - 点击邮件中的验证链接

6. **完成！** 您现在有了 GitHub 账号！

✅ **完成后您应该看到 GitHub 的主页面**

---

### 1.2 注册 Vercel 账号（前端部署）

Vercel 就像一个网站托管服务，让您的网页可以在互联网上访问。

**操作步骤：**

1. 打开新标签页
2. 在地址栏输入：`https://vercel.com`
3. 点击 **"Sign Up"**

4. **注册方式选择**：
   - 选择 **"Continue with GitHub"** （最简单！）
   - 如果没有GitHub，点击 "Continue with Email"

5. **授权 GitHub**：
   - 点击绿色的 **"Authorize vercel"** 按钮
   - 如果要求安装 Vercel 应用，点击 "Install"

6. **完成！** 您现在有了 Vercel 账号！

✅ **完成后您应该看到 Vercel 的仪表盘页面**

---

### 1.3 注册 Railway 账号（后端部署）

Railway 用来运行您的后端计算程序。

**操作步骤：**

1. 打开新标签页
2. 在地址栏输入：`https://railway.app`
3. 点击 **"Login"** 或 **"Sign Up"**

4. **注册方式选择**：
   - 选择 **"Login with GitHub"** （最简单！）
   - 点击后会跳转到 GitHub 授权页面
   - 点击绿色的 **"Authorize"** 按钮

5. **完成！** 您现在有了 Railway 账号！

✅ **完成后您应该看到 Railway 的项目页面**

---

### 📝 第一步小总结

您现在应该有：
- ✅ GitHub 账号（代码仓库）
- ✅ Vercel 账号（前端网站）
- ✅ Railway 账号（后端计算）

**把账号和密码都记下来，放在安全的地方！**

---

## 💻 第二步：上传代码到 GitHub

这一步是把您电脑上的代码上传到 GitHub，这样 Vercel 和 Railway 才能访问到代码。

### 2.1 创建 GitHub 仓库

**什么是仓库？** 
仓库就像一个文件夹，用来存放您的项目代码。

**操作步骤：**

1. 登录 GitHub（打开 github.com，输入账号密码登录）

2. 点击页面右上角的 **"+"** 号
   - 选择 **"New repository"**

3. **填写仓库信息**：
   ```
   Owner: 您的用户名（自动填好的）
   Repository name: burnerpro
   Description（描述）: Burner Design Pro - 工业燃烧器热设计工具
   ```
   - 选择 **"Public"**（公开，这样 Vercel 才能访问）
   - ✅ 勾选 **"Add a README file"**
   - 点击 **"Create repository"**

4. **完成！** 您现在有了一个空的仓库！

✅ **您应该看到一个页面，上面写着 "Quick setup"**

---

### 2.2 在本地初始化 Git 并上传代码

现在要把您电脑上的代码上传到这个仓库。

**打开终端（命令提示符）：**

**Windows 用户：**
1. 按 `Win + R`
2. 输入 `cmd`
3. 按回车

**Mac 用户：**
1. 按 `Command + 空格`
2. 搜索 "Terminal"
3. 按回车

**在终端中输入以下命令（一条一条输入，每条按回车）：**

```bash
# 1. 进入项目目录
cd /workspace/burnerpro

# 2. 初始化 Git（告诉电脑要开始跟踪文件变化）
git init

# 3. 添加所有文件到 Git
git add .

# 4. 提交文件（创建第一个版本）
git commit -m "First commit: Burner Design Pro"

# 5. 连接 GitHub 仓库（把 "YOUR_USERNAME" 换成您的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/burnerpro.git

# 6. 上传代码到 GitHub
git push -u origin master
```

**如果提示需要登录 GitHub：**
- 会弹出一个窗口要求输入用户名和密码
- 用户名就是您的 GitHub 用户名
- 密码是 GitHub 的 Personal Access Token（不是登录密码！）

**如何获取 GitHub Token（一次性操作）：**
1. 打开 https://github.com/settings/tokens
2. 点击 **"Generate new token"** (classic)
3. 勾选 `repo` 权限
4. 点击 **"Generate token"**
5. **立刻复制保存**，这个只会显示一次！
6. 粘贴到终端作为密码

---

### 2.3 验证上传成功

回到 GitHub 仓库页面（刷新），您应该能看到所有文件了！

✅ **您应该看到很多文件和文件夹，包括：**
- frontend/
- backend/
- README.md
- 等等

---

## 🚀 第三步：部署后端到 Railway

后端就像厨房，负责计算和数据处理。

### 3.1 连接 GitHub 仓库到 Railway

**操作步骤：**

1. 打开 Railway 网站并登录（railway.app）

2. 点击 **"New Project"**（新建项目）

3. 选择 **"Deploy from GitHub repo"**
   - 第一次可能需要点击 "Connect GitHub Account"
   - 选择您的 GitHub 账号
   - 选择要连接的仓库（勾选 burnerpro）
   - 点击 **"Connect"**

4. Railway 会自动扫描您的仓库

5. **选择 backend 文件夹**：
   - Railway 会问您要部署什么
   - 选择 **"Backend"** 或 **"Python"**
   - Root Directory 设置为：`backend`（或留空）

6. Railway 会自动识别为 Python 项目！

✅ **您应该看到 Railway 正在部署后端**

---

### 3.2 配置后端环境变量

**什么是环境变量？**
就像软件的设置，告诉程序该怎么运行。

**操作步骤：**

1. 在 Railway 项目页面，找到 **"Variables"** 标签
   - 可能显示为 "Environment Variables" 或在 Settings 里

2. 点击 **"New Variable"** 添加以下变量（一行一行添加）：

```
ENVIRONMENT    =    production
DEBUG          =    false
ALLOWED_ORIGINS=    *
RATE_LIMIT     =    100
RATE_WINDOW    =    60
```

**如何添加：**
- Variable name 填左边的（ENVIRONMENT）
- Value 填右边的（production）
- 点击 Add
- 重复以上步骤添加其他变量

3. **保存后，Railway 会自动重新部署**

---

### 3.3 获取后端 URL

部署完成后，Railway 会给您一个网址。

**操作步骤：**

1. 在 Railway 项目页面
2. 找到 **"Settings"** 或 **"Networking"**
3. 找到 **"Public Networking"**
4. 点击 **"Generate Domain"**
5. 您会得到一个类似这样的网址：
   ```
   https://burner-api.railway.app
   ```
   （或者 `.up.railway.app` 结尾）

**把这个网址记下来，后面要用！**

✅ **后端部署完成！**

---

## 🌐 第四步：部署前端到 Vercel

前端就像餐厅，负责展示给用户看。

### 4.1 连接 GitHub 仓库到 Vercel

**操作步骤：**

1. 打开 Vercel 网站并登录（vercel.com）

2. 点击 **"Add New..."** 
   - 选择 **"Project"**

3. **导入 GitHub 仓库**：
   - 在列表中找到 `burnerpro`
   - 点击旁边的 **"Import"**

4. **配置项目**：
   - **Framework Preset**: 选择 `Vite`（或者让 Vercel 自动检测）
   - **Root Directory**: 输入 `frontend`
   - **Build Command**: `npm run build`（通常自动填好）
   - **Output Directory**: `dist`（通常自动填好）

5. **环境变量**（重要！）：
   - 点击 **"Environment Variables"**
   - 添加：
     ```
     NAME: VITE_API_URL
     VALUE: https://你的-backend-url.railway.app
     ```
   - ⚠️ 把 `https://你的-backend-url.railway.app` 换成您上一步得到的真实后端地址！

6. 点击 **"Deploy"**

---

### 4.2 等待部署

Vercel 正在构建和部署您的网站。

**过程说明：**
1. 第一阶段：安装依赖（npm install）
2. 第二阶段：构建网站（npm run build）
3. 第三阶段：部署上线

**大约需要 1-3 分钟**

✅ **看到绿色的 "Ready" 或 "Success" 就表示部署成功！**

---

### 4.3 获取网站地址

Vercel 会给您一个免费的网站地址。

**在哪里找？**
- 在 Vercel 项目页面
- 找到 **"Domains"** 或类似的地方
- 您会看到类似这样的网址：
  ```
  https://burnerpro.vercel.app
  ```

**恭喜！您有网站了！**

把这个网址发给任何人，他们都能访问您的网站！

---

## 🧪 第五步：测试您的网站

### 5.1 打开网站

1. 在浏览器中输入您的 Vercel 网址
2. 应该能看到 Burner Design Pro 的首页

### 5.2 测试功能

尝试点击不同的模块：
- ✅ 点击 "Calculate the combustion values" - 应该能看到气体计算器
- ✅ 输入一些数值 - 应该能看到计算结果
- ✅ 点击 "Unit Converter" - 应该能看到单位转换器
- ✅ 点击 "Emission Conversion" - 应该能看到排放物估算

### 5.3 自定义域名（可选）

如果您有自己的域名，可以设置自定义域名：

**在 Vercel 中：**
1. 进入项目设置
2. 找到 **"Domains"**
3. 输入您的域名（如：`burnerpro.com`）
4. 按照提示添加 DNS 记录

---

## ❓ 常见问题解答

### Q1: 部署失败了怎么办？

**A:** 别慌！常见解决方法：

1. **看错误信息**
   - Railway/Vercel 会显示错误原因
   - 仔细阅读红色或橙色的文字

2. **常见错误及解决**：

   **后端报错 "Module not found"**
   - 确保 Root Directory 设置为 `backend`

   **前端报错 "Cannot find module"**
   - 确保 Root Directory 设置为 `frontend`

   **CORS 错误**
   - 检查 Railway 的 ALLOWED_ORIGINS 是否设置正确
   - 应该包含您的 Vercel 域名

3. **重新部署**
   - 在 Railway/Vercel 中找到 "Redeploy" 按钮
   - 点击重新部署

4. **查看日志**
   - Railway: 点击 "Logs" 查看详细日志
   - Vercel: 点击 "Functions" 查看错误日志

---

### Q2: 修改代码后怎么更新网站？

**A:** 很简单！

1. 修改您电脑上的代码
2. 在终端中运行：
   ```bash
   cd /workspace/burnerpro
   git add .
   git commit -m "描述你的修改"
   git push
   ```
3. Vercel/Railway 会自动检测到代码变化
4. 自动重新部署（等待1-3分钟）

---

### Q3: 怎么让网站更快？

**A:** 
1. 优化图片大小
2. 使用 Vercel 的自动 CDN
3. 开启缓存（在 Vercel 设置中）

---

### Q4: 如何关闭网站（省钱）？

**A:**
1. Railway: 在项目设置中找到 "Pause Project"
2. Vercel: Vercel 的免费版足够个人使用，不会收费

---

### Q5: 忘记了 GitHub 密码怎么办？

**A:**
1. 打开 github.com/login
2. 点击 "Forgot password"
3. 输入您的邮箱
4. 去邮箱重置密码

---

### Q6: Token 在哪里找？

**A:**
1. 打开 https://github.com/settings/tokens
2. 点击 "Generate new token"
3. 勾选 `repo` 权限
4. 点击 "Generate token"
5. **立刻复制保存**，只会显示一次！

---

## 🎉 恭喜！

您已经成功部署了自己的网站！

**您的网站地址：** `https://你的项目名.vercel.app`

**后端 API 地址：** `https://你的-backend.railway.app`

---

## 📞 需要帮助？

如果遇到问题：
1. 先看错误信息
2. 尝试重新部署
3. 截图错误信息
4. 可以在网上搜索错误信息

**祝您部署顺利！** 🚀

---

**最后更新：** 2024年
**版本：** 1.0
