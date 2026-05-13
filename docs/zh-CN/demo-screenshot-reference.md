# Demo 截图与 Query 速查表

本文件配套 [`demo-recording-guide.md`](./demo-recording-guide.md)，给出**现在 demo 系统能截到的所有页面清单**、**每个场景的推荐 query**、**alice 与 sysadmin 视角下能看到的 mock 数据**，方便快速完成录屏与截图。

---

## 0. 启动前确认

录制前必须确认 MSW 已正确注册，否则前端会去请求真实后端导致全部 ECONNREFUSED：

1. **首次启动**：用 Chrome **隐身窗口** 打开 `http://localhost:5183/`，硬刷新（`Cmd+Shift+R` / `Ctrl+Shift+R`）。
2. 打开 DevTools → **Application → Service Workers**，确认有一条 `mockServiceWorker.js`，状态 **Activated and is running**。
3. 控制台应出现 `[MSW] Mocking enabled.`。
4. **Network 面板**任意一条 `/api/...` 请求，Status 列应显示 **`200 (ServiceWorker)`**（不是真正出网的 200）。
5. 若仍看到 502 / ECONNREFUSED，刷新页面让 worker 接管；不行就关闭所有 5183 标签、`localStorage.clear()` 后重开。

> 我们的 baseURL 是相对路径 `/api/...`，MSW handler 用通配符 `*/api/...` 拦截任何 origin，不依赖 `VITE_SERVER_PROXY_BACKEND` 是否配。

---

## 1. 两个登录账号能看到的 mock 数据

### Alice（普通研究员 / `alice` / `alice123` / `nlp-lab`）

| 类别 | 数量 / 状态 |
|---|---|
| 自己的作业 | `my-train-job` (Pending)、`nlp-train-001` (Failed, OOM)、`stuck-job-7` (Running, 14h 空跑) |
| 自己的工单 | 3 条：JS 延期已批通过、配额扩容待审、解锁工单已驳回（详见 §3.3） |
| 健康概览 | 12 总作业 / 2 失败 / 1 排队 / 9 运行；近 7 天趋势 + Top 失败原因（OOM ×2、image pull ×1） |
| 聊天历史 | 左侧 3 条历史（JS-1/2/3 已录入完整对话与工具调用） |
| 可见队列 | `gpu-l40s`、`gpu-3090`、`gpu-a100`、`cpu` |
| 配额 | nlp-lab GPU 6/8, CPU 32/64, MEM 256Gi/512Gi |

### Sysadmin（平台管理员 / `sysadmin` / `sysadmin123` / `platform`）

| 类别 | 数量 / 状态 |
|---|---|
| 集群所有作业 | 14 个：alice 的 3 个 + 7 个 idle 空跑 + 4 个跨课题组（cv-train-12 / rl-train-04 / big-job-1 / data-prep-09 多种失败原因） |
| 节点 | 6 个：gpu-node-01..05（其中 gpu-node-03 **Degraded** + Xid 79）+ cpu-node-01 |
| 健康概览（管理员） | 318 总作业 / 27 失败 / 15 排队 / 276 运行；5 种 Top 失败原因（OOM 11、image 6、Xid 4、PVC 3、quota 3） |
| 巡检报告 | 2 份日报；最新的含 5 个失败分类、资源利用率、4 条 recommendations |
| 审计会话 | 6 条会话（chat 来源），每条含完整 messages/tool-calls/turns/events 时间线 |
| 质量评估 | 共 24 条评估（6 会话 × 多类型）：覆盖 `session/turn` 两种范围 × `full/dialogue/task` 三种类型 + 1 条 running 状态（AD-3） |
| 工单（管理视图） | 5 条：alice ×3 + bob ×1 + grace ×1；含 agent 自动审批 / 转人工 / 已驳回 / 已通过四类 |

---

## 2. Chat 场景推荐 Query 速查表

### 2.1 Alice 视角

**JS-1 作业 Pending 诊断**（4 个只读工具 + final answer）

| 推荐 query | 触发说明 |
|---|---|
| `my-train-job 为什么 还没运行` | 命中 `['my-train-job','没运行']` |
| `这个作业 为什么 排队` | 命中 `['排队','为什么']` |
| `my-train-job 卡住了` | 命中 `['my-train-job','卡']` |
| `pending wait` | 命中 `['pending','wait']` |
| `调度 不到` | 命中 `['调度','不到']` |
| `为什么 没跑` | 命中 `['为什么','没跑']` |
| `作业 排队 为什么` | 命中 `['作业','排队']` |

