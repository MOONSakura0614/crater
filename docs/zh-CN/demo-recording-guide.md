# Crater 前端演示录制操作手册

适用分支：`feature/crater-agent-demo`。本手册说明如何在不依赖后端与 Agent 服务的前提下，启动前端 demo 模式并录制论文第 3-4 章所需的截图与视频。

## 1. 启动

```bash
cd frontend
npm install              # 第一次需要
npm run dev:demo         # 启动 vite --mode demo，监听 5183
```

**强烈建议使用 Chrome 隐身窗口** 打开 `http://localhost:5183`，避免旧 Service Worker / localStorage 残留。

### 1.1 首次启动 / 之前启动过失败版本时的清理步骤

如果**之前启动过失败版本的 demo**（比如旧 SW 还残留），第一次进入会看到 `Failed to fetch dynamically imported module` 或一片空白报错。按下面 3 步清理：

1. **DevTools → Application → Service Workers**，找到 `mockServiceWorker.js` 点 **Unregister**
2. **Application → Storage → Clear site data**（一键清空所有 cache + localStorage + SW）
3. **关闭所有 5183 端口的标签页**，重新打开隐身窗口访问

之后每次切换 demo 数据集 / 重启 vite 时，只需 **硬刷新**（`Cmd+Shift+R` / `Ctrl+Shift+R`），新 SW 会立即接管。

### 1.2 录制前的小动作

- 在浏览器控制台执行 `localStorage.clear()` 保证会话状态干净；
- 节奏控制：`localStorage.setItem('demo.pacing', 'NORMAL')`（可选 `FAST` / `NORMAL` / `SLOW`），刷新生效；
- 关闭其它标签页里的旧前端，避免被 Service Worker 复用旧 handler；
- DevTools → Network 面板**勾选 "Disable cache"**，避免 chunk 缓存导致 import 失败。

### MSW 是什么？

