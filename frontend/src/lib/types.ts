// Hand-written mirrors of backend/models/*.py — keep in sync with the Pydantic models.

export type Category =
  | "musica"
  | "costura"
  | "artesanato"
  | "artes_visuais"
  | "danca_teatro"
  | "gastronomia"
  | "outros";
export type Gender = "mulher" | "homem" | "nao_binario" | "nao_informado";
export type AgeRange = "15-24" | "25-34" | "35-49" | "50-64" | "65+";
export type Experience = "<2" | "2-5" | "5-10" | "10-20" | "20+";
export type ActivityType = "oficina" | "aula" | "servico" | "evento";
export type TalentStatus = "pending" | "approved" | "rejected";

export interface Activity {
  id: string;
  title: string;
  type: ActivityType;
  description: string;
  date: string | null; // YYYY-MM-DD one-off date; null = recurring
  schedule: string;
  price: string;
}

export interface TalentInput {
  name: string;
  category: Category;
  specialty: string;
  bio: string;
  gender: Gender;
  age_range: AgeRange;
  experience: Experience;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string;
  instagram: string;
  photo: string;
  activities: Activity[];
}

export interface Talent extends TalentInput {
  id: string;
  lat: number;
  lng: number;
  status: TalentStatus;
  owner_id: string | null;
  owner_email: string; // admins only; "" otherwise
  created_at: string;
}

export interface StatusUpdate {
  status: TalentStatus;
}

export interface ActivityListing extends Activity {
  talent_id: string;
  talent_name: string;
  talent_category: Category;
  talent_photo: string;
  address: string;
  phone: string;
  instagram: string;
}

export interface CountItem {
  key: string;
  count: number;
}

export interface Summary {
  total_talents: number;
  total_activities: number;
  free_activities: number;
  by_category: CountItem[];
}

export interface Stats extends Summary {
  pending_talents: number;
  by_gender: CountItem[];
  by_age: CountItem[];
  by_experience: CountItem[];
  by_activity_type: CountItem[];
}

export interface TodayResponse {
  today: string;
}

export interface User {
  user_id: string;
  email: string;
  name: string;
  picture: string;
}

export interface Me {
  user: User | null;
  is_admin: boolean;
}

export interface SessionRequest {
  session_id: string;
}

export interface RecommendRequest {
  query: string;
}

export interface BioRequest {
  name: string;
  category: string;
  specialty: string;
  notes: string;
}
