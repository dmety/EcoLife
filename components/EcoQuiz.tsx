import React, { useState, useEffect, useRef } from 'react';
import { getEcoQuiz, getLocalQuiz } from '../services/geminiService';
import { QuizData } from '../types';
import { BulbIcon } from './Icons';

const EcoQuiz: React.FC = () => {
  // Initialize with a local quiz immediately for zero wait time
  const [quiz, setQuiz] = useState<QuizData>(getLocalQuiz());
  
  // Store the *next* quiz in memory to display it instantly when "Next" is clicked
  const [nextQuizData, setNextQuizData] = useState<QuizData | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const fetchingRef = useRef(false);

  // Function to load the next question in the background
  const preloadNextQuiz = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const data = await getEcoQuiz();
      setNextQuizData(data);
    } catch (e) {
      console.error(e);
    } finally {
      fetchingRef.current = false;
    }
  };

  // Start preloading immediately on mount
  useEffect(() => {
    preloadNextQuiz();
  }, []);

  const handleNextQuestion = async () => {
    setLoading(true);
    setSelectedOption(null);
    setIsCorrect(null);

    // If we have a preloaded quiz, use it instantly
    if (nextQuizData) {
      setQuiz(nextQuizData);
      setNextQuizData(null); // Clear buffer
      setLoading(false);
      preloadNextQuiz(); // Start fetching the next one
    } else {
      // Fallback if user clicks too fast: fetch now
      try {
        const data = await getEcoQuiz();
        setQuiz(data);
      } catch(e) {
        // Worst case fallback
        setQuiz(getLocalQuiz());
      } finally {
        setLoading(false);
        preloadNextQuiz();
      }
    }
  };

  const handleOptionClick = (index: number) => {
    if (selectedOption !== null) return; // Prevent changing answer
    setSelectedOption(index);
    if (quiz) {
      setIsCorrect(index === quiz.answerIndex);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto p-4 space-y-6">
      <header className="text-center mb-2">
        <h2 className="text-2xl font-bold text-leaf-900 flex items-center justify-center gap-2">
          <BulbIcon className="text-leaf-600" />
          环保百科挑战
        </h2>
        <p className="text-leaf-700 text-sm mt-1">趣味答题，涨知识，助力绿色地球</p>
      </header>

      {/* Loading State - only shows if "Next" is clicked and prefetch isn't ready */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-leaf-200 border-t-leaf-600 rounded-full animate-spin"></div>
          <p className="text-leaf-600 text-sm animate-pulse">正在生成题目...</p>
        </div>
      )}

      {/* Quiz Content */}
      {!loading && quiz && (
        <div className="flex-1 flex flex-col space-y-6 animate-fade-in">
          
          {/* Question Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-leaf-100">
            <span className="inline-block bg-leaf-100 text-leaf-800 text-xs font-bold px-2 py-1 rounded-md mb-3">
              知识挑战
            </span>
            <h3 className="text-lg font-bold text-gray-800 leading-snug">
              {quiz.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {quiz.options.map((option, index) => {
              let btnClass = "bg-white border-gray-200 hover:border-leaf-400 hover:bg-leaf-50 text-gray-700";
              
              if (selectedOption !== null) {
                if (index === quiz.answerIndex) {
                  btnClass = "bg-green-100 border-green-500 text-green-900 font-bold";
                } else if (index === selectedOption && index !== quiz.answerIndex) {
                  btnClass = "bg-red-100 border-red-500 text-red-900";
                } else {
                  btnClass = "bg-gray-50 border-transparent text-gray-400 opacity-50";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleOptionClick(index)}
                  disabled={selectedOption !== null}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${btnClass}`}
                >
                  <span>{option}</span>
                  {selectedOption !== null && index === quiz.answerIndex && (
                    <span className="text-green-600">✓</span>
                  )}
                  {selectedOption !== null && index === selectedOption && index !== quiz.answerIndex && (
                     <span className="text-red-500">✗</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation / Result */}
          {selectedOption !== null && (
            <div className={`p-5 rounded-2xl border ${isCorrect ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'} animate-fade-in`}>
              <div className="font-bold mb-1 flex items-center gap-2">
                 {isCorrect ? <span className="text-green-700">🎉 回答正确！</span> : <span className="text-orange-700">💡 差点就对了</span>}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {quiz.explanation}
              </p>
              
              <button 
                onClick={handleNextQuestion}
                className="mt-4 w-full bg-leaf-600 text-white py-3 rounded-xl font-semibold shadow-md hover:bg-leaf-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {/* Visual feedback if background fetch is pending (optional, usually instant if user reads explanation) */}
                {(!nextQuizData && fetchingRef.current) ? "AI 生成中..." : "下一题"} 
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EcoQuiz;