本仓库的 mock 系统基于 [Mock Service Worker (MSW)](https://mswjs.io/)：浏览器加载页面时注册一个 Service Worker，所有 `fetch`/`XHR` 请求在出网之前先经过它。命中预设规则的会被替换为假响应，没命中的回到真实路径。这样录制时 DevTools Network 看到的是真实请求，标着 `(ServiceWorker)`，与线上几乎无差。退出 demo 模式（关闭 `VITE_USE_MSW`）后 Service Worker 自动注销。

## 2. 登录账号

| 角色 | 用户名 | 密码 | 主要落点 |
|---|---|---|---|
| 普通研究员 | `alice` | `alice123` | `/portal/...`（作业、镜像、AI 助手抽屉） |
| 平台管理员 | `sysadmin` | `sysadmin123` | `/admin/...`（健康概览、巡检、节点、审计） |

> 两个账号工具集不同：alice 可见自己的作业、只读工具、停止/重提自己作业的写工具；sysadmin 在 alice 基础上额外可见集群节点、巡检触发、批量停止、审计处理。

## 3. Chat 场景（按论文叙事）

每个场景列了 4-9 种推荐问法（关键词组合匹配，文字鲁棒）；任选其一即可触发对应剧本；其它问法走 fallback 也不会报错。

> **触发提示**：所有问法在登录账号正确（user/admin）时才生效。账号角色不匹配会落到 "restricted" 友好提示分支；完全不匹配关键词则落到 fallback。

### 3.1 JS-1 作业 Pending 诊断（alice）

入口建议：登录 alice 后，打开浮动 AI 助手按钮，切到 Agent / multi_agent 模式。

推荐问法：
- `my-train-job 为什么 还没运行`
- `这个作业 为什么 排队`
- `pending wait`
- `my-train-job 卡住了`
- `调度 不到`
- `作业 排队 为什么`

剧本关键截图点：
1. coordinator → planner → explorer 三次 handoff 出现时
2. 4 个 tool_call 卡片就位时（queue / quota / capacity / scheduler events）
3. verifier `pass` 徽标出现
4. final_answer markdown 表（含两个建议方案）完成时

### 3.2 JS-2 作业失败根因诊断（alice）

推荐问法：
- `nlp-train-001 失败了 为什么`
- `nlp-train-001 报错 排查`
- `挂了 作业`
- `帮我 看下 错误 原因`
- `failed why`
- `作业 失败`

剧本关键截图点：
1. 5 个工具卡片依次出现（detail / events / logs / metrics / similar）
2. verifier 三重证据互证 `pass`
3. final_answer 三方案对比表（batch size / 显存 / gradient accumulation）

### 3.3 JS-3 受控停止 stuck-job-7（alice，带确认）

推荐问法：
- `把 stuck-job-7 停掉`
- `帮我 停 stuck-job-7`
- `kill stuck-job-7`
- `释放 资源 stuck-job-7`
- `stop`（需配合页面上下文，可能匹配不到）
- `把这个 停掉`

操作流程：
1. 触发关键词 → 看到协调器/规划器/探索器/执行器流转
2. 出现 ConfirmActionCard，3 个字段：
   - 作业名（只读，默认 stuck-job-7）
   - 停止原因（可选 textarea）
   - 优雅终止秒数（默认 30）
3. 点击"确认停止" → resume 流播放：executor 执行 → verifier 调用 get_job_detail 复核 → coordinator 汇总
4. 想录制拒绝路径，可再触发一次场景，点击取消按钮，得到拒绝总结

### 3.4 AD-1 集群巡检（sysadmin）

入口建议：`/admin/aiops` 健康概览 Tab 后点开浮动助手；或在 `/admin/more/agent-audit` 列表页打开。

推荐问法：
- `巡检 集群`
- `今天 集群 怎么样`
- `health report`
- `集群 整体 健康`
- `平台 整体 情况`
- `集群 状况`
- `日报`

剧本关键截图点：
1. 5 个工具卡逐个完成（health / nodes / queues / idle / failures）
2. pipeline_report 卡片渲染 3 个 category（critical 节点异常、warning 队列拥塞、info 7 个空跑）
3. final_answer 给出 3 条优先级建议

### 3.5 AD-2 节点异常排查（sysadmin）

推荐问法：
- `gpu-node-03 怎么回事`
- `gpu-node-03 排查`
- `gpu-node-03 分析`
- `节点 排查`
- `节点 异常`
- `OOM 节点`
- `Xid`
- `节点 故障`

剧本关键截图点：
1. 4 个独立来源工具卡片完成（K8s 状态 / 节点上作业 / 节点事件 / Prometheus DCGM）
2. verifier 显示"4 个独立来源互证" + `pass` 徽标
3. final_answer 中"是否需要现在执行 cordon"互动文案

### 3.6 AD-3 批量停止空跑作业（sysadmin，带批量确认）

推荐问法：
- `批量 停 空跑`
- `空跑 停掉`
- `空跑 清理`
- `批量 清理`
- `把那些 利用率低 的 处理`
- `gpu 5% 停`
- `利用率低 停`
- `idle stop`

操作流程：
1. 触发 → 探索器返回 7 个候选
2. 出现 BatchConfirmCard，7 行 5 个预勾选；管理员可随意调整勾选
3. 点确认 → resume 依次执行（按勾选数量出现 N 个 stop_job 卡片），可观察渐进式完成
4. 验证器通过、coordinator 总结释放 GPU·h（每张 1 GPU，时长 3.5 GPU·h/张）

## 4. 静态页面截图顺序（建议）

录完 6 个 chat 场景后切到截图录制，按下列顺序：

| 序号 | 路径 | 截图内容 |
|---|---|---|
| 1 | `/auth` | 登录页（演示证据） |
| 2 | `/admin/aiops` 健康概览 Tab | 4 个核心指标卡片 + 失败趋势图 + Top 5 失败原因 |
| 3 | `/admin/aiops` 智能巡检报告 Tab | 报告列表（2 个日报） |
| 4 | 同上 → 点最新报告 | 执行摘要、5 个失败分类、资源利用率、4 条 recommendations |
| 5 | `/admin/more/agent-audit` | 会话审计列表（6 条）+ summary chips（chat/opsAudit/system/benchmark） |
| 6 | 列表 → 点 `sess-alice-js2` | 消息时间线 Tab |
| 7 | 同上 → 工具调用 Tab | 5 行工具记录（含 source / agentRole / latencyMs / userConfirmed） |
| 8 | 同上 → 轮次 Tab | 1 条 multi_agent turn |
| 9 | 同上 → 质量评估 Tab | 5 维度评分（relevance / factual / tool_use / risk_control / usability） |
| 10 | 切回 alice，打开 AI 助手抽屉 | 左侧 3 个会话历史 + 当前对话 |

## 5. 受控执行截图建议

- 在 JS-3 触发后，ConfirmActionCard 出现时立即截图（卡片 + 工具调用历史在同一帧）
- AD-3 BatchConfirmCard 中"部分勾选"状态截图（5 选 + 2 未选）
- resume 完成后 final_answer 出现时再截一张

## 6. 故障排查

| 现象 | 处理 |
|---|---|
| **进入首页直接 `Failed to fetch dynamically imported module: .../src/routes/...`** | 旧 Service Worker 残留。**Application → Storage → Clear site data**（一键清空），关闭所有 5183 标签后重开。详见 §1.1 |
| 登录后白屏 / 401 反复 | DevTools → Application → Service Workers，确认 `mockServiceWorker.js` 状态为 activated；若否，硬刷新（Cmd+Shift+R） |
| 输入 chat 后无 SSE | DevTools → Network 找 `/v1/agent/chat`，确认 Status=200 + "(ServiceWorker)" 标记；若是真实 502/CORS，说明 demo 模式未生效，检查启动脚本是否用了 `dev:demo` |
| 节奏过快/过慢 | 控制台 `localStorage.setItem('demo.pacing','SLOW')` 后刷新 |
| ConfirmCard 不弹出 | 检查关键词触发的是 JS-3/AD-3 而非 JS-1/JS-2；fallback / pending 诊断不会弹出确认 |
| 历史会话不见 | 切换账号后刷新；登出再登入会清 `crater.demo.user` |
| 端口被占 | 默认 5183，被占可改 `package.json` 的 dev:demo `--port` 参数 |
| **chunk 加载错乱 / 模块找不到** | 等同上面"动态 import 失败"的处理，Clear site data 后重试。一般是 vite 重启后旧 SW 又拿着旧的 chunk URL |

## 7. 录制完关闭 demo 模式

```bash
# 用普通 dev 启动即可（不会加载 demo handlers）
npm run dev
```

或直接将 `frontend/.env.demo` 删除，仓库回到无 demo 状态。生产 build (`npm run build`) 由 `cleanMSW` 插件自动剔除 `mockServiceWorker.js`，不会带入线上。
