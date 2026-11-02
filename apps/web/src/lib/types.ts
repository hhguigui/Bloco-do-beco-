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
  date?: string | null; // YYYY-MM-DD one-off date; null = recurring
  schedule: string;
  price: string;
  weekdays?: string[]; // ["segunda", "terca", ...]
}

export interface TalentInput {
  name: string;
  category: Category;
  specialty: string;
  bio: string;
  gender: Gender;
  age_range?: AgeRange;
  birth_date?: string; // client-side only — can be YYYY-MM-DD
  experience: Experience;
  address: string;
  cep?: string; // client-side only — optional CEP lookup
  number?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  logradouro?: string; // client-side only
  address_full?: string; // client-side only
  lat: number | null;
  lng: number | null;
  phone: string;
  instagram: string;
  photo: string;
  cover_image?: string;
  activities: Activity[];
}

export interface Talent extends TalentInput {
  id: string;
  lat: number;
  lng: number;
  status: TalentStatus;
  owner_id: string | null;
  owner_email: string; // admins only; "" otherwise
  is_owner?: boolean; // true when the logged-in user owns this talent
  created_at: string;
}

export interface Report {
  id: string;
  talent_id: string;
  reporter_user_id: string | null;
  reporter_email: string | null;
  message: string;
  created_at: string;
}

export interface Observation {
  id: string;
  talent_id: string;
  author_user_id: string;
  author_email: string;
  note: string;
  created_at: string;
}

export interface Participation {
  id: string;
  talent_id: string;
  activity_id: string;
  participant_name: string;
  participant_email: string | null;
  participant_phone: string;
  participant_picture: string;
  participant_gender?: string | null;
  participant_instagram?: string | null;
  participant_phones?: string[];
  user_id: string | null;
  created_at: string;
}

export interface ParticipantUserInfo {
  user_id: string;
  email: string;
  name: string;
  picture: string;
  role: string;
  phones: string[];
  gender?: string | null;
  instagram?: string | null;
}

export interface ParticipantActivity {
  activity_id: string;
  activity_title: string;
  participants: Participation[];
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
  role: "customer" | "talent";
  phones?: string[];
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
  gender: string;
  notes: string;
}

export interface CepLookup {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  formatted_address: string;
}
