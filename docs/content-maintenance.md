# AI制作工具箱内容维护流程

## 公开站权限边界

- 访客可以提交评论、点赞、许愿箱内容和工具投稿。
- 访客不能直接修改正式工具列表、页面文案、工具入口或 Supabase Storage 资源。
- 工具投稿只进入 `tool_submissions` 待审核表，不会自动出现在工具大厅。
- 公开站不会展示内容维护入口；维护入口只在本地预览地址加 `?admin=1` 时显示。

## 快捷维护方式

1. 本地打开预览服务。
2. 访问 `http://localhost:4173/index.html?admin=1`。
3. 点击顶部的“内容维护”。
4. 修改 JSON 后先在本地检查页面效果。
5. 点击“导出 JSON”。
6. 将导出的内容更新到 `content/tools.seed.json`。
7. 提交到 GitHub，并在 GitHub Desktop 点击 `Push origin`。

## 审核投稿

1. 打开 Supabase 后台。
2. 进入 Table Editor。
3. 查看 `tool_submissions` 表。
4. 过滤 `status = pending`。
5. 检查工具名称、简介、链接、图片链接和补充说明。
6. 审核通过后，把内容整理进 `content/tools.seed.json`。
7. 如果资源需要正式托管，再由你手动上传到 Supabase Storage 后替换链接。

## 资源策略

- 图片、HTML、安装包和视频由站点管理员上传或接入。
- 投稿用户只提交图片链接、文档链接、工具入口链接和安装包链接。
- 投稿页不开放视频上传，避免占用 Supabase 空间。
- 视频资源如需上线，先由管理员审核，再决定是否上传到 `tool-videos`。

## 推荐日常节奏

- 小改文案：用本地 `?admin=1` 快速改，导出后覆盖种子数据。
- 新增工具：先从 Supabase 投稿表审核，再整理为正式工具。
- 更新资源：先上传 Supabase Storage，再把正式链接接到工具详情页。
- 上线发布：通过 GitHub Desktop 提交并 Push，GitHub Pages 会自动发布。
