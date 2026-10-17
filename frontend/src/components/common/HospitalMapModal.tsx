import { useState, useMemo } from 'react';
import { 
  X, 
  MapPin, 
  Search, 
  Navigation, 
  Stethoscope, 
  Layers, 
  Compass, 
  CheckCircle2, 
  Info,
  Clock,
  Sparkles
} from 'lucide-react';

export interface HospitalRoom {
  id: string;
  number: string;
  name: string;
  department: string;
  doctorName?: string;
  floor: number;
  floorName: string;
  wing: 'East Wing' | 'West Wing' | 'Central Hub';
  color: string;
  status: 'In Session' | 'Available' | 'Procedure Active';
  directions: string;
  services: string[];
}

export const hospitalRooms: HospitalRoom[] = [
  // ─── Level 0: Ground Floor ──────────────────────────────────────────────────
  {
    id: 'l0-rec',
    number: 'G-01',
    name: 'Central Reception & Token Kiosk',
    department: 'Patient Services',
    floor: 0,
    floorName: 'Ground Floor',
    wing: 'Central Hub',
    color: 'emerald',
    status: 'Available',
    directions: 'Immediately facing the main revolving entrance doors.',
    services: ['Token check-in', 'Patient registration', 'Insurance assistance', 'Visitor pass'],
  },
  {
    id: 'l0-emg',
    number: 'G-02',
    name: 'Emergency & Trauma Bay',
    department: 'Emergency Medicine',
    floor: 0,
    floorName: 'Ground Floor',
    wing: 'East Wing',
    color: 'rose',
    status: 'In Session',
    directions: 'East entrance with direct ambulance ramp access.',
    services: ['24/7 Critical care', 'Minor OT', 'Resuscitation', 'Triage'],
  },
  {
    id: 'l0-pharma',
    number: 'G-03',
    name: 'MediSync Central Pharmacy',
    department: 'Pharmacy',
    floor: 0,
    floorName: 'Ground Floor',
    wing: 'West Wing',
    color: 'cyan',
    status: 'Available',
    directions: 'To the right of the central atrium elevators.',
    services: ['Prescription fulfillment', 'Over-the-counter meds', 'Refrigerated injectables'],
  },
  {
    id: 'l0-lab',
    number: 'G-04',
    name: 'Pathology & Diagnostic Blood Lab',
    department: 'Diagnostics',
    floor: 0,
    floorName: 'Ground Floor',
    wing: 'West Wing',
    color: 'blue',
    status: 'Available',
    directions: 'Down the west corridor, past the pharmacy counter.',
    services: ['CBC & Blood chemistries', 'Urine analysis', 'Rapid cultures', 'Hormone panels'],
  },

  // ─── Level 1: 1st Floor (General Medicine, Pediatrics, ENT) ─────────────────
  {
    id: 'l1-gm1',
    number: 'Room 101',
    name: 'General Medicine Clinic 1',
    department: 'General Medicine',
    doctorName: 'Dr. Amit Patel',
    floor: 1,
    floorName: '1st Floor',
    wing: 'East Wing',
    color: 'blue',
    status: 'In Session',
    directions: 'Take Elevator A to Level 1. Turn left down East Corridor; Room 101 is the first door on the right.',
    services: ['Chronic disease management', 'Hypertension & Diabetes', 'General checkup', 'Preventive care'],
  },
  {
    id: 'l1-gm2',
    number: 'Room 102',
    name: 'General Medicine Clinic 2',
    department: 'General Medicine',
    doctorName: 'Dr. Priya Sharma',
    floor: 1,
    floorName: '1st Floor',
    wing: 'East Wing',
    color: 'blue',
    status: 'Available',
    directions: 'Take Elevator A to Level 1. East Corridor, right next to Room 101.',
    services: ['Family medicine', 'Fever & infections', 'Geriatric health', 'Wellness counselling'],
  },
  {
    id: 'l1-ped1',
    number: 'Room 104',
    name: 'Pediatrics Clinic 1',
    department: 'Pediatrics',
    doctorName: 'Dr. Deepa Krishnan',
    floor: 1,
    floorName: '1st Floor',
    wing: 'West Wing',
    color: 'emerald',
    status: 'In Session',
    directions: 'Take Elevator A or B to Level 1. Turn right into the Children\'s Wing (play area entrance).',
    services: ['Child growth monitoring', 'Newborn checkups', 'Pediatric nutrition', 'Developmental assessment'],
  },
  {
    id: 'l1-ped2',
    number: 'Room 105',
    name: 'Immunization & Well Baby Clinic',
    department: 'Pediatrics',
    doctorName: 'Dr. Rajesh Gupta',
    floor: 1,
    floorName: '1st Floor',
    wing: 'West Wing',
    color: 'emerald',
    status: 'Available',
    directions: 'Children\'s Wing, adjacent to the pediatric playroom.',
    services: ['Childhood vaccines', 'Growth charts', 'Allergy evaluation', 'Adolescent health'],
  },
  {
    id: 'l1-ent1',
    number: 'Room 106',
    name: 'ENT & Audiometry Suite',
    department: 'ENT',
    doctorName: 'Dr. Arjun Pillai',
    floor: 1,
    floorName: '1st Floor',
    wing: 'Central Hub',
    color: 'amber',
    status: 'In Session',
    directions: 'Center corridor on Level 1, between East and West wings.',
    services: ['Audiometry hearing tests', 'Endoscopy', 'Tonsil & sinus care', 'Vertigo assessment'],
  },
  {
    id: 'l1-ent2',
    number: 'Room 107',
    name: 'ENT Consultation 2',
    department: 'ENT',
    doctorName: 'Dr. Nisha Thomas',
    floor: 1,
    floorName: '1st Floor',
    wing: 'Central Hub',
    color: 'amber',
    status: 'Available',
    directions: 'Room 107, adjacent to Audiometry booth.',
    services: ['Nose & throat exams', 'Allergic rhinitis', 'Voice disorders', 'Foreign body removal'],
  },

  // ─── Level 2: 2nd Floor (Cardiology & Orthopedics) ───────────────────────────
  {
    id: 'l2-card1',
    number: 'Room 201',
    name: 'Cardiology Clinic 1',
    department: 'Cardiology',
    doctorName: 'Dr. Ananya Rao',
    floor: 2,
    floorName: '2nd Floor',
    wing: 'East Wing',
    color: 'rose',
    status: 'In Session',
    directions: 'Take Elevator B to Level 2. Head down East Wing into the Cardiac Care Unit corridor.',
    services: ['Coronary artery disease', 'Preventive cardiology', 'ECG review', 'Heart failure management'],
  },
  {
    id: 'l2-card2',
    number: 'Room 202',
    name: 'Cardiology Clinic 2',
    department: 'Cardiology',
    doctorName: 'Dr. Ramesh Kumar',
    floor: 2,
    floorName: '2nd Floor',
    wing: 'East Wing',
    color: 'rose',
    status: 'Available',
    directions: 'Cardiac Care Unit corridor, next door to Room 201.',
    services: ['Interventional reviews', 'Post-stent rehab', 'Arrhythmia care', 'TMT interpretation'],
  },
  {
    id: 'l2-card-lab',
    number: 'Room 203',
    name: 'Echo & Holter Diagnostic Lab',
    department: 'Cardiology',
    floor: 2,
    floorName: '2nd Floor',
    wing: 'East Wing',
    color: 'rose',
    status: 'Procedure Active',
    directions: 'Opposite Room 201 in the Cardiac Care corridor.',
    services: ['2D/3D Echocardiography', 'Stress testing (TMT)', '24h Holter monitoring', 'Carotid Doppler'],
  },
  {
    id: 'l2-ortho1',
    number: 'Room 204',
    name: 'Orthopedics & Joint Care',
    department: 'Orthopedics',
    doctorName: 'Dr. Suresh Nair',
    floor: 2,
    floorName: '2nd Floor',
    wing: 'West Wing',
    color: 'orange',
    status: 'In Session',
    directions: 'Take Elevator A to Level 2. Follow signs toward Bone & Joint Institute (West Wing).',
    services: ['Joint replacement consultation', 'Spine & back care', 'Sports injury rehab', 'Arthritis management'],
  },
  {
    id: 'l2-ortho2',
    number: 'Room 205',
    name: 'Fracture & Sports Medicine',
    department: 'Orthopedics',
    doctorName: 'Dr. Kavitha Menon',
    floor: 2,
    floorName: '2nd Floor',
    wing: 'West Wing',
    color: 'orange',
    status: 'Available',
    directions: 'West Wing, adjacent to Digital X-Ray suite.',
    services: ['Fracture casting', 'Ligament strain assessment', 'Knee & shoulder pain', 'Bone density checks'],
  },
  {
    id: 'l2-xray',
    number: 'Room 206',
    name: 'Digital X-Ray & Plaster Room',
    department: 'Orthopedics',
    floor: 2,
    floorName: '2nd Floor',
    wing: 'West Wing',
    color: 'orange',
    status: 'Procedure Active',
    directions: 'Directly opposite Room 205.',
    services: ['High-speed digital X-Ray', 'Fiberglass casting', 'Bone alignment checks'],
  },

  // ─── Level 3: 3rd Floor (Dermatology, Neurology, Gynecology) ────────────────
  {
    id: 'l3-derm1',
    number: 'Room 301',
    name: 'Dermatology & Skin Clinic 1',
    department: 'Dermatology',
    doctorName: 'Dr. Sneha Reddy',
    floor: 3,
    floorName: '3rd Floor',
    wing: 'East Wing',
    color: 'purple',
    status: 'In Session',
    directions: 'Take Elevator B to Level 3. Turn left down East Wing into the Skin & Aesthetics Pavilion.',
    services: ['Acne & rosacea', 'Autoimmune skin conditions', 'Psoriasis care', 'Dermoscopy mole checks'],
  },
  {
    id: 'l3-derm2',
    number: 'Room 302',
    name: 'Dermatology & Trichology 2',
    department: 'Dermatology',
    doctorName: 'Dr. Vikram Singh',
    floor: 3,
    floorName: '3rd Floor',
    wing: 'East Wing',
    color: 'purple',
    status: 'Available',
    directions: 'Skin & Aesthetics Pavilion, next to Room 301.',
    services: ['Hair fall & PRP', 'Allergy patch tests', 'Cosmetic dermatology', 'Eczema management'],
  },
  {
    id: 'l3-derm-proc',
    number: 'Room 304',
    name: 'Laser & Minor Skin Procedure Suite',
    department: 'Dermatology',
    floor: 3,
    floorName: '3rd Floor',
    wing: 'East Wing',
    color: 'purple',
    status: 'Procedure Active',
    directions: 'Directly opposite Room 301 in Skin Pavilion.',
    services: ['Fractional lasers', 'Cyst & mole excision', 'Chemical peels', 'Cryotherapy'],
  },
  {
    id: 'l3-neuro1',
    number: 'Room 305',
    name: 'Neurology Consultation',
    department: 'Neurology',
    doctorName: 'Dr. Meera Iyer',
    floor: 3,
    floorName: '3rd Floor',
    wing: 'West Wing',
    color: 'indigo',
    status: 'In Session',
    directions: 'Take Elevator A to Level 3. West Wing, Neurosciences corridor.',
    services: ['Headache & migraine', 'Epilepsy management', 'Stroke follow-up', 'Movement disorders'],
  },
  {
    id: 'l3-neuro2',
    number: 'Room 306',
    name: 'Neurophysiology & EEG Lab',
    department: 'Neurology',
    doctorName: 'Dr. Sanjay Desai',
    floor: 3,
    floorName: '3rd Floor',
    wing: 'West Wing',
    color: 'indigo',
    status: 'Available',
    directions: 'West Wing, adjacent to Room 305.',
    services: ['EEG recording', 'Nerve conduction studies (NCS)', 'EMG testing', 'Sleep disorder checks'],
  },
  {
    id: 'l3-gyn1',
    number: 'Room 307',
    name: 'Women’s Health & Obstetrics',
    department: 'Gynecology',
    doctorName: 'Dr. Lakshmi Venkat',
    floor: 3,
    floorName: '3rd Floor',
    wing: 'Central Hub',
    color: 'pink',
    status: 'In Session',
    directions: 'Level 3 Central Hub, dedicated Women\'s Wellness pavilion.',
    services: ['Antenatal consultations', 'PCOS & menstrual health', 'Pre-pregnancy screening', 'Menopause care'],
  },
  {
    id: 'l3-gyn2',
    number: 'Room 308',
    name: 'Ultrasound & Fetal Well-being',
    department: 'Gynecology',
    doctorName: 'Dr. Pooja Agarwal',
    floor: 3,
    floorName: '3rd Floor',
    wing: 'Central Hub',
    color: 'pink',
    status: 'Available',
    directions: 'Women\'s Wellness pavilion, Room 308.',
    services: ['Obstetric 3D/4D scans', 'Pelvic ultrasound', 'Anomaly scans', 'Cervical screenings'],
  },
];

