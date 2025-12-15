import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CarbonEntry } from '../types';
import { analyzeCarbonFootprint } from '../services/geminiService';
import { ChartIcon } from './Icons';

const COLORS = ['#34af6d', '#facc15', '#f87171'];

const CarbonTracker: React.FC = () => {
  const [data, setData] = useState<CarbonEntry>({
    transport: 0,
    electricity: 0,
    meatMeals: 0
  });

  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Simple estimations for visualization
  const calculatedData = [
    { name: '交通', value: data.transport * 0.15, unit: 'kg' }, // approx 0.15kg per km car
    { name: '电力', value: data.electricity * 0.5, unit: 'kg' }, // approx 0.5kg per kWh
    { name: '饮食', value: data.meatMeals * 2.5, unit: 'kg' },   // approx 2.5kg per meat meal
  ];

  const totalCarbon = calculatedData.reduce((acc, curr) => acc + curr.value, 0).toFixed(1);

  const handleAnalyze = async () => {
    if (totalCarbon === "0.0") return;
    setIsAnalyzing(true);
    
    // Pass the raw structured data object directly to the service
    // This allows the service to perform local smart calculations if AI fails
    const result = await analyzeCarbonFootprint(data);
    
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto p-4 space-y-6 overflow-y-auto pb-24">
       <header className="text-center">
        <h2 className="text-2xl font-bold text-leaf-900 flex items-center justify-center gap-2">
          <ChartIcon className="text-leaf-600" />
          碳足迹追踪
        </h2>
        <p className="text-leaf-700 text-sm mt-1">记录本周数据，量化环境影响</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-leaf-100 space-y-4">
          <h3 className="font-semibold text-gray-800 mb-2">本周活动录入</h3>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              私家车出行 (km)
            </label>
            <input
              type="number"
              min="0"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-400 transition-colors"
              value={data.transport || ''}
              onChange={(e) => setData({ ...data, transport: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              家庭用电 (kWh)
            </label>
            <input
              type="number"
              min="0"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-400 transition-colors"
              value={data.electricity || ''}
              onChange={(e) => setData({ ...data, electricity: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
              肉食餐数 (次数)
            </label>
            <input
              type="number"
              min="0"
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-400 transition-colors"
              value={data.meatMeals || ''}
              onChange={(e) => setData({ ...data, meatMeals: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || totalCarbon === "0.0"}
            className="w-full mt-4 bg-leaf-600 hover:bg-leaf-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? '生成分析中...' : 'AI 分析报告'}
          </button>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-leaf-100 flex flex-col justify-between min-h-[320px]">
          <h3 className="font-semibold text-gray-800 w-full text-left mb-4 border-b pb-2">排放估算</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="h-40 w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={calculatedData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {calculatedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(1)} kg`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-gray-800">{totalCarbon}</span>
                <span className="text-xs text-gray-400">kg CO₂e</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="w-full mt-6 space-y-2">
              {calculatedData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                    <span className="text-gray-600">{entry.name}</span>
                  </div>
                  <div className="font-mono font-bold text-gray-700">
                    {entry.value.toFixed(1)} <span className="text-xs text-gray-400 font-normal">{entry.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Analysis Result */}
      {aiAnalysis && (
        <div className="bg-gradient-to-br from-leaf-50 to-white p-6 rounded-2xl shadow-md border border-leaf-200">
          <h3 className="text-leaf-800 font-bold mb-3 flex items-center">
            🌱 您的专属减排建议
          </h3>
          <div className="prose prose-sm text-gray-700 whitespace-pre-line leading-relaxed break-words">
            {aiAnalysis}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarbonTracker;