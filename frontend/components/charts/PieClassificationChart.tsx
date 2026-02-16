"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export interface PieClassificationDatum {
  name: string;
  value: number;
  color: string;
}

interface PieClassificationChartProps {
  data: PieClassificationDatum[];
  height?: number;
  outerRadius?: number;
  showLabel?: boolean;
}

export function PieClassificationChart({
  data,
  height = 300,
  outerRadius = 100,
  showLabel = true,
}: PieClassificationChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={outerRadius}
          dataKey="value"
          label={
            showLabel
              ? (payload: { name?: string; value?: number }) =>
                  `${payload.name || ""} ${payload.value ?? 0}`.trim()
              : false
          }
          labelLine={false}
        >
          {data.map((item) => (
            <Cell key={`${item.name}-${item.color}`} fill={item.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
