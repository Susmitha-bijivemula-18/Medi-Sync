import { useEffect, useRef } from 'react';
import { loadAllAppointments, getPatientQueueStatus, getTodayDateString } from './queueStore';
import { getPatientRegisteredPhone } from './whatsapp';

/**
 * Automatically monitors patient queue progression and fires alerts when:
 * 1. The queue moves forward (patients ahead decreases).
 * 2. The patient's consultation is called into the doctor's room.
 *
 * Dispatches:
 * - OS Native Push Notifications (desktop & mobile)
 * - Physical Device Vibration (navigator.vibrate)
 * - Text-To-Speech announcement ("Token K-01, please proceed to Room 204")
 * - Acoustic Web Audio chime
 * - Local reactive notification feed entries
 */
export function useQueueAutoNotifier() {
  const prevRef = useRef<{
    patientsAhead: number | null;
    status: string | null;
    isCurrentTurn: boolean;
  }>({
    patientsAhead: null,
    status: null,
    isCurrentTurn: false,
  });

  // Request browser Notification permission on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  // Play pleasant acoustic chime using Web Audio API
  const playChime = (isUrgent: boolean = false) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const startTime = ctx.currentTime;
      const notes = isUrgent ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const t = startTime + idx * 0.14;
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(isUrgent ? 0.35 : 0.2, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    } catch {}
  };

  // Announce room calling via Text-to-Speech
  const speakAnnouncement = (text: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch {}
  };

  // Trigger OS-level notification and phone vibration
  const triggerNotification = (title: string, body: string, isUrgent: boolean = false) => {
    // 1. Phone Vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (isUrgent) {
          navigator.vibrate([400, 150, 400, 150, 400]);
        } else {
          navigator.vibrate([200, 100, 200]);
        }
      } catch {}
    }

    // 2. OS Native System Push Banner
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: isUrgent ? 'medisync-turn-now' : 'medisync-queue-advance',
            requireInteraction: isUrgent,
          });
        } catch {}
      }
    }

    // 3. Add to In-App Notification Feed
    try {
      const storageKey = 'caretrack_patient_notifications_v3';
      const raw = localStorage.getItem(storageKey);
      const list = raw ? JSON.parse(raw) : [];
      list.unshift({
        id: `auto-queue-${Date.now()}`,
        title,
        message: body,
        timestamp: 'Just now',
        type: 'queue',
        priority: isUrgent ? 'urgent' : 'high',
        actionLabel: 'Track Live Queue',
        actionUrl: '/patient/queue',
        read: false,
      });
      localStorage.setItem(storageKey, JSON.stringify(list.slice(0, 30)));
    } catch {}
  };

  useEffect(() => {
    const checkProgression = () => {
      const all = loadAllAppointments();
      const todayStr = getTodayDateString();
      const todayAppts = all.filter((a) => a.appointmentDate === todayStr);

      const active = todayAppts.find((a) => a.status === 'in-consultation') ||
                     todayAppts.find((a) => a.status === 'waiting') ||
                     todayAppts[0];

      if (!active || !active.tokenNumber) return;

      const queueStatus = getPatientQueueStatus(active.tokenNumber);
      const currentPatientsAhead = queueStatus.patientsAhead;
      const currentStatus = queueStatus.status;
      const isCurrentTurn = Boolean(queueStatus.isCurrentTurn);
      const doctor = active.doctorName.startsWith('Dr.') ? active.doctorName : `Dr. ${active.doctorName}`;
      const token = active.tokenNumber;

      const prev = prevRef.current;

      // First run: just initialize the baseline without noisy alerts
      if (prev.patientsAhead === null && prev.status === null) {
        prevRef.current = {
          patientsAhead: currentPatientsAhead,
          status: currentStatus,
          isCurrentTurn,
        };
        return;
      }

      // ── Trigger A: Consultation Reached / Called Now ─────────────────────
      const reachedTurn =
        (currentStatus === 'in-consultation' && prev.status !== 'in-consultation') ||
        (isCurrentTurn && !prev.isCurrentTurn);

      if (reachedTurn) {
        playChime(true);
        const title = `🚨 Your Turn Reached: Token ${token}`;
        const body = `${doctor} is calling you into the consultation room now! Please proceed inside.`;
        triggerNotification(title, body, true);
        speakAnnouncement(`Token ${token}, ${doctor} is calling you into the consultation room.`);

        // Dispatch direct background SMS to patient's phone number without opening browser tabs
        try {
          const phone = active.patientPhone || getPatientRegisteredPhone();
          fetch('/api/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone,
              message: `🚨 MediSync OPD: Token ${token} is being called NOW by ${doctor}. Please proceed to Room 204 immediately.`
            })
          }).catch(() => {});
        } catch {}

        prevRef.current = {
          patientsAhead: currentPatientsAhead,
          status: currentStatus,
          isCurrentTurn,
        };
        return;
      }

      // ── Trigger C: Consultation Completed ────────────────────────────────
      const isCompletedNow =
        (currentStatus === 'completed' || active.status === 'completed') &&
        prev.status !== 'completed' &&
        prev.status !== null;

      if (isCompletedNow) {
        playChime(false);
        const title = `✅ Consultation Completed: Token ${token}`;
        const body = `Your visit with ${doctor} is completed. Visit summary & digital prescription ready.`;
        triggerNotification(title, body, false);

        // Dispatch direct background SMS to patient's phone number without opening browser tabs
        try {
          const phone = active.patientPhone || getPatientRegisteredPhone();
          fetch('/api/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone,
              message: `🏥 MediSync OPD: Consultation completed with ${doctor} for Token ${token}. Your digital prescription & pass are ready.`
            })
          }).catch(() => {});
        } catch {}

        prevRef.current = {
          patientsAhead: currentPatientsAhead,
          status: currentStatus,
          isCurrentTurn,
        };
        return;
      }

      // ── Trigger B: Patients Moved Forward ────────────────────────────────
      if (
        prev.patientsAhead !== null &&
        currentPatientsAhead < prev.patientsAhead &&
        currentPatientsAhead >= 0 &&
        currentStatus === 'waiting'
      ) {
        playChime(false);

        if (currentPatientsAhead === 0) {
          const title = `🔔 You Are Next In Line: Token ${token}`;
          const body = `The patient ahead has finished. You are now next in line for ${doctor}.`;
          triggerNotification(title, body, false);
          speakAnnouncement(`Token ${token}, you are now next in line for ${doctor}.`);

          try {
            const phone = active.patientPhone || getPatientRegisteredPhone();
            fetch('/api/sms/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone,
                message: `🔔 MediSync OPD: Token ${token}, you are now NEXT IN LINE for ${doctor} (Room 204).`
              })
            }).catch(() => {});
          } catch {}
        } else {
          const title = `🔔 Queue Moved Forward: Token ${token}`;
          const body = `Patients moved ahead! You now have ${currentPatientsAhead} patient${currentPatientsAhead > 1 ? 's' : ''} ahead of you for ${doctor}.`;
          triggerNotification(title, body, false);

          try {
            const phone = active.patientPhone || getPatientRegisteredPhone();
            fetch('/api/sms/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone,
                message: `🔔 MediSync OPD: Queue moved forward! Token ${token}, you now have ${currentPatientsAhead} patient(s) ahead.`
              })
            }).catch(() => {});
          } catch {}
        }
      }

      prevRef.current = {
        patientsAhead: currentPatientsAhead,
        status: currentStatus,
        isCurrentTurn,
      };
    };

    // Run check on mount
    checkProgression();

    // Listen to real-time sync events from SSE / backend
    window.addEventListener('medisync:queue-update', checkProgression);
    window.addEventListener('caretrack:queue-update', checkProgression);

    // Heartbeat check every 3.5 seconds
    const interval = setInterval(checkProgression, 3500);

    return () => {
      window.removeEventListener('medisync:queue-update', checkProgression);
      window.removeEventListener('caretrack:queue-update', checkProgression);
      clearInterval(interval);
    };
  }, []);
}