**JS-2 作业失败诊断**（5 个证据工具 + 三方案表格）

| 推荐 query | 触发说明 |
|---|---|
| `nlp-train-001 失败了 为什么` | `['nlp-train-001','失败']` |
| `nlp-train-001 报错 排查` | `['nlp-train-001','报错']` 或 `['报错','排查']` |
| `挂了 作业` | `['挂了','作业']` |
| `帮我 看下 错误 原因` | `['看下','原因']` |
| `failed why` | `['failed','why']` |
| `作业 失败` | `['作业','失败']` |
| `nlp-train-001 错误 原因` | `['nlp-train-001','原因']` |

**JS-3 受控停止（弹确认卡 + 恢复）**

| 推荐 query | 触发说明 |
|---|---|
| `把 stuck-job-7 停掉` | `['停止','stuck-job-7']` 或 `['stuck-job-7','停']` |
| `帮我 停 stuck-job-7` | `['帮我','停']` + `['stuck-job-7','停']` |
| `kill stuck-job-7` | `['stuck-job-7','kill']` |
| `释放 stuck-job-7 资源` | `['释放','stuck-job-7']` |
| `把这个 停掉` | `['把这个','停']` 或 `['停掉','这个']` |

**确认卡操作**：
- 点击 **确认停止** → 触发 resume，executor 真正执行 → verifier 复核 → 总结释放 4 GPU
- 点击 **取消 / 拒绝** → 走拒绝分支，给出 "未做改动" 总结

### 2.2 Sysadmin 视角

**AD-1 集群巡检**（5 工具 + pipeline_report 卡片）

| 推荐 query | 触发说明 |
|---|---|
| `巡检 集群` 或 `集群 巡检` | `['巡检']` |
| `今天 集群 怎么样` | `['今天','情况']` 或 `['集群','整体']` |
| `health report` | `['health','report']` |
| `集群 健康 整体` | `['集群','健康']` 或 `['集群','整体']` |
| `平台 整体 情况` | `['平台','整体']` |
| `日报` | `['日报']` |

**AD-2 节点异常排查**（4 来源工具）

| 推荐 query | 触发说明 |
|---|---|
| `gpu-node-03 怎么回事` | `['gpu-node-03','怎么回事']` |
| `gpu-node-03 排查` | `['gpu-node-03','排查']` |
| `gpu-node-03 分析` | `['gpu-node-03','分析']` |
| `节点 异常 排查` | `['节点','排查']` 或 `['节点','异常']` |
| `OOM 节点 分析` | `['oom','节点']` |
| `Xid` | `['xid']` |
| `节点 故障` | `['节点','故障']` |

**AD-3 批量停止空跑作业**（弹 BatchConfirmCard）

| 推荐 query | 触发说明 |
|---|---|
| `批量 停 空跑` | `['批量','停']` |
| `空跑 停掉` 或 `空跑 清理` | `['空跑','停']` 或 `['空跑','清理']` |
| `批量 清理` | `['批量','清理']` |
| `把那些 利用率低 的 处理` | `['利用率低','处理']` |
| `gpu 5% 停` | `['gpu','5%','停']` |
| `idle stop` | `['idle','stop']` |

**批量确认卡操作**：
- 7 行候选，5 行默认勾选；可调整勾选
- 点击 **确认批量停止** → 按勾选数依次播放 stop_job 卡（5×stop = 5 张 GPU 释放）

### 2.3 跨角色行为

- alice 输入管理员 query（如 `巡检 集群`） → **restricted 友好提示**：「此操作需要平台管理员权限，普通用户无法触发」
- sysadmin 输入用户 query（如 `nlp-train-001 失败了`） → 命中 JS-2 剧本（admin 可以做 alice 视角的事；trigger 不限制 admin）
- 任意未命中的输入（如 `你好` `天气怎么样`） → **fallback** 提示并推荐用法

---

## 3. 静态页面截图清单（按推荐顺序）

下面所有页面都需要**先登录对应账号**才能访问。`✔` = 已在 demo mock 中验证过有非空数据。

### 3.1 公共：登录页

| 路径 | 内容 |
|---|---|
| `/auth` | 登录表单（仅 `normal` 模式，无 LDAP）。用作演示证据。 |

### 3.2 Alice 视角

