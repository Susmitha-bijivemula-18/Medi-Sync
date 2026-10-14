import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star,
  CheckCircle, ArrowRight, AlertCircle, Clock
} from 'lucide-react';
import { fetchDoctorById, createAppointment, fetchAvailableSlots } from '../lib/supabase';
import { mockDoctors } from '../lib/doctors';
import { recordNewBooking, syncQueueFromBackend } from '../lib/queueStore';

type Step = 'date' | 'time' | 'details' | 'confirm' | 'success';

export function AppointmentForm() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [currentStep, setCurrentStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [tokenNumber, setTokenNumber] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Patient inputs
  const [patientName, setPatientName] = useState('Siddharth Verma');
  const [patientAge, setPatientAge] = useState<number>(32);
  const [patientPhone, setPatientPhone] = useState('+91 98888 77777');
  const [patientEmail, setPatientEmail] = useState('sid.verma@example.com');
  const [problemDescription, setProblemDescription] = useState('Cardiology follow-up & general health check');

  // Slots state
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Generate realistic dates
  const dates = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day3 = new Date(today);
    day3.setDate(day3.getDate() + 2);
    const day4 = new Date(today);
    day4.setDate(day4.getDate() + 3);

    return [
      { id: today.toISOString().split('T')[0], label: 'Today', day: today.toLocaleDateString('en-US', { weekday: 'short' }), date: today.getDate() },
      { id: tomorrow.toISOString().split('T')[0], label: 'Tomorrow', day: tomorrow.toLocaleDateString('en-US', { weekday: 'short' }), date: tomorrow.getDate() },
      { id: day3.toISOString().split('T')[0], label: day3.toLocaleDateString('en-US', { weekday: 'long' }), day: day3.toLocaleDateString('en-US', { weekday: 'short' }), date: day3.getDate() },
      { id: day4.toISOString().split('T')[0], label: day4.toLocaleDateString('en-US', { weekday: 'long' }), day: day4.toLocaleDateString('en-US', { weekday: 'short' }), date: day4.getDate() },
    ];
  }, []);

  const loadDoctor = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchDoctorById(id);
      if (data) {
        const match = mockDoctors.find(m => m.full_name === data.full_name || m.id === data.id);
        setDoctor(match ? { ...match, ...data, id: data.id } : { ...data, rating: '4.8', availableStatus: 'Available today' });
      } else {
        const fallback = mockDoctors.find(d => d.id === id);
        setDoctor(fallback || mockDoctors[0]);
      }
    } catch {
      const fallback = mockDoctors.find(d => d.id === id);
      setDoctor(fallback || mockDoctors[0]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (doctorId) {
      loadDoctor(doctorId);
    }
  }, [doctorId, loadDoctor]);

  // Load available slots whenever date or doctor changes
  useEffect(() => {
    if (doctorId && selectedDate) {
      setLoadingSlots(true);
      fetchAvailableSlots(doctorId, selectedDate)
        .then((data) => {
          if (data && data.length > 0) {
            setAvailableSlots(data);
          } else {
            // Default slots if doctor has standard operating hours
            setAvailableSlots([
              { time: '09:00 AM', available: true },
              { time: '09:20 AM', available: true },
              { time: '09:40 AM', available: true },
              { time: '10:00 AM', available: false },
              { time: '10:20 AM', available: false },
              { time: '10:40 AM', available: true },
              { time: '11:00 AM', available: true },
              { time: '11:20 AM', available: true },
              { time: '11:40 AM', available: true },
              { time: '02:30 PM', available: true },
              { time: '03:00 PM', available: true },
              { time: '03:30 PM', available: true },
            ]);
          }
        })
        .catch(() => {
          setAvailableSlots([
            { time: '09:00 AM', available: true },
            { time: '09:30 AM', available: true },
            { time: '10:00 AM', available: false },
            { time: '11:00 AM', available: true },
            { time: '11:30 AM', available: true },
            { time: '02:30 PM', available: true },
            { time: '03:00 PM', available: true },
          ]);
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [doctorId, selectedDate]);

  async function handleConfirm() {
    if (!doctor || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setBookingError(null);

    try {
      // 1. Persist directly to backend database
      const result = await createAppointment({
        patient_name: patientName,
        patient_age: Number(patientAge) || 30,
        patient_email: patientEmail,
        patient_phone: patientPhone,
        problem_description: problemDescription,
        problem_category: doctor.specialization,
        doctor_id: String(doctor.id),
        appointment_date: selectedDate,
        appointment_time: selectedTime,
      });

      if (result) {
        setTokenNumber(result.tokenNumber);

        // 2. Synchronize shared queueStore
        recordNewBooking({
          id: result.id,
          patientName,
          patientAge: Number(patientAge) || 30,
          patientEmail,
          patientPhone,
          doctorId: String(doctor.id),
          doctorName: doctor.full_name,
          specialization: doctor.specialization,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          problemDescription,
          problemCategory: doctor.specialization,
          tokenNumber: result.tokenNumber,
        });

        syncQueueFromBackend(String(doctor.id));
        setCurrentStep('success');
      } else {
        throw new Error('Failed to create appointment on the backend');
      }
    } catch (err: any) {
      console.error('Booking confirmation failed', err);
      setBookingError(err.message || 'Selected time slot could not be reserved. Please try another time.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-border border-t-brand animate-spin" />
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-foreground">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (currentStep === 'success') navigate('/');
                else if (currentStep === 'confirm') setCurrentStep('details');
                else if (currentStep === 'details') setCurrentStep('time');
                else if (currentStep === 'time') setCurrentStep('date');
                else navigate('/book-appointment');
              }}
              className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-brand">Appointment Booking</span>
              <h1 className="text-lg font-heading font-semibold text-foreground">
                {currentStep === 'success' ? 'Confirmation' : `Book with ${doctor.full_name}`}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        
        {/* Error notification banner */}
        {bookingError && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{bookingError}</span>
          </div>
        )}

        {/* ── Doctor Profile Snapshot ─────────────────────────────────── */}
        {currentStep !== 'success' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 mb-8 flex items-center gap-5 shadow-xs">
            <img src={doctor.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&q=80'} alt={doctor.full_name} className="w-16 h-16 rounded-full object-cover border border-border flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold tracking-wider uppercase text-brand">{doctor.specialization}</span>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{doctor.rating || '4.9'}</span>
                </div>
              </div>
              <h2 className="text-lg font-heading font-semibold text-foreground truncate">{doctor.full_name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{doctor.qualification || 'MBBS, MD'} · {doctor.experience_years || 15} Years Experience</p>
            </div>
            <div className="text-right border-l border-border pl-5 hidden sm:block">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground block">Consultation</span>
              <span className="text-lg font-bold text-foreground">₹{doctor.consultation_fee || 800}</span>
            </div>
          </motion.div>
        )}

        {/* ── Dynamic Steps ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          
          {/* STEP 1: Date Selection */}
          {currentStep === 'date' && (
            <motion.div key="date" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h3 className="text-lg font-heading font-semibold mb-4">Select Consultation Date</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {dates.map((d) => {
                  const isSelected = selectedDate === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDate(d.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-brand bg-brand/5 text-brand shadow-xs' 
                          : 'border-border bg-card text-foreground hover:border-brand/30 hover:bg-secondary/50'
                      }`}
                    >
                      <span className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${isSelected ? 'text-brand' : 'text-muted-foreground'}`}>
                        {d.label}
                      </span>
                      <span className="text-2xl font-heading font-semibold mb-1">{d.date}</span>
                      <span className={`text-xs font-medium ${isSelected ? 'text-brand' : 'text-muted-foreground'}`}>
                        {d.day}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep('time')}
                  disabled={!selectedDate}
                  className="px-8 py-3.5 bg-foreground text-background rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-foreground/90 transition-all flex items-center gap-2 cursor-pointer"
                >
                  Continue to Slot Time
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Time Selection */}
          {currentStep === 'time' && (
            <motion.div key="time" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-heading font-semibold">Select Available Slot</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Live schedule for {dates.find(d => d.id === selectedDate)?.label} ({selectedDate})
                  </p>
                </div>
                {loadingSlots && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    Checking slots...
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {availableSlots.map((slot) => {
                  const isSelected = selectedTime === slot.time;
                  const isAvailable = slot.available;
                  return (
                    <button
                      key={slot.time}
                      disabled={!isAvailable}
                      onClick={() => isAvailable && setSelectedTime(slot.time)}
                      className={`py-3 px-3 rounded-xl text-xs font-semibold border-2 transition-all text-center flex flex-col items-center justify-center gap-1 ${
                        !isAvailable
                          ? 'border-border/40 bg-secondary/20 text-muted-foreground/50 cursor-not-allowed line-through'
                          : isSelected
                          ? 'border-brand bg-brand text-white shadow-xs cursor-pointer'
                          : 'border-border bg-card text-foreground hover:border-brand/40 hover:bg-secondary/40 cursor-pointer'
                      }`}
                    >
                      <span>{slot.time}</span>
                      <span className={`text-[10px] font-normal ${isSelected ? 'text-white/90' : isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/60'}`}>
                        {isAvailable ? 'Available' : 'Booked'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setCurrentStep('details')}
                  disabled={!selectedTime}
                  className="px-8 py-3.5 bg-foreground text-background rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-foreground/90 transition-all flex items-center gap-2 cursor-pointer"
                >
                  Enter Patient Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Patient Information Form */}
          {currentStep === 'details' && (
            <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h3 className="text-lg font-heading font-semibold mb-2">Patient Details</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Provide patient information for official hospital queue tracking and token assignment.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Patient Name</label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Patient Age</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Email Address</label>
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Reason for Consultation / Symptoms</label>
                <textarea
                  rows={2}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describe your current discomfort or reason for consulting the doctor..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep('confirm')}
                  disabled={!patientName || !patientPhone}
                  className="px-8 py-3.5 bg-foreground text-background rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-foreground/90 transition-all flex items-center gap-2 cursor-pointer"
                >
                  Review & Confirm
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Confirm Booking */}
          {currentStep === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h3 className="text-lg font-heading font-semibold mb-6">Review & Confirm Appointment</h3>
              
              <div className="bg-card border border-border rounded-xl overflow-hidden mb-8 shadow-xs">
                <div className="p-5 border-b border-border bg-secondary/30">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-1 block">Scheduled Encounter</span>
                  <div className="text-lg font-heading font-semibold text-foreground">
                    {dates.find(d => d.id === selectedDate)?.label}, {selectedDate} at {selectedTime}
                  </div>
                </div>
                <div className="p-5 space-y-3 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="font-medium text-muted-foreground">Consulting Doctor</span>
                    <span className="font-semibold text-foreground">{doctor.full_name} ({doctor.specialization})</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="font-medium text-muted-foreground">Patient Name</span>
                    <span className="font-semibold text-foreground">{patientName} ({patientAge} yrs)</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="font-medium text-muted-foreground">Contact</span>
                    <span className="font-semibold text-foreground">{patientPhone} · {patientEmail}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="font-medium text-muted-foreground">Chief Concern</span>
                    <span className="font-semibold text-foreground truncate max-w-xs">{problemDescription}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-medium text-foreground">Consultation Fee</span>
                    <span className="text-base font-bold text-foreground">₹{doctor.consultation_fee || 800}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="w-full sm:w-auto px-10 py-4 bg-brand text-white rounded-xl font-semibold text-sm disabled:opacity-70 disabled:cursor-not-allowed hover:bg-brand/90 transition-all flex justify-center items-center gap-2 shadow-md cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Reserving Slot & Issuing Token...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Confirm & Generate Token</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Success & Token Generated */}
          {currentStep === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-heading font-semibold mb-2">Appointment Confirmed!</h2>
              <p className="text-foreground/70 mb-8">Your visit has been recorded in the hospital management system.</p>

              <div className="bg-card border border-border rounded-2xl p-8 max-w-md mx-auto mb-8 shadow-xs">
                <div className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2">Your Live Queue Token</div>
                <div className="text-5xl font-heading font-bold text-brand mb-6">{tokenNumber}</div>
                
                <div className="grid grid-cols-2 gap-4 text-left border-t border-border pt-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Date</div>
                    <div className="font-semibold text-foreground text-sm">{selectedDate}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Time Slot</div>
                    <div className="font-semibold text-foreground text-sm">{selectedTime}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Doctor</div>
                    <div className="font-semibold text-foreground text-sm">{doctor.full_name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Status</div>
                    <div className="font-semibold text-emerald-600 text-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Queued & Active
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-card border border-border text-foreground rounded-xl font-semibold text-sm hover:bg-secondary transition-all cursor-pointer"
                >
                  Back to Home
                </button>
                <button
                  onClick={() => navigate(`/patient/queue?token=${tokenNumber}`)}
                  className="w-full sm:w-auto px-8 py-3.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-brand/90 transition-all shadow-sm cursor-pointer"
                >
                  Track My Queue Live
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
