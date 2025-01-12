import { MapContainer, TileLayer, Popup, useMap } from 'react-leaflet';
import { Marker as LeafletMarker, DivIcon } from 'leaflet';
import { Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Listing } from '../types';
import { useState, useEffect } from 'react';

interface MapProps {
  listings: Listing[];
  onMarkerClick: (listing: Listing) => void;
}

function ZoomHandler({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    map.on('zoomend', () => {
      onZoomChange(map.getZoom());
    });
  }, [map]);

  return null;
}

const DEFAULT_CENTER: [number, number] = [37.4275, -122.1697];

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    isFinite(lat) &&
    isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function Map({ listings, onMarkerClick }: MapProps) {
  const [currentZoom, setCurrentZoom] = useState(15);
  
  const createCustomIcon = (listing: Listing) => {
    const hasImage = listing.images && listing.images.length > 0;
    const scale = Math.max(0.5, Math.min(1, currentZoom / 14));
    const baseWidth = 80;
    const scaledWidth = Math.round(baseWidth * scale);
    const imageHeight = Math.round(scaledWidth * 0.6);
    
    const content = `
      <div class="relative" style="width: ${scaledWidth}px; transform: translate(-50%, -100%);">
        <div class="bg-white rounded shadow-md p-1">
          <div class="text-center font-semibold overflow-hidden text-ellipsis whitespace-nowrap" 
               style="font-size: ${Math.max(10, 11 * scale)}px;">
            ${listing.title}
          </div>
          ${hasImage 
            ? `<img src="${listing.images[0]}" 
                   class="w-full object-cover rounded mt-1" 
                   style="height: ${imageHeight}px;"
                   alt="${listing.title}" />`
            : `<div class="w-full flex items-center justify-center rounded mt-1" 
                   style="height: ${imageHeight}px; background: #f3f4f6;">
                <svg xmlns="http://www.w3.org/2000/svg" 
                     width="${Math.max(12, 16 * scale)}" 
                     height="${Math.max(12, 16 * scale)}" 
                     viewBox="0 0 24 24" 
                     fill="none" 
                     stroke="currentColor" 
                     stroke-width="2" 
                     stroke-linecap="round" 
                     stroke-linejoin="round" 
                     class="text-gray-400">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>`
          }
          <div class="text-center font-bold text-green-600 mt-0.5" 
               style="font-size: ${Math.max(10, 11 * scale)}px;">
            $${listing.price}
          </div>
        </div>
        <div class="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full">
          <div class="w-2 h-2 bg-white transform rotate-45 shadow-md"></div>
        </div>
      </div>
    `;

    return new DivIcon({
      html: content,
      className: 'custom-marker',
      iconSize: [scaledWidth, undefined],
      iconAnchor: [scaledWidth / 2, 0] // Changed to align with the pin point
    });
  };

  const validListings = listings.filter(listing => {
    const lat = typeof listing.location.lat === 'string' 
      ? parseFloat(listing.location.lat) 
      : listing.location.lat;
    const lng = typeof listing.location.lng === 'string' 
      ? parseFloat(listing.location.lng) 
      : listing.location.lng;
    return isValidCoordinate(lat, lng);
  });

  return (
    <>
      <style>{`
        .custom-marker {
          background: none !important;
          border: none;
          z-index: 1 !important;
        }
        .leaflet-container {
          z-index: 1;
        }
        .leaflet-popup {
          z-index: 2;
        }
        .leaflet-marker-icon {
          pointer-events: auto !important;
        }
      `}</style>
      <MapContainer
        key={`map-${validListings.length}`}
        center={DEFAULT_CENTER}
        zoom={15}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomHandler onZoomChange={setCurrentZoom} />
        {validListings.map((listing) => {
          const lat = typeof listing.location.lat === 'string' 
            ? parseFloat(listing.location.lat) 
            : listing.location.lat;
          const lng = typeof listing.location.lng === 'string' 
            ? parseFloat(listing.location.lng) 
            : listing.location.lng;
          
          if (!isValidCoordinate(lat, lng)) {
            return null;
          }

          return (
            <Marker
              key={listing.id}
              position={[lat, lng]}
              icon={createCustomIcon(listing)}
              eventHandlers={{
                click: () => onMarkerClick(listing),
              }}
            />
          );
        })}
      </MapContainer>
    </>
  );
}