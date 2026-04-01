"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type ChartDataPoint = { label: string; revenue: number; expenses: number; profit: number };

type RevenueChartProps = {
  data: ChartDataPoint[];
};

function formatK(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f0ef" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatK}
            tick={{ fontSize: 11, fill: "#78716c" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)} MAD`, ""]}
            contentStyle={{
              border: "1px solid #e7e5e3",
              borderRadius: "12px",
              fontSize: "12px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            }}
          />
          <Legend
            formatter={(value) =>
              value === "revenue" ? "Recettes" : value === "expenses" ? "Dépenses" : "Bénéfice"
            }
            wrapperStyle={{ fontSize: "12px" }}
          />
          <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} name="revenue" />
          <Bar dataKey="expenses" fill="#f87171" radius={[4, 4, 0, 0]} name="expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
