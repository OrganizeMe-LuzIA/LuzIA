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

interface VerticalStackedDistributionDatum {
  dimensao: string;
  favoravel: number;
  intermediario: number;
  risco: number;
}

interface VerticalStackedDistributionChartProps {
  data: VerticalStackedDistributionDatum[];
  height?: number;
  yAxisWidth?: number;
}

export function VerticalStackedDistributionChart({
  data,
  height = 340,
  yAxisWidth = 170,
}: VerticalStackedDistributionChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 100]} />
        <YAxis dataKey="dimensao" type="category" width={yAxisWidth} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="favoravel" stackId="a" fill="#10b981" name="Favorável" />
        <Bar dataKey="intermediario" stackId="a" fill="#f59e0b" name="Intermediário" />
        <Bar dataKey="risco" stackId="a" fill="#ef4444" name="Risco" />
      </BarChart>
    </ResponsiveContainer>
  );
}
