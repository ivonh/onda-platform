import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User } from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';

export default function MessagingPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.conversation_id);
      const interval = setInterval(() => fetchMessages(activeConversation.conversation_id), 3000);
      return () => clearInterval(interval);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const response = await api.get(`/messages/conversation/${conversationId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    try {
      await api.post('/messages/send', {
        receiver_id: activeConversation.other_user.user_id,
        message: newMessage,
        conversation_id: activeConversation.conversation_id
      });
      setNewMessage('');
      fetchMessages(activeConversation.conversation_id);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="container mx-auto max-w-7xl">
        <h1 className="font-cormorant text-6xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Messages</h1>

        <div className="grid md:grid-cols-3 gap-6 h-[700px]">
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="font-cormorant text-2xl">Conversations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                {conversations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No conversations yet</p>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.conversation_id}
                      onClick={() => setActiveConversation(conv)}
                      className={`p-4 border-b border-border/30 cursor-pointer transition-colors hover:bg-primary/5 ${
                        activeConversation?.conversation_id === conv.conversation_id ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{conv.other_user?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground truncate">{conv.last_message || 'No messages'}</p>
                        </div>
                        {conv.unread_count > 0 && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-xs font-bold text-black">{conv.unread_count}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="luxury-card md:col-span-2">
            {activeConversation ? (
              <>
                <CardHeader className="border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-cormorant text-2xl">{activeConversation.other_user?.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{activeConversation.other_user?.role}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <ScrollArea className="h-[480px] mb-4">
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`mb-4 flex ${
                          msg.sender_id === user.user_id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            msg.sender_id === user.user_id
                              ? 'bg-primary text-black'
                              : 'bg-card border border-border'
                          }`}
                        >
                          <p>{msg.message}</p>
                          <p className="text-xs mt-1 opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </ScrollArea>
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="bg-card border-border"
                    />
                    <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="btn-primary">
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">Select a conversation to start messaging</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
