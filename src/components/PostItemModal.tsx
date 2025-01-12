import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Listing } from '../types';
import { supabase } from '../lib/supabase';

// Stanford coordinates
const defaultLocation = { lat: 37.4275, lng: -122.1697 };

interface PostItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (listing: Omit<Listing, 'id' | 'seller' | 'created_at' | 'expires_at' | 'user_id'>) => void;
  editListing?: Listing | null;
}

function LocationPicker({ onLocationSelect }: { onLocationSelect: (location: { lat: number; lng: number }) => void }) {
  const [position, setPosition] = useState<LatLng | null>(null);
  
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export function PostItemModal({ isOpen, onClose, onSubmit, editListing }: PostItemModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: editListing?.title || '',
    description: editListing?.description || '',
    price: editListing?.price || '',
    category: editListing?.category || 'Books',
    condition: editListing?.condition || 'like-new' as const,
    images: editListing?.images || [] as string[],
    location: editListing?.location || defaultLocation
  });

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (editListing) {
      setFormData({
        title: editListing.title,
        description: editListing.description,
        price: editListing.price,
        category: editListing.category,
        condition: editListing.condition,
        images: editListing.images,
        location: editListing.location
      });
    } else {
      setFormData({
        title: '',
        description: '',
        price: '',
        category: 'Books',
        condition: 'like-new',
        images: [],
        location: defaultLocation
      });
    }
  }, [editListing]);

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    try {
      setUploadProgress(0);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      const { data, error } = await supabase.storage
        .from('listings')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          },
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('listings')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        images: [publicUrl]
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    try {
      setUploadProgress(0);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      const { data, error } = await supabase.storage
        .from('listings')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          },
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('listings')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        images: [publicUrl]
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#212529] dark:text-white">
              {editListing ? 'Edit Listing' : 'Post New Item'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-[#f1f3f5] dark:hover:bg-gray-700 rounded-full transition-colors">
              <X className="w-6 h-6 text-[#495057] dark:text-white" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#495057] dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-[#dee2e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339af0] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
                placeholder="What are you selling?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#495057] dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-[#dee2e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339af0] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all h-32"
                placeholder="Describe your item..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#495057] dark:text-gray-300 mb-1">
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#868e96] dark:text-gray-400">$</span>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 border border-[#dee2e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339af0] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#495057] dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-[#dee2e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339af0] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
                >
                  <option value="Books">Books</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#495057] dark:text-gray-300 mb-1">
                Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value as any })}
                className="w-full px-3 py-2 border border-[#dee2e6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#339af0] dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
              >
                <option value="new">New</option>
                <option value="like-new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#495057] dark:text-gray-300 mb-1">
                Images
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 ${
                  isDragging ? 'border-[#339af0] bg-[#e7f5ff]' : 'border-dashed border-[#dee2e6]'
                } dark:border-gray-600 rounded-lg p-4 text-center transition-all relative cursor-pointer hover:border-[#339af0] hover:bg-[#e7f5ff]/50 ${
                  formData.images[0] ? 'aspect-square' : 'h-40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                {formData.images[0] ? (
                  <div className="absolute inset-0 p-2">
                    <img
                      src={formData.images[0]}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, images: [] });
                      }}
                      className="absolute top-4 right-4 p-1 bg-[#fa5252] text-white rounded-full hover:bg-[#f03e3e] transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 mb-2 text-[#868e96] dark:text-gray-400" />
                    <p className="text-sm text-[#495057] dark:text-gray-400">
                      {isDragging ? 'Drop image here' : 'Drop image here or click to upload'}
                    </p>
                    {uploadProgress !== null && (
                      <div className="w-full max-w-xs mt-4">
                        <div className="h-2 bg-[#e9ecef] dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#339af0] transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#495057] dark:text-gray-300 mb-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location (Click on map to set location)
                </div>
              </label>
              <div className="h-48 border border-[#dee2e6] dark:border-gray-600 rounded-lg overflow-hidden">
                <MapContainer
                  center={[defaultLocation.lat, defaultLocation.lng]}
                  zoom={15}
                  className="w-full h-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker
                    onLocationSelect={(location) => setFormData({ ...formData, location })}
                  />
                </MapContainer>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#dee2e6] rounded-lg hover:bg-[#f1f3f5] dark:hover:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#339af0] text-white rounded-lg hover:bg-[#228be6] transition-colors"
              >
                {editListing ? 'Save Changes' : 'Post Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}