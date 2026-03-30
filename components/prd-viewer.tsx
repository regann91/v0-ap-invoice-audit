"use client"

import React from "react"
import { Card, Tabs, Typography, Table, Tag, Button } from "antd"
import { FileTextOutlined, LinkOutlined, DatabaseOutlined, ApiOutlined, RobotOutlined, SafetyCertificateOutlined, GlobalOutlined, BranchesOutlined } from "@ant-design/icons"

const { Title, Text, Paragraph } = Typography

export function PrdViewer({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const tabItems = [
    {
      key: "overview",
      label: "产品概述",
      children: (
        <div style={{ display: "grid", gap: 20 }}>
          <Card>
            <Title level={4} style={{ marginTop: 0 }}>产品定位</Title>
            <Paragraph>
              AP Invoice Audit 是一个面向财务团队的 AI Agent 管理系统，用于自动化发票审核流程。系统支持多区域运营（SEA、EA、LATAM），通过 AI Agent 实现发票提取、PO 匹配、AP 凭证生成等核心业务流程的自动化。
            </Paragraph>
          </Card>

          <Card>
            <Title level={4} style={{ marginTop: 0 }}>目标用户</Title>
            <Table
              columns={[
                { title: "角色", dataIndex: "role", render: (v) => <Text code>{v}</Text> },
                { title: "描述", dataIndex: "desc" },
              ]}
              dataSource={[
                { key: "1", role: "AP_MANAGER", desc: "应付账款经理，查看 Case、审核发票、查看报告" },
                { key: "2", role: "AI_OPS", desc: "AI 运维人员，管理 Agent、配置 Golden Set、运行回归测试" },
              ]}
              pagination={false}
              bordered={false}
              size="small"
            />
          </Card>
        </div>
      ),
    },
    {
      key: "arch",
      label: "系统架构",
      children: (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Link to full System Architecture page */}
          <Card style={{ background: "#e6f4ff", border: "1px solid #91caff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>完整系统架构图</Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  查看交互式架构图、数据流图、模块详情和 Agent 状态机
                </Text>
              </div>
              {onNavigate && (
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={() => onNavigate("system-architecture")}
                  style={{ background: "#1890ff" }}
                >
                  打开 System Architecture
                </Button>
              )}
            </div>
          </Card>

          {/* Tech Stack */}
          <Card>
            <Title level={4} style={{ marginTop: 0 }}>技术栈</Title>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {[
                { name: "Next.js", version: "16", color: "#000" },
                { name: "React", version: "19", color: "#61dafb" },
                { name: "TypeScript", version: "5.x", color: "#3178c6" },
                { name: "Ant Design", version: "5.x", color: "#1890ff" },
                { name: "Tailwind CSS", version: "4.x", color: "#06b6d4" },
              ].map((t) => (
                <div key={t.name} style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: `${t.color}10`,
                  border: `1px solid ${t.color}30`,
                  borderRadius: 6,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.color }} />
                  <Text style={{ fontSize: 12, fontWeight: 500 }}>{t.name}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t.version}</Text>
                </div>
              ))}
            </div>
          </Card>

          {/* Layered Architecture */}
          <Card>
            <Title level={4} style={{ marginTop: 0 }}>分层架构</Title>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                { layer: "Frontend Layer", icon: <GlobalOutlined />, color: "#1890ff", modules: ["React UI Layer", "State Management (Context)", "Role-Based Access"] },
                { layer: "Core Modules", icon: <RobotOutlined />, color: "#52c41a", modules: ["Knowledge Base", "Case Management", "Agent Management", "Regression Test"] },
                { layer: "Data Layer", icon: <DatabaseOutlined />, color: "#722ed1", modules: ["Mock Data Store", "Archive Utils", "Golden Cases State"] },
                { layer: "Cross-Cutting", icon: <SafetyCertificateOutlined />, color: "#fa8c16", modules: ["Region Context", "Role Context", "Type Definitions"] },
              ].map((l) => (
                <div key={l.layer} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: 12,
                  background: `${l.color}08`,
                  border: `1px solid ${l.color}20`,
                  borderRadius: 6,
                }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 6,
                    background: `${l.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: l.color,
                    fontSize: 16,
                    flexShrink: 0,
                  }}>
                    {l.icon}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>{l.layer}</Text>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {l.modules.map((m) => (
                        <Tag key={m} style={{ fontSize: 11, margin: 0 }}>{m}</Tag>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Core Modules */}
          <Card>
            <Title level={4} style={{ marginTop: 0 }}>核心模块</Title>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {[
                { name: "Knowledge Base", icon: <DatabaseOutlined />, desc: "Buyer、Supplier、Bank 知识库管理", color: "#1890ff" },
                { name: "Case Management", icon: <ApiOutlined />, desc: "发票 Case 管理，365 天活跃窗口，自动归档", color: "#52c41a" },
                { name: "Agent Management", icon: <RobotOutlined />, desc: "AI Agent 生命周期管理，版本控制", color: "#722ed1" },
                { name: "Regression Test", icon: <BranchesOutlined />, desc: "三集合回归测试 (Golden/Benchmark/Full)", color: "#fa8c16" },
              ].map((m) => (
                <div key={m.name} style={{
                  padding: 12,
                  border: "1px solid #f0f0f0",
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: `${m.color}10`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: m.color,
                    fontSize: 14,
                    flexShrink: 0,
                  }}>
                    {m.icon}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 13, display: "block" }}>{m.name}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{m.desc}</Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: "features",
      label: "功能特性",
      children: (
        <div style={{ display: "grid", gap: 24 }}>
          {/* Knowledge Base */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "#1890ff15", display: "flex", alignItems: "center", justifyContent: "center", color: "#1890ff" }}>
                <DatabaseOutlined />
              </div>
              <Title level={4} style={{ margin: 0 }}>Knowledge Base</Title>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 13, color: "#1890ff", display: "block", marginBottom: 8 }}>核心实体</Text>
              <Table
                size="small"
                pagination={false}
                bordered
                columns={[
                  { title: "实体", dataIndex: "name", width: 100, render: (v: string) => <Text strong>{v}</Text> },
                  { title: "描述", dataIndex: "desc" },
                  { title: "关键字段", dataIndex: "fields", render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
                ]}
                dataSource={[
                  { key: "1", name: "Buyer", desc: "采购方信息，代表发起采购请求的公司", fields: "id, name, address, contact" },
                  { key: "2", name: "Supplier", desc: "供应商信息，代表提供商品/服务的供应商", fields: "code, name, bankAccount, taxId" },
                  { key: "3", name: "Bank", desc: "银行信息，用于付款对账", fields: "bankCode, bankName, swiftCode" },
                ]}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: 13, color: "#1890ff", display: "block", marginBottom: 8 }}>交互细节</Text>
              <Table
                size="small"
                pagination={false}
                bordered
                columns={[
                  { title: "页面", dataIndex: "page", width: 140, render: (v: string) => <Text strong>{v}</Text> },
                  { title: "功能描述", dataIndex: "desc", width: 200 },
                  { title: "交互操作", dataIndex: "interaction" },
                  { title: "UI 元素", dataIndex: "ui", width: 160, render: (v: string) => <Tag style={{ fontSize: 10 }}>{v}</Tag> },
                ]}
                dataSource={[
                  { key: "1", page: "Knowledge Detail", desc: "查看实体详情", interaction: "点击侧边栏菜单进入，展示实体字段结构、示例数据、数据统计", ui: "Card + Descriptions" },
                  { key: "2", page: "Endpoint 配置", desc: "配置外部数据源连接", interaction: "填写 API Endpoint URL、选择认证方式、配置 API Key、点击 Test Connection 验证", ui: "Form + Input + Select" },
                  { key: "3", page: "数据同步", desc: "同步外部数据源", interaction: "点击 Sync Now 按钮手动触发，或配置定时任务自动同步", ui: "Button + Progress" },
                ]}
              />
            </div>
          </Card>

          {/* Case Management */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "#52c41a15", display: "flex", alignItems: "center", justifyContent: "center", color: "#52c41a" }}>
                <ApiOutlined />
              </div>
              <Title level={4} style={{ margin: 0 }}>Case Management</Title>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 13, color: "#52c41a", display: "block", marginBottom: 8 }}>核心实体: AuditCase</Text>
              <Table
                size="small"
                pagination={false}
                bordered
                columns={[
                  { title: "字段", dataIndex: "field", width: 120, render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
                  { title: "类型", dataIndex: "type", width: 100 },
                  { title: "描述", dataIndex: "desc" },
                  { title: "示例值", dataIndex: "example", render: (v: string) => <Text type="secondary" style={{ fontSize: 11 }}>{v}</Text> },
                ]}
                dataSource={[
                  { key: "1", field: "caseId", type: "string", desc: "Case 唯一标识", example: "CASE-001" },
                  { key: "2", field: "invoiceNo", type: "string", desc: "发票编号", example: "INV-2025-0001" },
                  { key: "3", field: "supplierName", type: "string", desc: "供应商名称", example: "Acme Corp" },
                  { key: "4", field: "entity", type: "string", desc: "所属实体 (区域代码)", example: "SG / TH / VN" },
                  { key: "5", field: "amount", type: "number", desc: "发票金额", example: "12500.00" },
                  { key: "6", field: "currency", type: "string", desc: "币种", example: "USD / SGD" },
                  { key: "7", field: "reviewDate", type: "string", desc: "审核日期 (365 天窗口判断依据)", example: "2025-03-15" },
                  { key: "8", field: "isGolden", type: "enum", desc: "是否为黄金测试集", example: "Golden / Non-Golden" },
                  { key: "9", field: "groundTruth", type: "enum", desc: "人工标注结果", example: "Pass / Fail / Pending" },
                ]}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: 13, color: "#52c41a", display: "block", marginBottom: 8 }}>交互细节</Text>
              <Table
                size="small"
                pagination={false}
                bordered
                columns={[
                  { title: "页面", dataIndex: "page", width: 160, render: (v: string) => <Text strong>{v}</Text> },
                  { title: "功能描述", dataIndex: "desc", width: 180 },
                  { title: "交互操作", dataIndex: "interaction" },
                  { title: "UI 元素", dataIndex: "ui", width: 140, render: (v: string) => <Tag style={{ fontSize: 10 }}>{v}</Tag> },
                  { title: "权限", dataIndex: "role", width: 80, render: (v: string) => <Text type="secondary" style={{ fontSize: 10 }}>{v}</Text> },
                ]}
                dataSource={[
                  { key: "1", page: "Case List", desc: "主列表，展示最近 365 天 Case", interaction: "搜索框输入关键词；Filter 选择 Entity/Golden/Ground Truth；点击行进入详情", ui: "Table + Search + Filter", role: "All" },
                  { key: "2", page: "Case Detail", desc: "查看 Case 完整信息", interaction: "查看发票图片预览、AI 提取结果、PO 匹配结果、Ground Truth 标注", ui: "Card + Image + JSON", role: "All" },
                  { key: "3", page: "Golden Case Mgmt", desc: "管理黄金测试集", interaction: "按 Step 切换 Tab；点击 Add to Golden Set 添加；Remove 移除；搜索/筛选", ui: "Tabs + Table + Button", role: "AI_OPS" },
                  { key: "4", page: "Pattern Library", desc: "管理 Case Pattern 标签", interaction: "查看 Pattern 分布统计；为 Case 添加/编辑 Pattern 标签", ui: "Table + Tag + Modal", role: "AI_OPS" },
                  { key: "5", page: "Archived Cases", desc: "查看已归档 Case (只读)", interaction: "搜索已归档 Case；查看 archivedAt 时间戳；点击行查看详情 (只读)", ui: "Table + Search", role: "All" },
                  { key: "6", page: "Run Archive Now", desc: "手动触发归档任务", interaction: "点击按钮触发归档；显示归档结果 (归档数量、跳过的 Golden Case)", ui: "Button + Confirm", role: "AI_OPS" },
                ]}
              />
              <div style={{ marginTop: 12, padding: 10, background: "#fff7e6", borderRadius: 4, border: "1px solid #ffd591" }}>
                <Text strong style={{ fontSize: 11, color: "#fa8c16" }}>归档规则</Text>
                <Text style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                  reviewDate &gt; 365 天 → 自动归档 | Golden Case 永久保留 | AI_OPS 可手动触发
                </Text>
              </div>
            </div>
          </Card>

          {/* Agent Management */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "#722ed115", display: "flex", alignItems: "center", justifyContent: "center", color: "#722ed1" }}>
                <RobotOutlined />
              </div>
              <Title level={4} style={{ margin: 0 }}>Agent Management</Title>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 13, color: "#722ed1", display: "block", marginBottom: 8 }}>核心实体: Agent</Text>
              <Table
                size="small"
                pagination={false}
                bordered
                columns={[
                  { title: "字段", dataIndex: "field", width: 130, render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
                  { title: "类型", dataIndex: "type", width: 100 },
                  { title: "描述", dataIndex: "desc" },
                  { title: "示例值", dataIndex: "example", render: (v: string) => <Text type="secondary" style={{ fontSize: 11 }}>{v}</Text> },
                ]}
                dataSource={[
                  { key: "1", field: "id", type: "string", desc: "Agent 唯一标识", example: "AGT-001" },
                  { key: "2", field: "agentName", type: "string", desc: "Agent 名称", example: "Line Item Validator" },
                  { key: "3", field: "flowId", type: "string", desc: "所属业务流程", example: "Invoice Processing" },
                  { key: "4", field: "step", type: "enum", desc: "处理步骤", example: "INVOICE_REVIEW / MATCH / AP_VOUCHER" },
                  { key: "5", field: "currentVersion", type: "string", desc: "当前生产版本", example: "v1.3.0" },
                  { key: "6", field: "status", type: "enum", desc: "Agent 状态", example: "TESTING / ACTIVE / DEPRECATED" },
                  { key: "7", field: "regions", type: "string[]", desc: "适用区域 (空数组=全区域)", example: "[\"SG\", \"TH\"]" },
                ]}
              />
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <div><Tag color="orange">TESTING</Tag><Text style={{ fontSize: 11 }}> 开发测试中</Text></div>
                <div><Tag color="green">ACTIVE</Tag><Text style={{ fontSize: 11 }}> 生产运行中</Text></div>
                <div><Tag color="default">DEPRECATED</Tag><Text style={{ fontSize: 11 }}> 已被替代</Text></div>
              </div>
            </div>

            <div>
              <Text strong style={{ fontSize: 13, color: "#722ed1", display: "block", marginBottom: 8 }}>交互细节</Text>
              <Table
                size="small"
                pagination={false}
                bordered
                columns={[
                  { title: "页面", dataIndex: "page", width: 150, render: (v: string) => <Text strong>{v}</Text> },
                  { title: "功能描述", dataIndex: "desc", width: 180 },
                  { title: "交互操作", dataIndex: "interaction" },
                  { title: "UI 元素", dataIndex: "ui", width: 140, render: (v: string) => <Tag style={{ fontSize: 10 }}>{v}</Tag> },
                  { title: "权限", dataIndex: "role", width: 80, render: (v: string) => <Text type="secondary" style={{ fontSize: 10 }}>{v}</Text> },
                ]}
                dataSource={[
                  { key: "1", page: "Agent List", desc: "Agent 列表，按 Region 筛选", interaction: "全局 Region Selector 切换区域；搜索框搜索 Agent 名称；点击行进入详情", ui: "Table + Search", role: "All" },
                  { key: "2", page: "Agent Detail 左侧", desc: "查看版本配置 (只读)", interaction: "展示 Model、Temperature、Max Tokens、Prompt 等配置；点击版本卡片切换配置", ui: "Card + Descriptions", role: "All" },
                  { key: "3", page: "Version List 右侧", desc: "版本管理面板", interaction: "查看 Current/Testing/Deprecated 版本列表；点击 View Config 切换左侧配置", ui: "Card + Table", role: "All" },
                  { key: "4", page: "Create New Version", desc: "创建新版本", interaction: "点击 New Version 按钮；选择 Copy From 版本；输入版本号 (v1.4.0-beta)；创建 TESTING 版本", ui: "Modal + Select + Input", role: "AI_OPS" },
                  { key: "5", page: "Publish", desc: "发布 TESTING 版本", interaction: "Regression Test 通过后，点击 Publish to Current；确认后 TESTING → ACTIVE", ui: "Button + Popconfirm", role: "AI_OPS" },
                  { key: "6", page: "Run Regression Test", desc: "跳转回归测试", interaction: "点击 Run Regression Test 链接，跳转至 Regression Test 页面并预选当前 Agent", ui: "Link", role: "AI_OPS" },
                ]}
              />
              <div style={{ marginTop: 12, padding: 10, background: "#f6ffed", borderRadius: 4, border: "1px solid #b7eb8f" }}>
                <Text strong style={{ fontSize: 11, color: "#52c41a" }}>发布条件</Text>
                <Text style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                  Golden Set &ge; 85% | Benchmark Set &ge; 85% | Full Set &ge; 85% | 仅 AI_OPS 可操作
                </Text>
              </div>
            </div>
          </Card>

          {/* Regression Test */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "#fa8c1615", display: "flex", alignItems: "center", justifyContent: "center", color: "#fa8c16" }}>
                <BranchesOutlined />
              </div>
              <Title level={4} style={{ margin: 0 }}>Regression Test</Title>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 13, color: "#fa8c16", display: "block", marginBottom: 8 }}>核心实体: Test Set</Text>
              <Table
                size="small"
                pagination={false}
                bordered
                columns={[
                  { title: "测试集", dataIndex: "name", width: 120, render: (v: string) => <Text strong>{v}</Text> },
                  { title: "描述", dataIndex: "desc" },
                  { title: "数据来源", dataIndex: "source" },
                  { title: "通过阈值", dataIndex: "threshold", width: 80, render: (v: string) => <Tag color="blue">{v}</Tag> },
                ]}
                dataSource={[
                  { key: "1", name: "Golden Set", desc: "黄金测试集，高质量人工标注", source: "Golden Case Management 维护", threshold: "≥ 85%" },
                  { key: "2", name: "Benchmark Set", desc: "基准测试集，性能基准参考", source: "历史稳定 Case 集合", threshold: "≥ 85%" },
                  { key: "3", name: "Full Set", desc: "全量测试集，完整 Pattern 覆盖", source: "所有可用测试 Case", threshold: "≥ 85%" },
                ]}
              />
            </div>

            <div>
              <Text strong style={{ fontSize: 13, color: "#fa8c16", display: "block", marginBottom: 8 }}>交互细节</Text>
              <Table
                size="small"
                pagination={false}
                bordered
                columns={[
                  { title: "功能", dataIndex: "feature", width: 160, render: (v: string) => <Text strong>{v}</Text> },
                  { title: "功能描述", dataIndex: "desc", width: 180 },
                  { title: "交互操作", dataIndex: "interaction" },
                  { title: "UI 元素", dataIndex: "ui", width: 140, render: (v: string) => <Tag style={{ fontSize: 10 }}>{v}</Tag> },
                ]}
                dataSource={[
                  { key: "1", feature: "Agent 选择", desc: "选择待测试 Agent", interaction: "下拉选择 TESTING 状态的 Agent；从 Agent Detail 跳转时自动预选", ui: "Select" },
                  { key: "2", feature: "Trigger Test", desc: "启动回归测试", interaction: "点击 Trigger Regression Test 按钮；依次执行 Golden → Benchmark → Full", ui: "Button" },
                  { key: "3", feature: "Progress Bar", desc: "实时显示测试进度", interaction: "显示当前执行的 Set 名称；进度条动态更新；预计剩余时间", ui: "Progress + Text" },
                  { key: "4", feature: "Verdict Banner", desc: "测试结果汇总", interaction: "所有 Set 通过 (≥85%) 显示 PASS (绿色大 Banner)；任一失败显示 FAIL (红色)", ui: "Alert Banner" },
                  { key: "5", feature: "Set Tabs", desc: "查看各 Set 详情", interaction: "切换 Golden/Benchmark/Full Tab；查看 Case-level 结果表格；展示 Pass/Fail 数量", ui: "Tabs + Table" },
                  { key: "6", feature: "Case-level Results", desc: "单个 Case 测试结果", interaction: "查看每个 Case 的 Expected vs Actual；Pass/Fail 状态；错误详情", ui: "Table + Tag" },
                  { key: "7", feature: "Simulate Failure", desc: "模拟测试失败 (Demo)", interaction: "点击按钮切换 Full Set 通过率为 78.2%，触发 FAIL 状态 (仅演示)", ui: "Button" },
                ]}
              />
              <div style={{ marginTop: 12, padding: 10, background: "#f0f5ff", borderRadius: 4, border: "1px solid #adc6ff" }}>
                <Text strong style={{ fontSize: 11, color: "#2f54eb" }}>测试流程</Text>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <Tag color="gold">Golden Set</Tag>
                  <span style={{ color: "#bfbfbf" }}>→</span>
                  <Tag color="blue">Benchmark Set</Tag>
                  <span style={{ color: "#bfbfbf" }}>→</span>
                  <Tag color="purple">Full Set</Tag>
                  <span style={{ color: "#bfbfbf" }}>→</span>
                  <Tag color="green">PASS → Publish</Tag>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: "data",
      label: "数据模型",
      children: (
        <div style={{ display: "grid", gap: 20 }}>
          <Card>
            <Title level={4} style={{ marginTop: 0 }}>AuditCase (发票 Case)</Title>
            <div style={{ background: "#fafafa", padding: 12, borderRadius: 4, fontFamily: "monospace", fontSize: 11, overflow: "auto" }}>
              <pre>{`caseId: string              // e.g. "CASE-001"
invoiceNo: string           // e.g. "INV-2025-0001"
supplierName: string
entity: string              // 2-letter code: "SG", "TH", ...
amount: number
currency: string
invoiceDate: string         // "YYYY-MM-DD"
reviewDate: string          // 用于 365 天活跃窗口
isGolden: "Golden" | "Non-Golden"
groundTruth: "Pass" | "Fail" | "Pending"
tags: string[]              // e.g. ["three-way-match"]`}</pre>
            </div>
          </Card>

          <Card>
            <Title level={4} style={{ marginTop: 0 }}>Agent</Title>
            <div style={{ background: "#fafafa", padding: 12, borderRadius: 4, fontFamily: "monospace", fontSize: 11, overflow: "auto" }}>
              <pre>{`id: string                  // e.g. "AGT-001"
agentName: string
flowId: string
step: string                // "INVOICE_REVIEW" | "MATCH" | "AP_VOUCHER"
currentVersion: string      // e.g. "v1.3.0"
status: "ACTIVE" | "TESTING" | "DEPRECATED"
description: string
regions: string[]           // 空数组 = 所有区域`}</pre>
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: "reference",
      label: "参考",
      children: (
        <div style={{ display: "grid", gap: 20 }}>
          <Card>
            <Title level={4} style={{ marginTop: 0 }}>支持区域</Title>
            <Table
              columns={[
                { title: "代码", dataIndex: "code", render: (v) => <Text code>{v}</Text>, width: 80 },
                { title: "区域", dataIndex: "name", flex: 1 },
                { title: "大区", dataIndex: "region", width: 80, render: (v) => <Tag>{v}</Tag> },
              ]}
              dataSource={[
                { key: "1", code: "SG", name: "Singapore", region: "SEA" },
                { key: "2", code: "TH", name: "Thailand", region: "SEA" },
                { key: "3", code: "VN", name: "Vietnam", region: "SEA" },
                { key: "4", code: "TW", name: "Taiwan", region: "EA" },
                { key: "5", code: "BR", name: "Brazil", region: "LATAM" },
              ]}
              pagination={false}
              bordered={false}
              size="small"
            />
          </Card>

          <Card>
            <Title level={4} style={{ marginTop: 0 }}>文档信息</Title>
            <ul style={{ fontSize: 13 }}>
              <li><Text strong>版本</Text>: 1.0</li>
              <li><Text strong>更新日期</Text>: 2025-03-19</li>
              <li><Text strong>完整文档</Text>: 保存于 <Text code>/docs/PRD.md</Text></li>
              <li><Text strong>包含内容</Text>: 产品定位、系统架构、功能模块、数据模型、全局功能、状态管理、组件通信、未来规划</li>
            </ul>
          </Card>
        </div>
      ),
    },
  ]

  return (
    <div style={{ padding: "24px 0" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <FileTextOutlined style={{ fontSize: 28, color: "#1890ff" }} />
          <div>
            <Title level={3} style={{ margin: 0 }}>产品需求文档 (PRD)</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>AP Invoice Audit - Agent Management System | v1.0</Text>
          </div>
        </div>
      </div>

      <Tabs items={tabItems} defaultActiveKey="overview" />

      <div style={{ marginTop: 24, padding: "16px", background: "#f6f8fa", borderRadius: 4, textAlign: "center" }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          完整 PRD 文档包括产品定位、系统架构、数据模型、功能设计、状态管理等完整设计文档，可在 <Text code>/docs/PRD.md</Text> 查看。
        </Text>
      </div>
    </div>
  )
}
