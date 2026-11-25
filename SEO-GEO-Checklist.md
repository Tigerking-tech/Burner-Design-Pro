# BurnerDesignPro SEO/GEO 行动清单

> 用法：按顺序逐项完成，做完在 `[ ]` 里打 `x`。带 ⭐ 的是最关键项。
> 代码侧优化已全部完成并推送到 GitHub main（2026-11-25）。以下是你需要手动做的事。

---

## 第 1 步：确认部署成功 ~~（今天，10 分钟）~~ ✅ 已完成（2026-11-25 自动验证）

- [x] llms.txt 已上线（text/plain 正常返回）✅
- [x] IndexNow 密钥文件已上线 ✅
- [x] 新文章 /blog/excess-air-calculation-combustion-o2 已上线 ✅
- [ ] 打开任一工具页（如 /flame-temperature）→ 页面底部有 "Frequently Asked Questions" 折叠区（你打开网页肉眼确认一下）
- [ ] 用 https://search.google.com/test/rich-results 测试首页 → 能识别 WebApplication/Organization（点链接、贴入网址即可）

## 第 2 步：Google Search Console（⭐最重要，今天）

4 个月零订单最可能的原因是**网站没被充分索引**。这一步解决它：

- [ ] 打开 https://search.google.com/search-console 用 Google 账号登录
- [ ] 「添加资源」→ 选「网址前缀」→ 输入 `https://burnerdesignpro.com`
- [ ] 验证所有权（推荐 HTML 标记方式）：复制 Google 给的 meta 标签 → 发给我（或贴到 frontend/index.html 的 `<head>` 里）→ 重新部署 → 点「验证」
- [ ] 验证成功后：左侧「站点地图」→ 输入 `sitemap.xml` → 提交
- [ ] 左侧「网址检查」→ 逐个粘贴以下 URL 并点「请求编入索引」：
  - [ ] https://burnerdesignpro.com/
  - [ ] https://burnerdesignpro.com/flame-temperature
  - [ ] https://burnerdesignpro.com/insulation-calculator
  - [ ] https://burnerdesignpro.com/orifice-calculator
  - [ ] https://burnerdesignpro.com/fuel-manager
  - [ ] https://burnerdesignpro.com/emission
  - [ ] https://burnerdesignpro.com/efficiency
- [ ] 一周后回来：左侧「编制索引 → 网页」确认页面已被收录（目标：30 个 URL 全部收录）

## 第 3 步：Bing + IndexNow（⭐）

- [x] **IndexNow 批量提交已完成**（2026-11-25，14 个 URL 一次提交，返回 202 Accepted）✅
- [ ] 打开 https://www.bing.com/webmasters 登录（可用 Google 账号直接导入 Search Console 站点，最省事）
- [ ] 在 Bing 后台提交 sitemap.xml

## 第 4 步：数据与转化自测（本周，1 小时）

- [ ] 打开 https://analytics.google.com → 确认 G-XKBRLTVH6C 有实时数据（自己访问网站，看实时面板有没有 1 个用户）
- [ ] 在 GA4「管理 → 事件」中把 signup（注册）和 purchase（购买）标记为「关键事件/转化」
- [ ] ⭐ 用一个测试邮箱完整走一遍：注册 → 使用免费计算 → 点升级 → 进入 Creem 支付页 → 确认能到达真实付款界面（**不用真付款**）。如果任何一步卡住，截图发我，这可能就是零订单的直接原因
- [ ] 检查定价页：免费 20 次/月是否够用、Pro 版 $19/月 的价值点是否写清楚（PDF 导出、无限次）

## 第 5 步：外链建设（⭐流量核心，每周持续做）

新域名没有外链几乎不可能有排名。每周做 2-3 个，一个月见效：

- [ ] Product Hunt 提交产品：https://www.producthunt.com/posts/new （标题建议：BurnerDesignPro — Free engineering calculators for combustion & insulation）
- [ ] AlternativeTo 提交：https://alternativeto.net/software/burnerdesignpro/（作为 Aspen/Cantera/3E Plus 的轻量替代品提交）
- [ ] Reddit 回答问题时引用文章（先认真回答，文末附链接，不要硬广）：
  - [ ] r/ChemicalEngineering —— 回答 excess air / flame temperature 类问题 → 链到新文章
  - [ ] r/HVAC 或 r/MEPEngineering —— 保温厚度问题 → 链到 pipe-insulation-thickness-guide
  - [ ] r/MechanicalEngineering —— 孔板/流量问题 → 链到 orifice 文章
- [ ] Quora：搜 "excess air calculation"、"wobbe index"、"pipe insulation thickness"，写 3-5 个带链接的回答
- [ ] Eng-Tips 论坛（https://www.eng-tips.com）相关版块参与讨论并附工具链接
- [ ] LinkedIn：用公司主页发 6 篇新文章的英文介绍帖（每篇一条，间隔 2-3 天）

## 第 6 步：AI 搜索（GEO）专项（本月）

- [ ] 在 ChatGPT / Perplexity 里提问："how to calculate excess air from flue gas O2"、"adiabatic flame temperature of methane" → 看是否引用你的网站；两周后复查
- [ ] 把 llms-full.txt 链接发给做工程内容的博主/YouTuber，说明 AI 可直接读取（这是内容合作钩子）
- [ ] 每月发新文章后重新部署即可（llms.txt 会自动重新生成，无需手动维护）

## 第 7 步：每月例行（长期坚持）

- [ ] 每月 2-4 篇新文章（告诉我方向，我来写；优先写 Search Console「效果」里已有展示但排名 10-50 的词）
- [ ] 每月看一次 Search Console：展示量 / 点击量 / 收录量趋势
- [ ] 每月更新 sitemap 的 lastmod（我来做，你只要告诉我"更新 sitemap"）
- [ ] 检查 robots.txt 和 llms.txt 仍可访问

---

## 已完成的代码优化（不需要你操作，仅供了解）

- ✅ 6 篇长尾关键词博客文章 + FAQ 结构化内容
- ✅ 6 个工具页各 5 条 FAQ + FAQPage JSON-LD
- ✅ llms.txt / llms-full.txt（AI 搜索引擎可读全文，构建自动生成）
- ✅ robots.txt 放行 9 个 AI 爬虫
- ✅ Organization / WebSite / BreadcrumbList / BlogPosting 结构化数据
- ✅ 修复 title 重复拼接 bug、旧文章温度单位错误
- ✅ 路由懒加载（首屏提速）、sitemap 扩至 30 URL
- ✅ og-image.png 从 1.6MB 压缩到 191KB
- ✅ 全部已推送 GitHub main

## 预期时间线（供参考，不保证）

- 第 1-2 周：完成收录，Search Console 出现展示数据
- 第 1-2 月：长尾词开始有排名，外链开始起效
- 第 3 月起：稳定自然流量；若届时仍无订单，重点排查第 4 步的转化问题
