import React from 'react';
import { User } from '../types';
import { ProfileIcon } from './Icons';

interface ProfileProps {
  user: User;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  // Read stats directly from LS for display
  const level = localStorage.getItem('eco_level') || '1';
  const points = localStorage.getItem('eco_points') || '0';
  const savedCarbon = "12.5"; // Mock or calculate real sum based on usage

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto p-4 space-y-6">
      <header className="text-center mb-4">
        <h2 className="text-2xl font-bold text-leaf-900 flex items-center justify-center gap-2">
          <ProfileIcon className="text-leaf-600" />
          个人中心
        </h2>
      </header>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-leaf-100 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-leaf-50 rounded-full -mr-10 -mt-10 opacity-50"></div>
         
         <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-leaf-50 rounded-full mb-3 flex items-center justify-center text-5xl border-4 border-white shadow-md">
              {user.avatar}
            </div>
            <h3 className="text-xl font-bold text-gray-800">{user.username}</h3>
            
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
               <span>📍 {user.city} {user.community}</span>
            </div>

            {user.interests && user.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                 {user.interests.map(tag => (
                   <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                     {tag}
                   </span>
                 ))}
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-4 pt-4 border-t w-full">加入时间: {user.joinDate}</p>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-400 mb-1">当前等级</div>
          <div className="text-2xl font-bold text-leaf-600">Lv.{level}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="text-xs text-gray-400 mb-1">持有积分</div>
          <div className="text-2xl font-bold text-yellow-500">{points}</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-leaf-600 to-leaf-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
           <div>
             <div className="text-leaf-100 text-sm mb-1">累计减碳</div>
             <div className="text-3xl font-bold">{savedCarbon} kg</div>
           </div>
           <div className="bg-white/20 p-3 rounded-full">
             🌱
           </div>
        </div>
      </div>

      <button 
        onClick={onLogout}
        className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-xl hover:bg-red-100 transition-colors mt-auto"
      >
        退出登录
      </button>
    </div>
  );
};

export default Profile;