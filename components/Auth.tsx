import React, { useState } from 'react';
import { User } from '../types';
import { LeafIcon } from './Icons';

interface AuthProps {
  onLogin: (user: User) => void;
}

const AVATARS = ['🐼', '🐨', '🦊', '🦁', '🐯', '🐸', '🐰', '🐹'];
const INTEREST_TAGS = ['🚲 低碳出行', '♻️ 垃圾分类', '🥕 绿色饮食', '👐 旧物改造', '🧴 零浪费', '🏃 户外公益'];

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [community, setCommunity] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const toggleInterest = (tag: string) => {
    setSelectedInterests(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleLogin = () => {
    if (!username.trim() || !city.trim() || !community.trim()) return;
    
    const user: User = {
      username: username.trim(),
      avatar: selectedAvatar,
      city: city.trim(),
      community: community.trim(),
      interests: selectedInterests,
      joinDate: new Date().toLocaleDateString('zh-CN')
    };
    localStorage.setItem('eco_user', JSON.stringify(user));
    onLogin(user);
  };

  const isFormValid = username.trim() && city.trim() && community.trim();

  return (
    <div className="min-h-screen bg-[#f2fcf5] flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 md:p-8 space-y-6 animate-fade-in border border-leaf-100 my-auto">
        <div className="text-center">
          <div className="w-14 h-14 bg-leaf-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-lg transform rotate-3">
            <LeafIcon className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">欢迎加入绿色生活</h1>
          <p className="text-gray-500 text-xs mt-1">完善信息，发现身边的绿色伙伴</p>
        </div>

        <div className="space-y-5">
          {/* Avatar Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 text-center">选择头像</label>
            <div className="flex flex-wrap gap-3 justify-center">
              {AVATARS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`text-2xl w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    selectedAvatar === emoji 
                      ? 'bg-leaf-100 ring-2 ring-leaf-500 scale-110' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">昵称</label>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="怎么称呼您？"
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-leaf-500 focus:ring-2 focus:ring-leaf-200 outline-none transition-all"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">城市</label>
                <input 
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="例如: 上海"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-leaf-500 focus:ring-2 focus:ring-leaf-200 outline-none transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">小区/社区</label>
                <input 
                  type="text"
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                  placeholder="例如: 幸福家园"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-leaf-500 focus:ring-2 focus:ring-leaf-200 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Interests */}
          <div>
             <label className="block text-xs font-bold text-gray-700 mb-2">感兴趣的话题 (多选)</label>
             <div className="flex flex-wrap gap-2">
               {INTEREST_TAGS.map(tag => (
                 <button
                   key={tag}
                   onClick={() => toggleInterest(tag)}
                   className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                     selectedInterests.includes(tag)
                       ? 'bg-leaf-100 text-leaf-800 border-leaf-300'
                       : 'bg-white text-gray-500 border-gray-200 hover:border-leaf-300'
                   }`}
                 >
                   {tag}
                 </button>
               ))}
             </div>
          </div>

          <button 
            onClick={handleLogin}
            disabled={!isFormValid}
            className="w-full bg-leaf-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-leaf-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            开启旅程
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;