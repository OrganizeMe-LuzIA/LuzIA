"use client";

import { forwardRef } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { Relatorio } from "@/lib/types/api";
import { formatDateTime, formatPercent, clamp } from "@/lib/utils/format";

interface PrintableReportProps {
  relatorio: Relatorio;
  orgName?: string;
  setorName?: string;
  userName?: string;
}

function toFiniteNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getHeatColor(value: number): string {
  if (value >= 70) return "#ef4444";
  if (value >= 50) return "#f59e0b";
  return "#10b981";
}

function classLabel(c: string): string {
  if (c === "favoravel") return "FAVORAVEL";
  if (c === "intermediario") return "INTERMEDIARIO";
  return "RISCO";
}

function classColor(c: string): string {
  if (c === "favoravel") return "#10b981";
  if (c === "intermediario") return "#f59e0b";
  return "#ef4444";
}

export const PrintableReport = forwardRef<HTMLDivElement, PrintableReportProps>(
  function PrintableReport({ relatorio, orgName, setorName, userName }, ref) {
    const radarData = relatorio.dominios
      .map((d) => ({
        dominio: (d.nome || "").length > 18 ? `${(d.nome || "").slice(0, 18)}...` : d.nome || "Sem domínio",
        score: clamp(Math.round(toFiniteNumber(d.media_dominio) * 20), 0, 100),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const distribuicaoData = relatorio.dominios
      .flatMap((d) => d.dimensoes)
      .map((dim) => {
        const f = toFiniteNumber(dim.distribuicao?.favoravel);
        const i = toFiniteNumber(dim.distribuicao?.intermediario);
        const r = toFiniteNumber(dim.distribuicao?.risco);
        const total = f + i + r || 1;
        const nome = dim.dimensao || "Sem dimensão";
        return {
          dimensao: nome.length > 22 ? `${nome.slice(0, 22)}...` : nome,
          favoravel: Number(((f / total) * 100).toFixed(2)),
          intermediario: Number(((i / total) * 100).toFixed(2)),
          risco: Number(((r / total) * 100).toFixed(2)),
        };
      })
      .sort((a, b) => b.risco - a.risco)
      .slice(0, 8);

    const heatmapData = relatorio.dominios.slice(0, 6).map((d) => ({
      dominio: d.nome || "Sem domínio",
      media: clamp(Math.round(toFiniteNumber(d.media_dominio) * 20), 0, 100),
      classificacao: d.classificacao_predominante,
    }));

    const tipoLabel =
      relatorio.tipoRelatorio === "individual"
        ? "Individual"
        : relatorio.tipoRelatorio === "setorial"
          ? "Setorial"
          : "Organizacional";

    return (
      <div
        ref={ref}
        style={{
          width: "800px",
          padding: "40px",
          fontFamily: "Arial, Helvetica, sans-serif",
          backgroundColor: "#ffffff",
          color: "#1e293b",
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: "3px solid #0d9488", paddingBottom: "16px", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#0d9488", margin: 0 }}>
            LuzIA - Relatório {tipoLabel}
          </h1>
          <div style={{ display: "flex", gap: "32px", marginTop: "12px", fontSize: "13px", color: "#475569" }}>
            {orgName && (
              <span>
                <strong>Organização:</strong> {orgName}
              </span>
            )}
            {setorName && (
              <span>
                <strong>Setor:</strong> {setorName}
              </span>
            )}
            {userName && (
              <span>
                <strong>Usuário:</strong> {userName}
              </span>
            )}
            <span>
              <strong>Data:</strong> {formatDateTime(relatorio.dataGeracao)}
            </span>
            <span>
              <strong>Gerado por:</strong> {relatorio.geradoPor}
            </span>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
          <div
            style={{
              flex: 1,
              padding: "16px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b" }}>Risco Global</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b" }}>
              {toFiniteNumber(relatorio.metricas.mediaRiscoGlobal).toFixed(2)}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Escala 0-4</div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "16px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b" }}>Proteção</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b" }}>
              {formatPercent(toFiniteNumber(relatorio.metricas.indiceProtecao))}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Fatores favoráveis</div>
          </div>
          <div
            style={{
              flex: 1,
              padding: "16px",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b" }}>Respondentes</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b" }}>
              {toFiniteNumber(relatorio.metricas.totalRespondentes)}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Base do relatório</div>
          </div>
        </div>

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
              Radar por Domínio
            </h2>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <RadarChart width={500} height={320} data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="dominio" tick={{ fontSize: 11, fill: "#475569" }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar dataKey="score" stroke="#0d9488" fill="#0d9488" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </div>
          </div>
        )}

        {/* Distribution Chart */}
        {distribuicaoData.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
              Distribuição por Dimensão
            </h2>
            <BarChart
              width={720}
              height={300}
              data={distribuicaoData}
              layout="vertical"
              margin={{ left: 140, right: 20, top: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="dimensao" width={140} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="favoravel" stackId="a" fill="#10b981" name="Favorável" />
              <Bar dataKey="intermediario" stackId="a" fill="#f59e0b" name="Intermediário" />
              <Bar dataKey="risco" stackId="a" fill="#ef4444" name="Risco" />
            </BarChart>
          </div>
        )}

        {/* Heatmap Table */}
        {heatmapData.length > 0 && (
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
              Mapa de Calor por Domínio
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      borderBottom: "2px solid #e2e8f0",
                      color: "#475569",
                    }}
                  >
                    Domínio
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "8px 12px",
                      borderBottom: "2px solid #e2e8f0",
                      color: "#475569",
                    }}
                  >
                    Score
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "8px 12px",
                      borderBottom: "2px solid #e2e8f0",
                      color: "#475569",
                    }}
                  >
                    Classificação
                  </th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => (
                  <tr key={row.dominio}>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", fontWeight: 500 }}>
                      {row.dominio}
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 16px",
                          borderRadius: "4px",
                          color: "#fff",
                          fontWeight: 600,
                          backgroundColor: getHeatColor(row.media),
                        }}
                      >
                        {row.media}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: "9999px",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#fff",
                          backgroundColor: classColor(row.classificacao),
                        }}
                      >
                        {classLabel(row.classificacao)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Recomendações */}
        {relatorio.recomendacoes?.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
              Recomendações Priorizadas
            </h2>
            {relatorio.recomendacoes.map((rec, idx) => (
              <div
                key={idx}
                style={{
                  padding: "12px 16px",
                  marginBottom: "8px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  borderLeft: `4px solid ${idx < 2 ? "#ef4444" : "#f59e0b"}`,
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 600, color: idx < 2 ? "#ef4444" : "#f59e0b" }}>
                  {idx < 2 ? "PRIORIDADE ALTA" : "PRIORIDADE MÉDIA"} - Ação {idx + 1}
                </div>
                <div style={{ fontSize: "13px", color: "#334155", marginTop: "4px" }}>{rec}</div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #e2e8f0",
            paddingTop: "12px",
            marginTop: "24px",
            fontSize: "11px",
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          Gerado por LuzIA em {formatDateTime(relatorio.dataGeracao)} | Relatório {tipoLabel} | ID:{" "}
          {relatorio.id}
        </div>
      </div>
    );
  },
);
