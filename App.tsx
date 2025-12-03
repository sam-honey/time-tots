import React, { useState, useEffect } from 'react';
import SunMoonBackground from './components/SunMoonBackground';
import AnalogClock from './components/AnalogClock';
import DigitalClock from './components/DigitalClock';
import { GameMode, QuizQuestion } from './types';
import { generateTimeQuestion, checkAnswer } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";

// Initialize to 10:10 AM
const INITIAL_TIME = 10 * 60 + 10; 

const App: React.FC = () => {
  // State
  const [totalMinutes, setTotalMinutes] = useState<number>(INITIAL_TIME);
  const [mode, setMode] = useState<GameMode>(GameMode.EXPLORE);
  
  // Quiz State
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  // Time Handler
  const handleTimeChange = (newMinutes: number) => {
    // If we are in quiz mode and got it right, don't allow moving away until next question? 
    // Or just let them play. Let's allow movement always.
    setTotalMinutes(newMinutes);
    if (isCorrect) setIsCorrect(false); // Reset correct state if they move it again
    setFeedback("");
  };

  // Quiz Logic
  const startQuiz = async () => {
    setMode(GameMode.QUIZ);
    setIsLoading(true);
    setFeedback("");
    setIsCorrect(false);
    
    const question = await generateTimeQuestion();
    setCurrentQuestion(question);
    setIsLoading(false);
  };

  const submitAnswer = async () => {
    if (!currentQuestion) return;

    // Normalize current time (0-23h)
    const currentNorm = totalMinutes % 1440;
    const currentH = Math.floor(currentNorm / 60);
    const currentM = currentNorm % 60;

    // Check if close enough (within 2 minutes tolerance)
    const targetTotal = currentQuestion.targetHour * 60 + currentQuestion.targetMinute;
    const diff = Math.abs(currentNorm - targetTotal);
    
    // Check strict 24h match or 12h match?
    // Kids usually learn 12h first. So 3:00 PM and 3:00 AM might look same on analog.
    // However, our clock has day/night.
    // Let's be lenient: If they match the face angle (mod 720), count it as correct for the "Analog" part, 
    // unless the question specifies "In the afternoon".
    
    // For this app, let's stick to the exact targetHour provided by Gemini which should align with the context.
    
    // Allow wrap-around diff check (e.g. 23:59 vs 00:01)
    const diffWrapped = Math.min(diff, 1440 - diff);
    
    if (diffWrapped <= 2) {
      setIsCorrect(true);
      setFeedback("🎉 Correct! You are a time wizard!");
    } else {
      setIsCorrect(false);
      setIsLoading(true);
      const aiFeedback = await checkAnswer(currentH, currentM, currentQuestion.targetHour, currentQuestion.targetMinute);
      setFeedback(aiFeedback);
      setIsLoading(false);
    }
  };

  const exitQuiz = () => {
    setMode(GameMode.EXPLORE);
    setCurrentQuestion(null);
    setFeedback("");
    setIsCorrect(false);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center">
      
      {/* Background Layer */}
      <SunMoonBackground totalMinutes={totalMinutes} />

      {/* Main UI Container */}
      <main className="z-10 w-full max-w-4xl px-4 flex flex-col items-center gap-8">
        
        {/* Header / Mode Switcher */}
        <div className="flex justify-between items-center w-full max-w-xl bg-white/80 backdrop-blur-md p-2 rounded-full shadow-lg">
             <button 
                onClick={exitQuiz}
                className={`flex-1 py-2 px-6 rounded-full font-bold transition-all ${mode === GameMode.EXPLORE ? 'bg-blue-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
             >
                Play & Explore
             </button>
             <button 
                onClick={() => mode !== GameMode.QUIZ && startQuiz()}
                className={`flex-1 py-2 px-6 rounded-full font-bold transition-all ${mode === GameMode.QUIZ ? 'bg-purple-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
             >
                Challenge Me!
             </button>
        </div>

        {/* Quiz Prompt Area */}
        {mode === GameMode.QUIZ && (
            <div className="w-full max-w-xl bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-6 text-center animate-fade-in">
                {isLoading && !currentQuestion ? (
                    <div className="flex items-center justify-center space-x-2 text-purple-600 font-bold">
                        <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce"></div>
                        <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce delay-100"></div>
                        <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce delay-200"></div>
                        <span>Thinking up a question...</span>
                    </div>
                ) : currentQuestion ? (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-slate-800">{currentQuestion.questionText}</h2>
                        
                        {feedback && (
                            <div className={`p-3 rounded-lg font-bold text-lg ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {feedback}
                            </div>
                        )}

                        <div className="flex justify-center gap-4 pt-2">
                             {/* Hint Button */}
                            {!isCorrect && (
                                <button 
                                    onClick={() => setFeedback(currentQuestion.hint)}
                                    className="px-4 py-2 text-sm font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg"
                                >
                                    Need a Hint?
                                </button>
                            )}
                            
                            {/* Action Button */}
                            {isCorrect ? (
                                <button 
                                    onClick={startQuiz}
                                    className="px-8 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg transform transition active:scale-95"
                                >
                                    Next Question ➜
                                </button>
                            ) : (
                                <button 
                                    onClick={submitAnswer}
                                    disabled={isLoading}
                                    className="px-8 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg transform transition active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? 'Checking...' : 'Check Answer'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : null}
            </div>
        )}

        {/* The Clock */}
        <div className="relative group">
           <AnalogClock totalMinutes={totalMinutes} onTimeChange={handleTimeChange} />
        </div>

        {/* Digital Display */}
        <DigitalClock totalMinutes={totalMinutes} />

      </main>

      {/* Footer Info */}
      <footer className="absolute bottom-4 text-white/60 text-sm font-medium">
         Drag the hands to change time!
      </footer>

    </div>
  );
};

export default App;