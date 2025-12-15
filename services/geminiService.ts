import { GoogleGenAI, Type } from "@google/genai";
import { RecyclingResult, QuizData, CommunityData, CarbonEntry } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Local Data & Fallbacks (Guaranteed to load) ---

const LOCAL_QUIZZES: QuizData[] = [
  {
    question: "以下哪种垃圾最难自然降解？",
    options: ["报纸", "羊毛织物", "玻璃瓶", "香蕉皮"],
    answerIndex: 2,
    explanation: "玻璃瓶在自然环境中极其稳定，可能需要上百万年才能分解。相比之下，纸张和有机物只需几个月，羊毛需几年。"
  },
  {
    question: "中国推行的垃圾分类标准中，红色桶代表什么？",
    options: ["厨余垃圾", "可回收物", "有害垃圾", "其他垃圾"],
    answerIndex: 2,
    explanation: "在中国大部分城市的分类标准中，红色代表有害垃圾，蓝色代表可回收物，绿色代表厨余（易腐）垃圾，灰色/黑色代表其他垃圾。"
  },
  {
    question: "造成温室效应的主要气体是？",
    options: ["氧气", "氮气", "二氧化碳", "氢气"],
    answerIndex: 2,
    explanation: "二氧化碳 (CO2) 是最主要的人为温室气体，它会吸收地表辐射的热量，导致地球变暖。"
  },
  {
    question: "废旧电池应该投放到哪个颜色的垃圾桶？",
    options: ["蓝色", "绿色", "红色", "灰色"],
    answerIndex: 2,
    explanation: "废旧电池属于有害垃圾，应投放到红色的有害垃圾桶中，以免污染土壤和地下水。"
  },
  {
    question: "每回收1吨废纸，大约可以挽救多少棵树？",
    options: ["5棵", "17棵", "50棵", "100棵"],
    answerIndex: 1,
    explanation: "据统计，回收1吨废纸可造出850公斤好纸，挽救约17棵大树，节省3立方米木材。"
  },
  {
    question: "以下哪种行为属于“低碳出行”？",
    options: ["乘坐私家车", "乘坐飞机", "骑自行车", "驾驶大排量越野车"],
    answerIndex: 2,
    explanation: "骑自行车不消耗化石燃料，零排放，是典型的低碳出行方式。"
  },
  {
    question: "过期的药物属于什么垃圾？",
    options: ["可回收物", "厨余垃圾", "其他垃圾", "有害垃圾"],
    answerIndex: 3,
    explanation: "过期药品若随意丢弃会对环境造成污染，属于有害垃圾。"
  },
  {
    question: "“碳中和”是指什么？",
    options: ["停止排放二氧化碳", "通过植树等方式抵消排放量", "将碳埋在地下", "不再使用煤炭"],
    answerIndex: 1,
    explanation: "碳中和是指企业、团体或个人测算在一定时间内直接或间接产生的温室气体排放总量，通过植树造林、节能减排等形式，以抵消自身产生的二氧化碳排放量，实现二氧化碳“零排放”。"
  }
];

const COMMUNITY_FALLBACK: CommunityData = {
  items: [
    { 
      id: '1', title: '九成新自行车', description: '孩子长大了骑不了，免费送给有需要的邻居', type: 'give', distance: '1.2km', imageTag: '🚲',
      author: { username: '王叔叔', avatar: '👨🏻' }, contact: { phone: '138****1234', wechat: 'bike_wang' }
    },
    { 
      id: '2', title: '求购二手猫笼', description: '刚领养了一只流浪猫，求闲置猫笼', type: 'request', distance: '0.8km', imageTag: '🐱',
      author: { username: '爱猫的李', avatar: '👩🏻' }, contact: { phone: '139****5678', wechat: 'cat_lover' }
    },
    { 
      id: '3', title: '多肉植物分株', description: '阳台爆盆了，分享一些健康分株', type: 'give', distance: '0.3km', imageTag: '🌵',
      author: { username: '花草爷爷', avatar: '👴🏻' }, contact: { phone: '136****9999', wechat: 'plant_grandpa' }
    }
  ],
  events: [
    { 
      id: '1', title: '周末海滩净塑行动', date: '本周六 09:00', location: '阳光海滩', participants: 42, tags: ['公益', '净塑'],
      author: { username: '蓝丝带协会', avatar: '🎗️' }
    },
    { 
      id: '2', title: '旧衣改造工作坊', date: '下周日 14:00', location: '社区活动中心', participants: 15, tags: ['手工', '零浪费'],
      author: { username: '巧手张阿姨', avatar: '🧵' }
    }
  ]
};

