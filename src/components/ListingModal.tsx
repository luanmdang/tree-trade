import { X, MessageSquare, Edit } from 'lucide-react';
import { Listing } from '../types';
import { useState } from 'react';
import { ChatInbox } from './ChatInbox';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ListingModalProps {
  listing: Listing | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (listing: Listing) => void;
}

export function ListingModal({ listing, onClose, onDelete, onEdit }: ListingModalProps) {
  const [showChat, setShowChat] = useState(false);
  const { user } = useAuth();

  if (!listing) return null;

  const expiresAt = new Date(listing.expires_at);
  const now = new Date();
  const hoursRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const minutesRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60)) % 60);

  const handleMessageClick = async () => {
    if (!user) {
      alert('Please sign in to message the seller');
      return;
    }

    if (user.id === listing.user_id) {
      alert('You cannot message yourself');
      return;
    }

    // Check if conversation exists
    const { data: existingConversations, error: fetchError } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing.id)
      .eq('buyer_id', user.id)
      .eq('seller_id', listing.user_id);

    if (fetchError) {
      console.error('Error checking for existing conversation:', fetchError);
      return;
    }

    if (!existingConversations || existingConversations.length === 0) {
      // Create new conversation
      const { error: createError } = await supabase
        .from('conversations')
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.user_id
        });

      if (createError) {
        console.error('Error creating conversation:', createError);
        return;
      }
    }

    setShowChat(true);
  };

  if (showChat) {
    return <ChatInbox onClose={() => setShowChat(false)} initialListingId={listing.id} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl m-4 overflow-hidden shadow-xl">
        <div className="relative">
          {listing.images[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-64 object-cover"
            />
          ) : (
            <div className="w-full h-64 bg-[#f1f3f5] dark:bg-gray-700 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#adb5bd] dark:text-gray-500"
              >
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <line x1="9" y1="9" x2="9.01" y2="9"/>
                <line x1="15" y1="9" x2="15.01" y2="9"/>
              </svg>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-[#495057] dark:text-white" />
          </button>
          <div className="absolute top-4 left-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full flex items-center">
            {hoursRemaining}h {minutesRemaining}m remaining
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-[#212529] dark:text-white">{listing.title}</h2>
              <p className="text-3xl font-bold text-[#40c057] dark:text-[#51cf66]">${listing.price}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#868e96] dark:text-gray-400">
                Posted {new Date(listing.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm font-medium text-[#495057] dark:text-gray-300 mt-1">
                Condition: <span className="capitalize">{listing.condition}</span>
              </p>
            </div>
          </div>

          <p className="text-[#495057] dark:text-gray-300 mb-6 whitespace-pre-wrap">{listing.description}</p>

          <div className="flex items-center justify-between border-t border-[#e9ecef] dark:border-gray-700 pt-6">
            <div className="flex items-center space-x-3">
              <img
                src={listing.seller.avatar}
                alt={listing.seller.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium text-[#212529] dark:text-white">
                  {listing.seller.name}
                  <span className="text-sm text-[#868e96] dark:text-gray-400 ml-2">
                    @{listing.seller.username}
                  </span>
                </p>
                <p className="text-sm text-[#868e96] dark:text-gray-400">Contact Seller</p>
              </div>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(listing)}
                  className="px-6 py-2 bg-[#339af0] hover:bg-[#228be6] text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(listing.id)}
                  className="px-6 py-2 bg-[#fa5252] hover:bg-[#f03e3e] text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              )}
              {!onEdit && !onDelete && (
                <button 
                  onClick={handleMessageClick}
                  className="px-6 py-2 bg-[#339af0] hover:bg-[#228be6] text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}