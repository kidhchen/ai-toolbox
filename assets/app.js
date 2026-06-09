const seedUrl = "./content/tools.seed.json?v=20260609k";
const supabaseConfig = globalThis.AI_TOOLBOX_SUPABASE || {};
const supabaseApi = createSupabaseApi(supabaseConfig);
const commentSelectColumns = "id,tool_id,nickname,issue_type,content,likes,status,created_at";
const wishSelectColumns = "id,nickname,pain_point,preferred_format,current_workaround,priority,status,created_at";
const storageKeys = {
  data: "ai_toolbox_data_override",
  comments: "ai_toolbox_comments",
  wishes: "ai_toolbox_wishes"
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
let adminPanel = null;
let dataEditor = null;
let adminMessage = null;

const state = {
  seed: null,
  data: null,
  query: "",
  category: "all",
  comments: readJson(storageKeys.comments, {}),
  wishes: readJson(storageKeys.wishes, []),
  backend: {
    mode: "local",
    label: "本地浏览器",
    error: null
  }
};

const functionalCategories = [
  {
    id: "storyboard-prompts",
    name: "剧本分镜与提示词",
    description: "从剧本拆分、起手式、场景视图到故事板生成的创作方法。"
  },
  {
    id: "video-audio",
    name: "视频与音频制作",
    description: "处理视频、音效、转场、XML、绿幕和ITV制作效率的工具。"
  },
  {
    id: "visual-assets",
    name: "图片与视觉素材",
    description: "用于抠图、高清放大、换背景和视觉素材增强的工具。"
  },
  {
    id: "workflow-automation",
    name: "自动化与工作流",
    description: "把重复操作交给Codex、脚本或跨软件工作流来完成。"
  },
  {
    id: "creation-entry",
    name: "工具入口与管理",
    description: "集中管理常用AI网址、提示词入口和制作流程快捷方式。"
  },
  {
    id: "course-layout",
    name: "教程与积木排版",
    description: "服务教程、课件、积木截图和说明素材整理的工具。"
  }
];

const toolCategoryAssignments = {
  "dianmao-prompt-assistant": ["creation-entry", "storyboard-prompts"],
  "prompt-formula-library": ["storyboard-prompts"],
  "codex-sound-effect-method": ["video-audio", "workflow-automation"],
  "auto-sound-html": ["video-audio"],
  "batch-cutout-upscale": ["visual-assets"],
  "greenscreen-video-cutout": ["visual-assets", "video-audio"],
  "block-layout-tool": ["course-layout"],
  "finalcut-motion-html-bridge": ["video-audio", "workflow-automation"],
  "ai-screen-recording-skill": ["workflow-automation"],
  "itv-auto-marker": ["video-audio", "workflow-automation"]
};

const legacyCategoryMap = {
  "prompt-workflows": ["storyboard-prompts"],
  "html-tools": ["workflow-automation"],
  "browser-extensions": ["creation-entry"],
  "codex-skills": ["workflow-automation"],
  "editing-audio": ["video-audio"],
  "asset-processing": ["visual-assets"],
  automation: ["workflow-automation"]
};

const feishuDocUrl = "https://my.feishu.cn/wiki/MCSEw5tSzihbDfk1MWBcsy1rnQh";
const feishuToolLinks = {
  "dianmao-prompt-assistant": `${feishuDocUrl}#Ok4rdSjWpoQkkxxfkpbc8KSonui`,
  "prompt-formula-library": `${feishuDocUrl}#SIhQd9guboHauexttXDc2i6CndH`,
  "codex-sound-effect-method": `${feishuDocUrl}#KXR2dYLJjoxMXmxjPk7cFC91nBd`,
  "auto-sound-html": `${feishuDocUrl}#W4lPdd6d5ocTphx0dbGcuOian1b`,
  "batch-cutout-upscale": `${feishuDocUrl}#OvGjdQ0eUoJbWZxPqmjcyJlonbg`,
  "greenscreen-video-cutout": `${feishuDocUrl}#QSkHdJN9todOQixYEFccftj8nUh`,
  "block-layout-tool": `${feishuDocUrl}#N9q8dE5tVogJzSxE429cmK53nlc`,
  "finalcut-motion-html-bridge": `${feishuDocUrl}#Vg8UdJq6cof4fsxbwDucw30qnde`,
  "ai-screen-recording-skill": `${feishuDocUrl}#MWied5cn3o8xXExws6tcxusInCg`,
  "itv-auto-marker": `${feishuDocUrl}#QJRFdS98IoFb5zxoVHlcWAVbnWf`
};

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
  return !list.length || list.every((item) => item?.status === "imported_from_feishu");
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

  nextData.tools?.forEach((tool) => {
    const seedTool = seedTools.get(tool.id || tool.slug);
    if (!seedTool) return;

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
    tool.resources = withFeishuResource(tool);
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
  return nextData;
}

function withFeishuResource(tool) {
  const resources = Array.isArray(tool.resources) ? [...tool.resources] : [];
  const url = feishuToolLinks[tool.id];
  if (!url || resources.some((item) => item.kind === "feishu_source" || item.url === url || item.href === url)) {
    return resources;
  }
  return [
    {
      kind: "feishu_source",
      label: "飞书原始说明 / 下载入口",
      url,
      status: "external_link"
    },
    ...resources
  ];
}

function bindChrome() {
  mountLocalMaintenance();
}

function render() {
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

  if (hash.startsWith("#/wishbox")) {
    setRouteActive("wishbox");
    renderWishbox();
    return;
  }

  setRouteActive("home");
  renderHome();
}

function renderHome() {
  const tools = filteredTools();
  const categories = state.data.categories;
  const publishedCount = state.data.tools.filter((tool) => tool.status === "published").length;
  const pendingResources = state.data.tools
    .flatMap((tool) => tool.resources || [])
    .filter((resource) => resource.status === "pending_upload" && !resourceUrl(resource)).length;

  app.innerHTML = `
    <section class="screen dashboard-grid">
      <aside class="control-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">TOOL LOBBY</p>
            <h1>${escapeHtml(state.data.site.name)}</h1>
          </div>
        </div>

        <div class="stats-grid" aria-label="工具统计">
          <div class="stat-box"><strong>${state.data.tools.length}</strong><span>工具入口</span></div>
          <div class="stat-box"><strong>${publishedCount}</strong><span>已上线</span></div>
          <div class="stat-box"><strong>${pendingResources}</strong><span>待上传资源</span></div>
        </div>

        <label class="field">
          <span>搜索工具</span>
          <input class="search-input" id="search-input" type="search" value="${escapeHtml(state.query)}" placeholder="输入工具名、标签或开发者">
        </label>

        <div class="field">
          <label>分类</label>
          <div class="category-list">
            ${categoryButton("all", "全部工具", state.data.tools.length)}
            ${categories.map((category) => categoryButton(
              category.id,
              category.name,
              state.data.tools.filter((tool) => toolInCategory(tool, category.id)).length
            )).join("")}
          </div>
        </div>

        <div class="quick-list">
          <a class="pixel-button primary" href="#/wishbox">进入许愿箱</a>
          <a class="pixel-button" href="#/submit">提交工具</a>
          <a class="pixel-button" href="${feishuDocUrl}" target="_blank" rel="noopener noreferrer">飞书原始资料</a>
        </div>
      </aside>

      <section class="content-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">SELECT A TOOL</p>
            <h2>${state.category === "all" ? "全部工具" : escapeHtml(categoryName(state.category))}</h2>
          </div>
          <span class="pixel-badge">${tools.length} 个入口</span>
        </div>
        ${tools.length ? `<div class="tool-grid">${tools.map(toolCard).join("")}</div>` : emptyState("没有匹配的工具", "换个关键词或分类再试一次。")}
      </section>
    </section>
  `;

  document.querySelector("#search-input").addEventListener("input", (event) => {
    state.query = event.target.value.trim();
    renderHome();
  });

  document.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => {
      state.category = button.dataset.category;
      renderHome();
    });
  });
}