// --- Helpers ---

/**
 * Executes a promise with a timeout. Returns fallback if timeout occurs or promise fails.
 * This prevents the app from "hanging" or "spinning" indefinitely.
 */
const safeExecute = async <T>(
  operation: () => Promise<T>, 
  timeoutMs: number, 
  fallback: T
): Promise<T> => {
  try {
    const timeoutPromise = new Promise<T>((resolve) => {
      setTimeout(() => resolve(fallback), timeoutMs);
    });
    // Race between the actual operation and the timeout
    return await Promise.race([operation(), timeoutPromise]);
  } catch (error) {
    console.warn("API Call failed or timed out, using fallback:", error);
    return fallback;
  }
};

// --- API Functions ---

export const getLocalQuiz = (): QuizData => {
  return LOCAL_QUIZZES[Math.floor(Math.random() * LOCAL_QUIZZES.length)];
};

export const classifyWasteItem = async (base64Image: string): Promise<RecyclingResult> => {
  // Vision tasks need a bit more time, but we still want a limit
  return safeExecute(async () => {
    const modelId = "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "分析这张图片。识别主要的垃圾物品。严格将其分类为中国常见的垃圾分类标准之一：'可回收物'、'有害垃圾'、'厨余垃圾'、'其他垃圾'。请提供简短的中文投放建议。" }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING },
            category: { type: Type.STRING },
            disposalAdvice: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["itemName", "category", "disposalAdvice"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as RecyclingResult;
    }
    throw new Error("No text response");
  }, 10000, { itemName: "未知物品", category: "其他垃圾", disposalAdvice: "无法识别，请建议投入其他垃圾桶", confidence: 0 });
};

export const analyzeCarbonFootprint = async (data: CarbonEntry): Promise<string> => {
  
  // Smart Local Fallback: Calculates suggestion based on the highest input
  // This ensures dynamic content even if offline/timeout
  const getSmartAdvice = () => {
    const t_impact = data.transport * 0.15;
    const e_impact = data.electricity * 0.5;
    const m_impact = data.meatMeals * 2.5;
    const max = Math.max(t_impact, e_impact, m_impact);

    if (max === 0) return "您本周还没有碳排放记录，是刚开始使用吗？期待您的绿色记录！🌱";
    if (max === t_impact) return "🚗 看来这周出行比较频繁哦！\n如果是短途，下周试试共享单车如何？每骑行1公里就能减少约150g碳排放，既省油钱又锻炼身体！";
    if (max === e_impact) return "⚡️ 家里的电器是这周的'排碳大户'。\n建议检查一下有没有长期待机的设备（如电视机顶盒）。尝试把空调调高1度，舒适又节能。";
    if (max === m_impact) return "🍖 肉食确实美味，但也是碳排放的重要来源。\n挑战一下：下周尝试一顿纯素晚餐？蔬菜沙拉或豆腐料理也是不错的选择！";
    return "您的各项数据比较均衡。💡 继续保持！尝试向身边朋友推广您的绿色生活方式吧。";
  };

  return safeExecute(async () => {
    const prompt = `
      用户本周碳排数据：
      - 私家车出行: ${data.transport} km
      - 家庭用电: ${data.electricity} kWh
      - 肉食餐数: ${data.meatMeals} 餐
      
      角色：你是一位幽默、接地气的环保老友，不是机器人。
      任务：
      1. 敏锐地指出这三项中对环境影响最大的一项（交通系数0.15/km, 电力0.5/kWh, 肉食2.5/餐）。
      2. 不要列出123点，而是给出一段连贯的、大约60-80字的点评。
      3. 提出一个具体、有趣的小挑战。
      
      示例风格："哎呀，这周车跑得有点多哦！尾气都快把云彩熏黑啦。🚗 要不咱们下周试着坐两次地铁？省下的油钱还能喝杯咖啡呢！☕️"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.8, // Slightly higher creativity for variety
      }
    });
    return response.text || getSmartAdvice();
  }, 12000, getSmartAdvice()); // Increased timeout to 12s, use smart fallback
};

export const getGreenLivingAdvice = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
  return safeExecute(async () => {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: history,
      config: {
        // Updated instruction to strictly request plain text without Markdown
        systemInstruction: "你是一个乐于助人、知识渊博的助手，名叫 'GreenBot'，致力于可持续生活、零浪费和环保习惯的推广。请用中文回答。请务必使用**纯文本**格式回复，**严禁**使用Markdown语法（例如不要使用 **加粗**、# 标题、- 列表符号等），不要使用任何特殊格式符号，直接输出文字段落。"
      }
    });
    const result = await chat.sendMessage({ message });
    return result.text || "抱歉，我没有听懂。";
  }, 8000, "抱歉，由于网络原因，我现在无法回答。请稍后再试。");
};

export const getEcoQuiz = async (): Promise<QuizData> => {
  // Use a variety of topics to prevent repetitive questions
  const topics = [
    "中国垃圾分类标准 (例如红蓝绿灰桶的区别)",
    "海洋塑料污染与治理",
    "全球变暖、碳排放与温室效应",
    "生物多样性保护 (例如濒危物种)",
    "家庭节水节电的小技巧",
    "新能源汽车与绿色交通",
    "可降解材料与白色污染",
    "零浪费生活方式 (Zero Waste)",
    "电子垃圾的处理",
    "有机农业与绿色食品"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  // Increase timeout to 4000ms to allow Gemini enough time to generate unique content.
  // The UI preloads the next question, so this slight delay is acceptable.
  return safeExecute(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `生成一个关于“${randomTopic}”的有趣的单项选择题。
      要求：
      1. 问题必须与“${randomTopic}”紧密相关。
      2. 4个选项中只有一个正确。
      3. 解释要生动有趣，能够科普知识。
      4. 严格返回JSON格式。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "answerIndex", "explanation"]
        }
      }
    });
    if (response.text) return JSON.parse(response.text) as QuizData;
    throw new Error("Empty");
  }, 4000, getLocalQuiz());
};

