import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export default function FraudTrendChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="fraudColor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#rose-500" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#rose-500" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="#94A3B8" 
          fontSize={11}
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis 
          stroke="#94A3B8" 
          fontSize={11}
          tickLine={false}
          axisLine={false}
          dx={-5}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)"
          }}
        />
        <Area 
          type="monotone" 
          dataKey="frauds" 
          stroke="#E11D48" 
          strokeWidth={2.5}
          fillOpacity={1} 
          fill="url(#fraudColor)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
