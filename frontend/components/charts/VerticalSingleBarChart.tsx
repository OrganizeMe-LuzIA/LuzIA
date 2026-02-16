"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartDatum = Record<string, string | number>;

interface VerticalSingleBarChartProps {
  data: ChartDatum[];
  valueKey: string;
  labelKey: string;
  height?: number;
  yAxisWidth?: number;
  xDomain?: [number, number];
  tickFontSize?: number;
  fill?: string;
  barRadius?: [number, number, number, number];
}

export function VerticalSingleBarChart({
  data,
  valueKey,
  labelKey,
  height = 300,
  yAxisWidth = 120,
  xDomain,
  tickFontSize,
  fill = "#14b8a6",
  barRadius = [0, 4, 4, 0],
}: VerticalSingleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={xDomain} />
        <YAxis type="category" dataKey={labelKey} width={yAxisWidth} tick={{ fontSize: tickFontSize }} />
        <Tooltip />
        <Bar dataKey={valueKey} fill={fill} radius={barRadius} />
      </BarChart>
    </ResponsiveContainer>
  );
}
