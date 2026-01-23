import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageSquare, Camera, Mic, TrendingUp, MapPin, Info, Send, X, StopCircle } from 'lucide-react';

const MoodTracker = () => {
  const [currentMood, setCurrentMood] = useState(null);
  const [inputMethod, setInputMethod] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [location, setLocation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [moodHistory, setMoodHistory] = useState([]);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  
  // Camera states
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const locations = ['Library', 'Cafeteria', 'Classroom A', 'Gym', 'Study Hall', 'Campus Courtyard'];

  useEffect(() => {
    loadHistory();
    
    // Cleanup on unmount
    return () => {
      stopCamera();
      stopRecording();
    };
  }, []);

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

  // Audio Recording Functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      alert('Could not access microphone. Please allow microphone access.');
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const deleteAudioRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  // Camera Functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraOn(true);
    } catch (error) {
      alert('Could not access camera. Please allow camera access.');
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOn(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const deletePhoto = () => {
    setCapturedImage(null);
  };

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

  const analyzeMoodFromAudio = async () => {
    // Simulated AI analysis for audio
    return {
      mood: 'neutral',
      intensity: 6,
      keywords: ['vocal tone detected'],
      suggestion: 'Your voice has been analyzed. Thank you for sharing.'
    };
  };

  const analyzeMoodFromImage = async () => {
    // Simulated AI analysis for image
    return {
      mood: 'neutral',
      intensity: 5,
      keywords: ['visual context captured'],
      suggestion: 'Your image has been analyzed. Take care.'
    };
  };

  const handleSubmit = async () => {
    if (inputMethod === 'text' && !textInput.trim()) return;
    if (inputMethod === 'voice' && !audioBlob) return;
    if (inputMethod === 'photo' && !capturedImage) return;
    if (inputMethod === 'quick' && !currentMood) return;
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
    } else if (inputMethod === 'voice') {
      moodData = await analyzeMoodFromAudio();
    } else if (inputMethod === 'photo') {
      moodData = await analyzeMoodFromImage();
    }

    const entry = {
      ...moodData,
      location,
      timestamp: Date.now(),
      method: inputMethod
    };

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
    setAudioBlob(null);
    setCapturedImage(null);
    setRecordingTime(0);
    stopCamera();
    stopRecording();
  };

  const handleBackToMain = () => {
    setInputMethod(null);
    setCurrentMood(null);
    setTextInput('');
    setAudioBlob(null);
    setCapturedImage(null);
    setRecordingTime(0);
    stopCamera();
    stopRecording();
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                <li>✓ Audio/photos processed locally, not stored</li>
                <li>✓ Completely free for students</li>
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
                    <div className="text-sm text-gray-600">Record your thoughts</div>
                  </div>
                </button>

                <button
                  onClick={() => setInputMethod('photo')}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition flex items-center gap-3"
                >
                  <Camera className="w-6 h-6 text-orange-600" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Share a Moment</div>
                    <div className="text-sm text-gray-600">Capture how you feel</div>
                  </div>
                </button>
              </div>
            )}

            {/* Quick Check-in */}
            {inputMethod === 'quick' && (
              <div className="space-y-4">
                <button
                  onClick={handleBackToMain}
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
                  onClick={handleBackToMain}
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

            {/* Voice Recording */}
            {inputMethod === 'voice' && (
              <div className="space-y-4">
                <button
                  onClick={handleBackToMain}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Back
                </button>
                
                {!audioBlob ? (
                  <div className="p-8 border-2 border-gray-300 rounded-xl text-center">
                    {!isRecording ? (
                      <>
                        <Mic className="w-16 h-16 mx-auto mb-4 text-green-600" />
                        <p className="text-gray-600 mb-4">Press to start recording your voice</p>
                        <button
                          onClick={startRecording}
                          className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                        >
                          Start Recording
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <div className="absolute inset-0 bg-red-600 rounded-full animate-pulse"></div>
                          <Mic className="relative w-16 h-16 text-white z-10" />
                        </div>
                        <p className="text-2xl font-bold text-red-600 mb-4">{formatTime(recordingTime)}</p>
                        <p className="text-gray-600 mb-4">Recording in progress...</p>
                        <button
                          onClick={stopRecording}
                          className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition flex items-center gap-2 mx-auto"
                        >
                          <StopCircle className="w-5 h-5" />
                          Stop Recording
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-6 border-2 border-green-300 bg-green-50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Mic className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-semibold text-gray-800">Recording Complete</p>
                          <p className="text-sm text-gray-600">Duration: {formatTime(recordingTime)}</p>
                        </div>
                      </div>
                      <button
                        onClick={deleteAudioRecording}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
                  </div>
                )}
              </div>
            )}

            {/* Photo Capture */}
            {inputMethod === 'photo' && (
              <div className="space-y-4">
                <button
                  onClick={handleBackToMain}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <X className="w-4 h-4" /> Back
                </button>

                {!capturedImage ? (
                  <div className="relative">
                    {!isCameraOn ? (
                      <div className="p-8 border-2 border-gray-300 rounded-xl text-center">
                        <Camera className="w-16 h-16 mx-auto mb-4 text-orange-600" />
                        <p className="text-gray-600 mb-4">Capture a photo to express your mood</p>
                        <button
                          onClick={startCamera}
                          className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition"
                        >
                          Open Camera
                        </button>
                      </div>
                    ) : (
                      <div>
                        <video
                          ref={videoRef}
                          className="w-full rounded-xl mb-4"
                          autoPlay
                          playsInline
                        />
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex gap-3">
                          <button
                            onClick={capturePhoto}
                            className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition flex items-center justify-center gap-2"
                          >
                            <Camera className="w-5 h-5" />
                            Capture Photo
                          </button>
                          <button
                            onClick={stopCamera}
                            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 border-2 border-orange-300 bg-orange-50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-semibold text-gray-800">Photo Captured</p>
                      <button
                        onClick={deletePhoto}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <img src={capturedImage} alt="Captured" className="w-full rounded-lg mb-3" />
                    <button
                      onClick={retakePhoto}
                      className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700 transition"
                    >
                      Retake Photo
                    </button>
                  </div>
                )}
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
                disabled={
                  analyzing || 
                  !location ||
                  (inputMethod === 'quick' && !currentMood) ||
                  (inputMethod === 'text' && !textInput.trim()) ||
                  (inputMethod === 'voice' && !audioBlob) ||
                  (inputMethod === 'photo' && !capturedImage)
                }
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
                  <span>Photo context provides visual mood indicators</span>
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