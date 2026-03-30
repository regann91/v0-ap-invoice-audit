# AP Invoice Audit - Agent Management System

## Product Requirements Document (PRD)

**Version**: 1.0  
**Last Updated**: 2025-03-19  
**Author**: AI Engineering Team

---

## 1. 产品概述

### 1.1 产品定位

AP Invoice Audit 是一个面向财务团队的 AI Agent 管理系统，用于自动化发票审核流程。系统支持多区域运营（SEA、EA、LATAM），通过 AI Agent 实现发票提取、PO 匹配、AP 凭证生成等核心业务流程的自动化。

### 1.2 目标用户

| 角色 | 描述 | 主要功能 |
|------|------|----------|
| `AP_MANAGER` | 应付账款经理 | 查看 Case、审核发票、查看报告 |
| `AI_OPS` | AI 运维人员 | 管理 Agent、配置 Golden Set、运行回归测试、发布 Agent 版本 |

### 1.3 支持区域

| 区域代码 | 区域名称 | 所属大区 |
|----------|----------|----------|
| SG | Singapore | SEA |
| TH | Thailand | SEA |
| VN | Vietnam | SEA |
| MY | Malaysia | SEA |
| PH | Philippines | SEA |
| ID | Indonesia | SEA |
| TW | Taiwan | EA |
| BR | Brazil | LATAM |
| CN | China | EA |
| HK | Hong Kong | EA |

---

## 2. 系统架构

### 2.1 技术栈

| 层级 | 技术选型 |
|------|----------|
| 框架 | Next.js 16 (App Router) |
| UI 库 | Ant Design 5.x + Tailwind CSS 4.x |
| 状态管理 | React Context + useState/useMemo |
| 类型系统 | TypeScript 5.x |
| 组件库 | shadcn/ui (部分) |

### 2.2 目录结构

```
├── app/
│   ├── layout.tsx          # 全局布局 + 字体配置
│   └── page.tsx            # 主入口 (AppShell)
├── components/
│   ├── agent-detail.tsx    # Agent 详情页
│   ├── agent-list.tsx      # Agent 列表页
│   ├── archived-cases.tsx  # 归档 Case 列表
│   ├── case-detail.tsx     # Case 详情页 (三步骤流程)
│   ├── case-management.tsx # Case 列表 (活跃窗口)
│   ├── golden-case-management.tsx  # Golden Set 管理
│   ├── knowledge-base.tsx  # 知识库详情
│   ├── knowledge-endpoint.tsx # 知识库 API 端点
│   ├── pattern-library.tsx # Pattern 库
│   └── regression-test.tsx # 回归测试
├── lib/
│   ├── archive-utils.ts    # 归档工具函数
│   ├── mock-data.ts        # Mock 数据 + 类型定义
│   ├── region-context.tsx  # 区域上下文
│   └── role-context.tsx    # 角色上下文
└── docs/
    └── PRD.md              # 本文档
```

### 2.3 页面路由

| 页面 Key | 面包屑路径 | 描述 |
|----------|------------|------|
| `knowledge-detail` | Knowledge Base > Knowledge Detail | 知识库详情 (Buyer、Supplier、Bank) |
| `knowledge-endpoint` | Knowledge Base > Endpoint | 知识库 API 端点配置 |
| `case-management` | Case Management > Case List | 活跃 Case 列表 (365 天窗口) |
| `archived-cases` | Case Management > Archived Cases | 归档 Case 列表 (只读) |
| `case-detail` | Case Management > Case List > Case Detail | Case 详情 (三步骤流程) |
| `golden-case-management` | Case Management > Golden Case Management | Golden Set 管理 |
| `pattern-library` | Case Management > Pattern Library | Pattern 库 |
| `agent-list` | Agent Management > Agent List | Agent 列表 |
| `agent-detail` | Agent Management > Agent List > Agent Detail | Agent 详情 |
| `regression-test` | Regression Test | 回归测试 |

---

## 3. 核心数据模型

### 3.1 Knowledge Base

