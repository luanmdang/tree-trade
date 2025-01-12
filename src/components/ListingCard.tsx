import { Listing } from '../types';
import { MapPin, Tag, Clock } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const expiresAt = new Date(listing.expires_at);
  const now = new Date();
  const hoursRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const minutesRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60)) % 60);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-[#e9ecef] dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
      <div className="relative pb-[60%]">
        {listing.images[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[#f1f3f5] dark:bg-gray-700 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
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
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center">
          <Clock className="w-3 h-3 mr-1" />
          {hoursRemaining}h {minutesRemaining}m
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 text-[#212529] dark:text-white">{listing.title}</h3>
        <p className="text-[#40c057] dark:text-[#51cf66] font-bold text-xl mb-2">${listing.price}</p>
        <div className="flex items-center text-[#495057] dark:text-gray-400 mb-2">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">Near campus</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-[#495057] dark:text-gray-400">
            <Tag className="w-4 h-4 mr-1" />
            <span className="text-sm">{listing.category}</span>
          </div>
          <span className="text-sm text-[#868e96] dark:text-gray-400">@{listing.seller.username}</span>
        </div>
      </div>
    </div>
  );
}