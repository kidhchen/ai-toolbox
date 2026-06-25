const seedUrl = "./content/tools.seed.json?v=20260625c";
const supabaseConfig = globalThis.AI_TOOLBOX_SUPABASE || {};
const supabaseApi = createSupabaseApi(supabaseConfig);
const commentSelectColumns = "id,tool_id,nickname,issue_type,content,likes,status,created_at";
const wishSelectColumns = "id,nickname,pain_point,preferred_format,current_workaround,priority,status,created_at";
const storageKeys = {
  data: "ai_toolbox_data_override",
  comments: "ai_toolbox_comments",
  wishes: "ai_toolbox_wishes",
  toolLikes: "ai_toolbox_tool_likes",
  theme: "ai_toolbox_theme"
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let adminPanel = null;
let dataEditor = null;
let adminMessage = null;
let lightboxKeyHandler = null;
let homeStrandsAnimation = null;
let spaceBackgroundAnimation = null;
let brandLogoAnimation = null;
let lastApprovedSubmissionLinks = [];

const state = {
  seed: null,
  data: null,
  query: "",
  category: "all",
  feedbackFilter: "all",
  theme: readJson(storageKeys.theme, "day"),
  comments: readJson(storageKeys.comments, {}),
  wishes: readJson(storageKeys.wishes, []),
  toolLikes: readJson(storageKeys.toolLikes, {}),
  backend: {
    mode: "local",
    label: "本地浏览器",
    error: null
  }
};

const functionalCategories = [
  {
    id: "text-tools",
    name: "文本工具",
    description: "提示词、剧本拆分、文案整理和内容结构化方法。"
  },
  {
    id: "video-processing",
    name: "视频处理",
    description: "处理视频剪辑、字幕、绿幕、标记、转场和软件联动。"
  },
  {
    id: "image-processing",
    name: "图片处理",
    description: "用于抠图、高清放大、换背景和视觉素材增强。"
  },
  {
    id: "audio-processing",
    name: "音频处理",
    description: "音效生成、配音整理、音频素材处理和声音工作流。"
  },
  {
    id: "workflow-automation",
    name: "自动化工作流",
    description: "把重复操作交给Codex、脚本或跨软件流程来完成。"
  }
];

const issueTypeLabels = {
  all: "全部反馈",
  none: "使用反馈",
  bug: "问题报告",
  improvement: "改进建议",
  question: "使用疑问"
};
const reviewSessionKey = "ai_toolbox_review_passcode";
const submissionStatusLabels = {
  all: "全部状态",
  pending: "待审核",
  approved: "已通过",
  rejected: "已退回",
  archived: "已归档"
};

const toolCategoryAssignments = {
  "dianmao-prompt-assistant": ["text-tools", "workflow-automation"],
  "promptpilot-prompt-assistant": ["text-tools", "workflow-automation"],
  "codex-sound-effect-method": ["audio-processing", "workflow-automation"],
  "auto-sound-html": ["audio-processing", "video-processing"],
  "batch-cutout-upscale": ["image-processing"],
  "block-layout-tool": ["text-tools", "image-processing"],
  "finalcut-motion-html-bridge": ["video-processing", "workflow-automation"],
  "fcpx-align-distribute-tool": ["video-processing", "workflow-automation"],
  "ai-screen-recording-skill": ["workflow-automation", "video-processing"],
  "ai-voice-redub-workflow": ["audio-processing", "workflow-automation"],
  "interactive-video-course-tool": ["video-processing", "workflow-automation"],
  "itv-auto-marker": ["video-processing", "workflow-automation"]
};

const legacyCategoryMap = {
  "prompt-workflows": ["text-tools"],
  "html-tools": ["workflow-automation"],
  "browser-extensions": ["workflow-automation"],
  "codex-skills": ["workflow-automation"],
  "editing-audio": ["audio-processing"],
  "asset-processing": ["image-processing"],
  automation: ["workflow-automation"]
};

const legacyDocumentHost = String.fromCharCode(109, 121, 46, 102, 101, 105, 115, 104, 117, 46, 99, 110);
const sourceDocumentLinks = {
  "itv-auto-marker": "https://alidocs.dingtalk.com/i/nodes/YMyQA2dXW792qoPNI5Nd40n0JzlwrZgb?utm_scene=team_space",
  "dianmao-prompt-assistant": "https://alidocs.dingtalk.com/i/nodes/amweZ92PV6v25O1jCM0Gzq5bVxEKBD6p?utm_scene=team_space",
  "promptpilot-prompt-assistant": "https://alidocs.dingtalk.com/i/nodes/Y1OQX0akWm3ZvBRQfbGG4jmQJGlDd3mE?utm_scene=person_space",
  "codex-sound-effect-method": "https://alidocs.dingtalk.com/i/nodes/gwva2dxOW4K2Pkbgf0MLdQ5z8bkz3BRL?utm_scene=team_space",
  "auto-sound-html": "https://alidocs.dingtalk.com/i/nodes/amweZ92PV6v25O1jCKBnRg4xVxEKBD6p?utm_scene=team_space",
  "batch-cutout-upscale": "https://alidocs.dingtalk.com/i/nodes/20eMKjyp81RkyMbvUeNlzzlxWxAZB1Gv?utm_scene=person_space",
  "block-layout-tool": "https://alidocs.dingtalk.com/i/nodes/ZgpG2NdyVXrAYQbpIPNrOOd48MwvDqPk?utm_scene=team_space",
  "finalcut-motion-html-bridge": "https://alidocs.dingtalk.com/i/nodes/R1zknDm0WR3Amzdgf0Mond4EVBQEx5rG?utm_scene=team_space",
  "fcpx-align-distribute-tool": "https://alidocs.dingtalk.com/i/nodes/mExel2BLV542wgbMtPMx9apOWgk9rpMq?utm_scene=team_space",
  "ai-voice-redub-workflow": "https://alidocs.dingtalk.com/i/nodes/AR4GpnMqJzMvaO3QikYYmXaoVKe0xjE3?utm_scene=team_space",
  "ai-screen-recording-skill": "https://alidocs.dingtalk.com/i/nodes/lyQod3RxJK3gkQdwforrA6elJkb4Mw9r?utm_scene=team_space",
  "interactive-video-course-tool": "https://alidocs.dingtalk.com/i/nodes/NZQYprEoWoe2DPmQtBjj9KPGJ1waOeDk?utm_scene=team_space"
};
const authoritativeSeedTools = new Set([
  "dianmao-prompt-assistant",
  "promptpilot-prompt-assistant",
  "itv-auto-marker",
  "codex-sound-effect-method",
  "auto-sound-html",
  "batch-cutout-upscale",
  "block-layout-tool",
  "finalcut-motion-html-bridge",
  "fcpx-align-distribute-tool",
  "ai-voice-redub-workflow",
  "ai-screen-recording-skill",
  "interactive-video-course-tool"
]);

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createSupabaseApi(config) {
  const url = String(config?.url || "").replace(/\/+$/, "");
  const anonKey = String(config?.anonKey || "");
  const enabled = config?.enabled === true || Boolean(url && anonKey && config?.enabled !== false);
  if (!enabled || !url || !anonKey) return null;

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json"
  };

  async function request(path, options = {}) {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    });
    if (!response.ok) {
      const details = await response.text();
      throw new Error(details || `Supabase 请求失败：${response.status}`);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  return {
    async listComments() {
      const rows = await request(
        `tool_comments?select=${commentSelectColumns}&status=eq.visible&order=created_at.desc`
      );
      return rows.map(mapCommentRow);
    },
    async createComment(toolId, comment) {
      const rows = await request(`tool_comments?select=${commentSelectColumns}`, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          tool_id: toolId,
          nickname: comment.nickname,
          issue_type: comment.issueType,
          content: comment.content,
          likes: 0,
          status: "visible"
        })
      });
      return mapCommentRow(rows[0]);
    },
    async likeComment(commentId) {
      const rows = await request("rpc/increment_comment_likes", {
        method: "POST",
        body: JSON.stringify({ comment_id: commentId })
      });
      return mapCommentRow(Array.isArray(rows) ? rows[0] : rows);
    },
    async listWishes() {
      const rows = await request(
        `wishbox_requests?select=${wishSelectColumns}&status=eq.new&order=created_at.desc`
      );
      return rows.map(mapWishRow);
    },
    async createWish(wish) {
      const rows = await request(`wishbox_requests?select=${wishSelectColumns}`, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          nickname: wish.nickname,
          pain_point: wish.painPoint,
          preferred_format: wish.preferredFormat,
          current_workaround: wish.currentWorkaround,
          priority: wish.priority,
          contact: wish.contact,
          status: "new"
        })
      });
      return mapWishRow(rows[0]);
    },
    async createToolSubmission(submission) {
      await request("tool_submissions", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          nickname: submission.nickname,
          contact: submission.contact,
          tool_name: submission.toolName,
          category_id: submission.categoryId,
          tool_type: submission.toolType,
          summary: submission.summary,
          pain_point: submission.painPoint,
          usage_steps: submission.usageSteps,
          tool_url: submission.toolUrl,
          doc_url: submission.docUrl,
          package_url: submission.packageUrl,
          image_urls: submission.imageUrls,
          notes: submission.notes,
          status: "pending"
        })
      });
      return true;
    },
    async listToolSubmissions(reviewPasscode, statusFilter = "pending") {
      const rows = await request("rpc/review_tool_submissions", {
        method: "POST",
        body: JSON.stringify({
          review_passcode: reviewPasscode,
          status_filter: statusFilter
        })
      });
      return rows.map(mapSubmissionRow);
    },
    async updateToolSubmissionStatus(reviewPasscode, submissionIds, nextStatus) {
      const rows = await request("rpc/update_tool_submission_status", {
        method: "POST",
        body: JSON.stringify({
          review_passcode: reviewPasscode,
          submission_ids: submissionIds,
          next_status: nextStatus
        })
      });
      return rows.map(mapSubmissionRow);
    }
  };
}

function mapCommentRow(row) {
  return {
    id: row.id,
    toolId: row.tool_id,
    nickname: row.nickname || "匿名玩家",
    issueType: row.issue_type || "none",
    content: row.content || "",
    likes: Number(row.likes || 0),
    createdAt: row.created_at || new Date().toISOString(),
    status: row.status || "visible"
  };
}

function mapWishRow(row) {
  return {
    id: row.id,
    nickname: row.nickname || "匿名玩家",
    painPoint: row.pain_point || "",
    preferredFormat: row.preferred_format || "unsure",
    currentWorkaround: row.current_workaround || "",
    priority: row.priority || "normal",
    createdAt: row.created_at || new Date().toISOString(),
    status: row.status || "new"
  };
}

