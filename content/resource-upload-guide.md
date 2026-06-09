# 资源上传与飞书链接使用说明

## 先说结论

可以先用飞书文档里的快速链接，但建议只作为临时方案。

原因是：

- 飞书附件链接可能需要登录或访问权限，外部用户不一定能打开。
- 部分飞书预览或下载链接会带临时鉴权参数，后续可能失效。
- 图片和视频不一定能被网页直接嵌入播放，可能只能跳转打开。
- 如果网站要给团队外用户长期访问，最终建议统一上传到网站存储。

## 当前原型支持的资源字段

## 文档图片当前处理方式

我已经先把飞书文档里能看到的图片导入到了本地网站资源里：

- 图片位置：`assets/feishu-images/doc-image-01.png` 到 `assets/feishu-images/doc-image-74.png`
- 图片清单：`assets/feishu-images/manifest.json`
- 预览拼图：`assets/feishu-images/contact-sheet.jpg`

这些图片现在用 `src` 接入页面，可以在首页封面、详情页「核心功能图示」和「使用步骤图文 / 视频」里直接显示。需要注意：这一版是从飞书页面截图裁出来的图片，适合原型和内容排版确认；正式上线时建议把原始高清图片上传到 Supabase Storage、Cloudflare R2 或其他对象存储，再把 `src` 换成正式公开链接。

在 `content/tools.seed.json` 或网站「内容维护」面板里，每个工具资源可以这样填：

```json
{
  "kind": "package",
  "label": "点猫提示词助手下载.zip",
  "url": "https://你的飞书公开分享链接",
  "status": "external_link"
}
```

视频或图片可以这样填：

```json
{
  "kind": "video",
  "label": "效果演示",
  "duration": "03:51",
  "url": "https://你的飞书公开视频链接",
  "status": "external_link"
}
```

如果是可以直接嵌入播放的图片或视频直链，用 `src`：

```json
{
  "kind": "image",
  "label": "功能截图",
  "src": "https://example.com/demo.png",
  "status": "uploaded"
}
```

```json
{
  "kind": "video",
  "label": "完整使用视频",
  "src": "https://example.com/demo.mp4",
  "status": "uploaded"
}
```

## 推荐流程

1. 第一阶段：先用飞书公开链接
   - 在飞书中确认附件或视频对目标用户公开可访问。
   - 把链接填到资源的 `url` 字段。
   - 网站会显示「打开资源」或「打开外链」。

2. 第二阶段：统一迁移到网站存储
   - 安装包、HTML工具、Skill包上传到 Supabase Storage、Cloudflare R2 或对象存储。
   - 图片和视频上传到同一个存储空间，拿到公开访问链接。
   - 图片/视频直链填 `src`，安装包和外部页面填 `url`。

3. 第三阶段：接后台上传
   - 后台提供上传按钮。
   - 上传完成后自动写入 `url` 或 `src`。
   - 资源不再需要手动改 JSON。

## 字段选择

- `url`：适合下载包、飞书分享链接、外部教程页、不能直接嵌入的视频页。
- `src`：适合图片直链、MP4/WebM 视频直链，可以直接在页面中展示或播放。
- `downloadUrl`：适合安装包下载地址。
- `previewUrl`：适合效果预览页。

## 飞书链接使用注意

使用飞书链接前，最好用一个未登录飞书的浏览器窗口测试：

- 能否打开
- 能否下载
- 视频是否能播放
- 其他用户是否需要申请权限

如果需要登录或权限，就不适合作为公开网站资源链接。