| ✔ | 路径 | 截图内容 |
|---|---|---|
| ✔ | `/portal/jobs/batch`（或具体作业列表入口） | 3 条作业行（Pending / Failed / Running） |
| ✔ | `/portal/jobs/<jobname>/detail`（点 nlp-train-001） | 作业详情 + 退出码 137 + OOMKilled 事件 |
| ✔ | `/portal/aiops` | 用户健康概览（12 作业 / 16.7% 失败率 / 2 个 Top 原因） |
| ✔ | `/portal/orders` 工单列表 | 3 条工单：1 已通过（agent 自动）、1 待审（agent 已转人工）、1 已驳回 |
| ✔ | `/portal/orders/<id>` 详情（点工单 1002 配额扩容） | **关键截图**：含 agent verdict=escalate + confidence + reason + admin_summary + trace 列表 |
| ✔ | AI 助手抽屉 | 左侧 3 条会话历史；点开任意一条可见完整对话 + 工具调用 |

### 3.3 Sysadmin 视角

| ✔ | 路径 | 截图内容 |
|---|---|---|
| ✔ | `/admin/aiops` 健康概览 Tab | 4 个核心指标卡 + 失败趋势曲线 + Top 5 原因 |
| ✔ | `/admin/aiops` 智能巡检报告 Tab | 报告列表（2 个日报） |
| ✔ | 同上 → 点最新报告 | 执行摘要、5 个失败分类（含 top_job）、资源利用率、4 条 recommendations |
| ✔ | `/admin/more/agent-audit` 列表 | **6 条会话**；source 全为 chat；eval status 含 completed×5 + running×1（AD-3）；feedback 列含 thumbs-up×3（alice 三条） |
| ✔ | 点 `sess-alice-js2` 详情 | 4 个 tab：消息（2 条）/ 工具调用（5 条，含 latencyMs / tokenCount）/ 轮次（1 multi_agent）/ 质量评估（4 个 variant） |
| ✔ | 同上 → **质量评估 Tab** | **4 种 variant 同时展示**：session/full、session/dialogue、session/task、turn/full。每条含分项评分 + summary + chatModel/chainModel + triggerSource（manual / offline_batch / feedback） |
| ✔ | 点 `sess-admin-ad3` 详情 → 质量评估 Tab | 含 1 条 **running 状态评估**（progress=0.42，stage=tool_chain_analysis） |
| ✔ | `/admin/more/orders` 工单列表 | 5 条工单，含 4 种 reviewSource（agent_auto×3 / admin_manual×1 / 空） |
| ✔ | 任意工单详情 | 完整 agent 报告（reason/admin_summary/trace）+ 操作按钮（approve/reject） |
| ✔ | `/admin/cluster/nodes`（或集群节点入口） | 6 个节点；gpu-node-03 状态显示 Occupied/Degraded |
| ✔ | 点 gpu-node-03 详情 | GPUHealthy=False、Xid 79 事件 ×4、conditions、pods 列表 |

### 3.4 推荐截图顺序（10 分钟一镜到底）

1. `/auth` 登录页
2. alice 登入 → 浮动助手 → **JS-2 query → 录 5 工具 + 三方案表**
3. 抽屉左侧切到 JS-3 → **JS-3 query → 弹 ConfirmCard → 确认 → resume 完成**
4. 切到 alice 工单页 → 点 1002 → 截 **agent escalate 报告（confidence 0.55 + trace）**
5. 登出，sysadmin 登入 → `/admin/aiops` 健康概览
6. 切到智能巡检报告 → 点最新 → 截 4 个区块
7. 浮动助手 → **AD-1 query → 录 pipeline_report 卡**
8. → **AD-2 query → gpu-node-03 4 来源诊断**
9. → **AD-3 query → BatchConfirmCard → 5 张勾选 → 确认 → 5 个 stop_job 渐进式播放**
10. `/admin/more/agent-audit` → 点 sess-alice-js2 → 截 4 tab → 重点截 **质量评估（4 variant）**
11. 切回会话列表 → 点 sess-admin-ad3 → 质量评估 Tab → 截 **running 状态**
12. `/admin/more/orders` → 点 1002 → 截 **agent escalate 报告**
13. 点 1005 → 截 **agent 拒绝自动审批（confidence 0.41，要求 human）**

---

## 4. Mock 数据完整清单

### 4.1 作业池