function categoryButton(id, label, count) {
  return `
    <button class="chip-button ${state.category === id ? "is-active" : ""}" type="button" data-category="${escapeHtml(id)}">
      <span>${escapeHtml(label)}</span>
      <span class="chip-count">${count}</span>
    </button>
  `;
}

function filteredTools() {
  const q = state.query.toLowerCase();
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

function toolCard(tool) {
  return `
    <article class="tool-card" onclick="location.hash='#/tool/${encodeURIComponent(tool.slug)}'">
      <div class="tool-card__top">
        <span class="status-badge" data-status="${escapeHtml(tool.status)}">${escapeHtml(statusLabel(tool.status))}</span>
        <span class="pixel-badge">${escapeHtml(typeLabel(tool.type))}</span>
      </div>
      ${toolThumbnail(tool)}
      <h2>${escapeHtml(tool.name)}</h2>
      <p>${escapeHtml(tool.summary)}</p>
      <div>
        <div class="meta-row">
          <span class="meta-item">开发者 ${escapeHtml(tool.developer)}</span>
          <span class="meta-item">${escapeHtml(tool.difficulty)}</span>
        </div>
        <div class="tag-row" aria-label="标签">
          ${(tool.tags || []).slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderTool(slug) {
  const tool = state.data.tools.find((item) => item.slug === slug);
  if (!tool) {
    app.innerHTML = emptyState("没有找到这个工具", "它可能被重命名或还没有上架。");
    return;
  }

  const comments = state.comments[tool.id] || [];

  app.innerHTML = `
    <section class="screen">
      <a class="pixel-button" href="#/">返回工具大厅</a>
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
              <span class="meta-item">难度 ${escapeHtml(tool.difficulty)}</span>
            </div>
          </header>

          ${heroMediaSection(tool)}
          ${listSection("适合谁使用", tool.targetUsers)}
          ${listSection("解决的痛点", tool.painPoints)}
          ${listSection("核心功能", tool.features)}
          ${visualSupportSection(tool, "features")}
          ${stepsSection(tool.usageSteps)}
          ${visualSupportSection(tool, "steps")}
          ${methodsSection(tool)}
          ${resourcesSection(tool)}
        </article>

        <aside class="detail-band">
          <div class="section-block" style="margin-top:0;padding-top:0;border-top:0">
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
  `;

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

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const text = button.closest(".method-item").querySelector(".prompt-box")?.textContent || "";
      try {
        await navigator.clipboard.writeText(text);
        showToast("已复制提示词");
      } catch {
        showToast("复制失败，请手动选中文字");
      }
    });
  });

  document.querySelectorAll("[data-like-comment]").forEach((button) => {
    button.addEventListener("click", async () => {
      const index = Number(button.dataset.likeComment);
      const target = state.comments[tool.id]?.[index];
      if (!target) return;
      await likeComment(tool, slug, index);
    });
  });
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

async function likeComment(tool, slug, index) {
  const target = state.comments[tool.id]?.[index];
  if (!target) return;

  if (state.backend.mode === "supabase" && supabaseApi && target.id) {
    try {
      state.comments[tool.id][index] = await supabaseApi.likeComment(target.id);
      writeJson(storageKeys.comments, state.comments);
      showToast("已标记好用");
      renderTool(slug);
      return;
    } catch (error) {
      state.backend = { mode: "local", label: "本地浏览器", error: error.message };
      updateBackendStatus();
    }
  }

  target.likes = Number(target.likes || 0) + 1;
  writeJson(storageKeys.comments, state.comments);
  showToast("已标记好用");
  renderTool(slug);
}

function toolThumbnail(tool) {
  if (tool.coverImage?.src) {
    return `
      <div class="tool-thumb has-image" aria-label="${escapeHtml(tool.coverImage.label || `${tool.name}封面图`)}">
        <img src="${escapeHtml(tool.coverImage.src)}" alt="${escapeHtml(tool.coverImage.label || tool.name)}">
        <span>${escapeHtml(tool.coverImage.label || "文档图片已接入")}</span>
      </div>
    `;
  }
  return `
    <div class="tool-thumb" aria-label="${escapeHtml(tool.name)}封面图预留位">
      <div class="pixel-scene" data-category="${escapeHtml(toolCategoryIds(tool)[0] || tool.categoryId)}">
        <span></span><span></span><span></span><span></span>
      </div>
      <span>封面图待上传</span>
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

function visualSupportSection(tool, slotType) {
  const config = {
    features: {
      title: "核心功能图示",
      slots: [
        {
          kind: "image",
          label: "功能截图",
          description: "建议放工具主界面、关键按钮或处理前后对比图。",
          status: "pending_upload"
        },
        {
          kind: "video",
          label: "功能演示视频",
          description: "建议放 30 到 90 秒的核心能力演示。",
          status: "pending_upload"
        }
      ]
    },
    steps: {
      title: "使用步骤图文 / 视频",
      slots: [
        {
          kind: "image",
          label: "步骤截图",
          description: "建议放安装、拖拽、导入、导出等关键步骤截图。",
          status: "pending_upload"
        },
        {
          kind: "video",
          label: "完整使用视频",
          description: "建议放从打开工具到完成结果的完整操作演示。",
          status: "pending_upload"
        }
      ]
    }
  }[slotType];
  if (!config) return "";
  const actualSlots = slotType === "features" ? tool.featureMedia || [] : tool.stepMedia || [];
  const slots = actualSlots.length ? actualSlots : config.slots;
  return `
    <section class="section-block visual-block">
      <h2>${escapeHtml(config.title)}</h2>
      <div class="visual-grid">
        ${slots.map((slot) => mediaSlot(slot)).join("")}
      </div>
    </section>
  `;
}

function listSection(title, items = []) {
  if (!items.length) return "";
  return `
    <section class="section-block">
      <h2>${escapeHtml(title)}</h2>
      <ul class="clean-list">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function stepsSection(items = []) {
  if (!items.length) return "";
  return `
    <section class="section-block">
      <h2>使用步骤</h2>
      <ol class="step-list">
        ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ol>
    </section>
  `;
}

function methodsSection(tool) {
  if (!tool.methods?.length) return "";
  return `
    <section class="section-block">
      <h2>方法入口</h2>
      <div class="method-list">
        ${tool.methods.map((method) => `
          <article class="method-item" id="${escapeHtml(method.id)}">
            <div class="resource-title">
              <strong>${escapeHtml(method.name)}</strong>
              <span class="meta-item">来源 ${escapeHtml(method.sourceCredit)}</span>
            </div>
            <p>${escapeHtml(method.summary)}</p>
            <pre class="prompt-box">${escapeHtml(method.optimizedPrompt)}</pre>
            <button class="copy-button" type="button" data-copy="${escapeHtml(method.id)}">复制提示词</button>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function resourcesSection(tool) {
  const resources = tool.resources || [];
  const media = tool.media || [];
  return `
    <section class="section-block">
      <h2>资源入口</h2>
      ${resources.length ? `<div class="resource-list">${resources.map(resourceItem).join("")}</div>` : emptyState("暂无安装包", "资源上传后会在这里出现。")}
      ${media.length ? `
        <div class="media-row" style="margin-top:12px">
          ${media.map((item) => `
            ${mediaSlot({
              kind: item.kind || "video",
              label: item.label,
              description: item.duration ? `预计视频时长：${item.duration}` : "资源上传后可在这里播放。",
              status: item.status,
              src: item.src,
              url: item.url || item.href || item.previewUrl
            })}
          `).join("")}
        </div>
      ` : ""}
    </section>
  `;
}

function mediaSlot(item) {
  const isVideo = item.kind === "video";
  const externalUrl = item.url || item.href || item.previewUrl;
  if (item.src && isVideo) {
    return `
      <figure class="media-slot">
        <video src="${escapeHtml(item.src)}" controls preload="metadata"></video>
        <figcaption>
          <strong>${escapeHtml(item.label)}</strong>
          <span>资源已接入，可直接播放。</span>
        </figcaption>
      </figure>
    `;
  }
  if (item.src) {
    return `
      <figure class="media-slot">
        <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.label)}">
        <figcaption>
          <strong>${escapeHtml(item.label)}</strong>
          <span>资源已接入，可直接查看。</span>
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
          <span>${escapeHtml(item.description || "当前使用外部链接，点击打开查看。")}</span>
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
        <span class="meta-item">${escapeHtml(resource.kind)}</span>
      </div>
    </article>
  `;
}

function resourceUrl(resource) {
  return resource.url || resource.href || resource.downloadUrl || resource.previewUrl || resource.src || "";
}

function resourceActionLabel(resource) {
  if (resource.downloadUrl || ["package", "skill"].includes(resource.kind)) return "下载资源";
  if (["html", "html_tool"].includes(resource.kind)) return "打开工具";
  if (resource.previewUrl) return "查看预览";
  return "打开资源";
}

function resourceNote(resource) {
  if (resource.status === "uploaded") {
    if (["html", "html_tool"].includes(resource.kind)) return "资源已接入，点击即可打开工具。";
    if (resource.downloadUrl || ["package", "skill"].includes(resource.kind)) return "资源已接入，点击即可下载。";
    return "资源已接入，点击即可查看。";
  }
  return "当前资源使用外部链接，后续可替换为网站存储地址。";
}

function commentItem(comment, index) {
  const issueMap = {
    none: "使用反馈",
    bug: "问题报告",
    improvement: "改进建议",
    question: "使用疑问"
  };
  return `
    <article class="comment-item">
      <strong>${escapeHtml(comment.nickname)}</strong>
      <div class="comment-meta">
        <span>${escapeHtml(issueMap[comment.issueType] || comment.issueType)}</span>
        <span>${new Date(comment.createdAt).toLocaleString("zh-CN")}</span>
      </div>
      <p>${escapeHtml(comment.content)}</p>
      <button class="like-button" type="button" data-like-comment="${index}" aria-label="标记这条反馈好用">
        <span class="pixel-like-icon" aria-hidden="true"></span>
        <span>好用</span>
        <span class="like-count">${Number(comment.likes || 0)}</span>
      </button>
    </article>
  `;
}

function renderSubmissionPage() {
  app.innerHTML = `
    <section class="screen submit-layout">
      <article class="wish-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">SUBMIT TOOL</p>
            <h1>工具投稿</h1>
          </div>
          <span class="pixel-badge">待审核</span>
        </div>
        <p class="muted">提交后会进入审核收件箱，通过后才会加入正式工具大厅。当前只接收图片、文档和安装包链接，暂不接收视频上传。</p>
        <form class="wish-form" id="submission-form">
          <div class="form-grid">
            <label class="field">
              <span>昵称</span>
              <input name="nickname" maxlength="24" placeholder="例如：工具玩家07" required>
            </label>
            <label class="field">
              <span>联系方式，可选</span>
              <input name="contact" maxlength="120" placeholder="飞书、微信或邮箱">
            </label>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>工具名称</span>
              <input name="toolName" maxlength="80" placeholder="这个工具叫什么" required>
            </label>
            <label class="field">
              <span>功能分类</span>
              <select name="categoryId">
                ${state.data.categories.map((category) => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`).join("")}
              </select>
            </label>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>工具类型</span>
              <select name="toolType">
                <option value="web_tool">网页工具</option>
                <option value="html_tool">HTML工具</option>
                <option value="chrome_extension">Chrome插件</option>
                <option value="codex_skill">Codex Skill</option>
                <option value="workflow_package">工作流包</option>
                <option value="method">制作方法</option>
              </select>
            </label>
            <label class="field">
              <span>工具入口链接，可选</span>
              <input name="toolUrl" type="url" maxlength="500" placeholder="https://...">
            </label>
          </div>

          <label class="field">
            <span>一句话简介</span>
            <textarea name="summary" maxlength="300" required placeholder="它能帮助别人在哪个制作环节省时间"></textarea>
          </label>

          <label class="field">
            <span>解决的痛点</span>
            <textarea name="painPoint" maxlength="800" required placeholder="说明原本最麻烦、最重复、最容易出错的地方"></textarea>
          </label>

          <label class="field">
            <span>使用步骤</span>
            <textarea name="usageSteps" maxlength="1200" placeholder="按 1、2、3 写清楚使用流程"></textarea>
          </label>

          <div class="form-grid">
            <label class="field">
              <span>文档说明链接，可选</span>
              <input name="docUrl" type="url" maxlength="500" placeholder="飞书、Notion、GitHub 文档等">
            </label>
            <label class="field">
              <span>安装包 / 源码链接，可选</span>
              <input name="packageUrl" type="url" maxlength="500" placeholder="网盘、GitHub Release、下载页等">
            </label>
          </div>

          <label class="field">
            <span>配图链接，可多行</span>
            <textarea name="imageUrls" maxlength="1200" placeholder="每行一个图片链接，最多 6 张。请不要填写视频链接。"></textarea>
          </label>

          <label class="field">
            <span>补充说明，可选</span>
            <textarea name="notes" maxlength="800" placeholder="例如版本信息、适用软件、授权说明、希望如何展示"></textarea>
          </label>

          <div class="submit-actions">
            <button class="pixel-button primary" type="submit">提交审核</button>
            <span class="muted" id="submission-message" role="status"></span>
          </div>
        </form>
      </article>

      <aside class="wish-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">REVIEW FLOW</p>
            <h2>发布规则</h2>
          </div>
        </div>
        <div class="review-steps">
          <div><strong>01</strong><span>投稿先进入 Supabase 待审核表。</span></div>
          <div><strong>02</strong><span>你确认内容、链接和展示素材。</span></div>
          <div><strong>03</strong><span>审核通过后再加入正式工具大厅。</span></div>
        </div>
        <div class="empty-state submission-note">
          <h3>资源策略</h3>
          <p>图片、文档和安装包先以链接形式提交；视频资源暂不开放投稿上传，避免占用站点存储空间。</p>
        </div>
      </aside>
    </section>
  `;

  document.querySelector("#submission-form").addEventListener("submit", saveSubmission);
}

function formText(form, name) {
  return String(form.get(name) || "").trim();
}

function parseLinkLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function hasVideoResource(values) {
  return values.some((value) => /\.(mp4|mov|m4v|webm)([?#].*)?$/i.test(value));
}

async function saveSubmission(event) {
  event.preventDefault();
  const formElement = event.currentTarget;
  const form = new FormData(formElement);
  const message = document.querySelector("#submission-message");
  const button = formElement.querySelector("button[type='submit']");
  const imageUrls = parseLinkLines(form.get("imageUrls"));
  const singleLinks = ["toolUrl", "docUrl", "packageUrl"].map((name) => formText(form, name)).filter(Boolean);
  const allLinks = [...singleLinks, ...imageUrls];

  const invalidLinks = allLinks.filter((link) => !isHttpUrl(link));
  if (invalidLinks.length) {
    message.textContent = "请填写有效的 http/https 链接。";
    return;
  }

  if (hasVideoResource(allLinks)) {
    message.textContent = "当前投稿不接收视频链接，请先移除视频资源。";
    return;
  }

  const submission = {
    nickname: formText(form, "nickname"),
    contact: formText(form, "contact"),
    toolName: formText(form, "toolName"),
    categoryId: formText(form, "categoryId"),
    toolType: formText(form, "toolType"),
    summary: formText(form, "summary"),
    painPoint: formText(form, "painPoint"),
    usageSteps: formText(form, "usageSteps"),
    toolUrl: formText(form, "toolUrl"),
    docUrl: formText(form, "docUrl"),
    packageUrl: formText(form, "packageUrl"),
    imageUrls,
    notes: formText(form, "notes")
  };

  if (!submission.nickname || !submission.toolName || !submission.summary || !submission.painPoint) {
    message.textContent = "请补齐昵称、工具名称、简介和痛点。";
    return;
  }

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

function renderWishbox() {
  app.innerHTML = `
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
              <input name="contact" maxlength="80" placeholder="飞书、微信或邮箱">
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
  `;

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