function mapSubmissionRow(row) {
  return {
    id: row.id,
    nickname: row.nickname || "匿名投稿",
    contact: row.contact || "",
    toolName: row.tool_name || "待抓取工具",
    categoryId: row.category_id || "workflow-automation",
    toolType: row.tool_type || "method",
    summary: row.summary || "",
    painPoint: row.pain_point || "",
    usageSteps: row.usage_steps || "",
    toolUrl: row.tool_url || "",
    docUrl: row.doc_url || "",
    packageUrl: row.package_url || "",
    imageUrls: row.image_urls || [],
    notes: row.notes || "",
    status: row.status || "pending",
    createdAt: row.created_at || new Date().toISOString()
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusLabel(status) {
  const map = {
    published: "已上线",
    in_development: "开发中",
    iterating: "持续迭代"
  };
  return map[status] || status || "待补充";
}

function typeLabel(type) {
  const map = {
    chrome_extension: "Chrome插件",
    method_collection: "方法合集",
    method: "制作方法",
    html_tool: "HTML工具",
    workflow_package: "工作流包",
    codex_skill: "Codex Skill"
  };
  return map[type] || type || "工具";
}

function categoryName(id) {
  return state.data.categories.find((item) => item.id === id)?.name || "未分类";
}

function toolCategoryIds(tool) {
  return tool.categoryIds?.length ? tool.categoryIds : [tool.categoryId].filter(Boolean);
}

function toolInCategory(tool, categoryId) {
  return toolCategoryIds(tool).includes(categoryId);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function setRouteActive(routeName) {
  document.querySelectorAll(".nav-link[data-route]").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.route === routeName);
  });
}

function siteFooter() {
  return `
    <footer class="site-footer">
      <span>原文链接：<a href="https://alidocs.dingtalk.com/i/nodes/P7QG4Yx2Jp7egOmQHgmlobKvV9dEq3XD?utm_scene=team_space" target="_blank" rel="noopener noreferrer">AI制作工具箱知识库</a></span>
      <span>© 2026 猫厂课程制作部/视频组</span>
      <span>联系方式：chenqiting@codemao.cn</span>
      <span>网站为猫厂内部使用哦</span>
    </footer>
  `;
}

function setAppHtml(markup) {
  app.innerHTML = `${markup}${siteFooter()}`;
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("clearLocal") === "1") {
    Object.values(storageKeys).forEach((key) => localStorage.removeItem(key));
    state.comments = {};
    state.wishes = [];
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
  }

  try {
    const response = await fetch(seedUrl);
    state.seed = await response.json();
  } catch (error) {
    app.innerHTML = `
      <section class="empty-state">
        <h1>数据加载失败</h1>
        <p>请通过本地预览服务打开网站，这样浏览器才能读取内容数据。</p>
      </section>
    `;
    return;
  }

  const storedData = readJson(storageKeys.data, null);
  state.data = normalizeData(mergeSeedUpdates(storedData || state.seed));
  await loadRemoteFeedback();
  bindChrome();
  updateBackendStatus();
  window.addEventListener("hashchange", render);
  render();
}

async function loadRemoteFeedback() {
  if (!supabaseApi) return;

  try {
    const [comments, wishes] = await Promise.all([
      supabaseApi.listComments(),
      supabaseApi.listWishes()
    ]);
    state.comments = comments.reduce((grouped, comment) => {
      grouped[comment.toolId] = grouped[comment.toolId] || [];
      grouped[comment.toolId].push(comment);
      return grouped;
    }, {});
    state.wishes = wishes;
    state.backend = {
      mode: "supabase",
      label: "Supabase 在线同步",
      error: null
    };
    writeJson(storageKeys.comments, state.comments);
    writeJson(storageKeys.wishes, state.wishes);
  } catch (error) {
    state.backend = {
      mode: "local",
      label: "本地浏览器",
      error: error.message
    };
  }
}

function updateBackendStatus() {
  const status = document.querySelector("#backend-status");
  if (!status) return;
  const suffix = state.backend.error ? "；在线后台暂未连接，已自动使用本地模式。" : "。";
  status.textContent = `当前后台：${state.backend.label}${suffix}`;
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function shouldUseSeedMedia(current) {
  if (!current) return true;
  const list = Array.isArray(current) ? current : [current];
  return !list.length || list.every((item) => String(item?.status || "").startsWith("imported_from_"));
}

function hasUsableResourceLink(item) {
  return Boolean(item?.src || item?.url || item?.downloadUrl || item?.previewUrl);
}

function shouldUseSeedResource(seedItem) {
  return seedItem?.status === "uploaded" && hasUsableResourceLink(seedItem);
}

function itemsMatch(currentItem, seedItem) {
  const currentLabel = String(currentItem?.label || "").trim();
  const seedLabel = String(seedItem?.label || "").trim();
  const currentOriginal = String(currentItem?.originalLabel || "").trim();
  const seedOriginal = String(seedItem?.originalLabel || "").trim();

  return Boolean(
    currentLabel && currentLabel === seedLabel
    || currentOriginal && currentOriginal === seedLabel
    || seedOriginal && seedOriginal === currentLabel
    || currentItem?.kind && currentItem.kind === seedItem?.kind && currentLabel && currentLabel === seedLabel
  );
}

function mergeSeedList(currentItems = [], seedItems = []) {
  const nextItems = cloneValue(Array.isArray(currentItems) ? currentItems : []);

  seedItems.filter(shouldUseSeedResource).forEach((seedItem) => {
    const existingIndex = nextItems.findIndex((currentItem) => itemsMatch(currentItem, seedItem));
    if (existingIndex >= 0) {
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        ...cloneValue(seedItem)
      };
      return;
    }

    nextItems.push(cloneValue(seedItem));
  });

  return nextItems;
}

function mergeSeedUpdates(data) {
  const nextData = cloneValue(data || state.seed);
  const seedTools = new Map((state.seed?.tools || []).map((tool) => [tool.id || tool.slug, tool]));
  const seedToolKeys = new Set(seedTools.keys());
  nextData.tools = (nextData.tools || []).filter((tool) => seedToolKeys.has(tool.id || tool.slug));
  const currentToolKeys = new Set(nextData.tools.map((tool) => tool.id || tool.slug));
  (state.seed?.tools || []).forEach((seedTool) => {
    const key = seedTool.id || seedTool.slug;
    if (!currentToolKeys.has(key)) {
      nextData.tools.push(cloneValue(seedTool));
    }
  });

  nextData.tools?.forEach((tool) => {
    const seedTool = seedTools.get(tool.id || tool.slug);
    if (!seedTool) return;

    if (authoritativeSeedTools.has(seedTool.id)) {
      [
        "name",
        "summary",
        "developer",
        "status",
        "type",
        "targetUsers",
        "painPoints",
        "features",
        "usageSteps",
        "coverImage",
        "featureMedia",
        "featuresTitle",
        "stepsTitle",
        "stepMediaTitle",
        "methodsTitle",
        "methods",
        "documentSections",
        "sourceMeta",
        "stepMedia",
        "resources",
        "tags",
        "version",
        "detailStyle"
      ].forEach((key) => {
        if (seedTool[key] !== undefined) {
          tool[key] = cloneValue(seedTool[key]);
        }
      });
    }

    ["coverImage", "featureMedia", "stepMedia"].forEach((key) => {
      if (seedTool[key] && shouldUseSeedMedia(tool[key])) {
        tool[key] = cloneValue(seedTool[key]);
      }
    });

    tool.resources = mergeSeedList(tool.resources, seedTool.resources);
    tool.media = mergeSeedList(tool.media, seedTool.media);
  });

  return nextData;
}

function normalizeData(data) {
  const nextData = cloneValue(data || state.seed);
  nextData.categories = functionalCategories;

  nextData.tools?.forEach((tool) => {
    const assigned = toolCategoryAssignments[tool.id];
    const legacy = legacyCategoryMap[tool.categoryId];
    const categoryIds = assigned || tool.categoryIds || legacy || [tool.categoryId].filter(Boolean);
    tool.categoryIds = Array.from(new Set(categoryIds));
    tool.categoryId = tool.categoryIds[0] || "workflow-automation";
    tool.resources = withSourceDocumentResource(tool);
  });

  const codexSoundTool = nextData.tools?.find((tool) => tool.id === "codex-sound-effect-method");
  if (codexSoundTool) {
    codexSoundTool.type = "codex_skill";
    codexSoundTool.tags = Array.from(new Set([...(codexSoundTool.tags || []), "Codex Skill"]));
  }
  if (nextData.commentSchema) {
    delete nextData.commentSchema.rating;
    nextData.commentSchema.likes = "number";
  }
  nextData.tools?.sort((a, b) => getToolUpdateTime(b) - getToolUpdateTime(a));
  return nextData;
}

function getToolUpdateTime(tool) {
  return Number(tool?.sourceMeta?.updateTime || tool?.updatedAt || tool?.createdAt || 0);
}

function withSourceDocumentResource(tool) {
  const resources = cleanSourceResources(tool.resources);
  const url = sourceDocumentLinks[tool.id];
  if (!url || resources.some((item) => item.kind === "source_doc" || item.url === url || item.href === url)) {
    return resources;
  }
  return [
    {
      kind: "source_doc",
      label: "图文说明 / 资源入口",
      url,
      status: "external_link"
    },
    ...resources
  ];
}

function cleanSourceResources(resources) {
  return (Array.isArray(resources) ? resources : []).filter((item) => {
    const url = String(item?.url || item?.href || item?.downloadUrl || item?.previewUrl || item?.src || "");
    return !url.includes(legacyDocumentHost);
  });
}

function bindChrome() {
  bindThemeToggle();
  startBrandLogo();
  mountReviewShortcut();
  mountLocalMaintenance();
}

function isReviewAccessRequested() {
  const params = new URLSearchParams(window.location.search);
  return params.get("admin") === "1";
}

function mountReviewShortcut() {
  if (!isReviewAccessRequested() || document.querySelector('[data-route="review"]')) return;
  const themeToggle = document.querySelector("#theme-toggle");
  const html = '<a href="#/review" class="nav-link" data-route="review">投稿审核</a>';
  if (themeToggle) {
    themeToggle.insertAdjacentHTML("beforebegin", html);
    return;
  }
  document.querySelector(".topnav")?.insertAdjacentHTML("beforeend", html);
}

function startBrandLogo() {
  if (brandLogoAnimation) return;
  const canvas = document.querySelector("#brand-logo-canvas");
  if (!canvas) return;
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false
  }) || canvas.getContext("experimental-webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false
  });
  if (!gl) return;

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  let frameId = 0;

  const vertexSource = `
    attribute vec2 aPosition;

    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uNight;

    const float PI = 3.141592653589793;

    vec3 palette(float t) {
      vec3 pink = vec3(0.925, 0.282, 0.725);
      vec3 violet = vec3(0.486, 0.227, 0.929);
      vec3 cyan = vec3(0.024, 0.714, 0.831);
      t = fract(t);
      if (t < 0.333) return mix(pink, violet, t / 0.333);
      if (t < 0.666) return mix(violet, cyan, (t - 0.333) / 0.333);
      return mix(cyan, pink, (t - 0.666) / 0.334);
    }

    vec3 strands(vec2 p) {
      vec2 uv = p / 1.3;
      float intensity = 0.5;
      float e = 0.06 + intensity * 0.94;
      float env = pow(max(cos(uv.x * PI * 1.3), 0.0), 3.7);
      vec3 col = vec3(0.0);

      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float phase = fi * 1.7 * 1.3;
        float freq = (2.0 + fi * 0.35) * 1.8;
        float spd = 1.4 + fi * 1.2;
        float tt = uTime * 0.3;
        float wave = sin(uv.x * freq + tt * spd + phase) * 0.60
          + sin(uv.x * freq * 1.1 - tt * spd * 0.7 + phase * 1.7) * 0.40;
        float amp = (0.1 + 0.02 * e) * env * 0.4;
        float y = wave * amp + (fi - 1.0) * 0.030;
        float d = abs(uv.y - y);
        float thick = (0.001 + 0.05 * e) * (0.35 + env) * 0.5;
        float g = thick / (d + thick * 0.45);
        g *= g;
        float h = fi / 3.0 + uv.x * 0.30 + uTime * 0.04;
        col += palette(h) * g * env;
      }

      col *= 0.45 + 0.7 * e;
      col = 1.0 - exp(-col * 1.35);
      float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = max(mix(vec3(gray), col, 1.5), 0.0);
      return col * mix(0.92, 1.12, uNight);
    }

    void main() {
      vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
      float d = length(p);
      float radius = 0.47;
      float edge = 0.018;
      float mask = 1.0 - smoothstep(radius - edge, radius + edge, d);
      if (mask <= 0.0) {
        gl_FragColor = vec4(0.0);
        return;
      }

      vec2 dir = d > 0.0 ? p / d : vec2(0.0);
      float nd = d / radius;
      float lens = smoothstep(0.72, 1.0, nd) * pow(nd, 4.0);
      vec2 offset = -dir * lens * 0.05 * 0.6;
      vec2 disp = -dir * lens * 0.010 * 0.85;

      vec3 light;
      light.r = strands(p + offset - disp).r;
      light.g = strands(p + offset).g;
      light.b = strands(p + offset + disp).b;

      float z = sqrt(max(radius * radius - d * d, 0.0)) / radius;
      float fresnel = pow(1.0 - z, 3.0);
      vec3 rim = mix(vec3(1.0), vec3(0.84, 1.0, 0.96), uNight) * fresnel * 0.24;
      vec3 body = mix(vec3(0.95, 0.98, 1.0), vec3(0.05, 0.08, 0.12), uNight) * (0.05 + fresnel * 0.08);
      vec3 color = light + rim + body;
      float alpha = mask * clamp(max(max(color.r, color.g), color.b) * 0.86 + 0.12 + fresnel * 0.12, 0.0, 0.96);

      gl_FragColor = vec4(color * mask, alpha);
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    3, -1,
    -1, 3
  ]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const uniforms = {
    time: gl.getUniformLocation(program, "uTime"),
    resolution: gl.getUniformLocation(program, "uResolution"),
    night: gl.getUniformLocation(program, "uNight")
  };

  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function draw(timestamp = 0) {
    gl.useProgram(program);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.time, timestamp * 0.001);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.night, document.documentElement.dataset.theme === "night" ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!reducedMotion) {
      frameId = requestAnimationFrame(draw);
    }
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
  brandLogoAnimation = () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  };
}

function bindThemeToggle() {
  applyTheme(state.theme);
  document.querySelector("#theme-toggle")?.addEventListener("click", () => {
    state.theme = state.theme === "night" ? "day" : "night";
    writeJson(storageKeys.theme, state.theme);
    applyTheme(state.theme);
  });
}

function applyTheme(theme) {
  const nextTheme = theme === "night" ? "night" : "day";
  state.theme = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  syncSpaceBackground(nextTheme);
  const button = document.querySelector("#theme-toggle");
  if (!button) return;
  button.textContent = nextTheme === "night" ? "白天版" : "夜晚版";
  button.setAttribute("aria-pressed", String(nextTheme === "night"));
}

function syncSpaceBackground(theme) {
  if (theme === "night") {
    startSpaceBackground();
    return;
  }
  stopSpaceBackground();
}

function stopSpaceBackground() {
  if (!spaceBackgroundAnimation) return;
  spaceBackgroundAnimation();
  spaceBackgroundAnimation = null;
}

function startSpaceBackground() {
  if (spaceBackgroundAnimation) return;
  const canvas = document.querySelector("#space-canvas");
  if (!canvas) return;
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false
  }) || canvas.getContext("experimental-webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false
  });
  if (!gl) return;

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const pointer = { x: 0.35, y: 0.65 };
  let frameId = 0;

  const vertexSource = `
    attribute vec2 aPosition;

    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uPointer;

    float hash21(vec2 p) {
      p = fract(p * vec2(213.21, 417.37));
      p += dot(p, p + 42.23);
      return fract(p.x * p.y);
    }

    float star(vec2 uv, float scale, float threshold, float size) {
      vec2 cell = floor(uv * scale);
      vec2 local = fract(uv * scale) - 0.5;
      float seed = hash21(cell);
      float pulse = 0.6 + 0.4 * sin(uTime * (1.0 + seed * 2.0) + seed * 6.2831);
      return smoothstep(size, 0.0, length(local)) * step(threshold, seed) * pulse;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
      vec2 screen = gl_FragCoord.xy / uResolution;
      vec2 drift = vec2(uTime * 0.006, -uTime * 0.004);
      vec2 field = uv + drift;

      vec3 color = vec3(0.010, 0.012, 0.030);
      color += vec3(0.015, 0.030, 0.070) * smoothstep(1.35, 0.0, length(uv * vec2(0.72, 1.18)));
      color += vec3(0.042, 0.006, 0.070) * smoothstep(1.05, 0.0, length(uv - vec2(-0.42, 0.10))) * 0.72;
      color += vec3(0.000, 0.120, 0.095) * smoothstep(0.88, 0.0, length(uv - vec2(0.48, -0.18))) * 0.34;
      color += vec3(0.015, 0.018, 0.032) * sin((uv.x + uv.y) * 1.7 + uTime * 0.08) * 0.08;

      float stars = 0.0;
      stars += star(field + vec2(0.0, uTime * 0.008), 48.0, 0.956, 0.040);
      stars += star(field * 1.21 - vec2(uTime * 0.010, 0.0), 92.0, 0.976, 0.034) * 0.82;
      stars += star(field * 0.68 + vec2(0.13, -0.21), 24.0, 0.938, 0.052) * 0.55;

      float mouseGlow = exp(-pow(distance(screen, uPointer), 2.0) * 11.0);
      color += vec3(0.00, 0.72, 0.54) * mouseGlow * 0.12;
      color += vec3(0.44, 0.16, 0.88) * mouseGlow * 0.08;
      color += vec3(0.76, 0.93, 1.00) * stars;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const uniforms = {
    time: gl.getUniformLocation(program, "uTime"),
    resolution: gl.getUniformLocation(program, "uResolution"),
    pointer: gl.getUniformLocation(program, "uPointer")
  };

  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.clearColor(0, 0, 0, 0);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function updatePointer(event) {
    pointer.x = event.clientX / Math.max(1, window.innerWidth);
    pointer.y = 1 - event.clientY / Math.max(1, window.innerHeight);
  }

  function draw(timestamp = 0) {
    gl.useProgram(program);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.time, timestamp * 0.001);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reducedMotion) frameId = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", updatePointer);
  spaceBackgroundAnimation = () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", updatePointer);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  };
}

function render() {
  stopHomeStrands();
  document.body.classList.remove("home-page", "tool-detail-page", "source-doc-page", "app-page", "feedback-page", "submit-page", "wishbox-page", "review-page");
  const hash = window.location.hash || "#/";
  if (hash.startsWith("#/tool/")) {
    setRouteActive("home");
    const slug = decodeURIComponent(hash.replace("#/tool/", ""));
    renderTool(slug);
    return;
  }

  if (hash.startsWith("#/submit")) {
    setRouteActive("submit");
    renderSubmissionPage();
    return;
  }

  if (hash.startsWith("#/review")) {
    setRouteActive("review");
    renderSubmissionReviewPage();
    return;
  }

  if (hash.startsWith("#/feedback")) {
    setRouteActive("feedback");
    renderFeedbackBoard();
    return;
  }

  if (hash.startsWith("#/wishbox")) {
    setRouteActive("wishbox");
    renderWishbox();
    return;
  }

  setRouteActive("home");
  renderHome();
}

function renderHome() {
  document.body.classList.add("home-page");
  const tools = filteredTools();
  const categories = state.data.categories;

  setAppHtml(`
    <section class="screen gallery-home">
      <section class="gallery-hero">
        <video class="gallery-hero__video" src="./assets/hero/day-loop.mp4" autoplay muted loop playsinline aria-hidden="true"></video>
        <canvas class="strands-canvas" id="strands-canvas" aria-hidden="true"></canvas>
        <div class="gallery-hero__copy">
          <p class="eyebrow">AI TOOLBOX</p>
          <h1>猫厂AI制作工具箱</h1>
          <p>这里收集了实用的AI工具，制作方法和工作流，助力各位每周少上半天班。</p>
        </div>
      </section>

      <section class="home-discovery" aria-label="工具分类和搜索">
        <div class="home-discovery__head">
          <div>
            <h2>工具分类</h2>
          </div>
          <label class="gallery-search" for="search-input">
            <span>搜索</span>
            <input class="search-input" id="search-input" type="search" value="${escapeHtml(state.query)}" placeholder="工具名、用途或标签">
          </label>
        </div>

        <div class="category-rail">
          ${categoryButton("all", "全部工具", state.data.tools.length, false)}
          ${categories.map((category) => categoryButton(
            category.id,
            category.name,
            state.data.tools.filter((tool) => toolInCategory(tool, category.id)).length,
            false
          )).join("")}
        </div>
      </section>

      ${homeResultsPanel(tools)}
    </section>
  `);

  document.querySelector("#search-input").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderHomeResults();
  });

  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      renderHome();
    });
  });

  startHomeStrands();
}

