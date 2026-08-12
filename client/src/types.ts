export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'owner' | 'buyer';
  phone?: string;
  profileImage?: string;
  isBlocked?: boolean;
  isEmailVerified?: boolean;
  favorites?: string[];
  location?: string;
  bio?: string;
  createdAt?: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type PropertyStatus = 'pending' | 'verified' | 'rejected' | 'sold' | 'rented';
export type VisitStatus = 'pending' | 'accepted' | 'rejected' | 'rescheduled' | 'completed' | 'cancelled';

export interface ReviewUser {
  _id: string;
  name: string;
  profileImage?: string;
}

export interface Review {
  _id: string;
  userId: ReviewUser;
  rating: number;
  comment: string;
  ownerReply?: string;
  createdAt?: string;
}

export interface Property {
  _id: string;
  ownerId: Partial<User> | string;
  title: string;
  description: string;
  type: string;
  purpose: 'sale' | 'rent';
  price: number;
  pricePerSqft?: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  balconies?: number;
  floors?: number;
  totalFloors?: number;
  parking?: number;
  furnished?: string;
  age?: number;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  coordinates?: Coordinates;
  images: string[];
  video?: string;
  panorama?: string;
  amenities?: string[];
  status: PropertyStatus;
  featured?: boolean;
  views?: number;
  rating?: number;
  ratingCount?: number;
  reviews?: Review[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Visit {
  _id: string;
  propertyId: Property | string;
  buyerId: User | string;
  ownerId?: User | string;
  date?: string;
  time?: string;
  note?: string;
  status: VisitStatus;
  createdAt?: string;
}

export interface Message {
  _id?: string;
  conversation?: string;
  sender?: string | User;
  receiver?: string | User;
  message: string;
  read?: boolean;
  createdAt?: string;
}

export interface Conversation {
  _id: string;
  participants: Array<string | Partial<User>>;
  otherUser?: Partial<User>;
  property?: Pick<Property, '_id' | 'title'>;
  lastMessage?: string;
  lastMessageAt?: string;
  updatedAt?: string;
}

export interface NotificationItem {
  _id: string;
  type?: 'visit' | 'message' | 'property' | 'system';
  title?: string;
  message?: string;
  read: boolean;
  link?: string;
  createdAt?: string;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  user?: User;
}

export interface ListResponse<T> {
  success: boolean;
  count: number;
  total: number;
  page: number;
  pages: number;
  data: T[];
}

export interface FavoriteUser extends User {
  role: 'owner' | 'admin' | 'buyer';
}

export interface RecentSearch {
  label: string;
  params: string;
}