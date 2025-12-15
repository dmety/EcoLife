import React, { useState, useEffect, useRef } from 'react';
import { Habit, Reward, User } from '../types';

interface HabitGrowthProps {
  user: User;
}

const HabitGrowth: React.FC<HabitGrowthProps> = ({ user }) => {
  // Ref for scrolling to top
  const contentRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [level, setLevel] = useState(() => {
    const val = parseInt(localStorage.getItem('eco_level') || '1');
    return isNaN(val) ? 1 : val;
  });
  
  const [xp, setXp] = useState(() => {
    const val = parseInt(localStorage.getItem('eco_xp') || '20');
    return isNaN(val) ? 20 : val;
  });

  const [points, setPoints] = useState(() => {
    const val = parseInt(localStorage.getItem('eco_points') || '100');
    return isNaN(val) ? 100 : val;
  });
  
  const [activeTab, setActiveTab] = useState<'habits' | 'wallet'>('habits');
  
  const [inventory, setInventory] = useState<Reward[]>(() => {
    try {
      const saved = localStorage.getItem('eco_inventory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // UI State for Feedback Modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redeemedItem, setRedeemedItem] = useState<Reward | null>(null);

  // --- PERSISTENCE ---
  useEffect(() => localStorage.setItem('eco_level', level.toString()), [level]);
  useEffect(() => localStorage.setItem('eco_xp', xp.toString()), [xp]);
  useEffect(() => localStorage.setItem('eco_points', points.toString()), [points]);
  useEffect(() => localStorage.setItem('eco_inventory', JSON.stringify(inventory)), [inventory]);

  // --- HABITS LOGIC ---
  const getInitialHabits = () => {
    const defaultHabits: Habit[] = [
      { id: '1', title: '自带水杯', points: 10, completed: false, icon: '🥤' },
      { id: '2', title: '垃圾分类投放', points: 20, completed: false, icon: '♻️' },
      { id: '3', title: '乘坐公共交通', points: 30, completed: false, icon: '🚌' },
      { id: '4', title: '光盘行动', points: 15, completed: false, icon: '🍽️' },
      { id: '5', title: '不使用一次性餐具', points: 10, completed: false, icon: '🥢' },
    ];

    const lastDate = localStorage.getItem('eco_last_date');
    const today = new Date().toDateString();
    
    if (lastDate !== today) {
      localStorage.setItem('eco_last_date', today);
      return defaultHabits;
    }

    try {
      const savedHabits = localStorage.getItem('eco_habits');
      return savedHabits ? JSON.parse(savedHabits) : defaultHabits;
    } catch (e) {
      return defaultHabits;
    }
  };

  const [habits, setHabits] = useState<Habit[]>(getInitialHabits);

  useEffect(() => {
    localStorage.setItem('eco_habits', JSON.stringify(habits));
  }, [habits]);

  const rewards: Reward[] = [
    { id: '1', title: '星巴克 3元减免券', cost: 100, provider: 'Starbucks', type: 'coupon' },
    { id: '2', title: '共享单车 周卡', cost: 200, provider: 'Meituan', type: 'coupon' },
    { id: '3', title: '捐赠一颗梭梭树', cost: 500, provider: 'Ant Forest', type: 'donation' },
    { id: '4', title: '有机蔬菜 9折购', cost: 150, provider: 'FreshLife', type: 'coupon' },
  ];

  const handleCheck = (id: string) => {
    const habit = habits.find(h => h.id === id);
    if (habit && !habit.completed) {
      setHabits(habits.map(h => h.id === id ? { ...h, completed: true } : h));
      setPoints(prev => prev + habit.points);
      
      const newXp = xp + habit.points;
      if (newXp >= 100) {
        setLevel(l => l + 1);
        setXp(newXp - 100);
      } else {
        setXp(newXp);
      }
    }
  };

  const handleRedeem = (reward: Reward) => {
    // 1. Check Points
    if (points < reward.cost) {
      // Use a simple alert for error, but we could also use a toast
      alert(`积分不足！需要 ${reward.cost} 积分，您当前只有 ${points} 积分。`);
      return;
    }

    // 2. Immediate Execution (No native confirm dialog to block UI)
    const newPoints = points - reward.cost;
    setPoints(newPoints);
    
    // Add unique ID to inventory item
    const newItem = { ...reward, id: Date.now().toString() };
    setInventory(prev => [newItem, ...prev]);

    // 3. Show Custom Success Modal
    setRedeemedItem(newItem);
    setShowSuccessModal(true);

    // 4. Scroll to top to show inventory
    setTimeout(() => {
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto p-4 space-y-4 relative">
      
      {/* --- SUCCESS MODAL OVERLAY --- */}
      {showSuccessModal && redeemedItem && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl transform transition-all animate-bounce-in relative z-10 flex flex-col items-center text-center">
            
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 text-4xl shadow-inner">
              🎁
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-2">兑换成功!</h3>
            <p className="text-gray-500 mb-6">
              您已消耗 <span className="font-bold text-leaf-600">{redeemedItem.cost}</span> 积分
              <br />
              兑换了 <span className="font-bold text-gray-800">{redeemedItem.title}</span>
            </p>

            <div className="w-full bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
               <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">当前积分余额</div>
               <div className="text-3xl font-bold text-leaf-600">{points}</div>
            </div>

            <button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-leaf-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-leaf-700 active:scale-95 transition-all"
            >
              收入卡包
            </button>
          </div>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-leaf-600 to-leaf-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden transition-all hover:shadow-xl flex-shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-2xl">{user.avatar}</span>
               <h2 className="text-2xl font-bold">Lv.{level} 环保卫士</h2>
            </div>
            <p className="text-leaf-100 text-sm">{user.username} · 距下一级还需 {100 - xp} XP</p>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
            <span>🪙</span>
            <span className="font-bold">{points}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-black/20 rounded-full h-3 mb-1 overflow-hidden">
          <div 
            className="bg-yellow-400 h-3 rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${xp}%` }}
          ></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1 border border-gray-100 shadow-sm flex-shrink-0">
        <button 
          onClick={() => setActiveTab('habits')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'habits' ? 'bg-leaf-50 text-leaf-700 shadow-sm' : 'text-gray-400'}`}
        >
          📝 每日打卡
        </button>
        <button 
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'wallet' ? 'bg-leaf-50 text-leaf-700 shadow-sm' : 'text-gray-400'}`}
        >
          🛍️ 绿色权益
        </button>
      </div>

      {/* Content Area */}
      <div ref={contentRef} className="flex-1 overflow-y-auto space-y-3 pb-20 scrollbar-hide">
        
        {activeTab === 'habits' && (
          <div className="space-y-3 animate-fade-in">
             {habits.map(habit => (
               <div 
                 key={habit.id}
                 onClick={() => handleCheck(habit.id)}
                 className={`group flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${habit.completed ? 'bg-leaf-50 border-leaf-200 opacity-80' : 'bg-white border-gray-100 hover:border-leaf-300'}`}
               >
                 <div className="flex items-center gap-4">
                   <div className="text-2xl bg-gray-50 w-12 h-12 flex items-center justify-center rounded-full group-hover:scale-110 transition-transform">
                     {habit.icon}
                   </div>
                   <div>
                     <h3 className={`font-bold ${habit.completed ? 'text-leaf-800 line-through' : 'text-gray-800'}`}>
                       {habit.title}
                     </h3>
                     <span className="text-xs font-semibold text-leaf-500">+{habit.points} 积分</span>
                   </div>
                 </div>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${habit.completed ? 'bg-leaf-500 border-leaf-500 text-white' : 'border-gray-200'}`}>
                   {habit.completed && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                 </div>
               </div>
             ))}
             <div className="text-center text-xs text-gray-400 mt-4">
               每日 00:00 自动重置任务
             </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="space-y-6 animate-fade-in">
             
             {/* Inventory Section */}
             {inventory.length > 0 && (
               <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-100 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-orange-800 flex items-center gap-2">
                      🎒 我的卡包
                      <span className="bg-orange-200 text-orange-800 text-[10px] px-2 py-0.5 rounded-full">{inventory.length}</span>
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {inventory.map((item) => (
                      <div key={item.id} className="bg-white p-3 rounded-lg border border-orange-100 flex justify-between items-center shadow-sm">
                        <div>
                          <span className="text-xs font-bold text-orange-600 border border-orange-200 px-1 rounded mr-2">已兑换</span>
                          <span className="font-bold text-gray-800 text-sm">{item.title}</span>
                        </div>
                        <button className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded font-bold hover:bg-orange-600 shadow-sm active:scale-95 transition-transform" onClick={() => alert(`券码: ECO-${Math.random().toString(36).substr(2, 8).toUpperCase()}`)}>
                          立即使用
                        </button>
                      </div>
                    ))}
                  </div>
               </div>
             )}

             {/* Shop Section */}
             <div>
               <h3 className="font-bold text-gray-800 mb-3 px-1 border-l-4 border-leaf-500 pl-2">积分商城</h3>
               <div className="grid grid-cols-2 gap-3">
                {rewards.map(reward => {
                  const canAfford = points >= reward.cost;
                  return (
                    <div key={reward.id} className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between h-40 transition-all ${canAfford ? 'border-gray-100 hover:border-leaf-300 hover:shadow-md' : 'border-gray-100 opacity-70'}`}>
                      <div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${reward.type === 'coupon' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {reward.type === 'coupon' ? '优惠券' : '公益证书'}
                        </span>
                        <h3 className="font-bold text-gray-800 mt-2 leading-tight">{reward.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">{reward.provider}</p>
                      </div>
                      <button
                        onClick={() => handleRedeem(reward)}
                        className={`w-full py-2 rounded-lg text-sm font-bold mt-2 transition-all active:scale-95 ${canAfford ? 'bg-leaf-600 text-white hover:bg-leaf-700 shadow-md cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                      >
                        {reward.cost} 积分兑换
                      </button>
                    </div>
                  );
                })}
               </div>
             </div>
             
             {/* Bottom Spacer */}
             <div className="h-10"></div>
          </div>
        )}

      </div>
    </div>
  );
};

export default HabitGrowth;