'use client';

import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Trip } from '@/lib/models';
import { getTripExpenseData, getCategoryDistribution, getTripKmData } from '@/lib/chart-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface DashboardChartsProps {
  trips: Trip[];
}

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
            <BarChart data={tripExpenseData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 11 }} 
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
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  borderColor: 'rgba(255,255,255,0.1)', 
                  borderRadius: '1rem',
                  backdropFilter: 'blur(8px)'
                }}
                itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                formatter={(value: any) => [formatCurrency(Number(value)), 'Total Gasto']}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} animationDuration={1500}>
                {tripExpenseData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="#9333ea" opacity={0.8 - (index * 0.1)} />
                ))}
              </Bar>
            </BarChart>
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
            <BarChart data={kmData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ backgroundColor: 'black', borderRadius: '12px', border: 'none' }}
                formatter={(value: any) => [`${value} km`, 'Distância']}
              />
              <Bar dataKey="km" radius={[8, 8, 0, 0]} animationDuration={1000}>
                {kmData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="#10b981" opacity={0.8 - (index * 0.1)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