interface HospitalMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDepartment?: string;
  targetDoctorName?: string;
  targetRoomNumber?: string;
}

export function HospitalMapModal({
  isOpen,
  onClose,
  targetDepartment,
  targetDoctorName,
  targetRoomNumber,
}: HospitalMapModalProps) {
  // Find initial matching room if destination requested
  const matchedTargetRoom = useMemo(() => {
    if (targetRoomNumber) {
      return hospitalRooms.find(r => r.number.toLowerCase() === targetRoomNumber.toLowerCase());
    }
    if (targetDoctorName) {
      const cleanDoc = targetDoctorName.replace(/^Dr\.?\s*/i, '').trim().toLowerCase();
      const match = hospitalRooms.find(r => 
        r.doctorName && r.doctorName.toLowerCase().includes(cleanDoc)
      );
      if (match) return match;
    }
    if (targetDepartment) {
      const cleanDept = targetDepartment.trim().toLowerCase();
      const match = hospitalRooms.find(r => 
        r.department.toLowerCase().includes(cleanDept) || cleanDept.includes(r.department.toLowerCase())
      );
      if (match) return match;
    }
    return null;
  }, [targetDepartment, targetDoctorName, targetRoomNumber]);

  const [activeFloor, setActiveFloor] = useState<number>(() => {
    return matchedTargetRoom ? matchedTargetRoom.floor : 1;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<HospitalRoom | null>(matchedTargetRoom ?? null);

  if (!isOpen) return null;

  const floors = [
    { level: 0, label: 'Ground Floor (L0)', sub: 'Reception, Emergency & Pharmacy' },
    { level: 1, label: '1st Floor (L1)', sub: 'General Medicine, Pediatrics, ENT' },
    { level: 2, label: '2nd Floor (L2)', sub: 'Cardiology, Orthopedics, X-Ray' },
    { level: 3, label: '3rd Floor (L3)', sub: 'Dermatology, Neurology, Gynecology' },
  ];

  const currentFloorRooms = hospitalRooms.filter(r => r.floor === activeFloor);

  const filteredFloorRooms = searchQuery.trim()
    ? hospitalRooms.filter(r => {
        const q = searchQuery.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          r.number.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          (r.doctorName && r.doctorName.toLowerCase().includes(q)) ||
          r.services.some(s => s.toLowerCase().includes(q))
        );
      })
    : currentFloorRooms;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-5xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-b border-border bg-card/95 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
              <Compass className="w-5 h-5 text-brand animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-heading font-bold text-foreground">
                  MediSync Hospital Wayfinding & Room Directory
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-wider">
                  Live Floor Map
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Main Medical Campus · 4 Floors of Specialized Consultation Suites & Procedure Labs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            title="Close Map"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Floor Navigation & Search Bar ────────────────────────────── */}
        <div className="p-4 bg-secondary/30 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shrink-0">
          {/* Floor Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {floors.map(f => (
              <button
                key={f.level}
                onClick={() => {
                  setActiveFloor(f.level);
                  setSearchQuery('');
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFloor === f.level && !searchQuery
                    ? 'bg-brand text-brand-foreground shadow-xs font-bold'
                    : 'bg-card border border-border hover:bg-secondary text-foreground'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room, doctor, or test..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-brand placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Main Map Canvas & Room Details ───────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ── Left 2 Columns: Visual Floor Plan & Room Grid ───────────── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Target Destination Banner (if booked doctor passed) */}
            {matchedTargetRoom && (
              <div className="p-3.5 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-brand font-semibold">
                  <Navigation className="w-4 h-4 shrink-0 animate-bounce" />
                  <span>
                    Your Destination: <strong>{matchedTargetRoom.number}</strong> – {matchedTargetRoom.name}
                    {matchedTargetRoom.doctorName ? ` (${matchedTargetRoom.doctorName})` : ''} on <strong>{matchedTargetRoom.floorName}</strong>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setActiveFloor(matchedTargetRoom.floor);
                    setSelectedRoom(matchedTargetRoom);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-brand text-brand-foreground font-bold text-[11px] hover:bg-brand/90 transition-colors shrink-0 cursor-pointer"
                >
                  Locate Room →
                </button>
              </div>
            )}

            {/* Architectural Floor Overview */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {searchQuery ? `Search Results (${filteredFloorRooms.length})` : floors.find(f => f.level === activeFloor)?.label}
                  </h3>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {searchQuery ? 'Showing matching rooms across all levels' : floors.find(f => f.level === activeFloor)?.sub}
                </span>
              </div>

              {/* Central Hallway / Architectural Layout Visual */}
              <div className="p-3 rounded-lg bg-secondary/40 border border-border/70 mb-4 flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-background border border-border">Elevator Bank A & B</span>
                  <span>← Stairs & Emergency Exit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Central Air-Conditioned Waiting Atrium</span>
                </div>
              </div>

              {/* Specialty Consultation Rooms Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredFloorRooms.map((room) => {
                  const isDestination = matchedTargetRoom?.id === room.id;
                  const isSelected = selectedRoom?.id === room.id;

                  return (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoom(room)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                        isDestination
                          ? 'border-brand ring-2 ring-brand/30 bg-brand/5 shadow-md'
                          : isSelected
                          ? 'border-foreground/40 bg-secondary/50 shadow-xs'
                          : 'border-border bg-card hover:border-brand/40 hover:bg-secondary/30'
                      }`}
                    >
                      {/* Top Bar: Room Number + Badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            isDestination 
                              ? 'bg-brand text-brand-foreground'
                              : 'bg-secondary text-foreground'
                          }`}>
                            {room.number}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                            {room.wing}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          room.status === 'In Session'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            : room.status === 'Procedure Active'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        }`}>
                          {room.status}
                        </span>
                      </div>

                      {/* Room & Department Name */}
                      <div>
                        <h4 className="text-sm font-heading font-bold text-foreground group-hover:text-brand transition-colors">
                          {room.name}
                        </h4>
                        <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                          {room.department} Department
                        </p>
                      </div>

                      {/* Doctor on duty */}
                      {room.doctorName && (
                        <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-foreground font-medium">
                            <Stethoscope className="w-3.5 h-3.5 text-brand shrink-0" />
                            <span className="truncate">{room.doctorName}</span>
                          </div>
                          <span className="text-[10px] text-brand font-bold">In Room</span>
                        </div>
                      )}

                      {/* Destination Ribbon */}
                      {isDestination && (
                        <div className="mt-2.5 pt-2 border-t border-brand/20 flex items-center gap-1 text-[10px] font-bold text-brand uppercase tracking-wider">
                          <Sparkles className="w-3 h-3 text-brand" />
                          <span>Your Booked Room</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredFloorRooms.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  No rooms found matching "{searchQuery}". Try searching by department (e.g. Cardiology, Dermatology) or doctor name.
                </div>
              )}
            </div>
          </div>

          {/* ── Right 1 Column: Selected Room Details & Directions ─────── */}
          <div className="space-y-4">
            {selectedRoom ? (
              <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 sticky top-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand block mb-1">
                      Room Inspection Card
                    </span>
                    <h3 className="text-lg font-heading font-bold text-foreground">
                      {selectedRoom.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedRoom.number} · {selectedRoom.floorName} ({selectedRoom.wing})
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                    {selectedRoom.number}
                  </div>
                </div>

                {/* Assigned Doctor */}
                {selectedRoom.doctorName && (
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block mb-1">
                      Consulting Specialist
                    </span>
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Stethoscope className="w-4 h-4 text-brand" />
                      <span>{selectedRoom.doctorName}</span>
                    </div>
                  </div>
                )}

                {/* Walking Directions */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-brand" />
                    <span>How to Reach Here</span>
                  </h4>
                  <p className="text-xs text-foreground/90 bg-secondary/30 p-3 rounded-xl border border-border/50 leading-relaxed">
                    {selectedRoom.directions}
                  </p>
                </div>

                {/* Services / Treatments available in room */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Available In This Suite</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRoom.services.map((svc, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-md bg-secondary text-[10px] font-medium text-foreground border border-border/50"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Operating Timings */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand" />
                    <span>Outpatient Hours</span>
                  </div>
                  <span className="font-semibold text-foreground">09:00 AM – 05:00 PM</span>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-dashed border-border bg-card/40 text-center text-muted-foreground text-xs flex flex-col items-center justify-center min-h-[300px]">
                <MapPin className="w-10 h-10 text-muted-foreground/30 mb-2" />
                <p className="font-semibold text-foreground">Select Any Room on the Map</p>
                <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
                  Click on any consultation suite or procedure room to view its location, doctor on duty, and walking directions.
                </p>
              </div>
            )}

            {/* Emergency & Reception Help Card */}
            <div className="p-4 rounded-xl border border-border bg-secondary/30 flex items-start gap-3 text-xs">
              <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-foreground block mb-0.5">Need Wayfinding Assistance?</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Visit the Ground Floor Central Reception or ask any floor nurse coordinator wearing a blue MediSync lanyard.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground shrink-0">
          <span>MediSync Main Campus · Elevator Banks A & B operate continuously</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-foreground text-background font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
}
