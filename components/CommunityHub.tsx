import React, { useState, useEffect } from 'react';
import { getCommunityData, validateContentSafety } from '../services/geminiService';
import { CommunityData, User, MarketItem, LocalEvent } from '../types';
import { UsersIcon } from './Icons';

interface CommunityHubProps {
  user: User;
}

const CommunityHub: React.FC<CommunityHubProps> = ({ user }) => {
  // Local persistence for user's own posts to simulate "real backend"
  const [localItems, setLocalItems] = useState<MarketItem[]>(() => {
    try {
      const saved = localStorage.getItem('eco_market_items');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [localEvents, setLocalEvents] = useState<LocalEvent[]>(() => {
    try {
      const saved = localStorage.getItem('eco_events');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [aiData, setAiData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false); // New state for moderation check
  const [activeTab, setActiveTab] = useState<'market' | 'events'>('market');
  
  // Track joined events locally
  const [joinedEvents, setJoinedEvents] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('eco_joined_events');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  // Modal State
  const [activeModal, setActiveModal] = useState<{
    type: 'contact' | 'publish_item' | 'create_event' | null;
    data?: any;
  }>({ type: null });

  // Input states
  const [publishForm, setPublishForm] = useState({
    title: '',
    description: '',
    type: 'give' as 'give' | 'request',
    contactPhone: '',
    contactWechat: ''
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    location: '',
    description: ''
  });

  // Persist user posts
  useEffect(() => {
    localStorage.setItem('eco_market_items', JSON.stringify(localItems));
  }, [localItems]);

  useEffect(() => {
    localStorage.setItem('eco_events', JSON.stringify(localEvents));
  }, [localEvents]);

  useEffect(() => {
    localStorage.setItem('eco_joined_events', JSON.stringify([...joinedEvents]));
  }, [joinedEvents]);

  // Load AI Data
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const locationContext = `${user.city}${user.community ? user.community : ''}`;
        const result = await getCommunityData(locationContext);
        if (isMounted) setAiData(result);
      } catch (error) {
        console.error("Failed to load community data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [user.city, user.community]);

  // --- Actions ---

  const handleContact = (item: MarketItem) => {
    // For local items (user's own), usually you don't contact yourself, but for demo we show data
    const contactInfo = item.contact || {
      phone: '未知',
      wechat: '未知'
    };

    setActiveModal({
      type: 'contact',
      data: {
        title: item.title,
        phone: contactInfo.phone,
        wechat: contactInfo.wechat,
        author: item.author.username
      }
    });
  };

  const handleJoinEvent = (id: string) => {
    if (joinedEvents.has(id)) return;
    setJoinedEvents(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
    showToast(`🎉 报名成功!`);
  };

  const submitPublishItem = async () => {
    if (!publishForm.title.trim() || !publishForm.description.trim()) return;

    // 1. Phone Validation
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(publishForm.contactPhone)) {
        showToast("❌ 请输入有效的11位中国大陆手机号");
        return;
    }

    // 2. Content Moderation
    setIsVerifying(true);
    const contentToCheck = `${publishForm.title} ${publishForm.description}`;
    const safetyCheck = await validateContentSafety(contentToCheck);
    setIsVerifying(false);

    if (!safetyCheck.valid) {
        showToast(`⚠️ 内容违规: ${safetyCheck.reason || "包含敏感信息"}`);
        return;
    }
    
    // 3. Success
    const newItem: MarketItem = {
      id: `local_item_${Date.now()}`,
      title: publishForm.title,
      description: publishForm.description,
      type: publishForm.type,
      distance: '0.0km (我)',
      imageTag: publishForm.type === 'give' ? '🎁' : '🙋',
      author: { username: user.username, avatar: user.avatar, isMe: true },
      contact: {
        phone: publishForm.contactPhone,
        wechat: publishForm.contactWechat || '未填写'
      }
    };

    setLocalItems(prev => [newItem, ...prev]);
    setActiveModal({ type: null });
    setPublishForm({ title: '', description: '', type: 'give', contactPhone: '', contactWechat: '' });
    showToast('发布成功！您的物品已上架');
  };

  const submitCreateEvent = async () => {
    if (!eventForm.title.trim()) return;

    // Content Moderation for Events
    setIsVerifying(true);
    const contentToCheck = `${eventForm.title} ${eventForm.description}`;
    const safetyCheck = await validateContentSafety(contentToCheck);
    setIsVerifying(false);

    if (!safetyCheck.valid) {
        showToast(`⚠️ 内容违规: ${safetyCheck.reason || "包含敏感信息"}`);
        return;
    }

    const newEvent: LocalEvent = {
      id: `local_event_${Date.now()}`,
      title: eventForm.title,
      description: eventForm.description,
      date: eventForm.date || '近期',
      location: eventForm.location || user.community,
      participants: 1, // Me
      tags: ['居民发起', '社区'],
      author: { username: user.username, avatar: user.avatar, isMe: true }
    };

    setLocalEvents(prev => [newEvent, ...prev]);
    setJoinedEvents(prev => new Set(prev).add(newEvent.id)); // Auto join own event
    setActiveModal({ type: null });
    setEventForm({ title: '', date: '', location: '', description: '' });
    showToast('活动发起成功！');
  };

  // Toast
  const [toast, setToast] = useState<{show: boolean, message: string}>({show: false, message: ''});
  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // Merge Data
  const displayItems = [...localItems, ...(aiData?.items || [])];
  const displayEvents = [...localEvents, ...(aiData?.events || [])];

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto p-4 space-y-4 relative">
      
      {/* --- Modals --- */}
      {activeModal.type && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isVerifying && setActiveModal({ type: null })}></div>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10 animate-fade-in max-h-[90vh] overflow-y-auto">
            
            {/* Contact Modal */}
            {activeModal.type === 'contact' && activeModal.data && (
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  💬
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">联系 {activeModal.data.author}</h3>
                <p className="text-sm text-gray-500 mb-6 px-4">
                  关于 "{activeModal.data.title}"
                </p>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">电话</span>
                    <span className="font-mono font-bold text-gray-800 select-all">{activeModal.data.phone}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">微信</span>
                    <span className="font-mono font-bold text-gray-800 select-all">{activeModal.data.wechat}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal({ type: null })}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all"
                >
                  知道了
                </button>
              </div>
            )}

            {/* Publish Item Modal */}
            {activeModal.type === 'publish_item' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">发布闲置</h3>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">类型</label>
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setPublishForm({...publishForm, type: 'give'})}
                      className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${publishForm.type === 'give' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      🎁 赠送
                    </button>
                    <button 
                      onClick={() => setPublishForm({...publishForm, type: 'request'})}
                      className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${publishForm.type === 'request' ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-500'}`}
                    >
                      🙋 求购
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">物品名称</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-leaf-500"
                    placeholder="例如: 九成新 宜家台灯"
                    value={publishForm.title}
                    onChange={(e) => setPublishForm({...publishForm, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">描述</label>
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-leaf-500 h-20"
                    placeholder="简要描述物品状况..."
                    value={publishForm.description}
                    onChange={(e) => setPublishForm({...publishForm, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">手机号 <span className="text-red-500">*</span></label>
                    <input 
                      type="tel" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="11位手机号"
                      value={publishForm.contactPhone}
                      onChange={(e) => setPublishForm({...publishForm, contactPhone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">微信号 (选填)</label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      value={publishForm.contactWechat}
                      onChange={(e) => setPublishForm({...publishForm, contactWechat: e.target.value})}
                    />
                  </div>
                </div>

                <button 
                  onClick={submitPublishItem}
                  disabled={!publishForm.title || !publishForm.description || isVerifying}
                  className="w-full bg-leaf-600 text-white font-bold py-3 rounded-xl hover:bg-leaf-700 active:scale-95 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                >
                  {isVerifying && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                  {isVerifying ? 'AI 核验中...' : '确认发布'}
                </button>
              </div>
            )}

            {/* Create Event Modal */}
            {activeModal.type === 'create_event' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">发起活动</h3>
                
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">活动主题</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-leaf-500"
                    placeholder="例如: 周末夜跑"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">时间</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="例如: 本周六 19:00"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">地点</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="例如: 小区中心花园"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">详情</label>
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-leaf-500 h-20"
                    placeholder="介绍活动内容..."
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  />
                </div>

                <button 
                  onClick={submitCreateEvent}
                  disabled={!eventForm.title || isVerifying}
                  className="w-full bg-leaf-600 text-white font-bold py-3 rounded-xl hover:bg-leaf-700 active:scale-95 transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                >
                  {isVerifying && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
                  {isVerifying ? 'AI 核验中...' : '发起活动'}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* --- Toast Notification --- */}
      {toast.show && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-lg z-[70] flex items-center gap-2 whitespace-nowrap animate-fade-in">
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
        <div>
          <h2 className="text-2xl font-bold text-leaf-900 flex items-center gap-2">
            <UsersIcon className="text-leaf-600" />
            绿色社区
          </h2>
          <p className="text-leaf-700 text-sm flex items-center gap-1">
            <span className="font-semibold">{user.community || user.city}</span> · 真实邻里
          </p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-100 self-start md:self-auto">
           <button 
             onClick={() => setActiveTab('market')}
             className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'market' ? 'bg-leaf-100 text-leaf-800' : 'text-gray-400 hover:text-gray-600'}`}
           >
             市集
           </button>
           <button 
             onClick={() => setActiveTab('events')}
             className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${activeTab === 'events' ? 'bg-leaf-100 text-leaf-800' : 'text-gray-400 hover:text-gray-600'}`}
           >
             活动
           </button>
        </div>
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in py-12">
           <div className="w-8 h-8 border-4 border-leaf-200 border-t-leaf-600 rounded-full animate-spin mb-3"></div>
           <p className="text-xs text-leaf-600">正在寻找 {user.city} 附近的邻居...</p>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
          
          {/* Market View */}
          {activeTab === 'market' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center mb-4">
                <div>
                   <h3 className="font-bold text-blue-900">发布闲置</h3>
                   <p className="text-xs text-blue-700">家里有闲置？转给 {user.community || '邻居'} 吧</p>
                </div>
                <button 
                  onClick={() => setActiveModal({type: 'publish_item'})}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-sm active:scale-95 transition-transform"
                >
                  + 发布
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {displayItems.map(item => (
                  <div key={item.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="h-32 bg-gray-100 flex items-center justify-center text-4xl select-none relative">
                      {item.imageTag}
                      {item.author.isMe && (
                        <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">我发布的</span>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="text-lg">{item.author.avatar}</span>
                         <span className="text-xs text-gray-500 font-medium truncate">{item.author.username}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded text-white font-bold ${item.type === 'give' ? 'bg-leaf-500' : 'bg-orange-400'}`}>
                          {item.type === 'give' ? '赠送' : '求购'}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center truncate">
                          📍 {item.distance}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm truncate mb-1">{item.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 h-8 mb-3">{item.description}</p>
                      
                      <button 
                        onClick={() => handleContact(item)}
                        className="w-full mt-auto py-1.5 text-xs font-bold border border-gray-200 rounded text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        {item.author.isMe ? '查看详情' : '联系对方'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events View */}
          {activeTab === 'events' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-100 flex justify-between items-center mb-4">
                <div>
                   <h3 className="font-bold text-orange-900">发起活动</h3>
                   <p className="text-xs text-orange-700">约邻居一起夜跑、净塑、遛狗...</p>
                </div>
                <button 
                  onClick={() => setActiveModal({type: 'create_event'})}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-600 shadow-sm active:scale-95 transition-transform"
                >
                  + 发起
                </button>
              </div>

              {displayEvents.map(event => {
                const isJoined = joinedEvents.has(event.id);
                return (
                  <div key={event.id} className={`bg-white p-4 rounded-xl border shadow-sm flex gap-4 transition-all ${isJoined ? 'border-leaf-300 bg-leaf-50/30' : 'border-gray-100'}`}>
                    <div className="bg-leaf-50 w-16 h-16 rounded-lg flex flex-col items-center justify-center text-leaf-800 flex-shrink-0">
                      <span className="text-xs font-bold uppercase">{event.date.includes(' ') ? event.date.split(' ')[0].substring(0,2) : '近期'}</span>
                      <span className="text-lg font-bold">📅</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-800">{event.title}</h3>
                        {event.author.isMe && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded">我发起的</span>}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 mb-2">
                        <span className="text-sm">{event.author.avatar}</span>
                        <span className="text-xs text-gray-600">发起人: {event.author.username}</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span>⏰ {event.date}</span>
                        <span>📍 {event.location}</span>
                      </div>
                      
                      {event.description && <p className="text-xs text-gray-500 mb-2 bg-gray-50 p-2 rounded">{event.description}</p>}

                      <div className="flex gap-2 mb-3">
                        {event.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">#{tag}</span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between border-t pt-2">
                        <span className="text-xs text-leaf-600 font-medium">
                          {isJoined ? (parseInt(event.participants as any) + (event.author.isMe ? 0 : 1)) : event.participants} 人已报名
                        </span>
                        <button 
                          onClick={() => handleJoinEvent(event.id)}
                          disabled={isJoined}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                            isJoined 
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                              : 'bg-leaf-600 text-white hover:bg-leaf-700 active:scale-95'
                          }`}
                        >
                          {isJoined ? '已报名' : '立即报名'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="text-center text-xs text-gray-400 mt-6 pb-4">
                已显示 {user.city} 附近 {displayEvents.length} 个活动
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default CommunityHub;