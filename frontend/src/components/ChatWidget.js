import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Calendar, MapPin, Star, ThumbsUp, ThumbsDown, Scissors, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';

const DAILY_LIMIT_GUEST = 5;
const DAILY_LIMIT_LOGGED_IN = 15;

function getChatCount() {
  const stored = localStorage.getItem('onda_chat_usage');
  if (!stored) return { count: 0, date: new Date().toDateString() };
  try {
    const parsed = JSON.parse(stored);
    if (parsed.date !== new Date().toDateString()) {
      return { count: 0, date: new Date().toDateString() };
    }
    return parsed;
  } catch {
    return { count: 0, date: new Date().toDateString() };
  }
}

function incrementChatCount() {
  const current = getChatCount();
  const updated = { count: current.count + 1, date: new Date().toDateString() };
  localStorage.setItem('onda_chat_usage', JSON.stringify(updated));
  return updated.count;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState(null);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState(0);
  const [feedbackData, setFeedbackData] = useState({});
  const [hasCheckedFeedback, setHasCheckedFeedback] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { user, token } = useAuth();
  const { location } = useLocation();

  const dailyLimit = token ? DAILY_LIMIT_LOGGED_IN : DAILY_LIMIT_GUEST;

  const checkLimit = useCallback(() => {
    const usage = getChatCount();
    if (usage.count >= dailyLimit) {
      setLimitReached(true);
      return true;
    }
    return false;
  }, [dailyLimit]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkPendingFeedback = useCallback(async () => {
    if (!token || hasCheckedFeedback) return;
    
    try {
      const response = await api.get('/feedback/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.count > 0) {
        const feedback = response.data.pending_feedback[0];
        setPendingFeedback(feedback);
        setIsOpen(true);
        setFeedbackMode(true);
        const firstName = user?.first_name || user?.name?.split(' ')[0] || 'there';
        setMessages([{
          role: 'assistant',
          content: `Hi ${firstName}! Your appointment with ${feedback.stylist_name} is complete. Would you mind sharing some quick feedback? It really helps stylists improve their service.`,
          showFeedbackPrompt: true
        }]);
      } else {
        setMessages([{
          role: 'assistant',
          content: "Hi! I'm your Onda concierge. I can help you find available stylists, check booking times, and answer any questions."
        }]);
      }
      setHasCheckedFeedback(true);
    } catch (error) {
      console.error('Error checking feedback:', error);
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm your Onda concierge. I can help you find available stylists, check booking times, and answer any questions."
      }]);
      setHasCheckedFeedback(true);
    }
  }, [token, user, hasCheckedFeedback]);

  useEffect(() => {
    if (isOpen && token && !hasCheckedFeedback) {
      checkPendingFeedback();
    } else if (isOpen && !token && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm your Onda concierge. I can help you find available stylists, check booking times, and answer any questions."
      }]);
    }
    if (isOpen) {
      checkLimit();
    }
  }, [isOpen, token, checkPendingFeedback, hasCheckedFeedback, messages.length, checkLimit]);

  const handleFeedbackResponse = async (accepted) => {
    if (accepted) {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: 'Yes, I would like to share feedback' },
        { role: 'assistant', content: `Great! On a scale of 1-5 stars, how would you rate your overall experience with ${pendingFeedback?.stylist_name}?`, showRating: true }
      ]);
      setFeedbackStep(1);
    } else {
      try {
        await api.post('/feedback/decline', {
          booking_id: pendingFeedback.booking_id
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMessages(prev => [
          ...prev,
          { role: 'user', content: 'Not right now, thanks' },
          { role: 'assistant', content: 'No problem at all! Thank you for using Onda. Is there anything else I can help you with today?' }
        ]);
        setFeedbackMode(false);
        setPendingFeedback(null);
      } catch (error) {
        console.error('Error declining feedback:', error);
      }
    }
  };

  const handleRating = (rating) => {
    setFeedbackData(prev => ({ ...prev, overall_rating: rating }));
    setMessages(prev => [
      ...prev,
      { role: 'user', content: `${rating} stars` },
      { role: 'assistant', content: rating >= 4 
        ? "Wonderful! What did you love most about your appointment? (You can type your answer or skip)" 
        : "Thank you for your honesty. What could have been better? (You can type your answer or skip)",
        showSkip: true
      }
    ]);
    setFeedbackStep(2);
  };

  const handleFeedbackText = async (text, skipped = false) => {
    const updatedData = { 
      ...feedbackData,
      ...(feedbackData.overall_rating >= 4 
        ? { what_they_loved: skipped ? null : text }
        : { improvement_suggestions: skipped ? null : text })
    };
    setFeedbackData(updatedData);
    
    setMessages(prev => [
      ...prev,
      ...(skipped ? [] : [{ role: 'user', content: text }]),
      { role: 'assistant', content: "Would you recommend this stylist to a friend?", showRecommend: true }
    ]);
    setFeedbackStep(3);
  };

  const handleRecommend = async (recommend) => {
    setIsLoading(true);
    try {
      await api.post('/feedback/submit', {
        booking_id: pendingFeedback.booking_id,
        overall_rating: feedbackData.overall_rating,
        what_they_loved: feedbackData.what_they_loved,
        improvement_suggestions: feedbackData.improvement_suggestions,
        would_recommend: recommend
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessages(prev => [
        ...prev,
        { role: 'user', content: recommend ? 'Yes, I would recommend them!' : 'Not sure' },
        { role: 'assistant', content: `Thank you so much for your feedback! It really helps ${pendingFeedback?.stylist_name} and other clients. Is there anything else I can help you with today?` }
      ]);
      
      setFeedbackMode(false);
      setPendingFeedback(null);
      setFeedbackStep(0);
      setFeedbackData({});
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, there was an issue saving your feedback. Please try again later.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    if (feedbackMode && feedbackStep === 2 && !messageText) {
      handleFeedbackText(text);
      setInput('');
      return;
    }

    if (checkLimit()) {
      setMessages(prev => [...prev, 
        { role: 'user', content: text },
        { role: 'assistant', content: `You've reached your daily chat limit (${dailyLimit} messages). ${!token ? 'Sign in for more messages, or ' : ''}Come back tomorrow! In the meantime, you can browse stylists directly.` }
      ]);
      setInput('');
      return;
    }

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    incrementChatCount();

    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const userContext = {};
      if (location) {
        userContext.latitude = location.latitude;
        userContext.longitude = location.longitude;
        userContext.suburb = location.suburb || location.address;
      }

      const response = await api.post('/chat/', {
        messages: [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content
        })),
        user_context: Object.keys(userContext).length > 0 ? userContext : null
      }, { headers });

      if (response.data.success) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.data.message 
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment." 
      }]);
    } finally {
      setIsLoading(false);
      checkLimit();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    { icon: Calendar, text: "Who's available today?", color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
    { icon: MapPin, text: "Stylists near me", color: "from-green-500/20 to-green-600/10 border-green-500/30" },
    { icon: Scissors, text: "Where can I get an appointment now?", color: "from-purple-500/20 to-purple-600/10 border-purple-500/30" },
    { icon: Clock, text: "What services are available?", color: "from-amber-500/20 to-amber-600/10 border-amber-500/30" },
  ];

  const handleQuickPrompt = (promptText) => {
    sendMessage(promptText);
  };

  const remainingMessages = Math.max(0, dailyLimit - getChatCount().count);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary via-secondary to-primary text-black shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 chat-widget-glow"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
        {pendingFeedback && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-primary via-secondary to-primary p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="text-black font-semibold">Beauty Concierge</h3>
            <p className="text-black/70 text-xs">
              {feedbackMode ? 'Quick feedback' : (user ? `Hi ${user.first_name || user.name?.split(' ')[0]}!` : 'Find & book stylists')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-black/60 hover:text-black transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-secondary text-black rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
            
            {message.showFeedbackPrompt && (
              <div className="flex gap-2 mt-3 justify-center">
                <Button
                  size="sm"
                  onClick={() => handleFeedbackResponse(true)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" /> Yes, sure!
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleFeedbackResponse(false)}
                >
                  Not now
                </Button>
              </div>
            )}
            
            {message.showRating && (
              <div className="flex gap-1 mt-3 justify-center">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRating(rating)}
                    className="p-2 hover:scale-110 transition-transform"
                  >
                    <Star className={`w-8 h-8 ${rating <= (feedbackData.overall_rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            )}
            
            {message.showSkip && (
              <div className="flex justify-center mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleFeedbackText('', true)}
                  className="text-xs text-muted-foreground"
                >
                  Skip this question
                </Button>
              </div>
            )}
            
            {message.showRecommend && (
              <div className="flex gap-2 mt-3 justify-center">
                <Button
                  size="sm"
                  onClick={() => handleRecommend(true)}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" /> Yes!
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRecommend(false)}
                >
                  <ThumbsDown className="w-4 h-4 mr-1" /> Not sure
                </Button>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {feedbackMode ? 'Saving...' : 'Checking availability...'}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!feedbackMode && messages.length <= 2 && !limitReached && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(prompt.text)}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs text-left bg-gradient-to-br ${prompt.color} border rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150`}
              >
                <prompt.icon className="w-4 h-4 flex-shrink-0 text-foreground/70" />
                <span className="text-foreground/90 leading-tight">{prompt.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t border-border bg-background">
        {limitReached && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-600">Daily limit reached. Come back tomorrow!</span>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={limitReached ? "Daily limit reached" : (feedbackMode && feedbackStep === 2 ? "Type your feedback..." : "Ask about availability, pricing...")}
            className="flex-1"
            disabled={isLoading || limitReached || (feedbackMode && feedbackStep !== 2)}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading || limitReached || (feedbackMode && feedbackStep !== 2)}
            size="icon"
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-black"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {!limitReached && !feedbackMode && (
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            {remainingMessages} message{remainingMessages !== 1 ? 's' : ''} remaining today
          </p>
        )}
      </div>
    </div>
  );
}
