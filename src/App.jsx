import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Camera, Mic, TrendingUp, MapPin, Info, Send, X } from 'lucide-react';

const MoodTracker = () => {
  const [currentMood, setCurrentMood] = useState(null);
  const [inputMethod, setInputMethod] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [location, setLocation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [moodHistory, setMoodHistory] = useState([]);

  // Simulated locations for demo
  const locations = ['Library', 'Cafeteria', 'Classroom A', 'Gym', 'Study Hall', 'Campus Courtyard'];

  useEffect(() => {
    // Load mood history from storage
    const loadHistory = async () => {
      try {
        const result = await window.storage.list('mood:');
        if (result && result.keys) {
          const historyPromises = result.keys.map(async key => {
            const data = await window.storage.get(key);
            return data ? JSON.parse(data.value) : null;
          });
          const history = (await Promise.all(historyPromises)).filter(Boolean);
          setMoodHistory(history.sort((a, b) => b.timestamp - a.timestamp));
        }
      } catch (error) {
        console.log('No previous mood history');
      }
    };
    loadHistory();
  }, []);

  const analyzeMoodFromText = async (text) => {
    setAnalyzing(true);
    
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Analyze this student's text and determine their emotional state. Respond ONLY with a JSON object, no other text or formatting:
{
  "mood": "one of: happy, calm, stressed, anxious, tired, energetic, sad, neutral",
  "intensity": "number from 1-10",
  "keywords": ["array", "of", "key", "emotional", "words"],
  "suggestion": "brief supportive message (max 20 words)"
}

Student's text: "${text}"`
            }
          ],
        })
      });

      const data = await response.json();
      const analysisText = data.content.find(c => c.type === 'text')?.text || '{}';
      const cleanText = analysisText.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(cleanText);
      
      setAnalyzing(false);
      return analysis;
    } catch (error) {
      setAnalyzing(false);
      return {
        mood: 'neutral',
        intensity: 5,
        keywords: [],
        suggestion: 'Thank you for sharing. Take care of yourself.'
      };
    }
  };

  const handleSubmit = async () => {
    if (inputMethod === 'text' && !textInput.trim()) return;
    if (!location) {
      alert('Please select a location');
      return;
    }

    let moodData;

    if (inputMethod === 'text') {
      moodData = await analyzeMoodFromText(textInput);
    } else if (inputMethod === 'quick') {
      moodData = {
        mood: currentMood,
        intensity: 7,
        keywords: [currentMood],
        suggestion: 'Thanks for checking in! Keep going.'
      };
    } else {
      // Voice/Photo would also use AI analysis
      moodData = {
        mood: 'neutral',
        intensity: 5,
        keywords: [],
        suggestion: 'Your input has been recorded. Thank you.'
      };
    }

    const entry = {
      ...moodData,
      location,
      timestamp: Date.now(),
      method: inputMethod
    };

    // Save anonymously to storage
    try {
      await window.storage.set(`mood:${Date.now()}`, JSON.stringify(entry));
      setMoodHistory([entry, ...moodHistory]);
    } catch (error) {
      console.error('Storage error:', error);
    }

    setSubmitted(true);
    setTimeout(() => {
      resetForm();
    }, 3000);
  };

  const resetForm = () => {
    setCurrentMood(null);
    setInputMethod(null);
    setTextInput('');
    setLocation('');
    setSubmitted(false);
  };

  const getMoodColor = (mood) => {
    const colors = {
      happy: 'bg-yellow-400',
      calm: 'bg-blue-400',
      stressed: 'bg-orange-500',
      anxious: 'bg-red-400',
      tired: 'bg-purple-400',
      energetic: 'bg-green-400',
      sad: 'bg-gray-500',
      neutral: 'bg-gray-400'
    };
    return colors[mood] || 'bg-gray-400';
  };

  const getMoodEmoji = (mood) => {
    const emojis = {
      happy: '😊',
      calm: '😌',
      stressed: '😰',
      anxious: '😟',
      tired: '😴',
      energetic: '⚡',
      sad: '😢',
      neutral: '😐'
    };
    return emojis[mood] || '😐';
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-4">Your mood has been recorded anonymously. Your wellbeing matters.</p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded text-left">
            <p className="text-sm text-gray-700">{moodHistory[0]?.suggestion}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                <Heart className="text-purple-600" />
                MoodSpace
              </h1>
              <p className="text-gray-600 mt-1">Anonymous AI-powered wellbeing tracker</p>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <Info className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {showInfo && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-2">Privacy First</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ 100% anonymous - no names collected</li>
                <li>✓ Only location data shared with school</li>
                <li>✓ AI analyzes your input to understand mood</li>
                <li>✓ Completely free for students</li>
                <li>✓ Data helps improve campus wellbeing</li>
              </ul>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">How are you feeling?</h2>

            {/* Input Method Selection */}
            {!inputMethod && (
              <div className="space-y-3">
                <button
                  onClick={() => setInputMethod('quick')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition flex items-center gap-3"
                >
                  <Heart className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Quick Check-in</div>
                    <div className="text-sm text-gray-600">Tap your current mood</div>
                  </div>
                </button>

                <button
                  onClick={() => setInputMethod('text')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition flex items-center gap-3"
                >
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Write It Out</div>
                    <div className="text-sm text-gray-600">AI analyzes your message</div>
                  </div>
                </button>

                <button
                  onClick={() => setInputMethod('voice')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition flex items-center gap-3"
                >
                  <Mic className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Voice Note</div>
                    <div className="text-sm text-gray-600">Speak your thoughts (Demo)</div>
                  </div>
                </button>

                <button
                  onClick={() => setInputMethod('photo')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition flex items-center gap-3"
                >
                  <Camera className="w-6 h-6 text-orange-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Share a Moment</div>
                    <div className="text-sm text-gray-600">Photo mood detection (Demo)</div>
                  </div>
                </button>
              </div>
            )}

            {/* Quick Check-in */}
            {inputMethod === 'quick' && (
              <div className="space-y-4">
                <button
                  onClick={() => setInputMethod(null)}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Back
                </button>
                <div className="grid grid-cols-2 gap-3">
                  {['happy', 'calm', 'stressed', 'anxious', 'tired', 'energetic', 'sad', 'neutral'].map(mood => (
                    <button
                      key={mood}
                      onClick={() => setCurrentMood(mood)}
                      className={`p-4 rounded-xl border-2 transition ${
                        currentMood === mood
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-3xl mb-1">{getMoodEmoji(mood)}</div>
                      <div className="text-sm font-medium capitalize">{mood}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Text Input */}
            {inputMethod === 'text' && (
              <div className="space-y-4">
                <button
                  onClick={() => setInputMethod(null)}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Back
                </button>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="What's on your mind? AI will understand your feelings... (e.g., 'Exams are overwhelming' or 'Had a great study session!')"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none h-32"
                />
                <p className="text-xs text-gray-500">AI analyzes your words to detect mood patterns - no need to label how you feel</p>
              </div>
            )}

            {/* Voice/Photo Demo */}
            {(inputMethod === 'voice' || inputMethod === 'photo') && (
              <div className="space-y-4">
                <button
                  onClick={() => setInputMethod(null)}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Back
                </button>
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-xl text-center">
                  <div className="text-5xl mb-3">
                    {inputMethod === 'voice' ? '🎤' : '📸'}
                  </div>
                  <p className="text-gray-600">
                    {inputMethod === 'voice' 
                      ? 'Voice analysis would detect tone, pace, and emotional markers'
                      : 'Image AI would analyze facial expressions and context'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">(Demo mode - feature in development)</p>
                </div>
              </div>
            )}

            {/* Location Selection */}
            {inputMethod && (
              <div className="mt-6 space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4" />
                  Where are you? (Required for school insights)
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                >
                  <option value="">Select location...</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Submit Button */}
            {inputMethod && (
              <button
                onClick={handleSubmit}
                disabled={analyzing || (!currentMood && !textInput.trim()) || !location}
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>Analyzing mood...</>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Anonymously
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Panel - Insights */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Your Recent Check-ins
              </h2>
              
              {moodHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No check-ins yet. Start tracking your mood!</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {moodHistory.slice(0, 5).map((entry, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                          <span className="font-medium capitalize">{entry.mood}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {entry.location}
                      </div>
                      {entry.keywords && entry.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {entry.keywords.map((kw, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-3">How AI Helps You</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Text analysis detects emotional patterns from your words</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Voice tone analysis captures stress and energy levels</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>No forced categories - express yourself naturally</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span>Schools see aggregate location data, never individual entries</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;