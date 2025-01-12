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

export function ChatInbox() {
  // ... (previous state and hooks remain the same)

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50">
      <div className="h-full flex flex-col">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          {selectedConversation ? (
            <div className="flex items-center">
              <button
                onClick={() => setSelectedConversation(null)}
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
                onClick={() => window.location.reload()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <ArrowLeft className="w-6 h-6 dark:text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Rest of the component remains the same */}
      </div>
    </div>
  );
}