| 名称 | 归属 | 队列 | 状态 | 关键属性 |
|---|---|---|---|---|
| `my-train-job` | alice | gpu-l40s | Pending | WaitingForResources，2 GPU |
| `nlp-train-001` | alice | gpu-l40s | **Failed** | OOMKilled, exit 137, 1 GPU |
| `stuck-job-7` | alice | gpu-l40s | **Running**（14h 空跑） | gpuUtil 0.03，4 GPU |
| `idle-train-01..07` | bob/carol/dave/eve/frank/grace/henry | gpu-l40s/3090 交替 | Running | gpuUtil 0.020~0.050 |
| `cv-train-12` | bob | gpu-3090 | **Failed** | OOMKilled, exit 137 |
| `rl-train-04` | henry | gpu-l40s | **Failed** | Node Xid error, exit 139 |
| `big-job-1` | grace | gpu-l40s | **Failed** | Quota exceeded |
| `data-prep-09` | dave | gpu-3090 | **Failed** | PVC mount failure |

### 4.2 节点

| 名称 | 状态 | GPU | 显著属性 |
|---|---|---|---|
| gpu-node-01/02 | Ready | L40S ×4 满载 | 健康 |
| **gpu-node-03** | **Degraded** | L40S 3/4 | GPUHealthy=False, Xid 79 ×4 次事件 |
| gpu-node-04 | Ready | A100 ×8（用 6） | 健康 |
| gpu-node-05 | Ready | RTX3090 ×8（用 5） | 健康 |
| cpu-node-01 | Ready | 无 GPU | CPU 节点 |

### 4.3 工单（Approval Order）

| ID | 申请人 | 类型 | 状态 | reviewSource | agent verdict | confidence |
|---|---|---|---|---|---|---|
| 1001 | alice | job_extension | **Approved** | `agent_auto` | approve | 0.92 |
| 1002 | alice | quota_expansion | **Pending** | `agent_auto`（已转人工） | escalate | 0.55 |
| 1003 | alice | job_unlock | **Rejected** | `agent_auto` | approve（工单本身不必要） | 0.97 |
| 1004 | bob | job_extension | Approved | `admin_manual` | escalate | 0.62 |
| 1005 | grace | quota_expansion | **Pending** | `agent_auto`（要求 human） | escalate | 0.41 |

每个工单的 `agentReport` 都是 JSON-stringified `AgentReportData`，包含：
- `verdict` (approve | escalate)
- `confidence` (0–1)
- `reason` （决策依据，长文本）
- `user_message` （给用户看的内容）
- `admin_summary` （给管理员看的关键信号）
- `trace` （agent 调用工具的轨迹）

### 4.4 质量评估（24 条 + 1 running = 25 条）

每个会话对应 3-4 条不同 variant 的评估（JS-1 跳过 dialogue 类型保持差异）：

| 维度 | 取值 |
|---|---|
| evalScope | `session` / `turn` |
| evalType | `full` / `dialogue` / `task` |
| triggerSource | `manual` / `offline_batch` / `feedback` |
| evalStatus | `completed`（24 条）/ `running`（1 条，AD-3） |
| chatModel | `glm-4.6` / `qwen-max-latest` / `` |
| chainModel | `glm-4.6` / `` |
| dimensions（5 个） | relevance / factual / tool_use / risk_control / usability |

录管理员审计的"质量评估"Tab 时，点 `sess-alice-js2` 会展示 4 条不同 variant 的并列卡片，是截图重点。

---

## 5. 验证清单（录制开始前快速过一遍）

打开 demo 后按顺序确认：

- [ ] Service Worker 已注册（DevTools → Application）
- [ ] alice 登录成功，落到 `/portal/...`
- [ ] alice 看到 3 条自己的作业
- [ ] alice AI 助手抽屉左侧 3 条历史会话
- [ ] alice 工单页 3 条工单，点 1002 能看到 agent escalate 报告
- [ ] 登出，sysadmin 登录成功
- [ ] `/admin/aiops` 健康概览有 318 总作业
- [ ] 巡检报告 Tab 有 2 条记录
- [ ] `/admin/more/agent-audit` 列表 6 条会话，最后一条 latestEvalStatus=running
- [ ] 任意一条会话的质量评估 Tab 有 ≥3 条不同 variant
- [ ] `/admin/more/orders` 5 条工单，包含 agent_auto / admin_manual 两种 reviewSource
- [ ] Chat 6 个场景全部能触发并完整播完（含 JS-3、AD-3 的确认卡）
