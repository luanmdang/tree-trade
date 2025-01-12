import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
}

interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  updated_at: string;
  listing: {
    title: string;
    images: string[];
  };
  buyer: {
    name: string;
    username: string;
    avatar: string;
  };
  seller: {
    name: string;
    username: string;
    avatar: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
}

interface ChatInboxProps {
  onClose: () => void;
  initialListingId?: string;
}

export function ChatInbox({ onClose, initialListingId }: ChatInboxProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(false);
  const pollingIntervalRef = useRef<number>();

  useEffect(() => {
    if (user) {
      fetchConversations();
      
      // Set up real-time subscriptions
      const messageChannel = supabase.channel('messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, (payload) => {
          const newMessage = payload.new as Message;
          if (selectedConversation?.id === newMessage.conversation_id) {
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
          }
          fetchConversations();
        })
        .subscribe();

      const conversationChannel = supabase.channel('conversations')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations',
        }, () => {
          fetchConversations();
        })
        .subscribe();

      return () => {
        messageChannel.unsubscribe();
        conversationChannel.unsubscribe();
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [user]);

  // Set up polling for the selected conversation
  useEffect(() => {
    if (selectedConversation) {
      // Initial fetch
      fetchMessages(selectedConversation.id);
      
      // Set up polling every 2 seconds
      pollingIntervalRef.current = window.setInterval(() => {
        fetchMessages(selectedConversation.id);
      }, 2000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [selectedConversation?.id]);

  // Handle initial listing selection
  useEffect(() => {
    if (initialListingId && conversations.length > 0 && !initialLoadRef.current) {
      const conversation = conversations.find(c => c.listing_id === initialListingId);
      if (conversation) {
        setSelectedConversation(conversation);
        fetchMessages(conversation.id);
        initialLoadRef.current = true;
      }
    }
  }, [initialListingId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(title, images),
        buyer:profiles!buyer_id(*),
        seller:profiles!seller_id(*),
        last_message:messages(content, created_at)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    setConversations(data);
  };

  const fetchMessages = async (conversationId?: string) => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedConversation || !newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          content: messageContent,
        });

      if (error) throw error;
      
      // Force immediate refresh
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message if sending failed
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleBack = () => {
    if (selectedConversation) {
      setSelectedConversation(null);
      setMessages([]);
      initialLoadRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          {selectedConversation ? (
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <ArrowLeft className="w-6 h-6 dark:text-white" />
              </button>
              <div className="flex items-center">
                <img
                  src={user?.id === selectedConversation.buyer_id
                    ? selectedConversation.seller.avatar
                    : selectedConversation.buyer.avatar}
                  alt="Profile"
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <h2 className="font-semibold dark:text-white">
                    {user?.id === selectedConversation.buyer_id
                      ? selectedConversation.seller.name
                      : selectedConversation.buyer.name}
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      @{user?.id === selectedConversation.buyer_id
                        ? selectedConversation.seller.username
                        : selectedConversation.buyer.username}
                    </span>
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedConversation.listing.title}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold dark:text-white">Messages</h1>
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <ArrowLeft className="w-6 h-6 dark:text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Conversation List or Messages */}
        {selectedConversation ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender_id === user?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 dark:text-white'
                  }`}
                >
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === user?.id
                      ? 'text-blue-100'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mb-4" />
                <p>No messages yet</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    setSelectedConversation(conversation);
                    fetchMessages(conversation.id);
                  }}
                  className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <div className="flex items-center">
                    <img
                      src={user?.id === conversation.buyer_id
                        ? conversation.seller.avatar
                        : conversation.buyer.avatar}
                      alt="Profile"
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold dark:text-white">
                          {user?.id === conversation.buyer_id
                            ? conversation.seller.name
                            : conversation.buyer.name}
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                            @{user?.id === conversation.buyer_id
                              ? conversation.seller.username
                              : conversation.buyer.username}
                          </span>
                        </h3>
                        {conversation.last_message && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(conversation.last_message.created_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {conversation.listing.title}
                      </p>
                      {conversation.last_message && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                          {conversation.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Message Input */}
        {selectedConversation && (
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}