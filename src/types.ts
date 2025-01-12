export interface Listing {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  images: string[];
  location: {
    lat: number;
    lng: number;
  };
  seller: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  created_at: string;
  expires_at: string;
  user_id: string;
}