function stopHomeStrands() {
  if (!homeStrandsAnimation) return;
  homeStrandsAnimation();
  homeStrandsAnimation = null;
}

function startHomeStrands() {
  stopHomeStrands();
  const canvas = document.querySelector("#strands-canvas");
  if (!canvas) return;
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false
  }) || canvas.getContext("experimental-webgl", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false
  });
  if (!gl) return;

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const palette = new Float32Array([
    0.976, 0.357, 0.086,
    0.486, 0.227, 0.929,
    0.024, 0.714, 0.831,
    0.267, 0.843, 0.659
  ]);
  let frameId = 0;
  let width = 1;
  let height = 1;
  const pointer = { x: 2, y: 2 };

  const vertexSource = `
    attribute vec2 aPosition;

    void main() {
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;

    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uPointer;
    uniform float uNight;
    uniform vec3 uColors[4];

    const float PI = 3.141592653589793;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 345.45));
      p += dot(p, p + 34.345);
      return fract(p.x * p.y);
    }

    vec3 palette(float t) {
      t = fract(t);
      if (t < 0.25) return mix(uColors[0], uColors[1], t / 0.25);
      if (t < 0.50) return mix(uColors[1], uColors[2], (t - 0.25) / 0.25);
      if (t < 0.75) return mix(uColors[2], uColors[3], (t - 0.50) / 0.25);
      return mix(uColors[3], uColors[0], (t - 0.75) / 0.25);
    }

    float starLayer(vec2 uv, float scale, float threshold) {
      vec2 cell = floor(uv * scale);
      vec2 local = fract(uv * scale) - 0.5;
      float seed = hash21(cell);
      float radius = 0.035 + seed * 0.035;
      float twinkle = 0.55 + 0.45 * sin(uTime * (1.4 + seed) + seed * 6.2831);
      return smoothstep(radius, 0.0, length(local)) * step(threshold, seed) * twinkle;
    }

    float strand(vec2 uv, float index, float env) {
      float t = uTime * (0.58 + index * 0.08);
      float phase = index * 1.65;
      float wave = sin(uv.x * (2.15 + index * 0.28) + t * 1.7 + phase) * 0.62;
      wave += sin(uv.x * (3.85 + index * 0.22) - t * 1.1 + phase * 1.7) * 0.38;
      float amplitude = mix(0.135, 0.16, uNight) * env;
      float y = wave * amplitude + (index - 1.5) * 0.018 * (0.8 + env);
      float d = abs(uv.y - y);
      float thickness = (0.006 + 0.013 * env) * mix(1.02, 1.14, uNight);
      float core = thickness / (d + thickness * 0.46);
      float halo = exp(-d * d / (thickness * 0.32)) * mix(0.036, 0.16, uNight);
      return core * core * env * mix(1.04, 1.0, uNight) + halo * env;
    }

    void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
      float heroAspect = uResolution.x / uResolution.y;
      vec2 beamUv = uv - vec2(heroAspect * 0.22, -0.015);

      float env = pow(max(cos(beamUv.x * PI * 0.86), 0.0), 3.4);
      env *= smoothstep(-heroAspect * 0.18, heroAspect * 0.10, uv.x);
      vec3 beam = vec3(0.0);

      for (int i = 0; i < 4; i++) {
        float fi = float(i);
        float energy = strand(beamUv, fi, env);
        vec3 color = palette(fi * 0.19 + beamUv.x * 0.18 + uTime * 0.035);
        beam += color * energy * mix(0.58 + env * 0.70, 0.55 + env * 0.74, uNight);
      }

      beam = 1.0 - exp(-beam * mix(2.18, 2.45, uNight));

      float pointerGlow = exp(-pow(distance(uv, uPointer), 2.0) * 8.0);
      beam += vec3(0.00, 0.94, 0.66) * pointerGlow * 0.08 * uNight;
      beam += vec3(0.45, 0.18, 0.95) * pointerGlow * 0.04 * uNight;

      vec3 color = beam * mix(1.16, 1.12, uNight);
      float lum = max(max(beam.r, beam.g), beam.b);
      float alpha = clamp(lum * mix(0.94, 1.06, uNight), 0.0, 0.96);

      gl_FragColor = vec4(color, alpha);
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    3, -1,
    -1, 3
  ]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const uniforms = {
    time: gl.getUniformLocation(program, "uTime"),
    resolution: gl.getUniformLocation(program, "uResolution"),
    pointer: gl.getUniformLocation(program, "uPointer"),
    night: gl.getUniformLocation(program, "uNight"),
    colors: gl.getUniformLocation(program, "uColors[0]")
  };

  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform3fv(uniforms.colors, palette);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    pointer.x = (x - rect.width * 0.5) / rect.height;
    pointer.y = (rect.height * 0.5 - y) / rect.height;
  }

  function resetPointer() {
    pointer.x = 2;
    pointer.y = 2;
  }

  function draw(timestamp = 0) {
    gl.useProgram(program);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.time, timestamp * 0.001);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
    gl.uniform1f(uniforms.night, document.documentElement.dataset.theme === "night" ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!reducedMotion) {
      frameId = requestAnimationFrame(draw);
    }
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
  canvas.addEventListener("pointermove", updatePointer);
  canvas.addEventListener("pointerleave", resetPointer);
  homeStrandsAnimation = () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", resize);
    canvas.removeEventListener("pointermove", updatePointer);
    canvas.removeEventListener("pointerleave", resetPointer);
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  };
}

function homeResultsPanel(tools = filteredTools()) {
  const selectedCategory = state.data.categories.find((category) => category.id === state.category);
  const title = selectedCategory?.name || "全部工具";
  const description = selectedCategory?.description || "从截图快速浏览工具，点击卡片进入详情。";
  const queryText = state.query.trim();

  return `
    <section class="home-results">
      <div class="home-results__head">
        <div>
          <p class="eyebrow">TOOL GALLERY</p>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(queryText ? `正在搜索：${queryText}` : description)}</p>
        </div>
        ${tools.length ? "" : `<span class="result-hint">没有匹配结果</span>`}
      </div>
      ${tools.length ? `<div class="tool-grid">${tools.map(toolCard).join("")}</div>` : emptyState("没有匹配的工具", "换个关键词或分类再试一次。")}
    </section>
  `;
}

function renderHomeResults() {
  const panel = document.querySelector(".home-results");
  if (!panel) return;
  panel.outerHTML = homeResultsPanel();
}

function categoryButton(id, label, count, showCount = true) {
  return `
    <button class="chip-button ${state.category === id ? "is-active" : ""}" type="button" data-category="${escapeHtml(id)}">
      <span>${escapeHtml(label)}</span>
      ${showCount ? `<span class="chip-count">${count}</span>` : ""}
    </button>
  `;
}

function filteredTools() {
  const q = state.query.trim().toLowerCase();
  return state.data.tools.filter((tool) => {
    const inCategory = state.category === "all" || toolInCategory(tool, state.category);
    const haystack = [
      tool.name,
      tool.summary,
      tool.developer,
      typeLabel(tool.type),
      ...toolCategoryIds(tool).map(categoryName),
      ...(tool.tags || [])
    ].join(" ").toLowerCase();
    return inCategory && (!q || haystack.includes(q));
  });
}

function renderFeedbackBoard() {
  document.body.classList.add("app-page", "feedback-page");
  const allItems = feedbackItems();
  const filteredItems = state.feedbackFilter === "all"
    ? allItems
    : allItems.filter(({ comment }) => comment.issueType === state.feedbackFilter);
  const toolsWithFeedback = new Set(allItems.map(({ tool }) => tool.id)).size;
  const usefulMarks = allItems.reduce((total, { comment }) => total + Number(comment.likes || 0), 0);

  setAppHtml(`
    <section class="screen feedback-layout">
      <aside class="control-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">FEEDBACK BOARD</p>
            <h1>反馈评价集合</h1>
          </div>
        </div>

        <div class="stats-grid" aria-label="反馈统计">
          <div class="stat-box"><strong>${allItems.length}</strong><span>反馈评价</span></div>
          <div class="stat-box"><strong>${toolsWithFeedback}</strong><span>涉及工具</span></div>
          <div class="stat-box"><strong>${usefulMarks}</strong><span>同意标记</span></div>
        </div>

        <div class="field">
          <label>反馈类型</label>
          <div class="category-list">
            ${feedbackFilterButton("all", allItems.length)}
            ${Object.keys(issueTypeLabels).filter((id) => id !== "all").map((id) => feedbackFilterButton(
              id,
              allItems.filter(({ comment }) => comment.issueType === id).length
            )).join("")}
          </div>
        </div>

        <div class="quick-list">
          <a class="pixel-button primary" href="#/">返回工具大厅</a>
          <a class="pixel-button" href="#/wishbox">去许愿箱</a>
        </div>
      </aside>

      <section class="content-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">ALL REVIEWS</p>
            <h2>${escapeHtml(issueTypeLabels[state.feedbackFilter] || "反馈评价")}</h2>
          </div>
          <span class="pixel-badge">${filteredItems.length} 条</span>
        </div>
        ${filteredItems.length ? `<div class="feedback-list">${filteredItems.map(feedbackItem).join("")}</div>` : emptyState("还没有这类反馈", "可以先进入某个工具详情页留下第一条。")}
      </section>
    </section>
  `);

  document.querySelectorAll("[data-feedback-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.feedbackFilter = button.dataset.feedbackFilter;
      renderFeedbackBoard();
    });
  });

  document.querySelectorAll("[data-like-feedback]").forEach((button) => {
    button.addEventListener("click", async () => {
      const tool = state.data.tools.find((item) => item.id === button.dataset.toolId);
      const index = Number(button.dataset.commentIndex);
      if (!tool || !state.comments[tool.id]?.[index]) return;
      await likeComment(tool, index, renderFeedbackBoard);
    });
  });
}

function feedbackItems() {
  return state.data.tools
    .flatMap((tool) => (state.comments[tool.id] || []).map((comment, index) => ({
      tool,
      comment,
      index
    })))
    .sort((a, b) => new Date(b.comment.createdAt) - new Date(a.comment.createdAt));
}

function feedbackFilterButton(id, count) {
  return `
    <button class="chip-button ${state.feedbackFilter === id ? "is-active" : ""}" type="button" data-feedback-filter="${escapeHtml(id)}">
      <span>${escapeHtml(issueTypeLabels[id] || id)}</span>
      <span class="chip-count">${count}</span>
    </button>
  `;
}

function toolCard(tool) {
  return `
    <article class="tool-card" onclick="location.hash='#/tool/${encodeURIComponent(tool.slug)}'">
      ${toolThumbnail(tool)}
      <div class="tool-card__body">
        <div class="tool-card__top">
          <span class="pixel-badge">${escapeHtml(typeLabel(tool.type))}</span>
          <span class="status-badge" data-status="${escapeHtml(tool.status)}">${escapeHtml(statusLabel(tool.status))}</span>
        </div>
        <h2>${escapeHtml(tool.name)}</h2>
        <p>${escapeHtml(tool.summary)}</p>
        <div class="tag-row" aria-label="标签">
          ${tool.developer ? `<span class="tag developer-tag">${escapeHtml(tool.developer)}</span>` : ""}
          ${toolCategoryIds(tool).slice(0, 2).map((id) => `<span class="tag">${escapeHtml(categoryName(id))}</span>`).join("")}
          ${(tool.tags || []).slice(0, 1).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderTool(slug) {
  document.body.classList.add("tool-detail-page");
  const tool = state.data.tools.find((item) => item.slug === slug);
  if (!tool) {
    setAppHtml(emptyState("没有找到这个工具", "它可能被重命名或还没有上架。"));
    return;
  }
  if (tool.detailStyle === "source_document") {
    document.body.classList.add("source-doc-page");
  }

  const comments = state.comments[tool.id] || [];

  setAppHtml(`
    <section class="screen tool-detail-screen">
      <a class="pixel-button detail-back" href="#/">返回工具大厅</a>
      <div class="detail-layout">
        <article class="detail-band">
          <header class="detail-title">
            <div class="meta-row">
              <span class="status-badge" data-status="${escapeHtml(tool.status)}">${escapeHtml(statusLabel(tool.status))}</span>
              <span class="pixel-badge">${escapeHtml(typeLabel(tool.type))}</span>
              ${toolCategoryIds(tool).map((id) => `<span class="pixel-badge">${escapeHtml(categoryName(id))}</span>`).join("")}
            </div>
            <h1>${escapeHtml(tool.name)}</h1>
            <p>${escapeHtml(tool.summary)}</p>
            <div class="meta-row">
              <span class="meta-item">开发者 ${escapeHtml(tool.developer)}</span>
              <span class="meta-item">版本 ${escapeHtml(tool.version)}</span>
            </div>
          </header>

          ${tool.detailStyle === "source_document" ? "" : heroMediaSection(tool)}
          ${tool.documentSections?.length ? documentSectionsSection(tool) : toolNarrativeSections(tool)}
          ${toolPraiseSection(tool)}
          ${resourcesSection(tool)}
        </article>

        <aside class="detail-band detail-sidebar">
          <div class="section-block detail-comment-panel" style="margin-top:0;padding-top:0;border-top:0">
            <h2>匿名评论</h2>
            <form class="comment-form" id="comment-form">
              <div class="form-grid">
                <label class="field">
                  <span>昵称</span>
                  <input name="nickname" maxlength="24" placeholder="例如：工具猎人01" required>
                </label>
                <label class="field">
                  <span>反馈类型</span>
                  <select name="issueType">
                    <option value="none">使用反馈</option>
                    <option value="bug">问题报告</option>
                    <option value="improvement">改进建议</option>
                    <option value="question">使用疑问</option>
                  </select>
                </label>
              </div>
              <label class="field">
                <span>评论内容</span>
                <textarea name="content" maxlength="500" required placeholder="写下你的体验、问题或建议"></textarea>
              </label>
              <button class="pixel-button primary" type="submit">提交评论</button>
            </form>
          </div>

          <div class="section-block">
            <h2>反馈记录</h2>
            ${comments.length ? `<div class="comment-list">${comments.map((comment, index) => commentItem(comment, index)).join("")}</div>` : emptyState("还没有评论", "第一条反馈会显示在这里。")}
          </div>
        </aside>
      </div>
    </section>
  `);

  document.querySelector("#comment-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const comment = {
      id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      nickname: String(form.get("nickname")).trim(),
      issueType: String(form.get("issueType")),
      content: String(form.get("content")).trim(),
      likes: 0,
      createdAt: new Date().toISOString(),
      status: "visible"
    };
    if (!comment.nickname || !comment.content) return;
    await saveComment(tool, slug, comment);
  });

  bindCopyButtons();

  document.querySelectorAll("[data-like-comment]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.likeComment);
      const target = state.comments[tool.id]?.[index];
      if (!target) return;
      await likeComment(tool, index, () => renderTool(slug));
    });
  });

  document.querySelector("[data-tool-praise]")?.addEventListener("click", () => {
    praiseTool(tool, slug);
  });

  bindMediaLightbox();
}

