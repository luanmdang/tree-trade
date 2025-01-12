import React, { useState, useEffect } from 'react';
import { Map } from './components/Map';
import { ListingCard } from './components/ListingCard';
import { PostItemModal } from './components/PostItemModal';
import { ListingModal } from './components/ListingModal';
import { AuthModal } from './components/AuthModal';
import { AdminKeyModal } from './components/AdminKeyModal';
import { ChatInbox } from './components/ChatInbox';
import { useAdmin } from './context/AdminContext';
import { Shield, MessageSquare } from 'lucide-react';
import { Listing } from './types';
import { Search, PlusCircle, Menu, Sun, Moon, LogIn, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';

export default function App() {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { isAdmin, clearAdmin } = useAdmin();

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 768);
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
    if (!editingListing) return;

    try {
      const query = supabase
        .from('listings')
        .update({
          ...listing
        })
        .eq('id', editingListing.id);

      // Only add user check if not admin
      if (!isAdmin) {
        query.eq('user_id', user?.id);
      }

      const { error } = await query;

      if (error) throw error;

      await fetchListings();
      setIsPostModalOpen(false);
      setEditingListing(null);
    } catch (error) {
      console.error('Error updating listing:', error);
      alert('Failed to update listing');
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      const query = supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      // Only add user check if not admin
      if (!isAdmin) {
        query.eq('user_id', user?.id);
      }

      const { error } = await query;

      if (error) throw error;

      setSelectedListing(null);
      await fetchListings();
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing');
    }
  };

  const handleEditClick = (listing: Listing) => {
    setEditingListing(listing);
    setSelectedListing(null);
    setIsPostModalOpen(true);
  };

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-[#e9ecef] dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-[#f1f3f5] dark:hover:bg-gray-700 rounded-lg transition-colors md:hidden"
            >
              <Menu className="w-6 h-6 dark:text-white" />
            </button>
            <h1 className="text-xl font-bold text-[#212529] dark:text-white hidden md:block">🌲 TreeTrade</h1>
            <h1 className="text-lg font-bold text-[#212529] dark:text-white md:hidden">Marketplace</h1>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#dee2e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339af0] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all text-sm md:text-base"
              />
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-[#868e96]" />
            </div>

            {user && (
              <button
                onClick={() => setShowInbox(true)}
                className="p-2 hover:bg-[#f1f3f5] dark:hover:bg-gray-700 rounded-lg transition-colors relative"
              >
                <MessageSquare className="w-6 h-6 dark:text-white" />
              </button>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-[#f1f3f5] dark:hover:bg-gray-700 rounded-lg transition-colors hidden md:block"
            >
              {theme === 'dark' ? (
                <Sun className="w-6 h-6 dark:text-white" />
              ) : (
                <Moon className="w-6 h-6 text-[#495057]" />
              )}
            </button>

            {isAdmin ? (
              <button
                onClick={clearAdmin}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Shield className="w-5 h-5" />
                <span className="hidden md:inline">Exit Admin</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="p-2 hover:bg-[#f1f3f5] dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Shield className="w-6 h-6 dark:text-white" />
              </button>
            )}

            {user ? (
              <>
                <button 
                  onClick={() => {
                    setEditingListing(null);
                    setIsPostModalOpen(true);
                  }}
                  className="flex items-center space-x-2 bg-[#339af0] text-white px-4 py-2 rounded-lg hover:bg-[#228be6] transition-colors"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span className="hidden md:inline">Post Item</span>
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="flex items-center space-x-2 px-4 py-2 border border-[#dee2e6] rounded-lg hover:bg-[#f1f3f5] dark:hover:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center space-x-2 bg-[#339af0] text-white px-4 py-2 rounded-lg hover:bg-[#228be6] transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span className="hidden md:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {showSidebar && (
          <div className="w-full md:w-96 overflow-y-auto bg-white dark:bg-gray-800 border-r border-[#e9ecef] dark:border-gray-700">
            <div className="p-4 space-y-4">
              {filteredListings.map((listing) => (
                <div 
                  key={listing.id} 
                  onClick={() => {
                    setSelectedListing(listing);
                    if (window.innerWidth < 768) {
                      setShowSidebar(false);
                    }
                  }}
                >
                  <ListingCard listing={listing} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1">
          <Map
            listings={filteredListings}
            onMarkerClick={(listing) => {
              setSelectedListing(listing);
              if (window.innerWidth < 768) {
                setShowSidebar(false);
              }
            }}
          />
        </div>
      </div>

      {showInbox && (
        <ChatInbox onClose={() => setShowInbox(false)} />
      )}

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
        onDelete={isAdmin || (user && selectedListing?.user_id === user.id) ? handleDeleteListing : undefined}
        onEdit={isAdmin || (user && selectedListing?.user_id === user.id) ? handleEditClick : undefined}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <AdminKeyModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </div>
  );
}