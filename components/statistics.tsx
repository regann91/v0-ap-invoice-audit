"use client"

import React, { useState, useMemo } from "react"
import {
  Card, Tabs, DatePicker, Select, Button, Table, Row, Col, Space, Tag, Typography,
} from "antd"
import { DownloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ComposedChart,
} from "recharts"
import { statisticsData, type DailyMetrics, type StatisticsStep } from "@/lib/mock-data"
import { useRegion, getEntitiesForRegion, type EntityCode, type RegionCode } from "@/lib/region-context"

const { RangePickerProps } = DatePicker
const { Text } = Typography

// ── KPI Card ─────────────────────────────────────────────────────
function KPICard({
  title,
  value,
  unit,
  trend,
}: {
  title: string
  value: number
  unit: string
  trend: number
}) {
  const isPositive = trend >= 0
  return (
    <Card style={{ textAlign: "center", padding: "16px 12px" }}>
      <div style={{ fontSize: 13, color: "#8c8c8c", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        {value.toFixed(1)}{unit}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        {isPositive ? (
          <ArrowUpOutlined style={{ color: "#52c41a", fontSize: 12 }} />
        ) : (
          <ArrowDownOutlined style={{ color: "#ff4d4f", fontSize: 12 }} />
        )}
        <Text type={isPositive ? undefined : "danger"} style={{ fontSize: 12 }}>
          {Math.abs(trend).toFixed(1)}% vs prev
        </Text>
      </div>
    </Card>
  )
}

// ── Statistics Page ──────────────────────────────────────────────
export function Statistics() {
  const { region } = useRegion()
  const entityOptions = getEntitiesForRegion(region)
  const [selectedEntity, setSelectedEntity] = React.useState<EntityCode>(entityOptions[0] ?? "")
  const [activeStep, setActiveStep] = useState<StatisticsStep>("INVOICE_REVIEW")
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  // Reset entity when region changes
  React.useEffect(() => {
    const newOptions = getEntitiesForRegion(region)
    setSelectedEntity(newOptions[0] ?? "")
  }, [region])

  // Get data for active step
  const stepData = statisticsData.find((s) => s.step === activeStep)
  const dailyMetrics = stepData?.dailyMetrics ?? []

  // Filter by date range if provided
  const filteredMetrics = useMemo(() => {
    if (!dateRange) return dailyMetrics
    const [start, end] = dateRange
    return dailyMetrics.filter((m) => {
      const date = dayjs(m.date)
      return date.isAfter(start) || date.isSame(start) && (date.isBefore(end) || date.isSame(end))
    })
  }, [dailyMetrics, dateRange])

  // Calculate KPI averages
  const kpiMetrics = useMemo(() => {
    if (filteredMetrics.length === 0) {
      return { hardAccuracy: 0, automationRate: 0, pendingRate: 0, precisionPositive: 0, precisionNegative: 0, feedbackCoverage: 0 }
    }

    const avg = (key: keyof DailyMetrics) => {
      const sum = filteredMetrics.reduce((acc, m) => acc + (m[key] as number), 0)
      return sum / filteredMetrics.length
    }

    return {
      hardAccuracy: avg("hardAccuracy"),
      automationRate: avg("automationRate"),
      pendingRate: avg("pendingRate"),
      precisionPositive: avg("precisionPositive"),
      precisionNegative: avg("precisionNegative"),
      feedbackCoverage: avg("feedbackCoverageRate"),
    }
  }, [filteredMetrics])

  // Trends vs first day
  const calculateTrend = (key: keyof DailyMetrics) => {
    if (filteredMetrics.length < 2) return 0
    const first = filteredMetrics[0][key] as number
    const last = filteredMetrics[filteredMetrics.length - 1][key] as number
    return ((last - first) / first) * 100
  }

  // Chart data
  const chartData = filteredMetrics.map((m) => ({
    date: dayjs(m.date).format("MMM DD"),
    "Hard Accuracy": parseFloat(m.hardAccuracy.toFixed(1)),
    "Automation Rate": parseFloat(m.automationRate.toFixed(1)),
    "Pending Rate": parseFloat(m.pendingRate.toFixed(1)),
    "Risk Exposure": m.riskExposureSGD,
  }))

  // Table columns
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 100,
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
    },
    {
      title: "Total Count",
      dataIndex: "totalCount",
      key: "totalCount",
      width: 100,
      render: (count: number) => count,
    },
    {
      title: "Automation Rate",
      dataIndex: "automationRate",
      key: "automationRate",
      width: 120,
      render: (rate: number) => `${rate.toFixed(1)}%`,
    },
    {
      title: "Pending Rate",
      dataIndex: "pendingRate",
      key: "pendingRate",
      width: 110,
      render: (rate: number) => `${rate.toFixed(1)}%`,
    },
    {
      title: "Hard Accuracy",
      dataIndex: "hardAccuracy",
      key: "hardAccuracy",
      width: 110,
      render: (acc: number) => `${acc.toFixed(1)}%`,
    },
    {
      title: "Precision on Positive",
      dataIndex: "precisionPositive",
      key: "precisionPositive",
      width: 140,
      render: (p: number) => `${p.toFixed(1)}%`,
    },
    {
      title: "Precision on Negative",
      dataIndex: "precisionNegative",
      key: "precisionNegative",
      width: 140,
      render: (p: number) => `${p.toFixed(1)}%`,
    },
    {
      title: "Risk Exposure (SGD)",
      dataIndex: "riskExposureSGD",
      key: "riskExposureSGD",
      width: 140,
      render: (amount: number) => (
        activeStep === "INVOICE_REVIEW"
          ? `$${(amount / 1000).toFixed(1)}k`
          : "N/A"
      ),
    },
    {
      title: "Feedback Coverage Rate",
      dataIndex: "feedbackCoverageRate",
      key: "feedbackCoverageRate",
      width: 150,
      render: (rate: number) => `${rate.toFixed(1)}%`,
    },
  ]

  return (
    <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #f0f0f0", padding: "20px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={4} style={{ margin: "0 0 16px 0" }}>Statistics</Typography.Title>

        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>Date Range</div>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(range) => setDateRange(range as [dayjs.Dayjs, dayjs.Dayjs])}
              presets={[
                { label: "Last 7 days", value: [dayjs().subtract(6, "d"), dayjs()] },
                { label: "Last 30 days", value: [dayjs().subtract(29, "d"), dayjs()] },
              ]}
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={4}>
            <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>Region</div>
            <Select value={region} disabled style={{ width: "100%" }} />
          </Col>
          <Col span={6}>
            <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 4 }}>Entity</div>
            <Select
              value={selectedEntity}
              onChange={setSelectedEntity}
              options={entityOptions.map((e) => ({ value: e, label: e }))}
              style={{ width: "100%" }}
            />
          </Col>
          <Col span={8} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <Button icon={<DownloadOutlined />} type="text">
              Export Excel
            </Button>
          </Col>
        </Row>
      </div>

      {/* Step Tabs */}
      <Tabs
        activeKey={activeStep}
        onChange={(key) => setActiveStep(key as StatisticsStep)}
        items={[
          { key: "INVOICE_REVIEW", label: "Invoice Review" },
          { key: "MATCH", label: "Match" },
          { key: "AP_VOUCHER", label: "AP Voucher" },
        ]}
        style={{ marginBottom: 24 }}
      />

      {/* KPI Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <KPICard
            title="Hard Accuracy"
            value={kpiMetrics.hardAccuracy}
            unit="%"
            trend={calculateTrend("hardAccuracy")}
          />
        </Col>
        <Col span={4}>
          <KPICard
            title="Automation Rate"
            value={kpiMetrics.automationRate}
            unit="%"
            trend={calculateTrend("automationRate")}
          />
        </Col>
        <Col span={4}>
          <KPICard
            title="Pending Rate"
            value={kpiMetrics.pendingRate}
            unit="%"
            trend={calculateTrend("pendingRate")}
          />
        </Col>
        <Col span={4}>
          <KPICard
            title="Precision on Positive"
            value={kpiMetrics.precisionPositive}
            unit="%"
            trend={calculateTrend("precisionPositive")}
          />
        </Col>
        <Col span={4}>
          <KPICard
            title="Precision on Negative"
            value={kpiMetrics.precisionNegative}
            unit="%"
            trend={calculateTrend("precisionNegative")}
          />
        </Col>
        <Col span={4}>
          <KPICard
            title="Feedback Coverage Rate"
            value={kpiMetrics.feedbackCoverage}
            unit="%"
            trend={calculateTrend("feedbackCoverageRate")}
          />
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={activeStep === "INVOICE_REVIEW" ? 12 : 24}>
          <Card title="Quality Metrics Trend" style={{ height: 350 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Hard Accuracy" stroke="#1677ff" />
                  <Line type="monotone" dataKey="Automation Rate" stroke="#52c41a" />
                  <Line type="monotone" dataKey="Pending Rate" stroke="#faad14" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#8c8c8c" }}>No data</div>
            )}
          </Card>
        </Col>

        {activeStep === "INVOICE_REVIEW" && (
          <Col span={12}>
            <Card title="Risk Exposure Amount" style={{ height: 350 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `$${(value / 1000).toFixed(1)}k`}
                    />
                    <Bar dataKey="Risk Exposure" fill="#ff4d4f" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#8c8c8c" }}>No data</div>
              )}
            </Card>
          </Col>
        )}
      </Row>

      {/* Daily Detail Table */}
      <Card title="Daily Detail" style={{ marginBottom: 16 }}>
        <Table
          columns={columns}
          dataSource={filteredMetrics}
          size="small"
          rowKey="date"
          pagination={{ pageSize: 31, hideOnSinglePage: true }}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  )
}