async function saveComment(tool, slug, comment) {
  if (state.backend.mode === "supabase" && supabaseApi) {
    try {
      const saved = await supabaseApi.createComment(tool.id, comment);
      state.comments[tool.id] = [saved, ...(state.comments[tool.id] || [])];
      writeJson(storageKeys.comments, state.comments);
      showToast("评论已同步");
      renderTool(slug);
      return;
    } catch (error) {
      state.backend = { mode: "local", label: "本地浏览器", error: error.message };
      updateBackendStatus();
    }
  }

  state.comments[tool.id] = [comment, ...(state.comments[tool.id] || [])];
  writeJson(storageKeys.comments, state.comments);
  showToast("评论已保存在本地");
  renderTool(slug);
}

async function likeComment(tool, index, renderAfter = render) {
  const target = state.comments[tool.id]?.[index];
  if (!target) return;

  if (state.backend.mode === "supabase" && supabaseApi && target.id) {
    try {
      state.comments[tool.id][index] = await supabaseApi.likeComment(target.id);
      writeJson(storageKeys.comments, state.comments);
      showToast("已同意");
      renderAfter();
      return;
    } catch (error) {
      state.backend = { mode: "local", label: "本地浏览器", error: error.message };
      updateBackendStatus();
    }
  }

  target.likes = Number(target.likes || 0) + 1;
  writeJson(storageKeys.comments, state.comments);
  showToast("已同意");
  renderAfter();
}

function toolThumbnail(tool) {
  if (tool.coverImage?.src) {
    return `
      <div class="tool-thumb has-image" aria-label="${escapeHtml(tool.coverImage.label || `${tool.name}封面图`)}">
        <img src="${escapeHtml(tool.coverImage.src)}" alt="${escapeHtml(tool.coverImage.label || tool.name)}">
      </div>
    `;
  }
  return `
    <div class="tool-thumb" aria-label="${escapeHtml(tool.name)}封面图预留位">
      <div class="pixel-scene" data-category="${escapeHtml(toolCategoryIds(tool)[0] || tool.categoryId)}">
        <span></span><span></span><span></span><span></span>
      </div>
    </div>
  `;
}

function heroMediaSection(tool) {
  const coverImage = tool.coverImage || {
    kind: "image",
    label: `${tool.name} 封面图`,
    description: "用于展示工具界面、效果前后对比或工作流总览。",
    status: "pending_upload"
  };
  return `
    <section class="media-hero">
      ${mediaSlot(coverImage)}
    </section>
  `;
}

function toolNarrativeSections(tool) {
  const stepMedia = [...(tool.stepMedia || []), ...inlineOperationMedia(tool)];
  return `
    ${contentSection("适合谁使用", { items: tool.targetUsers })}
    ${contentSection("解决的痛点", { items: tool.painPoints })}
    ${contentSection(tool.featuresTitle || "核心功能", {
      items: tool.features,
      images: tool.featureMedia
    })}
    ${contentSection(tool.stepsTitle || "使用步骤", {
      items: tool.usageSteps,
      images: stepMedia,
      ordered: true,
      mediaTitle: tool.stepMediaTitle
    })}
    ${methodsSection(tool)}
  `;
}

function inlineOperationMedia(tool) {
  return (tool.media || []).map((item) => ({
    kind: item.kind || "video",
    label: item.label || "操作演示",
    description: item.description || (item.duration ? `预计视频时长：${item.duration}` : "完整操作演示。"),
    status: item.status,
    src: item.src,
    url: item.url || item.href || item.previewUrl
  }));
}

function contentSection(title, { items = [], images = [], ordered = false, mediaTitle = "" } = {}) {
  const realImages = (images || []).filter((item) => item?.src || item?.url || item?.href || item?.previewUrl || item?.downloadUrl);
  if (!items.length && !realImages.length) return "";
  const ListTag = ordered ? "ol" : "ul";
  const listClass = ordered ? "step-list" : "clean-list";
  return `
    <section class="section-block doc-section tool-doc-section">
      <h2>${escapeHtml(title)}</h2>
      ${items.length ? `
        <${ListTag} class="${listClass}">
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </${ListTag}>
      ` : ""}
      ${realImages.length ? `
        <div class="doc-image-flow">
          ${mediaTitle && mediaTitle !== title ? `<h3>${escapeHtml(mediaTitle)}</h3>` : ""}
          ${realImages.map((item) => mediaSlot(item)).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function documentSectionsSection(tool) {
  return tool.documentSections.map((section) => documentSection(section)).join("");
}

function documentSection(section, level = 2) {
  const Heading = level <= 2 ? "h2" : "h3";
  const paragraphs = section.paragraphs?.length ? `
    <div class="doc-paragraphs">
      ${section.paragraphs.map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
    </div>
  ` : "";
  const bullets = section.bullets?.length ? `
    <ul class="clean-list doc-bullets">
      ${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  ` : "";
  const images = section.images?.length ? `
    <div class="doc-image-flow">
      ${section.images.map((item) => mediaSlot(item)).join("")}
    </div>
  ` : "";
  const mediaBlocks = section.mediaBlocks?.length ? `
    <div class="doc-media-blocks">
      ${section.mediaBlocks.map((block) => `
        <article class="doc-media-block">
          <div class="doc-media-block__text">
            <h3>${escapeHtml(block.title)}</h3>
            ${(block.paragraphs || []).map((text) => `<p>${escapeHtml(text)}</p>`).join("")}
          </div>
          ${(block.images || []).length ? `
            <div class="doc-media-block__images">
              ${block.images.map((item) => mediaSlot(item)).join("")}
            </div>
          ` : ""}
        </article>
      `).join("")}
    </div>
  ` : "";
  const subsections = section.subsections?.length ? `
    <div class="doc-subsections">
      ${section.subsections.map((item) => documentSection(item, level + 1)).join("")}
    </div>
  ` : "";
  return `
    <section class="section-block doc-section">
      <${Heading}>${escapeHtml(section.title)}</${Heading}>
      ${paragraphs}
      ${bullets}
      ${images}
      ${mediaBlocks}
      ${subsections}
    </section>
  `;
}

function methodsSection(tool) {
  if (!tool.methods?.length) return "";
  return `
    <section class="section-block">
      <h2>${escapeHtml(tool.methodsTitle || "方法入口")}</h2>
      <div class="method-list">
        ${tool.methods.map((method) => {
          const source = method.sourceCredit ? `<span class="meta-item">来源 ${escapeHtml(method.sourceCredit)}</span>` : "";
          const summary = method.summary ? `<p>${escapeHtml(method.summary)}</p>` : "";
          const points = method.points?.length ? `<ul class="clean-list method-points">${method.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>` : "";
          const prompt = method.optimizedPrompt ? `
            <pre class="prompt-box">${escapeHtml(method.optimizedPrompt)}</pre>
            <button class="copy-button" type="button" data-copy="${escapeHtml(method.id)}">复制提示词</button>
          ` : "";
          return `
            <article class="method-item" id="${escapeHtml(method.id)}">
              <div class="resource-title">
                <strong>${escapeHtml(method.name)}</strong>
                ${source}
              </div>
              ${summary}
              ${points}
              ${prompt}
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function resourcesSection(tool) {
  const resources = tool.resources || [];
  return `
    <section class="section-block">
      <h2>资源入口</h2>
      ${resources.length ? `<div class="resource-list">${resources.map(resourceItem).join("")}</div>` : emptyState("暂无安装包", "资源上传后会在这里出现。")}
    </section>
  `;
}

function toolPraiseSection(tool) {
  const count = Number(state.toolLikes[tool.id] || 0);
  return `
    <section class="section-block tool-praise">
      <button class="like-button tool-praise-button" type="button" data-tool-praise aria-label="夯一下这个工具">
        <span aria-hidden="true">👍</span>
        <span>夯</span>
        <span class="like-count">${count}</span>
      </button>
    </section>
  `;
}

function praiseTool(tool, slug) {
  state.toolLikes[tool.id] = Number(state.toolLikes[tool.id] || 0) + 1;
  writeJson(storageKeys.toolLikes, state.toolLikes);
  showToast("已夯一下");
  renderTool(slug);
}

function bindCopyButtons(root = document) {
  root.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const targetSelector = button.dataset.copyTarget;
      const target = targetSelector ? document.querySelector(targetSelector) : button.closest(".method-item")?.querySelector(".prompt-box");
      const text = target?.textContent || "";
      try {
        await navigator.clipboard.writeText(text);
        showToast(button.dataset.copyToast || "已复制");
      } catch {
        showToast("复制失败，请手动选中文字");
      }
    });
  });
}

