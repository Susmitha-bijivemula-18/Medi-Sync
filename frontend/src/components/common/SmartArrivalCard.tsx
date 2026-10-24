import { useState, useEffect, useTransition } from 'react';
import { 
  Navigation, 
  Clock, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Edit3, 
  Car, 
  Users, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  type QueueAppointment, 
  calculateLocalSmartArrival, 
  updateAppointmentTravelDuration,
  checkAndTriggerSmartArrivalAlert
} from '../../lib/queueStore';
import { 
  fetchSmartArrival, 
  type SmartArrivalData 
} from '../../lib/supabase';

interface SmartArrivalCardProps {
  appointment: QueueAppointment;
  queueState?: {
    patientsAhead?: number;
    estimatedWait?: number;
    currentToken?: string;
    isCurrentTurn?: boolean;
    clinicStatus?: string;
  } | null;
  onRefresh?: () => void;
  className?: string;
}

const PRESET_DURATIONS = [15, 20, 30, 45, 60];

export function SmartArrivalCard({
  appointment,
  queueState,
  onRefresh,
  className = '',
}: SmartArrivalCardProps) {
  const [data, setData] = useState<SmartArrivalData>(() => 
    calculateLocalSmartArrival(appointment, queueState)
  );
  const [isEditingTravel, setIsEditingTravel] = useState(false);
  const [customTravel, setCustomTravel] = useState(String(appointment.travelDurationMinutes || 30));
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [isPending, startTransition] = useTransition();

  // Sync from backend or calculate locally
  const syncSmartArrival = async () => {
    if (!appointment.id) return;
    try {
      const serverData = await fetchSmartArrival(appointment.id);
      if (serverData) {
        startTransition(() => {
          setData(serverData);
          setLastSynced(new Date());
        });
        checkAndTriggerSmartArrivalAlert(serverData);
        return;
      }
    } catch {}

    const localData = calculateLocalSmartArrival(appointment, queueState);
    startTransition(() => {
      setData(localData);
      setLastSynced(new Date());
    });
    checkAndTriggerSmartArrivalAlert(localData);
  };

  useEffect(() => {
    syncSmartArrival();

    const handleUpdate = () => syncSmartArrival();
    window.addEventListener('medisync:queue-update', handleUpdate);
    window.addEventListener('caretrack:queue-update', handleUpdate);

    // Heartbeat sync every 30 seconds
    const interval = setInterval(syncSmartArrival, 30000);

    return () => {
      window.removeEventListener('medisync:queue-update', handleUpdate);
      window.removeEventListener('caretrack:queue-update', handleUpdate);
      clearInterval(interval);
    };
  }, [appointment.id, appointment.status, appointment.travelDurationMinutes, queueState?.currentToken, queueState?.patientsAhead]);

  const handleSetTravelDuration = async (minutes: number) => {
    if (minutes < 5 || minutes > 240) return;
    setIsUpdating(true);
    setCustomTravel(String(minutes));
    setIsEditingTravel(false);

    // Optimistic local update
    const optimistic = calculateLocalSmartArrival(appointment, queueState, minutes);
    setData(optimistic);

    try {
      const updated = await updateAppointmentTravelDuration(appointment.id, minutes);
      if (updated) {
        setData(updated);
        setLastSynced(new Date());
      }
    } finally {
      setIsUpdating(false);
      if (onRefresh) onRefresh();
    }
  };

  const getStatusBadge = () => {
    switch (data.departureStatus) {
      case 'DEPART_NOW':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Depart Now
          </span>
        );
      case 'LEAVE_SOON':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            Leave in {Math.max(1, data.minutesUntilDeparture)} min
          </span>
        );
      case 'ON_TRACK':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            On Track ({Math.max(1, data.minutesUntilDeparture)}m to departure)
          </span>
        );
      case 'PLENTY_OF_TIME':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-500 dark:text-blue-400 border border-blue-500/30">
            <Clock className="w-3.5 h-3.5" />
            Scheduled Standby
          </span>
        );
      case 'IN_CONSULTATION':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-500 dark:text-purple-400 border border-purple-500/30">
            <Users className="w-3.5 h-3.5" />
            In Consultation
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Completed
          </span>
        );
      case 'ARRIVED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30">
            <MapPin className="w-3.5 h-3.5" />
            Arrived at Clinic
          </span>
        );
      case 'SCHEDULED_STANDBY':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
            <Clock className="w-3.5 h-3.5" />
            Upcoming Visit
          </span>
        );
    }
  };

  const getReliabilityBadge = () => {
    switch (data.reliability) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            High Confidence (Live Queue Active)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Moderate Confidence (Dynamic Pacing)
          </span>
        );
      case 'INSUFFICIENT_DATA':
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Standby (Pending Clinic Opening)
          </span>
        );
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-card via-card to-blue-500/5 shadow-md p-5 sm:p-6 transition-all duration-200 ${className}`}>
      {/* Decorative ambient aura */}
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-xs">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground text-base tracking-tight flex items-center gap-1.5">
                MediSync Smart Arrival
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-500/20 text-blue-600 dark:text-blue-300">
                  Live
                </span>
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Personalized departure window based on live doctor pacing and travel time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            Updated {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {getStatusBadge()}
          <button
            onClick={syncSmartArrival}
            title="Refresh Smart Arrival calculation"
            className="p-1.5 rounded-lg border border-border bg-card/80 text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Departure Banner */}
      <div className="mt-4 p-4 sm:p-5 rounded-xl border border-blue-500/25 bg-blue-500/10 dark:bg-blue-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[11px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Recommended Departure Window
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {data.departureWindowStart} – {data.departureWindowEnd}
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            Target hospital arrival:{' '}
            <strong className="text-foreground font-semibold">{data.targetArrivalTime}</strong>
            <span className="text-muted-foreground/60">•</span>
            Includes {data.arrivalBufferMinutes}m check-in buffer
          </p>
        </div>

        {/* Confidence & Token pill */}
        <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-blue-500/20">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">Your Token</span>
            <span className="text-lg font-black font-mono text-foreground">
              {data.tokenNumber || appointment.tokenNumber || '--'}
            </span>
          </div>
          {getReliabilityBadge()}
        </div>
      </div>

      {/* Grid of Key Factors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        {/* Factor 1: Queue Position */}
        <div className="p-3 rounded-xl border border-border bg-card/50 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            Queue Position
          </span>
          <div className="mt-1">
            <span className="text-base font-bold text-foreground">
              {data.patientsAhead === 0 ? 'Next Turn' : `${data.patientsAhead} Ahead`}
            </span>
            <span className="block text-[11px] text-muted-foreground truncate">
              Serving: <strong className="text-foreground">{data.currentlyServingToken || '--'}</strong>
            </span>
          </div>
        </div>

        {/* Factor 2: Est. Doctor Ready */}
        <div className="p-3 rounded-xl border border-border bg-card/50 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            Doctor Ready
          </span>
          <div className="mt-1">
            <span className="text-base font-bold text-foreground">
              {data.estimatedDoctorReadyTime}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Uncertainty: ±{data.uncertaintyMinutes}m
            </span>
          </div>
        </div>

        {/* Factor 3: Travel Duration (Interactive) */}
        <div className="p-3 rounded-xl border border-border bg-card/50 flex flex-col justify-between relative group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-amber-500" />
              Travel Duration
            </span>
            <button
              onClick={() => setIsEditingTravel(!isEditingTravel)}
              className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 rounded transition-colors"
              title="Edit travel duration"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
          <div className="mt-1">
            <span className="text-base font-bold text-foreground flex items-center gap-1">
              {data.travelDurationMinutes} min
            </span>
            <span className="block text-[11px] text-muted-foreground">
              Patient estimate
            </span>
          </div>
        </div>

        {/* Factor 4: Clinic Required Arrival */}
        <div className="p-3 rounded-xl border border-border bg-card/50 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            Clinic Check-in
          </span>
          <div className="mt-1">
            <span className="text-base font-bold text-foreground">
              {data.clinicRequiredArrivalTime}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              15 min before slot
            </span>
          </div>
        </div>
      </div>

      {/* Travel Duration Quick Editor (Expands when clicked) */}
      {isEditingTravel && (
        <div className="mt-4 p-4 rounded-xl border border-border bg-secondary/40 space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Car className="w-4 h-4 text-amber-500" />
              Adjust Your Travel Duration (minutes)
            </span>
            <button
              onClick={() => setIsEditingTravel(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            No GPS permissions required. Select how long it usually takes you to commute to the hospital:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {PRESET_DURATIONS.map((preset) => (
              <button
                key={preset}
                disabled={isUpdating}
                onClick={() => handleSetTravelDuration(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  data.travelDurationMinutes === preset
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-card border-border text-foreground hover:bg-secondary'
                }`}
              >
                {preset} mins
              </button>
            ))}

            <div className="flex items-center gap-1.5 ml-auto">
              <input
                type="number"
                min="5"
                max="240"
                value={customTravel}
                onChange={(e) => setCustomTravel(e.target.value)}
                className="w-16 px-2.5 py-1 text-xs rounded-lg border border-border bg-card text-foreground font-mono focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                placeholder="Custom"
              />
              <button
                disabled={isUpdating || !customTravel}
                onClick={() => handleSetTravelDuration(parseInt(customTravel, 10))}
                className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explainable Insights Box */}
      <div className="mt-4 p-3.5 rounded-xl border border-border/80 bg-secondary/30 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <p className="font-semibold text-foreground">
            {data.explanation || 'Calculating real-time queue pacing...'}
          </p>
          <p className="text-[11px] text-muted-foreground leading-normal">
            {data.clinicPolicyNotice}
          </p>
        </div>
      </div>

      {/* Doctor Delay Warning if Doctor is delayed */}
      {data.doctorDelayMinutes >= 15 && (
        <div className="mt-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-2.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <p className="leading-snug">
            <strong>Schedule Notice:</strong> {data.doctorName} is running approximately {data.doctorDelayMinutes} minutes behind schedule. Your departure window has been adjusted so you do not have to wait in the physical waiting area.
          </p>
        </div>
      )}
    </div>
  );
}
