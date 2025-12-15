import React, { useState, useRef } from 'react';
import { classifyWasteItem } from '../services/geminiService';
import { RecyclingResult } from '../types';
import { UploadIcon, ScanIcon } from './Icons';

const RecycleAssistant: React.FC = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<RecyclingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image to speed up transmission
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimension 800px is enough for recognition and much faster
          const MAX_DIM = 800; 
          if (width > height) {
            if (width > MAX_DIM) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context error"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          // Return as base64 jpeg with 0.7 quality
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        // Display raw preview immediately for better UX
        const objectUrl = URL.createObjectURL(file);
        setImagePreview(objectUrl);
        
        // Compress for API calls
        const compressedBase64 = await compressImage(file);
        // Remove header for API
        analyzeImage(compressedBase64.split(',')[1]); 
      } catch (e) {
        console.error("Compression failed", e);
        alert("图片处理失败");
        setLoading(false);
      }
    }
  };

  const analyzeImage = async (base64: string) => {
    setResult(null);
    try {
      const data = await classifyWasteItem(base64);
      setResult(data);
    } catch (err) {
      alert("识别失败，请重试或检查图片");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (cat: string) => {
    if (cat.includes("可回收")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (cat.includes("有害")) return "bg-red-100 text-red-800 border-red-200";
    if (cat.includes("厨余") || cat.includes("湿")) return "bg-green-100 text-green-800 border-green-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto p-4 space-y-6">
      <header className="text-center mb-4">
        <h2 className="text-2xl font-bold text-leaf-900 flex items-center justify-center gap-2">
          <ScanIcon className="text-leaf-600" />
          智能分类
        </h2>
        <p className="text-leaf-700 text-sm mt-1">拍照识别垃圾，获取分类建议</p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        {/* Upload Area */}
        <div 
          onClick={() => !loading && fileInputRef.current?.click()}
          className={`relative w-full aspect-square max-w-sm rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden shadow-sm
            ${imagePreview ? 'border-leaf-400' : 'border-gray-300 hover:border-leaf-400 bg-white hover:bg-leaf-50'}
            ${loading ? 'cursor-not-allowed opacity-80' : ''}
          `}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Uploaded" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-6">
              <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">点击上传或拍照</p>
              <p className="text-xs text-gray-400 mt-1">支持 JPG, PNG (自动压缩加速)</p>
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="w-full max-w-sm bg-white p-4 rounded-xl shadow-md border border-gray-100 animate-pulse">
            <div className="flex items-center justify-center mb-3">
               <div className="w-5 h-5 border-2 border-leaf-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-center text-sm text-leaf-600 font-medium">AI 正在极速分析...</p>
          </div>
        )}

        {/* Result Card */}
        {result && !loading && (
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-leaf-100 overflow-hidden transform transition-all duration-500 ease-out translate-y-0 opacity-100">
            <div className={`p-4 font-bold text-lg text-center border-b ${getCategoryColor(result.category)}`}>
              {result.category}
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">识别物品</span>
                <span className="font-semibold text-gray-800">{result.itemName}</span>
              </div>
              <div className="bg-leaf-50 p-3 rounded-lg text-sm text-leaf-800 leading-relaxed">
                <span className="font-bold mr-1">💡 投放建议:</span>
                {result.disposalAdvice}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecycleAssistant;