function mediaSlot(item) {
  const isVideo = item.kind === "video";
  const externalUrl = item.url || item.href || item.previewUrl;
  if (item.src && isVideo) {
    const caption = publicMediaCaption(item, "资源已接入，可直接播放。");
    return `
      <figure class="media-slot">
        <video src="${escapeHtml(item.src)}" controls preload="metadata"></video>
        <figcaption>
          <strong>${escapeHtml(item.label)}</strong>
          ${caption ? `<span>${escapeHtml(caption)}</span>` : ""}
        </figcaption>
      </figure>
    `;
  }
  if (item.src) {
    const caption = publicMediaCaption(item, item.status === "external_link" ? "点击打开查看。" : "");
    return `
      <figure class="media-slot">
        <button class="media-zoom" type="button" data-lightbox-src="${escapeHtml(item.src)}" data-lightbox-title="${escapeHtml(item.label)}" aria-label="放大查看 ${escapeHtml(item.label)}">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.label)}">
        </button>
        <figcaption>
          <strong>${escapeHtml(item.label)}</strong>
          ${caption ? `<span>${escapeHtml(caption)}</span>` : ""}
        </figcaption>
      </figure>
    `;
  }
  if (externalUrl) {
    return `
      <figure class="media-slot is-pending" data-kind="${isVideo ? "video" : "image"}">
        <div class="media-placeholder" aria-hidden="true">
          <span class="media-pixel one"></span>
          <span class="media-pixel two"></span>
          <span class="media-pixel three"></span>
          ${isVideo ? `<span class="play-pixel"></span>` : ""}
        </div>
        <figcaption>
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.description || "点击打开查看。")}</span>
          <a class="pixel-button primary" href="${escapeHtml(externalUrl)}" target="_blank" rel="noopener noreferrer">打开外链</a>
        </figcaption>
      </figure>
    `;
  }
  return `
    <figure class="media-slot is-pending" data-kind="${isVideo ? "video" : "image"}">
      <div class="media-placeholder" aria-hidden="true">
        <span class="media-pixel one"></span>
        <span class="media-pixel two"></span>
        <span class="media-pixel three"></span>
        ${isVideo ? `<span class="play-pixel"></span>` : ""}
      </div>
      <figcaption>
        <strong>${escapeHtml(item.label)}</strong>
        <span>${escapeHtml(item.description || "图片或视频上传后显示在这里。")}</span>
      </figcaption>
    </figure>
  `;
}

function bindMediaLightbox() {
  document.querySelectorAll("[data-lightbox-src]").forEach((button) => {
    button.addEventListener("click", () => {
      openMediaLightbox(button.dataset.lightboxSrc, button.dataset.lightboxTitle || "图片预览");
    });
  });
}

function ensureMediaLightbox() {
  let lightbox = document.querySelector("#image-lightbox");
  if (lightbox) return lightbox;

  document.body.insertAdjacentHTML("beforeend", `
    <div class="image-lightbox" id="image-lightbox" hidden>
      <button class="image-lightbox__close" type="button" data-lightbox-close aria-label="关闭大图">X</button>
      <img alt="">
      <p></p>
    </div>
  `);
  lightbox = document.querySelector("#image-lightbox");
  lightbox.querySelector("[data-lightbox-close]").addEventListener("click", closeMediaLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeMediaLightbox();
  });

  if (!lightboxKeyHandler) {
    lightboxKeyHandler = (event) => {
      if (event.key === "Escape") closeMediaLightbox();
    };
    document.addEventListener("keydown", lightboxKeyHandler);
  }

  return lightbox;
}

function openMediaLightbox(src, title) {
  if (!src) return;
  const lightbox = ensureMediaLightbox();
  const image = lightbox.querySelector("img");
  const caption = lightbox.querySelector("p");
  image.src = src;
  image.alt = title || "图片预览";
  caption.textContent = title || "";
  lightbox.hidden = false;
  lightbox.classList.add("is-open");
  document.body.classList.add("has-lightbox");
}

function closeMediaLightbox() {
  const lightbox = document.querySelector("#image-lightbox");
  if (!lightbox) return;
  lightbox.hidden = true;
  lightbox.classList.remove("is-open");
  lightbox.querySelector("img").removeAttribute("src");
  document.body.classList.remove("has-lightbox");
}

function publicMediaCaption(item, fallback = "") {
  const description = String(item.description || "").trim();
  if (/Supabase|Storage|GitHub Pages|网站部署|存储/i.test(description)) {
    return fallback;
  }
  return description || fallback;
}

function resourceItem(resource) {
  const href = resourceUrl(resource);
  const pending = resource.status === "pending_upload" && !href;
  const actionLabel = resourceActionLabel(resource);
  const note = href ? resourceNote(resource) : "";
  return `
    <article class="resource-item">
      <div class="resource-title">
        <strong>${escapeHtml(resource.label)}</strong>
        <span class="resource-status">${pending ? "待上传" : "可用"}</span>
      </div>
      ${resource.originalLabel ? `<p class="muted">原始文件名：${escapeHtml(resource.originalLabel)}</p>` : ""}
      ${note ? `<p class="muted">${escapeHtml(note)}</p>` : ""}
      <div class="resource-row">
        ${href
          ? `<a class="pixel-button primary" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(actionLabel)}</a>`
          : `<button class="pixel-button" type="button" disabled>等待资源</button>`
        }
        <span class="meta-item">${escapeHtml(resourceKindLabel(resource.kind))}</span>
      </div>
    </article>
  `;
}

function resourceUrl(resource) {
  return resource.url || resource.href || resource.downloadUrl || resource.previewUrl || resource.src || "";
}

function resourceActionLabel(resource) {
  if (resource.actionLabel) return resource.actionLabel;
  if (resource.kind === "source_doc") return "查看原文";
  if (resource.downloadUrl || ["package", "skill"].includes(resource.kind)) return "下载资源";
  if (["html", "html_tool", "web_tool"].includes(resource.kind)) return "打开工具";
  if (resource.previewUrl) return "查看预览";
  return "打开资源";
}

function resourceKindLabel(kind) {
  const map = {
    source_doc: "图文文档",
    html: "HTML工具",
    html_tool: "HTML工具",
    web_tool: "网页工具",
    package: "安装包",
    skill: "Skill包",
    video: "视频",
    image: "图片"
  };
  return map[kind] || kind || "资源";
}

function resourceNote(resource) {
  if (resource.note) return resource.note;
  if (resource.kind === "source_doc") return "完整图文、安装包或大文件资源以原文为准。";
  if (resource.status === "uploaded") {
    if (["html", "html_tool"].includes(resource.kind)) return "资源已接入，点击即可打开工具。";
    if (resource.downloadUrl || ["package", "skill"].includes(resource.kind)) return "资源已接入，点击即可下载。";
    return "资源已接入，点击即可查看。";
  }
  return "";
}

function commentItem(comment, index) {
  return `
    <article class="comment-item">
      <strong>${escapeHtml(comment.nickname)}</strong>
      <div class="comment-meta">
        <span>${escapeHtml(issueTypeLabels[comment.issueType] || comment.issueType)}</span>
        <span>${new Date(comment.createdAt).toLocaleString("zh-CN")}</span>
      </div>
      <p>${escapeHtml(comment.content)}</p>
      <button class="like-button" type="button" data-like-comment="${index}" aria-label="同意这条反馈">
        <span>同意</span>
        <span class="like-count">${Number(comment.likes || 0)}</span>
      </button>
    </article>
  `;
}

function feedbackItem({ tool, comment, index }) {
  return `
    <article class="comment-item feedback-item">
      <div class="feedback-item__head">
        <div>
          <strong>${escapeHtml(comment.nickname)}</strong>
          <div class="comment-meta">
            <span>${escapeHtml(issueTypeLabels[comment.issueType] || comment.issueType)}</span>
            <span>${new Date(comment.createdAt).toLocaleString("zh-CN")}</span>
          </div>
        </div>
        <a class="feedback-tool-link" href="#/tool/${encodeURIComponent(tool.slug)}">${escapeHtml(tool.name)}</a>
      </div>
      <p>${escapeHtml(comment.content)}</p>
      <button class="like-button" type="button" data-like-feedback data-tool-id="${escapeHtml(tool.id)}" data-comment-index="${index}" aria-label="同意这条反馈">
        <span>同意</span>
        <span class="like-count">${Number(comment.likes || 0)}</span>
      </button>
    </article>
  `;
}

