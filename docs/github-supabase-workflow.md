# GitHub + Supabase 上线流程

## 推荐分工

GitHub 用来管理网站版本：

- 页面代码
- 工具基础介绍
- 样式和交互
- 文档和数据库脚本

Supabase 用来管理线上动态数据和正式资源：

- 评论和点赞
- 许愿箱
- 图片、视频、安装包

## 第一次上线流程

1. 在 GitHub 创建仓库。
2. 把本项目推送到 GitHub。
3. 选择部署平台：
   - 最简单：GitHub Pages
   - 后续扩展更舒服：Vercel、Netlify 或 Cloudflare Pages
4. 在 Supabase 执行 `supabase/schema.sql`。
5. 填写 `assets/supabase-config.js`。
6. 上传资源到 Supabase Storage。
7. 把正式资源链接替换到 `content/tools.seed.json` 的 `src`、`url`、`downloadUrl` 字段。

## Storage 建议路径

```text
tool-images/{tool-slug}/cover.webp
tool-images/{tool-slug}/feature-01.webp
tool-videos/{tool-slug}/demo.mp4
tool-packages/{tool-slug}/release.zip
```

例子：

```json
{
  "kind": "image",
  "label": "点猫提示词助手界面",
  "src": "https://你的项目.supabase.co/storage/v1/object/public/tool-images/dianmao-prompt-assistant/cover.webp",
  "status": "uploaded"
}
```

## 安全提醒

- 可以公开：Project URL、anon public key、公开资源链接。
- 不能公开：service_role key、数据库密码、任何私人联系方式导出表。
- 安装包如果只给内部测试，先不要放到 public bucket。

## 内容更新方式

第一版建议用 GitHub 更新 `content/tools.seed.json`，每次更新都有版本记录。等工具数量和维护人员变多后，再把“内容维护”面板升级为登录后台，直接写入 Supabase。
