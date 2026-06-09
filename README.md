# AI制作工具箱

像素风 AI 制作工具箱网站，用于集中展示 HTML 工具、Chrome 插件、Codex Skill、制作方法、资源入口、匿名评论和许愿箱。

## 本地预览

```bash
python3 -m http.server 4173
```

打开：

```text
http://localhost:4173/
```

## GitHub 管什么

- 网站代码：`index.html`、`assets/app.js`、`assets/styles.css`
- 工具基础内容：`content/tools.seed.json`
- 文档导入后的原型图片：`assets/doc-images/doc-image-*.png`
- Supabase 数据库脚本：`supabase/schema.sql`
- 上线和资源维护说明：`docs/github-supabase-workflow.md`

## Supabase 管什么

- `tool-comments`：工具评论和“好用”点赞
- `wishbox-requests`：许愿箱需求
- `tool-images`：工具图片
- `tool-videos`：效果视频
- `tool-packages`：安装包、HTML 工具、Skill 包

## 连接 Supabase

1. 在 Supabase 后台打开 SQL Editor。
2. 执行 `supabase/schema.sql`。
3. 在 Project Settings 里复制 Project URL 和 anon public key。
4. 填到 `assets/supabase-config.js`：

```js
window.AI_TOOLBOX_SUPABASE = {
  enabled: true,
  url: "https://你的项目.supabase.co",
  anonKey: "你的 anon public key",
  buckets: {
    images: "tool-images",
    videos: "tool-videos",
    packages: "tool-packages"
  }
};
```

`anon public key` 可以用于前端公开页面；`service_role key` 不能放进 GitHub，也不能放进网页代码。
