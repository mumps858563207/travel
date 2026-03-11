
export type TransportType = 'Flight' | 'HSR' | 'Driving' | 'Flight_Driving' | 'Flight_HSR' | 'PublicTransport';
export type AccommodationType = 'B&B' | 'Camping' | 'Hotel' | 'Motel';
export type TravelTheme = 'Family' | 'Couple' | 'Solo' | 'Onsen' | 'Shopping' | 'Culture' | 'Friends';
export type TravelRegion = 'Domestic' | 'International';
export type CuisineType = 'Chinese' | 'HotPot' | 'WesternSteak' | 'BBQ' | 'Sichuan' | 'Japanese' | 'Korean' | 'StreetFood' | 'LocalBreakfast' | 'Michelin' | 'Cafe' | 'LocalRecommended';

export interface DayMealPreference {
  day: number;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface TravelPreferences {
  region: TravelRegion;
  startPoint: string;
  destination: string;
  duration: number;
  transport: TransportType;
  accommodations: AccommodationType[];
  themes: TravelTheme[];
  cuisines: CuisineType[];
  dailyMeals: DayMealPreference[];
  starRating?: number;
  startDate?: string;
  endDate?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ItineraryResult {
  text: string;
  sources: GroundingSource[];
  agentAnalysis?: string;
  preferences?: TravelPreferences;
}
