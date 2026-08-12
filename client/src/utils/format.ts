import i18n from '../i18n';

export const formatPrice = (price: number, purpose?: string): string => {
  if (!price && price !== 0) return 'N/A';
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });
  const formatted = formatter.format(price);
  if (purpose === 'rent') return `${formatted}/mo`;
  return formatted;
};

export const formatCompactPrice = (price: number): string => {
  if (!price && price !== 0) return 'N/A';
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  if (price >= 1000) return `₹${(price / 1000).toFixed(1)} K`;
  return `₹${price}`;
};

export const formatArea = (area: number): string => {
  if (!area) return 'N/A';
  if (area >= 1089) return `${(area / 1089).toFixed(2)} ground`;
  return `${area.toLocaleString('en-IN')} sq.ft`;
};

export const formatDate = (date: string | Date): string =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const timeAgo = (date: string | Date): string => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
};

export const truncate = (text: string, length = 100): string =>
  text?.length > length ? `${text.slice(0, length)}…` : text;

export const getInitials = (name = ''): string =>
  name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

type StatusKey = 'status.pending' | 'status.verified' | 'status.rejected' | 'status.sold' | 'status.rented' | 'status.accepted' | 'status.rescheduled' | 'status.completed' | 'status.cancelled';

const STATUS_LABELS: Record<string, StatusKey> = {
  pending: 'status.pending',
  verified: 'status.verified',
  rejected: 'status.rejected',
  sold: 'status.sold',
  rented: 'status.rented',
  accepted: 'status.accepted',
  rescheduled: 'status.rescheduled',
  completed: 'status.completed',
  cancelled: 'status.cancelled',
};

export const statusLabel = (status: string): string =>
  STATUS_LABELS[status] ? i18n.t(STATUS_LABELS[status]) : status;

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-yellow',
  verified: 'badge-green',
  rejected: 'badge-red',
  sold: 'badge-blue',
  rented: 'badge-blue',
  accepted: 'badge-green',
  rescheduled: 'badge-yellow',
  completed: 'badge-green',
  cancelled: 'badge-red',
};

export const statusBadgeClass = (status: string): string => STATUS_BADGE[status] || 'badge-gray';

export const PROPERTY_TYPES: string[] = ['Apartment', 'Villa', 'House', 'Plot', 'Commercial', 'PG', 'Other'];
export const AMENITIES_LIST = [
  'Swimming Pool', 'Gym', 'Parking', 'Lift', 'Power Backup', 'Club House',
  'Security', 'Garden', 'Children Play Area', 'Intercom', 'Air Conditioning',
  'Gas Pipeline', 'Gated Society', 'Water Supply', 'Balcony',
];

export const CITIES_INDIA: string[] = [
  'Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai',
  'Kolkata', 'Ahmedabad', 'Jaipur', 'Noida', 'Gurgaon', 'Chandigarh',
  'Kochi', 'Indore', 'Lucknow',
];