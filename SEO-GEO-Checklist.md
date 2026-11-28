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
- [x] **构建期预渲染 29 个路由的静态 HTML**（每个页面独立的 title/description/canonical/H1）——修复了"所有工具页 canonical 指向首页、被 Bing 判定为重复页不予收录"的致命问题
- [x] 静态加载壳加入真实 H1 + 关键词描述（不执行 JS 的爬虫与 AI 机器人也能读到内容）
- [x] 全部页面标题控制在 60 字符内（含 11 篇文章的短 SEO 标题，正文 H1 保留完整标题）
- [x] 修复 `vercel.json` 的 SPA 兜底重写：改为按扩展名排除，静态文件（xml/txt/png）不会再被吞掉
- [x] 线上抽查 11 个 URL：canonical / H1 / 标题长度 / JS 加载 全部正确

---

## 📋 你必须做的（共 5 项，按优先级排序）

### ✅ 1. Bing 站长工具（已完成 2026-11-27）

- [x] Microsoft 账号登录 ✅
- [x] 添加站点 `https://burnerdesignpro.com` ✅
- [x] XML 文件验证通过（`BingSiteAuth.xml` 已部署）✅
- [x] 左侧 `Sitemaps` → 提交 `https://burnerdesignpro.com/sitemap.xml` → **Status: Success，发现 31 个 URL** ✅
- [x] 首页已被 Bing 收录（Indexed successfully）✅
- [x] 修复 Bing 报的 2 个问题：标题过长（76→54 字符）、缺 H1（已在静态 HTML 中加入）✅

### ⭐ 2. Google Search Console（已验证，从 2026-07 就有账号）

**GSC 早已验证通过**（首页是目前唯一被索引的页面）。剩余操作：

- [ ] 左侧「站点地图」→ 确认 `sitemap.xml` 已提交且状态成功；没提交就补上
- [ ] 左侧「网址检查」→ 逐个请求编入索引：`/`、`/flame-temperature`、`/insulation-calculator`、`/orifice-calculator`、`/fuel-manager`、`/emission`、`/efficiency`（每天约 10 条额度）
- [ ] 「网页索引编制」报告里点开「网页会自动重定向」→ 截图 URL 列表发我确认（www 空页面问题已于 2026-11-28 通过 Vercel 后台 308 跳转修复）

### ✅ www 域名问题（已完成 2026-11-28）

- [x] 发现 www.burnerdesignpro.com 返回 200 空页面（重复页 + 空内容）
- [x] Vercel 后台添加 www → 308 重定向到主域名，路径保留，线上验证通过

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