#### BuyerInfo
```typescript
interface BuyerInfo {
  key: string
  buyerId: string           // e.g. "BUY-001"
  buyerName: string         // e.g. "Shopee Singapore Pte Ltd"
  region: string            // "SEA" | "EA" | "LATAM"
  entity: string            // 2-letter code: "SG" | "TH" | ...
  status: "Active" | "Inactive"
}
```

#### SupplierTermDate
```typescript
interface SupplierTermDate {
  key: string
  supplierId: string
  supplierName: string
  paymentTerm: string       // e.g. "Net 30"
  dueDateRule: string       // e.g. "Invoice Date + 30 days"
  region: string
}
```

#### SupplierBankAccount
```typescript
interface SupplierBankAccount {
  key: string
  supplierId: string
  bankName: string
  accountNo: string         // Masked: "****7821"
  currency: string
  country: string
}
```

### 3.2 Case Management

#### AuditCase
```typescript
interface AuditCase {
  key: string
  caseId: string            // e.g. "CASE-001"
  invoiceNo: string         // e.g. "INV-2025-0001"
  supplierName: string
  region: string            // "SEA" | "EA" | "LATAM"
  entity: string            // 2-letter code
  amount: number
  currency: string          // "SGD" | "THB" | "VND" | ...
  invoiceDate: string       // "YYYY-MM-DD"
  reviewDate: string        // 用于 365 天活跃窗口计算
  isGolden: "Golden" | "Non-Golden"
  groundTruth: "Pass" | "Fail" | "Pending"
  tags: string[]            // e.g. ["three-way-match", "header-check"]
}
```

#### ArchivedCase (扩展 AuditCase)
```typescript
interface ArchivedCase extends AuditCase {
  archivedAt: string        // ISO timestamp
}
```

#### GoldenCase
```typescript
interface GoldenCase {
  key: string
  caseId: string
  invoiceNo: string
  supplier: string
  region: string            // 2-letter code
  groundTruth: "Pass" | "Fail"
  patterns: string[]        // e.g. ["amount-mismatch", "header-check"]
  addedBy: string
  addedDate: string
}
```

#### GoldenCasesState
```typescript
type GoldenCasesState = Record<
  "INVOICE_REVIEW" | "MATCH" | "AP_VOUCHER",
  GoldenCase[]
>
```

### 3.3 Agent Management

#### AgentFlow
```typescript
interface AgentFlow {
  id: string                // e.g. "FLOW-001"
  name: string              // e.g. "Invoice Processing"
  description: string
  steps: AgentStepDef[]
}
```

#### AgentStepDef
```typescript
interface AgentStepDef {
  id: string                // e.g. "INVOICE_REVIEW"
  name: string              // e.g. "Invoice Review"
  flowId: string
}
```

#### Agent
```typescript
interface Agent {
  key: string
  id: string                // e.g. "AGT-001"
  agentName: string
  flowId: string
  step: AgentStep           // "INVOICE_REVIEW" | "MATCH" | "AP_VOUCHER" | ...
  currentVersion: string    // e.g. "v1.3.0" or "v1.4.0-beta"
  status: "ACTIVE" | "TESTING" | "DEPRECATED"
  lastUpdated: string
  description: string
  regions: string[]         // 空数组 = 所有区域
}
```

#### AgentDetailData
```typescript
interface AgentDetailData {
  id: string
  agentName: string
  description: string
  flowId: string
  step: AgentStep
  model: string             // e.g. "claude-sonnet-4-20250514"
  temperature: number       // 0.0 - 1.0
  maxTokens: number
  additionalParams: Array<{ key: string; value: string }>
  apiEndpoint: string
  apiKey: string
  authMethod: string
  systemPrompt: string
  userPromptTemplate: string
  versions: {
    current: AgentVersionInfo
    testing: AgentVersionInfo | null
    history: Array<{ version: string; date: string; publishedBy: string }>
  }
}
```

---

## 4. 功能模块详解

### 4.1 Knowledge Base (知识库)

