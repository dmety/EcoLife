
export enum AppView {
  TRACKER = 'tracker',
  RECYCLE = 'recycle',
  ADVICE = 'advice',
  QUIZ = 'quiz',
  GROWTH = 'growth',     // Habits & Wallet
  COMMUNITY = 'community', // Market & Events
  PROFILE = 'profile'    // New: User Profile
}

export interface User {
  username: string;
  avatar: string; // emoji
  joinDate: string;
  city: string;        // New: e.g., "Shanghai"
  community: string;   // New: e.g., "Sunshine Garden"
  interests: string[]; // New: e.g., ["Recycling", "Vegan"]
}

export interface CarbonEntry {
  transport: number; // km
  electricity: number; // kWh
  meatMeals: number; // count
}

export interface RecyclingResult {
  itemName: string;
  category: string; 
  disposalAdvice: string;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface QuizData {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

// New Types
export interface Habit {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  icon: string;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  provider: string; // e.g., "Starbucks", "Public Transit"
  type: 'coupon' | 'donation';
}

export interface Author {
  username: string;
  avatar: string;
  isMe?: boolean;
}

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  type: 'give' | 'request'; // "赠送" or "求购"
  distance: string;
  imageTag: string;
  author: Author; // Who posted this
  contact?: {
    phone: string;
    wechat: string;
  };
}

export interface LocalEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  participants: number;
  tags: string[];
  author: Author; // Who initiated this
  description?: string;
}

export interface CommunityData {
  items: MarketItem[];
  events: LocalEvent[];
}
