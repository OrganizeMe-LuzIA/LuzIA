"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarScoreDatum {
  dominio: string;
  score: number;
}

interface RadarScoreChartProps {
  data: RadarScoreDatum[];
  height?: number;
}

export function RadarScoreChart({ data, height = 340 }: RadarScoreChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data.length ? data : [{ dominio: "Sem dados", score: 0 }]}>
        <PolarGrid />
        <PolarAngleAxis dataKey="dominio" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar dataKey="score" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}