#### 4.1.1 Knowledge Detail
展示三类主数据表格：
- **Buyer Info**: 买方信息 (Region、Entity、Status)
- **Supplier Term & Date**: 供应商付款条款
- **Supplier Bank Account**: 供应商银行账户

**功能点**:
- 表格支持搜索、分页
- 支持按 Region 筛选

#### 4.1.2 Knowledge Endpoint
展示知识库 API 端点配置：
- GET `/api/knowledge/buyers`
- GET `/api/knowledge/suppliers`
- GET `/api/knowledge/bank-accounts`

### 4.2 Case Management (Case 管理)

#### 4.2.1 Case List (活跃 Case 列表)

**活跃窗口规则**:
- 默认显示 `reviewDate` 在最近 365 天内的 Case
- Golden Set 中的 Case 永久保留，不受时间限制
- 已归档的 Case 不显示

**区域过滤**:
- Header 区域选择器驱动全局 Region 上下文
- Case List 按 `entity === region` 过滤

**列定义**:
| 列名 | 字段 | 排序 |
|------|------|------|
| Case ID | caseId | Yes |
| Invoice No. | invoiceNo | No |
| Supplier | supplierName | No |
| Region | region | No |
| Entity | entity | No |
| Amount | amount (格式化) | Yes |
| Invoice Date | invoiceDate | Yes |
| Review Date | reviewDate | Yes |
| Golden | isGolden (Tag) | No |
| Ground Truth | groundTruth (Tag) | No |
| Action | View Detail | - |

**归档管理**:
- 页面顶部显示 Info Banner: "Showing cases from the last 365 days. [View Archived Cases]"
- AI_OPS 角色可见 "Run Archive Now" 按钮，手动触发归档任务
- 归档任务逻辑: `isArchivable(case, goldenCaseIds)` → 移入 ArchivedCases

#### 4.2.2 Archived Cases (归档 Case 列表)

**特性**:
- 只读列表，不可编辑
- 与 Case List 相同的列 + `archivedAt` 列
- 支持搜索和筛选
- 按 Region 过滤

#### 4.2.3 Case Detail (Case 详情页)

**三步骤流程**:
1. **Step 1: Invoice Review** - 发票头部信息校验
2. **Step 2: Match** - PO 匹配 (三方匹配)
3. **Step 3: AP Voucher** - AP 凭证生成

**每个步骤包含**:
- AI Agent Output Panel
- Human Review Result Panel (Decision + Reason)
- Demo Toggle: 切换 Matched/Rejected 状态

**Match Section 详细面板**:
- **Match Summary Panel**: Invoice Total vs PO Total、Match Status、Matched Amount、Difference
- **PO Line Items Table**: 含 Difference 列 + Match 状态 (Mismatch 显示红色 + Tooltip)
- **Invoice Amount Verification Panel**: Subtotal、GST、Total、AP Voucher Amount 核对
- **Receipt Match Panel**: Receipt 行项目匹配状态

#### 4.2.4 Golden Case Management

**按步骤分组**:
- Tab: INVOICE_REVIEW / MATCH / AP_VOUCHER
- 每个步骤有独立的 Golden Case 配额 (Limit)

**功能点**:
- 搜索、按 Pattern 筛选、按 Ground Truth 筛选
- Add Case to Golden Set (Modal)
- 移除 Golden Case
- Pattern Distribution 可视化

**区域过滤**:
- 按 `goldenCase.region === region` 过滤
- 空列表显示 `<Empty>` 组件

### 4.3 Agent Management (Agent 管理)

#### 4.3.1 Agent List

**列定义**:
| 列名 | 字段 |
|------|------|
| Agent Name | agentName |
| Flow | flowId (显示 Flow Name) |
| Step | step |
| Version | currentVersion |
| Status | status (Tag) |
| Last Updated | lastUpdated |
| Actions | View / Trigger Test |

**区域过滤**:
- `regions.length === 0` 表示全区域可用
- 否则按 `regions.includes(region)` 过滤

