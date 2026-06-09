# Supabase Storage 资源上传清单

## Bucket 分工

- `tool-images`：工具截图、封面图、步骤图。
- `tool-videos`：效果演示视频、完整教程视频。
- `tool-packages`：HTML 工具、ZIP 安装包、Codex Skill 包、教程文件。

## 路径命名规则

统一使用工具 slug 建文件夹：

```text
tool-images/{tool-slug}/cover.webp
tool-images/{tool-slug}/feature-01.webp
tool-images/{tool-slug}/step-01.webp
tool-videos/{tool-slug}/demo.mp4
tool-packages/{tool-slug}/{file-name}
```

上传后复制 Public URL，再写回 `content/tools.seed.json`。

## 字段选择

- 图片直接显示：填 `src`
- 视频直接播放：填 `src`
- HTML 工具点击打开：填 `url`
- ZIP / Skill / 安装包下载：填 `downloadUrl`

## 当前资源清单

### 点猫提示词助手

slug：`dianmao-prompt-assistant`

图片：

- `tool-images/dianmao-prompt-assistant/cover.webp`
- `tool-images/dianmao-prompt-assistant/feature-url-entry.webp`
- `tool-images/dianmao-prompt-assistant/feature-prompt-insert.webp`
- `tool-images/dianmao-prompt-assistant/step-install-unzip.webp`
- `tool-images/dianmao-prompt-assistant/step-extension-pin.webp`

安装包：

- `tool-packages/dianmao-prompt-assistant/dianmao-prompt-assistant.zip`

### 常用提示词公式库

slug：`prompt-formula-library`

图片：

- `tool-images/prompt-formula-library/cover.webp`
- `tool-images/prompt-formula-library/feature-four-view.webp`
- `tool-images/prompt-formula-library/feature-storyboard.webp`

### Codex 自动加音效方法

slug：`codex-sound-effect-method`

图片：

- `tool-images/codex-sound-effect-method/cover.webp`
- `tool-images/codex-sound-effect-method/feature-audio-workflow.webp`

教程文件：

- `tool-packages/codex-sound-effect-method/codex-sound-effect-method.md`

### 自动加音效 HTML 工具

slug：`auto-sound-html`

图片：

- `tool-images/auto-sound-html/cover.webp`
- `tool-images/auto-sound-html/feature-xml-guide.webp`

HTML 工具：

- `tool-packages/auto-sound-html/quick-sound-4.html`

### 一键批量抠图 + 高清放大工具 2.0

slug：`batch-cutout-upscale`

图片：

- `tool-images/batch-cutout-upscale/cover.webp`
- `tool-images/batch-cutout-upscale/feature-batch-panel.webp`

安装包：

- `tool-packages/batch-cutout-upscale/batch-cutout-upscale.zip`

### 一键抠绿幕视频 + 高清放大工具 1.0

slug：`greenscreen-video-cutout`

图片：

- `tool-images/greenscreen-video-cutout/cover.webp`

后续建议补充：

- `tool-videos/greenscreen-video-cutout/demo.mp4`
- `tool-packages/greenscreen-video-cutout/greenscreen-video-cutout.zip`

### 积木自动排版工具

slug：`block-layout-tool`

图片：

- `tool-images/block-layout-tool/cover.webp`
- `tool-images/block-layout-tool/feature-drag-layout.webp`
- `tool-images/block-layout-tool/feature-result.webp`

HTML 工具：

- `tool-packages/block-layout-tool/block-layout-tool.html`

### Final Cut / Motion 集成 HTML 工具

slug：`finalcut-motion-html-bridge`

图片：

- `tool-images/finalcut-motion-html-bridge/cover.webp`
- `tool-images/finalcut-motion-html-bridge/feature-motion-package.webp`
- `tool-images/finalcut-motion-html-bridge/step-permission.webp`
- `tool-images/finalcut-motion-html-bridge/step-bind-folder.webp`

视频：

- `tool-videos/finalcut-motion-html-bridge/demo.mp4`

安装包：

- `tool-packages/finalcut-motion-html-bridge/plugin-package.zip`
- `tool-packages/finalcut-motion-html-bridge/miniapps.zip`

### 自动化 AI 录屏

slug：`ai-screen-recording-skill`

后续建议补充：

- `tool-images/ai-screen-recording-skill/cover.webp`
- `tool-videos/ai-screen-recording-skill/demo.mp4`
- `tool-packages/ai-screen-recording-skill/ai-screen-recording-skill.zip`

### ITV 自动打点工具

slug：`itv-auto-marker`

图片：

- `tool-images/itv-auto-marker/cover.webp`

视频：

- `tool-videos/itv-auto-marker/demo.mp4`

HTML 工具：

- `tool-packages/itv-auto-marker/itv-auto-marker.html`

## Supabase Public URL 格式

```text
https://mmdxptnrfcwfulutzoex.supabase.co/storage/v1/object/public/{bucket}/{path}
```

例子：

```text
https://mmdxptnrfcwfulutzoex.supabase.co/storage/v1/object/public/tool-videos/itv-auto-marker/demo.mp4
```