export const getCommunityData = async (locationContext: string = "中国城市"): Promise<CommunityData> => {
  // Short timeout (2.0s) for Community page
  return safeExecute(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `生成JSON数据模拟${locationContext}周边的环保社区内容。请模拟真实的社区居民作为发布者（author），包含avatar和username。
      Items包含id, title, description, type, distance, imageTag, author, contact(phone, wechat)。
      Events包含id, title, date, location, participants, tags, author, description。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  type: { type: Type.STRING },
                  distance: { type: Type.STRING },
                  imageTag: { type: Type.STRING },
                  author: {
                     type: Type.OBJECT,
                     properties: {
                       username: { type: Type.STRING },
                       avatar: { type: Type.STRING }
                     }
                  },
                  contact: {
                    type: Type.OBJECT,
                    properties: {
                      phone: { type: Type.STRING },
                      wechat: { type: Type.STRING }
                    }
                  }
                },
                required: ["id", "title", "description", "type", "distance", "imageTag", "author"]
              }
            },
            events: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  date: { type: Type.STRING },
                  location: { type: Type.STRING },
                  participants: { type: Type.INTEGER },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  author: {
                     type: Type.OBJECT,
                     properties: {
                       username: { type: Type.STRING },
                       avatar: { type: Type.STRING }
                     }
                  }
                },
                required: ["id", "title", "date", "location", "participants", "tags", "author"]
              }
            }
          },
          required: ["items", "events"]
        }
      }
    });
    if (response.text) return JSON.parse(response.text) as CommunityData;
    throw new Error("Empty");
  }, 2000, COMMUNITY_FALLBACK);
};

export const validateContentSafety = async (text: string): Promise<{ valid: boolean; reason?: string }> => {
   return safeExecute(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `作为社区内容审核员，请严格审核以下用户提交的文本安全性。
      文本：“${text}”。
      
      审核标准：
      1. 不得包含色情、暴力、血腥、恐怖内容。
      2. 不得包含侮辱谩骂、仇恨言论。
      3. 不得包含违法违规交易（如野生动物、违禁品）。
      4. 允许正常的闲置物品交易和社区活动。

      返回JSON: { "valid": boolean, "reason": "若违规的原因，安全则为空字符串" }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                valid: { type: Type.BOOLEAN },
                reason: { type: Type.STRING }
            },
            required: ["valid"]
        }
      }
    });
    if (response.text) {
       return JSON.parse(response.text);
    }
    return { valid: true };
  }, 4000, { valid: true }); // Fallback to allow if API fails, to not block user
};