**创建 Agent**:
- New Agent Drawer: Agent Name、Flow、Step、Description
- 默认 Version: `v0.1.0-draft`、Status: `TESTING`、Regions: `[]`

#### 4.3.2 Agent Detail

**信息展示**:
- 基本信息: Name、Description、Flow、Step、Status
- LLM 配置: Model、Temperature、Max Tokens、Additional Params
- API 配置: Endpoint、API Key、Auth Method
- Prompt 配置: System Prompt、User Prompt Template

**版本管理**:
- Current Version (ACTIVE)
- Testing Version (Beta)
- Version History

**操作**:
- Trigger Regression Test → 跳转 Regression Test 页面
- Publish → 将 Testing 版本发布为 Current

### 4.4 Regression Test (回归测试)

#### 4.4.1 测试集类型

| 类型 | 描述 |
|------|------|
| Golden Set | Golden Cases (Golden Set 管理中配置的 Case) |
| Benchmark Set | 基准测试集 (性能基准) |
| Full Set | 全量测试集 |

#### 4.4.2 测试流程

1. 选择 Agent (Dropdown)
2. 点击 "Run Regression Test"
3. 依次执行: Golden Set → Benchmark Set → Full Set
4. 显示进度条 + 实时状态

#### 4.4.3 测试结果

**Verdict Banner**:
- PASS: 所有 Set 达到发布阈值 (绿色)
- FAIL: 任一 Set 未达阈值 (红色)
- 阈值: Golden Pass Rate ≥ 80%

**每个 Set 的指标**:
- Total Cases
- Golden Pass Rate (%)
- Latency (P50 / P95)

**Case-level Results Table**:
- Case ID、Invoice No.、Expected、Actual、Match Status、Latency

#### 4.4.4 发布流程

- Regression Test PASS 后，AI_OPS 可点击 "Publish Agent"
- 发布将 Testing 版本升级为 Current (移除 `-beta` 后缀)
- 更新 Agent Status 为 `ACTIVE`

### 4.5 Pattern Library (Pattern 库)

展示所有可用的 Pattern 标签：
- `amount-mismatch`
- `header-check`
- `supplier-name-mismatch`
- `gst-calculation-error`
- `duplicate-invoice`
- `date-out-of-range`
- `three-way-match-fail`
- `line-item-qty-mismatch`
- `unit-price-discrepancy`
- `gl-account-wrong`
- `cost-center-mismatch`

---

## 5. 全局功能

### 5.1 Region Selector (区域选择器)

- 位于 Header 右侧
- 驱动全局 `RegionContext`
- 影响页面: Case List、Archived Cases、Golden Case Management、Agent List

### 5.2 Role Context (角色上下文)

- `AP_MANAGER`: 基础查看权限
- `AI_OPS`: 完整管理权限 (触发归档、发布 Agent、管理 Golden Set)

### 5.3 归档机制

**规则**:
- 活跃窗口: `reviewDate` 在最近 365 天内
- 归档条件: 超过 365 天 + 非 Golden Set Case
- Golden Set 中的 Case 永久保留

**触发方式**:
- 自动: 每日定时任务 (模拟)
- 手动: AI_OPS 点击 "Run Archive Now"

**API**:
```typescript
// lib/archive-utils.ts

const ARCHIVE_WINDOW_DAYS = 365

function isArchivable(case: AuditCase, goldenCaseIds: Set<string>): boolean
function runArchiveJob(active: AuditCase[], existing: ArchivedCase[], goldenIds: Set<string>): ArchiveJobResult
function getActiveCases(all: AuditCase[], archivedIds: Set<string>, goldenIds: Set<string>): AuditCase[]
```

---

## 6. 状态管理

### 6.1 全局状态 (AppShell)

