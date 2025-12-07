import { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Send, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { sendChatMessage, subscribeToChat, ChatMessage } from '@/services/liveChat';
import { useNavigate } from 'react-router-dom';

interface LiveChatProps {
  raceName: string;
  raceYear: number;
  limit?: number;
}

const driverColors = {
  verstappen: { bg: 'bg-blue-600', text: 'text-blue-400', border: 'border-blue-600', name: 'VER' },
  norris: { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500', name: 'NOR' },
  piastri: { bg: 'bg-orange-600', text: 'text-orange-500', border: 'border-orange-600', name: 'PIA' },
};

export const LiveChat = ({ raceName, raceYear, limit = 100 }: LiveChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [supportingDriver, setSupportingDriver] = useState<'verstappen' | 'norris' | 'piastri' | undefined>(undefined);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToChat(raceName, raceYear, limit, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [raceName, raceYear, limit]);

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    if (!showScrollButton) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollButton]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to send messages',
        variant: 'destructive',
      });
      return;
    }

    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await sendChatMessage(newMessage, raceName, raceYear, supportingDriver);
      setNewMessage('');
      setCountdown(60); // Start 60 second countdown
      toast({
        title: 'Message sent',
        description: 'You can send another message in 60 seconds',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });

      // Extract countdown from error message
      const match = error.message.match(/wait (\d+) seconds/);
      if (match) {
        setCountdown(parseInt(match[1]));
      }
    } finally {
      setSending(false);
    }
  };

  const handleDriverSupport = async (driver: 'verstappen' | 'norris' | 'piastri') => {
    const newDriver = supportingDriver === driver ? undefined : driver;
    setSupportingDriver(newDriver);

    // Send system message about driver support
    if (newDriver && user) {
      try {
        const driverName = driver === 'verstappen' ? 'Verstappen' : driver === 'norris' ? 'Norris' : 'Piastri';
        await sendChatMessage(`supported ${driverName}`, raceName, raceYear, newDriver);
      } catch (error) {
        // Silently fail, don't show error for system messages
        console.error('Failed to send support message:', error);
      }
    }
  };

  return (
    <div className="relative w-full">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ef4444;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #dc2626;
        }
      `}</style>
      <Card className="p-3 sm:p-4 md:p-6 border-2 border-racing-red/40 bg-black/90 backdrop-blur-sm">
        {/* Chat Header */}
        <div className="mb-3 sm:mb-4 pb-2 border-b border-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse" />
              <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-wide">Live Chat</span>
            </div>
            {!isLoading && messages.length > 0 && (
              <span className="text-[10px] sm:text-xs text-gray-500">
                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              </span>
            )}
          </div>
        </div>

        {/* Driver Support Selection */}
        <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-800">
          <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wide">Supporting:</p>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => handleDriverSupport('verstappen')}
              className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-wide transition-all ${
                supportingDriver === 'verstappen'
                  ? 'bg-blue-600 text-white border-2 border-blue-400 shadow-lg'
                  : 'bg-blue-600/20 text-blue-400 border border-blue-600/40 hover:bg-blue-600/30'
              }`}
            >
              VER
            </button>
            <button
              onClick={() => handleDriverSupport('norris')}
              className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-wide transition-all ${
                supportingDriver === 'norris'
                  ? 'bg-orange-500 text-white border-2 border-orange-300 shadow-lg'
                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/40 hover:bg-orange-500/30'
              }`}
            >
              NOR
            </button>
            <button
              onClick={() => handleDriverSupport('piastri')}
              className={`flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-wide transition-all ${
                supportingDriver === 'piastri'
                  ? 'bg-orange-600 text-white border-2 border-orange-400 shadow-lg'
                  : 'bg-orange-600/20 text-orange-500 border border-orange-600/40 hover:bg-orange-600/30'
              }`}
            >
              PIA
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="relative">
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="custom-scrollbar bg-black/40 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 h-[50vh] sm:h-[60vh] md:h-[500px] overflow-y-auto space-y-2 sm:space-y-3 scroll-smooth"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#ef4444 #1a1a1a',
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500 text-sm">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No messages yet. Be the first to chat!
              </div>
            ) : (
              messages.map((msg, index) => {
              const isSupportMessage = msg.message.startsWith('supported ');

              return (
                <div
                  key={msg.id}
                  className={`space-y-1 ${
                    index > 0 ? 'pt-2 sm:pt-3 border-t border-gray-800/30' : ''
                  }`}
                >
                  {isSupportMessage ? (
                    // System message for driver support
                    <div className="text-center px-2 py-1">
                      <span className="text-[10px] sm:text-xs text-gray-500 italic">
                        <span
                          className="font-bold cursor-pointer hover:text-racing-red transition-colors"
                          onClick={() => navigate(`/user/${msg.userId}`)}
                        >
                          {msg.username}
                        </span>
                        {' '}{msg.message}
                        {msg.supportingDriver && (
                          <span className={`ml-1 ${driverColors[msg.supportingDriver].text}`}>
                            {' '}({driverColors[msg.supportingDriver].name})
                          </span>
                        )}
                      </span>
                    </div>
                  ) : (
                    // Regular message
                    <div className="px-1 sm:px-2 py-1 rounded hover:bg-gray-900/30 transition-colors">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
                          onClick={() => navigate(`/user/${msg.userId}`)}
                        >
                          {msg.userAvatar ? (
                            <img
                              src={msg.userAvatar}
                              alt={msg.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] sm:text-xs font-bold text-white">
                              {msg.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span
                          className="font-bold text-xs sm:text-sm text-white cursor-pointer hover:text-racing-red transition-colors"
                          onClick={() => navigate(`/user/${msg.userId}`)}
                        >
                          {msg.username}
                        </span>
                        {msg.supportingDriver && (
                          <span
                            className={`text-[9px] sm:text-xs font-black px-1.5 sm:px-2 py-0.5 rounded ${
                              driverColors[msg.supportingDriver].bg
                            } text-white`}
                          >
                            {driverColors[msg.supportingDriver].name}
                          </span>
                        )}
                        <span className="text-[10px] sm:text-xs text-gray-500">
                          {msg.createdAt.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-200 ml-6 sm:ml-8 break-words whitespace-pre-wrap overflow-wrap-anywhere">{msg.message}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to Bottom Button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-16 sm:bottom-20 right-4 bg-racing-red hover:bg-red-600 text-white p-2 sm:p-3 rounded-full shadow-lg transition-all z-10 animate-bounce"
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="space-y-1.5 sm:space-y-2">
          <div className="flex gap-1.5 sm:gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={countdown > 0 ? `Wait ${countdown}s...` : "Type a message..."}
              disabled={sending || countdown > 0}
              maxLength={200}
              className="bg-black/60 border-gray-700 text-white flex-1 text-sm sm:text-base h-9 sm:h-10"
            />
            <Button
              type="submit"
              disabled={sending || !newMessage.trim() || countdown > 0}
              className="bg-racing-red hover:bg-red-600 h-9 sm:h-10 px-3 sm:px-4"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
          <div className="flex justify-between text-[10px] sm:text-xs text-gray-500">
            <span>{newMessage.length}/200</span>
            {countdown > 0 && (
              <span className="text-racing-red font-bold">
                Next message in {countdown}s
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};
