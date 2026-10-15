import { fetchDoctors, type Doctor } from './supabase';

export interface ExtendedDoctor extends Doctor {
  availableStatus?: string;
  nextSlot?: string;
  rating?: string;
  avatar?: string;
  bio?: string;
  languages?: string[];
}

export const mockDoctors: ExtendedDoctor[] = [
  {
    id: '1',
    full_name: 'Dr. Ananya Rao',
    specialization: 'Cardiology',
    experience_years: 12,
    qualification: 'MD, DM Cardiology',
    consultation_fee: 800,
    available_days: ['Monday', 'Wednesday'],
    available_from: '10:00',
    available_to: '16:00',
    is_active: true,
    created_at: '',
    availableStatus: 'Available today',
    nextSlot: 'Today · 2:30 PM',
    rating: '4.9',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=faces&q=80',
    bio: 'Senior Consultant Cardiologist specializing in preventive cardiology, coronary artery disease management, and heart failure care.',
    languages: ['English', 'Telugu', 'Hindi'],
  },
  {
    id: '2',
    full_name: 'Dr. Rahul Sharma',
    specialization: 'Dermatology',
    experience_years: 8,
    qualification: 'MD Dermatology',
    consultation_fee: 600,
    available_days: ['Tuesday', 'Thursday'],
    available_from: '09:00',
    available_to: '14:00',
    is_active: true,
    created_at: '',
    availableStatus: 'Available tomorrow',
    nextSlot: 'Tomorrow · 9:15 AM',
    rating: '4.8',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=faces&q=80',
    bio: 'Specialist in medical and aesthetic dermatology, treating chronic skin allergies, acne, hair loss, and eczema.',
    languages: ['English', 'Hindi'],
  },
  {
    id: '3',
    full_name: 'Dr. Priya Nair',
    specialization: 'General Medicine',
    experience_years: 15,
    qualification: 'MD General Medicine',
    consultation_fee: 500,
    available_days: ['Monday', 'Tuesday'],
    available_from: '10:00',
    available_to: '18:00',
    is_active: true,
    created_at: '',
    availableStatus: 'Available today',
    nextSlot: 'Today · 11:45 AM',
    rating: '4.9',
    avatar: 'https://images.unsplash.com/photo-1594824813626-d62fcf656b62?w=400&h=400&fit=crop&crop=faces&q=80',
    bio: 'Lead Physician focused on comprehensive adult healthcare, lifestyle disease management, diabetes care, and preventive checkups.',
    languages: ['English', 'Telugu', 'Malayalam'],
  },
  {
    id: '4',
    full_name: 'Dr. Arjun Reddy',
    specialization: 'Orthopedics',
    experience_years: 10,
    qualification: 'MS Orthopedics',
    consultation_fee: 1000,
    available_days: ['Wednesday', 'Friday'],
    available_from: '11:00',
    available_to: '17:00',
    is_active: true,
    created_at: '',
    availableStatus: 'Available Wednesday',
    nextSlot: 'Wed · 1:00 PM',
    rating: '4.7',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=faces&q=80',
    bio: 'Orthopedic surgeon with expertise in joint preservation, knee replacement, trauma surgery, and sports injury rehabilitation.',
    languages: ['English', 'Telugu'],
  },
  {
    id: '5',
    full_name: 'Dr. Meera Kapoor',
    specialization: 'Pediatrics',
    experience_years: 14,
    qualification: 'MD Pediatrics',
    consultation_fee: 700,
    available_days: ['Monday', 'Thursday'],
    available_from: '09:00',
    available_to: '13:00',
    is_active: true,
    created_at: '',
    availableStatus: 'Available today',
    nextSlot: 'Today · 4:00 PM',
    rating: '4.8',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=faces&q=80',
    bio: 'Consultant Pediatrician dedicated to infant development, childhood immunization, pediatric respiratory illnesses, and growth monitoring.',
    languages: ['English', 'Hindi', 'Punjabi'],
  },
  {
    id: '6',
    full_name: 'Dr. Vikram Singh',
    specialization: 'Neurology',
    experience_years: 18,
    qualification: 'MD, DM Neurology',
    consultation_fee: 1200,
    available_days: ['Tuesday', 'Friday'],
    available_from: '14:00',
    available_to: '19:00',
    is_active: true,
    created_at: '',
    availableStatus: 'Available Thursday',
    nextSlot: 'Thu · 10:30 AM',
    rating: '4.9',
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=faces&q=80',
    bio: 'Senior Neurologist managing epilepsy, Parkinson’s disease, stroke prevention, chronic headache disorders, and peripheral neuropathy.',
    languages: ['English', 'Hindi'],
  },
  {
    id: '7',
    full_name: 'Dr. Sneha Iyer',
    specialization: 'Gynecology',
    experience_years: 11,
    qualification: 'MD Obstetrics & Gynecology',
    consultation_fee: 800,
    available_days: ['Monday', 'Wednesday'],
    available_from: '10:00',
    available_to: '16:00',
    is_active: true,
    created_at: '',
    availableStatus: 'Available today',
    nextSlot: 'Today · 1:15 PM',
    rating: '4.8',
    avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=400&fit=crop&crop=faces&q=80',
    bio: 'Obstetrician and Gynecologist providing personalized prenatal care, high-risk pregnancy management, PCOS counseling, and wellness screenings.',
    languages: ['English', 'Telugu', 'Tamil'],
  },
  {
    id: '8',
    full_name: 'Dr. Karthik Rao',
    specialization: 'ENT',
    experience_years: 9,
    qualification: 'MS ENT',
    consultation_fee: 600,
    available_days: ['Tuesday', 'Thursday'],
    available_from: '10:00',
    available_to: '15:00',
    is_active: true,
    created_at: '',
    availableStatus: 'Available tomorrow',
    nextSlot: 'Tomorrow · 3:00 PM',
    rating: '4.7',
    avatar: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&h=400&fit=crop&crop=faces&q=80',
    bio: 'ENT surgeon with specialization in endoscopic sinus surgery, hearing loss evaluation, allergy treatment, and voice disorders.',
    languages: ['English', 'Telugu'],
  },
];

