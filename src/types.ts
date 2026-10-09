export type TileType = 'name' | 'photo';

export interface Tier {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

export interface Place {
  id: string;
  name: string;
  type: TileType;
  tierId: string | null; // null means unranked
  order: number; // For sorting within a tier or unranked
  
  // Appearance
  photoId?: string; // ID for IndexedDB image
  backgroundColor?: string;
  textColor?: string;
  
  // Details
  mapsUrl?: string;
  address?: string;
  area?: string;
  recommendations?: string;
  cuisine?: string;
  priceRange?: string;
  notes?: string;
}

export interface BoardState {
  title: string;
  tiers: Tier[];
  places: Place[];
}
