# BurnerDesignPro SEO/GEO 剩余行动清单

> 更新于 2026-11-25。**我能做的已全部做完**（代码优化、部署验证、IndexNow 提交、浏览器实测）。
> 以下是经过逐一排除后，**确实只有你本人能完成**的事项。

---

## ✅ 已完成（我已完成，无需你操作）

- [x] 全部 SEO/GEO 代码优化并推送 GitHub main（6 篇长尾文章、FAQ 结构化数据、llms.txt、robots.txt、sitemap、懒加载、bug 修复）
- [x] og-image.png 压缩 1.6MB → 191KB
- [x] Vercel 自动部署验证通过（llms.txt / 密钥文件 / 新文章均上线）
- [x] **IndexNow 批量提交 14 个 URL**（Bing/Yandex 等已通知，返回 202 Accepted）
- [x] 浏览器实测：工具页 FAQ 折叠区正常渲染和展开
- [x] 浏览器实测：页面含 5 种结构化数据（WebApplication×2、FAQPage、Organization、WebSite），全部有效
- [x] 浏览器实测：定价页正常（Free $0 / Pro $19），Upgrade 按钮正确跳转注册页
- [x] 浏览器实测：新博客文章表格、FAQ、内链全部正常渲染

---

## 📋 你必须做的（共 5 项，按优先级排序）

### ✅ 1. Bing 站长工具（已完成 2026-11-27）

- [x] Microsoft 账号登录 ✅
- [x] 添加站点 `https://burnerdesignpro.com` ✅
- [x] XML 文件验证通过（`BingSiteAuth.xml` 已部署）✅
- [x] 左侧 `Sitemaps` → 提交 `https://burnerdesignpro.com/sitemap.xml` → **Status: Success，发现 31 个 URL** ✅
- [x] 首页已被 Bing 收录（Indexed successfully）✅
- [x] 修复 Bing 报的 2 个问题：标题过长（76→54 字符）、缺 H1（已在静态 HTML 中加入）✅

### ⭐ 2. Google Search Console（15 分钟，最可能解决零流量问题）

**我的沙箱网络访问不了 google.com，这一步只能你在自己电脑/手机上做：**

- [ ] 打开 https://search.google.com/search-console 登录 Google 账号
- [ ] 添加资源 → 选「网址前缀」→ 输入 `https://burnerdesignpro.com`
- [ ] 选「HTML 标记」验证方式 → 复制那串 meta 标签 → **粘贴发给我**，我帮你写进代码并推送部署
- [ ] 部署完成后回到 Search Console 点「验证」
- [ ] 左侧「站点地图」→ 输入 `sitemap.xml` → 提交
- [ ] 左侧「网址检查」→ 粘贴 `https://burnerdesignpro.com/` → 点「请求编入索引」
- [ ] 同样方法请求索引：`/flame-temperature`、`/insulation-calculator`、`/orifice-calculator`、`/fuel-manager`、`/emission`、`/efficiency`

### ⭐ 3. 支付流程自测（10 分钟，排查零订单的直接原因）

需要一个你能收信的邮箱（收验证码），我无法代做：

- [ ] 用测试邮箱在 https://burnerdesignpro.com/signup 注册
- [ ] 完成邮箱验证 → 登录
- [ ] 做几次免费计算，确认第 21 次时正确提示升级（免费额度 20 次/月）
- [ ] 点 Upgrade to Pro → **确认能跳到 Creem 的真实付款页面**（不用真付款，看到付款界面即可）
- [ ] 如果任何一步卡住/报错 → 截图发我，立即修

### 4. GA4 数据确认（2 分钟）

- [ ] 打开 https://analytics.google.com → 左边「报告 → 实时」→ 自己访问一下网站 → 确认实时用户数 ≥ 1
- [ ] 若显示 0：说明 GA 没装上或 ID 不对，截图发我

### 5. 外链建设（每周 2-3 个，长期坚持）

这些需要注册你的账号、代表你的品牌发声，必须你来做：

- [ ] Product Hunt 提交产品：https://www.producthunt.com/posts/new
- [ ] AlternativeTo 提交：https://alternativeto.net （作为 Aspen/Cantera/3E Plus 的轻量免费替代品）
- [ ] Reddit 回答问题时附文章链接（r/ChemicalEngineering、r/HVAC、r/MechanicalEngineering，先认真回答再附链接）
- [ ] Quora 搜 "excess air calculation" / "wobbe index" / "pipe insulation thickness" 写带链接的回答
- [ ] LinkedIn 公司主页发 6 篇新文章介绍帖（每篇一条，间隔 2-3 天）

---

## 之后随时叫我做的事

- 写好 Search Console 的 meta 验证标签 → 发我，我嵌入并部署
- Bing 准备好登录 → 我开浏览器交给你，登录后我来完成剩余操作
- 每月想发新文章 → 告诉我关键词方向，我来写并更新 sitemap/llms.txt
- Search Console 里看到有展示量的关键词 → 发我，我针对性写内容