export function getDoctorFallbackAvatar(name?: string): string {
  const cleanName = encodeURIComponent(name || 'Doctor');
  return `https://ui-avatars.com/api/?name=${cleanName}&background=0284c7&color=ffffff&bold=true&size=256`;
}

const specialtyPhotos: Record<string, string> = {
  Cardiology: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=faces&q=80',
  Dermatology: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=faces&q=80',
  'General Medicine': 'https://images.unsplash.com/photo-1594824813626-d62fcf656b62?w=400&h=400&fit=crop&crop=faces&q=80',
  Orthopedics: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=faces&q=80',
  Pediatrics: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=faces&q=80',
  Neurology: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=faces&q=80',
  Gynecology: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=400&fit=crop&crop=faces&q=80',
  ENT: 'https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&h=400&fit=crop&crop=faces&q=80',
};

/**
 * Loads doctors from backend and merges with rich details and portrait photos
 */
export async function getMergedDoctors(): Promise<ExtendedDoctor[]> {
  try {
    const data = await fetchDoctors();
    if (data && data.length > 0) {
      return data.map((dbDoc) => {
        const docName = dbDoc.full_name || dbDoc.fullName || '';
        const match = mockDoctors.find((m) => (m.full_name || '').toLowerCase() === docName.toLowerCase() || m.id === dbDoc.id);
        const specPhoto = specialtyPhotos[dbDoc.specialization] || 
          mockDoctors.find((m) => m.specialization.toLowerCase() === (dbDoc.specialization || '').toLowerCase())?.avatar || 
          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=faces&q=80';

        return match
          ? { ...dbDoc, ...match, id: dbDoc.id }
          : {
              ...dbDoc,
              availableStatus: 'Available today',
              nextSlot: 'Today · 10:00 AM',
              rating: '4.8',
              avatar: specPhoto,
            };
      });
    }
  } catch {
    // Return mock doctors on backend network error
  }
  return mockDoctors;
}