function renderSubmissionPage() {
  document.body.classList.add("app-page", "submit-page");
  setAppHtml(`
    <section class="screen submit-layout">
      <article class="wish-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">SUBMIT TOOL</p>
            <h1>工具投稿</h1>
          </div>
          <span class="pixel-badge">待整理</span>
        </div>
        <p class="muted">把工具说明整理到钉钉文档里，再把文档链接提交过来。建议正文内容写在同步块中，并确认文档具备可阅读权限；有同步块时会归档到工具箱知识库，没有同步块时会以投稿者原文作为后续更新源。</p>
        <form class="wish-form" id="submission-form">
          <div class="form-grid">
            <label class="field">
              <span>昵称，可选</span>
              <input name="nickname" maxlength="24" placeholder="例如：工具玩家07">
            </label>
            <label class="field">
              <span>联系方式，可选</span>
              <input name="contact" maxlength="120" placeholder="钉钉、微信或邮箱">
            </label>
          </div>

          <label class="field">
            <span>钉钉文档链接</span>
            <input name="docUrl" type="url" maxlength="500" placeholder="https://alidocs.dingtalk.com/i/nodes/..." required>
          </label>

          <label class="field">
            <span>补充说明，可选</span>
            <textarea name="notes" maxlength="800" placeholder="例如希望优先上架的原因、版本信息、特殊授权说明、是否已有安装包链接"></textarea>
          </label>

          <div class="submit-actions">
            <a class="pixel-button" href="https://alidocs.dingtalk.com/i/nodes/P7QG4Yx2Jp7egOmQHgmlobKvV9dEq3XD?utm_scene=team_space" target="_blank" rel="noopener noreferrer">打开知识库</a>
            <button class="pixel-button primary" type="submit">提交审核</button>
            <span class="muted" id="submission-message" role="status"></span>
          </div>
        </form>
      </article>

      <aside class="wish-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">DOC FORMAT</p>
            <h2>推荐文档格式</h2>
          </div>
          <button class="copy-button" type="button" data-copy data-copy-target="#doc-template" data-copy-toast="已复制推荐文档格式">复制格式</button>
        </div>
        <p class="muted">建议投稿文档按下面的基础格式整理。正文请尽量放进同步块，图片、安装包和补充资源放在文档里；如果没有同步块，也可以直接提交原文链接。</p>
        <pre class="doc-template" id="doc-template">工具名称

一句话介绍
用一句话说明它能帮大家在哪个制作环节省时间。

同步块正文
请把下面正式内容写在同步块中，方便归档后继续跟随原文更新。

适合谁使用
- 适合的人群 1
- 适合的人群 2

解决的痛点
- 原本最麻烦的地方
- 容易出错或重复操作的地方

软件功能
- 功能 1
- 功能 2
- 功能 3

核心功能图示
插入工具界面图、效果图或前后对比图。

安装/使用方法
1. 第一步
2. 第二步
3. 第三步

资源链接
安装包、源码、网页入口或补充文档链接。

投稿提示
- 请确认文档链接具备可阅读权限。
- 如需归档后继续同步更新，请把正文写在同步块中。
- 如果文档没有同步块，后续更新会以投稿者原文链接为准。</pre>
      </aside>
    </section>
  `);

  document.querySelector("#submission-form").addEventListener("submit", saveSubmission);
  bindCopyButtons();
}

function isTestEnvironment() {
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  return window.location.protocol === "file:" || localHosts.has(window.location.hostname);
}

function formText(form, name) {
  return String(form.get(name) || "").trim();
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function isDingTalkDocUrl(value) {
  try {
    const hostname = new URL(value).hostname;
    return hostname.endsWith("dingtalk.com");
  } catch {
    return false;
  }
}

async function saveSubmission(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const message = document.querySelector("#submission-message");
  const button = formElement.querySelector("button[type='submit']");
  const docUrl = formText(form, "docUrl");

  if (!isHttpUrl(docUrl)) {
    message.textContent = "请填写有效的钉钉文档链接。";
    return;
  }

  if (!isDingTalkDocUrl(docUrl)) {
    message.textContent = "目前请提交钉钉文档链接，便于后续抓取整理。";
    return;
  }

  const nickname = formText(form, "nickname") || "匿名投稿";
  const notes = formText(form, "notes");
  const submission = {
    nickname,
    contact: formText(form, "contact"),
    toolName: "待抓取工具",
    categoryId: "workflow-automation",
    toolType: "method",
    summary: "待从钉钉文档抓取整理",
    painPoint: "待从钉钉文档抓取整理",
    usageSteps: "待从钉钉文档抓取整理",
    toolUrl: "",
    docUrl,
    packageUrl: "",
    imageUrls: [],
    notes: notes ? `投稿备注：${notes}` : "投稿备注：仅提交钉钉文档链接，等待整理抓取。"
  };

  if (!supabaseApi) {
    message.textContent = "投稿后台暂未连接，请稍后再试。";
    return;
  }

  try {
    button.disabled = true;
    message.textContent = "正在提交...";
    await supabaseApi.createToolSubmission(submission);
    formElement.reset();
    message.textContent = "已进入待审核收件箱。";
    showToast("投稿已提交");
  } catch (error) {
    message.textContent = "提交失败，请稍后重试。";
  } finally {
    button.disabled = false;
  }
}

function renderSubmissionReviewPage() {
  document.body.classList.add("app-page", "review-page");

  if (!isReviewAccessRequested()) {
    setAppHtml(`
      <section class="screen">
        ${emptyState("入口未开启", "审核入口需要使用专门的管理链接打开。")}
      </section>
    `);
    return;
  }

  const savedPasscode = sessionStorage.getItem(reviewSessionKey) || "";
  setAppHtml(`
    <section class="screen review-layout">
      <article class="wish-panel review-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">SUBMISSION REVIEW</p>
            <h1>投稿审核</h1>
          </div>
          <span class="pixel-badge">隐藏入口</span>
        </div>
        <p class="muted">这里集中查看投稿文档，批量标记通过或退回。通过后，把已通过链接发给我，我会用钉钉 MCP 读取原文并归档到工具箱知识库。</p>

        <div class="review-toolbar">
          <label class="field">
            <span>审核口令</span>
            <input id="review-passcode" type="password" autocomplete="current-password" placeholder="输入审核口令" value="${escapeHtml(savedPasscode)}">
          </label>
          <label class="field">
            <span>状态筛选</span>
            <select id="review-status-filter">
              ${Object.entries(submissionStatusLabels).map(([value, label]) => `
                <option value="${escapeHtml(value)}" ${value === "pending" ? "selected" : ""}>${escapeHtml(label)}</option>
              `).join("")}
            </select>
          </label>
          <button class="pixel-button primary" type="button" id="load-submissions">刷新投稿</button>
        </div>

        <div class="review-batchbar">
          <label class="review-select-all">
            <input type="checkbox" id="select-all-submissions">
            <span>全选当前列表</span>
          </label>
          <button class="pixel-button primary" type="button" data-review-status="approved">批量通过</button>
          <button class="pixel-button" type="button" data-review-status="rejected">批量退回</button>
          <button class="pixel-button" type="button" data-review-status="archived">归档</button>
          <button class="pixel-button" type="button" id="copy-approved-links">复制已通过链接</button>
        </div>

        <p class="admin-message" id="review-message" role="status"></p>
        <div class="review-list" id="review-list">
          ${emptyState("等待加载", "输入审核口令后点击刷新投稿。")}
        </div>
      </article>

      <aside class="wish-panel review-help">
        <p class="eyebrow">ARCHIVE FLOW</p>
        <h2>通过后怎么归档</h2>
        <ol class="review-flow">
          <li>在这里批量通过投稿。</li>
          <li>复制已通过文档链接并发给我。</li>
          <li>我读取钉钉原文，识别标题、正文、图片和资源链接。</li>
          <li>我在 AI制作工具箱知识库中创建同名文档，并把站内工具入口接好。</li>
        </ol>
        <p class="muted">说明：网站前端不会保存钉钉写权限。创建知识库文档由我在当前会话里通过钉钉 MCP 执行，更稳也更安全。</p>
      </aside>
    </section>
  `);

  document.querySelector("#load-submissions").addEventListener("click", loadReviewSubmissions);
  document.querySelector("#review-status-filter").addEventListener("change", loadReviewSubmissions);
  document.querySelector("#select-all-submissions").addEventListener("change", toggleSubmissionSelection);
  document.querySelectorAll("[data-review-status]").forEach((button) => {
    button.addEventListener("click", () => updateReviewSubmissionStatus(button.dataset.reviewStatus));
  });
  document.querySelector("#copy-approved-links").addEventListener("click", copyApprovedSubmissionLinks);
}

function getReviewPasscode() {
  const passcode = String(document.querySelector("#review-passcode")?.value || "").trim();
  if (passcode) sessionStorage.setItem(reviewSessionKey, passcode);
  return passcode;
}

function setReviewMessage(message) {
  const target = document.querySelector("#review-message");
  if (target) target.textContent = message;
}

async function loadReviewSubmissions() {
  const passcode = getReviewPasscode();
  const statusFilter = document.querySelector("#review-status-filter")?.value || "pending";
  const list = document.querySelector("#review-list");
  if (!list) return;

  if (!supabaseApi) {
    setReviewMessage("投稿后台暂未连接。");
    return;
  }
  if (!passcode) {
    setReviewMessage("请先输入审核口令。");
    return;
  }

  try {
    setReviewMessage("正在读取投稿...");
    list.innerHTML = emptyState("读取中", "正在从投稿后台拉取数据。");
    const rows = await supabaseApi.listToolSubmissions(passcode, statusFilter);
    list.innerHTML = rows.length
      ? rows.map(reviewSubmissionItem).join("")
      : emptyState("暂无投稿", "当前状态下没有投稿记录。");
    document.querySelector("#select-all-submissions").checked = false;
    setReviewMessage(`已加载 ${rows.length} 条投稿。`);
  } catch (error) {
    list.innerHTML = emptyState("读取失败", "请检查审核口令，或确认 Supabase 已执行审核函数 SQL。");
    setReviewMessage("读取失败：审核口令无效，或审核函数还未配置。");
  }
}

function reviewSubmissionItem(item) {
  const date = new Date(item.createdAt).toLocaleString("zh-CN");
  return `
    <article class="review-item" data-submission-id="${escapeHtml(item.id)}" data-status="${escapeHtml(item.status)}">
      <label class="review-check">
        <input type="checkbox" value="${escapeHtml(item.id)}" data-submission-check>
        <span></span>
      </label>
      <div class="review-item__body">
        <div class="review-item__head">
          <div>
            <strong>${escapeHtml(item.toolName)}</strong>
            <div class="wish-meta">
              <span>${escapeHtml(submissionStatusLabels[item.status] || item.status)}</span>
              <span>${escapeHtml(item.nickname)}</span>
              <span>${escapeHtml(date)}</span>
            </div>
          </div>
          ${item.docUrl ? `<a class="feedback-tool-link" href="${escapeHtml(item.docUrl)}" target="_blank" rel="noopener noreferrer">打开文档</a>` : ""}
        </div>
        ${item.summary ? `<p>${escapeHtml(item.summary)}</p>` : ""}
        ${item.notes ? `<p class="muted">${escapeHtml(item.notes)}</p>` : ""}
        ${item.contact ? `<p class="muted">联系方式：${escapeHtml(item.contact)}</p>` : ""}
        ${item.docUrl ? `<code class="review-url">${escapeHtml(item.docUrl)}</code>` : ""}
      </div>
    </article>
  `;
}

function selectedSubmissionIds() {
  return Array.from(document.querySelectorAll("[data-submission-check]:checked")).map((item) => item.value);
}

function toggleSubmissionSelection(event) {
  document.querySelectorAll("[data-submission-check]").forEach((item) => {
    item.checked = event.currentTarget.checked;
  });
}

async function updateReviewSubmissionStatus(nextStatus) {
  const passcode = getReviewPasscode();
  const ids = selectedSubmissionIds();
  if (!ids.length) {
    setReviewMessage("请先选择要处理的投稿。");
    return;
  }
  if (!passcode) {
    setReviewMessage("请先输入审核口令。");
    return;
  }

  try {
    setReviewMessage("正在更新投稿状态...");
    const rows = await supabaseApi.updateToolSubmissionStatus(passcode, ids, nextStatus);
    if (nextStatus === "approved") {
      lastApprovedSubmissionLinks = rows.map((item) => item.docUrl).filter(Boolean);
    }
    showToast(`已更新为${submissionStatusLabels[nextStatus] || nextStatus}`);
    await loadReviewSubmissions();
  } catch (error) {
    setReviewMessage("更新失败：请检查审核口令或 Supabase 审核函数配置。");
  }
}

async function copyApprovedSubmissionLinks() {
  const links = Array.from(new Set([
    ...Array.from(document.querySelectorAll('.review-item[data-status="approved"] .review-url'))
    .map((item) => item.textContent.trim())
    .filter(Boolean),
    ...lastApprovedSubmissionLinks
  ]));
  if (!links.length) {
    setReviewMessage("当前列表里没有已通过链接。可以先切到“已通过”状态再刷新。");
    return;
  }
  try {
    await navigator.clipboard.writeText(links.join("\n"));
    showToast("已复制已通过链接");
  } catch {
    setReviewMessage("复制失败，请手动复制文档链接。");
  }
}

function renderWishbox() {
  document.body.classList.add("app-page", "wishbox-page");
  setAppHtml(`
    <section class="screen wish-layout">
      <article class="wish-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">WISH BOX</p>
            <h1>工具许愿箱</h1>
          </div>
          <span class="pixel-badge">${state.wishes.length} 条</span>
        </div>
        <p class="muted">说出你在 AI 制作里最想省掉的重复操作。高频痛点会优先进入工具箱。</p>
        <form class="wish-form" id="wish-form">
          <div class="form-grid">
            <label class="field">
              <span>昵称</span>
              <input name="nickname" maxlength="24" placeholder="给自己起个代号" required>
            </label>
            <label class="field">
              <span>希望做成</span>
              <select name="preferredFormat">
                <option value="web_tool">网页工具</option>
                <option value="chrome_extension">Chrome插件</option>
                <option value="codex_skill">Codex Skill</option>
                <option value="automation_script">自动化脚本</option>
                <option value="unsure">还不确定</option>
              </select>
            </label>
          </div>
          <label class="field">
            <span>制作痛点</span>
            <textarea name="painPoint" maxlength="800" required placeholder="哪个环节最重复、最烦、最想交给工具处理"></textarea>
          </label>
          <label class="field">
            <span>现在怎么解决</span>
            <textarea name="currentWorkaround" maxlength="500" placeholder="例如：手动复制、多个软件来回切、找同事处理"></textarea>
          </label>
          <div class="form-grid">
            <label class="field">
              <span>重要程度</span>
              <select name="priority">
                <option value="wanted">很想要</option>
                <option value="daily_blocker">每天都卡</option>
                <option value="normal">一般</option>
              </select>
            </label>
            <label class="field">
              <span>联系方式，可选</span>
              <input name="contact" maxlength="80" placeholder="钉钉、微信或邮箱">
            </label>
          </div>
          <button class="pixel-button primary" type="submit">投进许愿箱</button>
        </form>
      </article>

      <aside class="wish-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">REQUEST BOARD</p>
            <h2>最近愿望</h2>
          </div>
        </div>
        ${state.wishes.length ? `<div class="wish-list">${state.wishes.map(wishItem).join("")}</div>` : emptyState("还没有愿望", "第一条工具需求会显示在这里。")}
      </aside>
    </section>
  `);

  document.querySelector("#wish-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const wish = {
      nickname: String(form.get("nickname")).trim(),
      painPoint: String(form.get("painPoint")).trim(),
      preferredFormat: String(form.get("preferredFormat")),
      currentWorkaround: String(form.get("currentWorkaround")).trim(),
      priority: String(form.get("priority")),
      contact: String(form.get("contact")).trim(),
      createdAt: new Date().toISOString(),
      status: "new"
    };
    if (!wish.nickname || !wish.painPoint) return;
    await saveWish(wish);
  });
}

