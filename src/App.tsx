import React, { useState, useEffect } from 'react';
import { Map } from './components/Map';
import { ListingCard } from './components/ListingCard';
import { PostItemModal } from './components/PostItemModal';
import { ListingModal } from './components/ListingModal';
import { AuthModal } from './components/AuthModal';
import { Listing } from './types';
import { Search, PlusCircle, Sun, Moon, LogIn, LogOut, MapPin, List } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';

export default function App() {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showListView, setShowListView] = useState(window.innerWidth <= 768);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowListView(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:user_id (
          name,
          username,
          avatar
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      return;
    }

    const transformedListings = data.map(listing => ({
      ...listing,
      seller: {
        id: listing.user_id,
        name: listing.profiles?.name || 'Unknown User',
        username: listing.profiles?.username || 'unknown',
        avatar: listing.profiles?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'
      }
    }));

    setListings(transformedListings);
  }

  const handleNewListing = async (listing: Omit<Listing, 'id' | 'seller' | 'created_at' | 'expires_at' | 'user_id'>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('listings')
      .insert([
        {
          ...listing,
          user_id: user.id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating listing:', error);
      return;
    }

    await fetchListings();
    setIsPostModalOpen(false);
  };

  const handleEditListing = async (listing: Omit<Listing, 'id' | 'seller' | 'created_at' | 'expires_at' | 'user_id'>) => {
    if (!user || !editingListing) return;

    const { error } = await supabase
      .from('listings')
      .update({
        ...listing,
        user_id: user.id
      })
      .eq('id', editingListing.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating listing:', error);
      return;
    }

    await fetchListings();
    setIsPostModalOpen(false);
    setEditingListing(null);
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting listing:', error);
      return;
    }

    setSelectedListing(null);
    await fetchListings();
  };

  const handleEditClick = (listing: Listing) => {
    setEditingListing(listing);
    setSelectedListing(null);
    setIsPostModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-[#e9ecef] dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#212529] dark:text-white">🌲 TreeTrade</h1>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="hidden md:flex relative">
              <input
                type="text"
                placeholder="Search listings..."
                className="pl-10 pr-4 py-2 border border-[#dee2e6] rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-[#339af0] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
              />
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-[#868e96]" />
            </div>

            <div className="md:hidden">
              <button
                onClick={() => setShowListView(!showListView)}
                className="p-2 hover:bg-[#f1f3f5] dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {showListView ? <MapPin className="w-6 h-6 dark:text-white" /> : <List className="w-6 h-6 dark:text-white" />}
              </button>
            </div>
            
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-[#f1f3f5] dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-6 h-6 dark:text-white" />
              ) : (
                <Moon className="w-6 h-6 text-[#495057]" />
              )}
            </button>

            {user ? (
              <>
                <button 
                  onClick={() => {
                    setEditingListing(null);
                    setIsPostModalOpen(true);
                  }}
                  className="flex items-center space-x-1 md:space-x-2 bg-[#339af0] text-white px-3 md:px-4 py-2 rounded-lg hover:bg-[#228be6] transition-colors"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span className="hidden md:inline">Post Item</span>
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 border border-[#dee2e6] rounded-lg hover:bg-[#f1f3f5] dark:hover:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-1 md:space-x-2 bg-[#339af0] text-white px-3 md:px-4 py-2 rounded-lg hover:bg-[#228be6] transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span className="hidden md:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Mobile search bar */}
        <div className="md:hidden absolute top-16 left-0 right-0 z-10 bg-white dark:bg-gray-800 p-4 border-b border-[#e9ecef] dark:border-gray-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Search listings..."
              className="w-full pl-10 pr-4 py-2 border border-[#dee2e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339af0] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-[#868e96]" />
          </div>
        </div>

        {/* Listings view (full width on mobile when showListView is true) */}
        <div className={`${
          showListView ? 'w-full' : 'hidden md:block w-full md:w-96'
        } overflow-y-auto bg-white dark:bg-gray-800 border-r border-[#e9ecef] dark:border-gray-700 pt-16 md:pt-0`}>
          <div className="p-4 space-y-4">
            {listings.map((listing) => (
              <div key={listing.id} onClick={() => setSelectedListing(listing)}>
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </div>

        {/* Map view (hidden on mobile when showListView is true) */}
        <div className={`flex-1 ${showListView ? 'hidden md:block' : 'block'}`}>
          <Map
            listings={listings}
            onMarkerClick={setSelectedListing}
          />
        </div>
      </div>

      <PostItemModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setEditingListing(null);
        }}
        onSubmit={editingListing ? handleEditListing : handleNewListing}
        editListing={editingListing}
      />

      <ListingModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onDelete={user && selectedListing?.user_id === user.id ? handleDeleteListing : undefined}
        onEdit={user && selectedListing?.user_id === user.id ? handleEditClick : undefined}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}