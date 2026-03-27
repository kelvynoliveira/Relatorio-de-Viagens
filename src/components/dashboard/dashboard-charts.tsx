'use client';

import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Sector, Legend
} from 'recharts';
import { Trip } from '@/lib/models';
import { getTripExpenseData, getCategoryDistribution, getTripKmData } from '@/lib/chart-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface DashboardChartsProps {
  trips: Trip[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Combustível': '#10b981', // Emerald
  'Pedágio': '#3b82f6',     // Blue
  'Alimentação': '#fbbf24', // Amber
  'Mobilidade': '#8b5cf6',  // Violet
  'Hospedagem': '#ec4899',  // Pink
  'Outros': '#94a3b8'       // Slate
};

export default function DashboardCharts({ trips }: DashboardChartsProps) {
  const tripExpenseData = useMemo(() => getTripExpenseData(trips), [trips]);
  const categoryData = useMemo(() => getCategoryDistribution(trips), [trips]);
  const kmData = useMemo(() => getTripKmData(trips), [trips]);

  if (trips.length === 0) return null;

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {/* 1. Comparativo de Custo por Viagem (Bar Chart) */}
      <Card className="lg:col-span-2 glass-card border-white/5 overflow-hidden group">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <div className="w-1.5 h-6 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.3)]" />
            Gastos por Viagem (R$)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tripExpenseData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 10 }} 
                interval={0}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 11 }}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.85)', 
                  borderColor: 'rgba(255,255,255,0.1)', 
                  borderRadius: '1rem',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                formatter={(value: any) => [formatCurrency(Number(value)), 'Total Gasto']}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={50} animationDuration={1500}>
                {tripExpenseData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="#9333ea" opacity={1 - (index * 0.1)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. Distribuição por Categoria (Pie/Donut Chart) */}
      <Card className="glass-card border-white/5 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
            Perfil de Gastos
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy={100}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="amount"
                nameKey="category"
                animationDuration={1500}
                labelLine={false}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#888'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.9)', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)'
                }}
                formatter={(value: any) => [formatCurrency(Number(value)), 'Valor']}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center"
                layout="horizontal"
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value, entry: any) => {
                  const payload = entry.payload;
                  const total = categoryData.reduce((a, b) => a + b.amount, 0);
                  const percentage = ((payload.amount / total) * 100).toFixed(0);
                  return <span className="text-[10px] font-bold text-white/60 ml-1">{value} ({percentage}%)</span>;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3. KM por Viagem (Bar Chart) */}
      <Card className="lg:col-span-3 glass-card border-white/5 overflow-hidden">
        <CardHeader className="pb-2">
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              KM por Rodagem
            </CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kmData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 10 }} interval={0} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ backgroundColor: 'black', borderRadius: '12px', border: 'none' }}
                formatter={(value: any) => [`${value} km`, 'Distância']}
              />
              <Bar dataKey="km" radius={[6, 6, 0, 0]} maxBarSize={60} animationDuration={1200}>
                {kmData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="#10b981" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
