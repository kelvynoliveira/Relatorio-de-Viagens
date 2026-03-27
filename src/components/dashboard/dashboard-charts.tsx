'use client';

import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Trip } from '@/lib/models';
import { getMonthlyExpenseData, getCategoryDistribution, getMonthlyKmData } from '@/lib/chart-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface DashboardChartsProps {
  trips: Trip[];
}

export default function DashboardCharts({ trips }: DashboardChartsProps) {
  const expenseData = useMemo(() => getMonthlyExpenseData(trips), [trips]);
  const categoryData = useMemo(() => getCategoryDistribution(trips), [trips]);
  const kmData = useMemo(() => getMonthlyKmData(trips), [trips]);

  if (trips.length === 0) return null;

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {/* 1. Evolução Financeira (Area Chart) */}
      <Card className="lg:col-span-2 glass-card border-white/5 overflow-hidden group">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <div className="w-1.5 h-6 bg-primary rounded-full" />
            Evolução Mensal (R$)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={expenseData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 12 }} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 12 }}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  borderColor: 'rgba(255,255,255,0.1)', 
                  borderRadius: '1rem',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                formatter={(value: any) => [formatCurrency(Number(value)), 'Total Gasto']}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#9333ea" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorAmount)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2. Distribuição por Categoria (Radar Chart) */}
      <Card className="glass-card border-white/5 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
            Perfil de Gastos
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius="80%" data={categoryData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="category" tick={{ fill: '#888', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} axisLine={false} tick={false} />
              <Radar
                name="Gastos"
                dataKey="amount"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.5}
                animationDuration={1500}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'black', borderRadius: '12px', border: 'none' }}
                formatter={(value: any) => [formatCurrency(Number(value)), 'Valor']}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 3. KM Percorridos (Bar Chart) */}
      <Card className="lg:col-span-3 glass-card border-white/5 overflow-hidden">
        <CardHeader className="pb-2">
            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              Evolução de KM Percorrido
            </CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={kmData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ backgroundColor: 'black', borderRadius: '12px', border: 'none' }}
                formatter={(value: any) => [`${value} km`, 'Distância']}
              />
              <Bar dataKey="km" radius={[8, 8, 0, 0]} animationDuration={1000}>
                {kmData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#34d399'} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