async function saveWish(wish) {
  if (state.backend.mode === "supabase" && supabaseApi) {
    try {
      const saved = await supabaseApi.createWish(wish);
      state.wishes = [saved, ...state.wishes];
      writeJson(storageKeys.wishes, state.wishes);
      showToast("愿望已同步");
      renderWishbox();
      return;
    } catch (error) {
      state.backend = { mode: "local", label: "本地浏览器", error: error.message };
      updateBackendStatus();
    }
  }

  state.wishes = [wish, ...state.wishes];
  writeJson(storageKeys.wishes, state.wishes);
  showToast("愿望已保存在本地");
  renderWishbox();
}

function wishItem(wish) {
  const formatMap = {
    web_tool: "网页工具",
    chrome_extension: "Chrome插件",
    codex_skill: "Codex Skill",
    automation_script: "自动化脚本",
    unsure: "还不确定"
  };
  const priorityMap = {
    normal: "一般",
    wanted: "很想要",
    daily_blocker: "每天都卡"
  };
  return `
    <article class="wish-item">
      <strong>${escapeHtml(wish.nickname)}</strong>
      <div class="wish-meta">
        <span>${escapeHtml(formatMap[wish.preferredFormat] || wish.preferredFormat)}</span>
        <span>${escapeHtml(priorityMap[wish.priority] || wish.priority)}</span>
        <span>${new Date(wish.createdAt).toLocaleString("zh-CN")}</span>
      </div>
      <p>${escapeHtml(wish.painPoint)}</p>
      ${wish.currentWorkaround ? `<p class="muted">现在：${escapeHtml(wish.currentWorkaround)}</p>` : ""}
    </article>
  `;
}

function emptyState(title, text) {
  return `
    <div class="empty-state">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function isLocalMaintenanceAllowed() {
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  const params = new URLSearchParams(window.location.search);
  return localHosts.has(window.location.hostname) && params.get("admin") === "1";
}

function mountLocalMaintenance() {
  if (!isLocalMaintenanceAllowed() || document.querySelector("#admin-panel")) return;

  document.querySelector(".topnav")?.insertAdjacentHTML(
    "beforeend",
    '<button class="nav-link nav-button" type="button" id="open-admin">内容维护</button>'
  );

  document.body.insertAdjacentHTML("beforeend", `
    <aside class="admin-panel" id="admin-panel" aria-hidden="true" aria-label="内容维护面板">
      <div class="admin-panel__inner">
        <div class="panel-head">
          <div>
            <p class="eyebrow">DATA CORE</p>
            <h2>内容维护</h2>
          </div>
          <button class="icon-button" type="button" id="close-admin" aria-label="关闭内容维护">X</button>
        </div>
        <p class="muted" id="backend-status">
          当前后台：${escapeHtml(state.backend.label)}。
        </p>
        <textarea id="data-editor" class="data-editor" spellcheck="false" aria-label="工具数据 JSON"></textarea>
        <div class="admin-actions">
          <button class="pixel-button primary" type="button" id="save-data">保存本地数据</button>
          <button class="pixel-button" type="button" id="export-data">导出 JSON</button>
          <button class="pixel-button danger" type="button" id="reset-data">恢复种子数据</button>
        </div>
        <p id="admin-message" class="admin-message" role="status"></p>
      </div>
    </aside>
  `);

  adminPanel = document.querySelector("#admin-panel");
  dataEditor = document.querySelector("#data-editor");
  adminMessage = document.querySelector("#admin-message");

  document.querySelector("#open-admin").addEventListener("click", openAdmin);
  document.querySelector("#close-admin").addEventListener("click", closeAdmin);
  document.querySelector("#save-data").addEventListener("click", saveAdminData);
  document.querySelector("#reset-data").addEventListener("click", resetAdminData);
  document.querySelector("#export-data").addEventListener("click", exportData);
}

function openAdmin() {
  if (!dataEditor || !adminPanel || !adminMessage) return;
  dataEditor.value = JSON.stringify(state.data, null, 2);
  adminMessage.textContent = "";
  adminPanel.classList.add("is-open");
  adminPanel.setAttribute("aria-hidden", "false");
}

function closeAdmin() {
  if (!adminPanel) return;
  adminPanel.classList.remove("is-open");
  adminPanel.setAttribute("aria-hidden", "true");
}

function saveAdminData() {
  if (!dataEditor || !adminMessage) return;
  try {
    const nextData = JSON.parse(dataEditor.value);
    if (!Array.isArray(nextData.tools) || !Array.isArray(nextData.categories)) {
      throw new Error("缺少 tools 或 categories 数组");
    }
    state.data = normalizeData(nextData);
    writeJson(storageKeys.data, state.data);
    adminMessage.textContent = "已保存到本地浏览器。";
    showToast("内容已更新");
    render();
  } catch (error) {
    adminMessage.textContent = `保存失败：${error.message}`;
  }
}

function resetAdminData() {
  if (!dataEditor || !adminMessage) return;
  state.data = state.seed;
  localStorage.removeItem(storageKeys.data);
  dataEditor.value = JSON.stringify(state.data, null, 2);
  adminMessage.textContent = "已恢复种子数据。";
  showToast("已恢复默认内容");
  render();
}

function exportData() {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tools.seed.updated.json";
  link.click();
  URL.revokeObjectURL(url);
}

init();