| 状态 | 类型 | 描述 |
|------|------|------|
| `page` | `Page` | 当前页面 Key |
| `selectedKey` | `string` | Sidebar 选中项 |
| `openKeys` | `string[]` | Sidebar 展开的菜单 |
| `agents` | `Agent[]` | Agent 列表 (可编辑) |
| `goldenCases` | `GoldenCasesState` | Golden Set (按步骤分组) |
| `archivedCases` | `ArchivedCase[]` | 归档 Case 列表 |
| `passedAgentIds` | `string[]` | 已通过回归测试的 Agent ID |
| `selectedCase` | `AuditCase \| null` | 当前选中的 Case (用于 Detail 页) |
| `regressionAgentId` | `string \| undefined` | 预选的回归测试 Agent |

### 6.2 Context

| Context | Provider | 描述 |
|---------|----------|------|
| `RegionContext` | `RegionProvider` | 当前区域 (2-letter code) |
| `RoleContext` | `RoleProvider` | 当前角色 (`AP_MANAGER` / `AI_OPS`) |

---

## 7. 组件间通信

### 7.1 导航

```
AppShell
├── navigate(key) → setPage() + setSelectedKey()
├── goToCaseDetail(case) → setSelectedCase() + setPage("case-detail")
├── goToAgentDetail() → setPage("agent-detail")
├── goToRegressionTest(agentId?) → setRegressionAgentId() + setPage("regression-test")
└── goToArchivedCases() → setPage("archived-cases")
```

### 7.2 数据流

```
AgentList
  └── onTriggerTest(agentId) → RegressionTest (preselectedAgentId)
  
RegressionTest
  └── onPublish(agentId) → AppShell.handlePublish() → 更新 agents

GoldenCaseManagement
  └── setGoldenCases() → 更新 goldenCases → 影响 goldenCaseIdSet → 影响 CaseManagement 归档逻辑

CaseManagement
  └── onArchive(newly) → AppShell.handleArchive() → 更新 archivedCases
```

---

## 8. 未来规划

### 8.1 Phase 2 功能

- [ ] 真实数据库集成 (Supabase / Neon)
- [ ] 用户认证 (Supabase Auth)
- [ ] 实时 Agent 调用 (AI Gateway)
- [ ] 批量归档 API
- [ ] 导出功能 (CSV / Excel)

### 8.2 技术改进

- [ ] 迁移至 React Server Components
- [ ] 添加 E2E 测试 (Playwright)
- [ ] API Route 实现
- [ ] 权限中间件

---

## 9. 附录

### 9.1 Flow 与 Step 映射

| Flow ID | Flow Name | Steps |
|---------|-----------|-------|
| FLOW-001 | Invoice Processing | INVOICE_REVIEW → MATCH → AP_VOUCHER |
| FLOW-002 | Supplier Onboarding | SUPPLIER_VERIFY → BANK_CHECK |
| FLOW-003 | Payment Reconciliation | BANK_RECON → EXCEPTION_MGT |

### 9.2 Agent 列表

| Agent ID | Name | Flow | Step | Status |
|----------|------|------|------|--------|
| AGT-001 | Invoice Header Extractor | FLOW-001 | INVOICE_REVIEW | ACTIVE |
| AGT-002 | Line Item Validator | FLOW-001 | INVOICE_REVIEW | TESTING |
| AGT-003 | PO Matching Agent | FLOW-001 | MATCH | ACTIVE |
| AGT-004 | Three-Way Match Auditor | FLOW-001 | MATCH | DEPRECATED |
| AGT-005 | AP Voucher Generator | FLOW-001 | AP_VOUCHER | ACTIVE |
| AGT-006 | Voucher Approval Router | FLOW-001 | AP_VOUCHER | TESTING |
| AGT-007 | Supplier Data Validator | FLOW-002 | SUPPLIER_VERIFY | ACTIVE |
| AGT-008 | Bank Account Verifier | FLOW-002 | BANK_CHECK | TESTING |
| AGT-009 | Bank Statement Reconciler | FLOW-003 | BANK_RECON | ACTIVE |
| AGT-010 | Exception Classifier | FLOW-003 | EXCEPTION_MGT | ACTIVE |

---

**End of Document**
