"use client";

import { useMemo } from "react";
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
  const normalizedData = useMemo(() => {
    const cleaned = data
      .filter((item) => item && typeof item.dominio === "string")
      .map((item) => ({
        dominio: item.dominio,
        score: Math.max(0, Math.min(100, Number(item.score) || 0)),
      }))
      .slice(0, 6);

    const padded = [...cleaned];
    for (let i = padded.length; i < 6; i += 1) {
      padded.push({
        dominio: `Eixo ${i + 1}`,
        score: 0,
      });
    }

    if (!padded.length) {
      return [{ dominio: "Sem dados", score: 0 }];
    }

    return padded;
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={normalizedData} outerRadius="72%">
        <PolarGrid gridType="polygon" stroke="#cbd5e1" />
        <PolarAngleAxis dataKey="dominio" tick={{ fontSize: 11, fill: "#334155" }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={6} tick={{ fill: "#64748b", fontSize: 10 }} />
        <Radar dataKey="score" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.45} />
        <Tooltip formatter={(value: number | string) => [`${Number(value || 0).toFixed(0)}%`, "Score"]} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
