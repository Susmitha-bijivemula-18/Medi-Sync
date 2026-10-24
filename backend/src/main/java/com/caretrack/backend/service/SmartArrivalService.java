package com.caretrack.backend.service;

import com.caretrack.backend.dto.SmartArrivalDTO;
import com.caretrack.backend.entity.Appointment;
import com.caretrack.backend.entity.Doctor;
import com.caretrack.backend.repository.AppointmentRepository;
import com.caretrack.backend.repository.DoctorRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SmartArrivalService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private static final DateTimeFormatter TIME_FORMATTER_12H = DateTimeFormatter.ofPattern("hh:mm a");

    public SmartArrivalService(AppointmentRepository appointmentRepository, DoctorRepository doctorRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
    }

    public SmartArrivalDTO calculateSmartArrival(UUID appointmentId) {
        if (appointmentId == null) return null;
        Appointment appt = appointmentRepository.findById(appointmentId).orElse(null);
        if (appt == null) return null;
        return calculateSmartArrival(appt);
    }

    public SmartArrivalDTO calculateSmartArrival(Appointment appointment) {
        if (appointment == null) return null;

        SmartArrivalDTO dto = new SmartArrivalDTO();
        dto.setAppointmentId(appointment.getId());
        dto.setPatientName(appointment.getPatientName() != null ? appointment.getPatientName() : "Patient");
        dto.setTokenNumber(appointment.getTokenNumber() != null ? appointment.getTokenNumber() : "--");
        dto.setStatus(appointment.getStatus() != null ? appointment.getStatus() : "waiting");

        Doctor doctor = appointment.getDoctor();
        if (doctor == null && appointment.getId() != null) {
            // Reload appointment with doctor eagerly
            appointment = appointmentRepository.findById(appointment.getId()).orElse(appointment);
            doctor = appointment.getDoctor();
        }

        UUID doctorId = doctor != null ? doctor.getId() : null;
        String doctorName = doctor != null ? doctor.getFullName() : "Doctor";
        String specialization = doctor != null ? doctor.getSpecialization() : "General Medicine";
        int standardSlotMinutes = (doctor != null && doctor.getSlotDuration() != null) ? doctor.getSlotDuration() : 20;

        dto.setDoctorId(doctorId);
        dto.setDoctorName(doctorName);
        dto.setSpecialization(specialization);

        LocalDate apptDate = appointment.getAppointmentDate() != null ? appointment.getAppointmentDate() : LocalDate.now();
        dto.setAppointmentDate(apptDate.toString());
        dto.setAppointmentTime(appointment.getAppointmentTime() != null ? appointment.getAppointmentTime() : "10:00 AM");

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        boolean isToday = apptDate.isEqual(today);

        int travelDuration = appointment.getTravelDurationMinutes() != null ? appointment.getTravelDurationMinutes() : 30;
        int arrivalBufferMinutes = 15; // clinic standard triage & vitals buffer
        dto.setTravelDurationMinutes(travelDuration);
        dto.setArrivalBufferMinutes(arrivalBufferMinutes);

        LocalTime scheduledTime = parseTimeToLocalTime(appointment.getAppointmentTime());
        LocalTime clinicRequiredArrival = scheduledTime.minusMinutes(arrivalBufferMinutes);
        dto.setClinicRequiredArrivalTime(formatTime(clinicRequiredArrival));

        // Evaluate live queue for this doctor on the appointment date
        List<Appointment> doctorAppts = (doctorId != null) 
            ? appointmentRepository.findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(doctorId, apptDate)
            : Collections.emptyList();

        // 1. Calculate historical / live average consultation duration
        int avgConsultationMinutes = calculateAverageConsultationMinutes(doctorAppts, standardSlotMinutes);
        dto.setAvgConsultationMinutes(avgConsultationMinutes);

        // 2. Identify currently serving patient
        Appointment currentlyServing = doctorAppts.stream()
            .filter(a -> "in-consultation".equalsIgnoreCase(a.getStatus()))
            .findFirst()
            .orElse(null);
        dto.setCurrentlyServingToken(currentlyServing != null ? currentlyServing.getTokenNumber() : "--");

        // 3. Count patients ahead
        List<Appointment> waitingList = doctorAppts.stream()
            .filter(a -> "waiting".equalsIgnoreCase(a.getStatus()) || "scheduled".equalsIgnoreCase(a.getStatus()))
            .toList();

        int patientsAhead = 0;
        int queuePosition = 1;
        boolean foundInWaiting = false;

        for (int i = 0; i < waitingList.size(); i++) {
            Appointment wa = waitingList.get(i);
            if (wa.getId() != null && wa.getId().equals(appointment.getId())) {
                patientsAhead = i;
                queuePosition = i + 1;
                foundInWaiting = true;
                break;
            }
        }

        if (!foundInWaiting) {
            if ("in-consultation".equalsIgnoreCase(appointment.getStatus())) {
                patientsAhead = 0;
                queuePosition = 0;
            } else if ("completed".equalsIgnoreCase(appointment.getStatus())) {
                patientsAhead = 0;
                queuePosition = 0;
            } else {
                patientsAhead = waitingList.size();
                queuePosition = waitingList.size() + 1;
            }
        }

        dto.setPatientsAhead(patientsAhead);
        dto.setQueuePosition(queuePosition);

        // 4. In consultation or completed handling
        if ("in-consultation".equalsIgnoreCase(appointment.getStatus())) {
            dto.setDepartureStatus("IN_CONSULTATION");
            dto.setEstimatedDoctorReadyTime(formatTime(now));
            dto.setTargetArrivalTime(formatTime(now));
            dto.setDepartureWindowStart(formatTime(now));
            dto.setDepartureWindowEnd(formatTime(now));
            dto.setMinutesUntilDeparture(0);
            dto.setUncertaintyMinutes(0);
            dto.setReliability("HIGH");
            dto.setReliable(true);
            dto.setExplanation(String.format("You are currently in consultation with %s.", doctorName));
            dto.setClinicPolicyNotice("Active consultation in progress.");
            dto.setLastCalculatedAt(LocalDateTime.now().toString());
            return dto;
        }

        if ("completed".equalsIgnoreCase(appointment.getStatus())) {
            dto.setDepartureStatus("COMPLETED");
            dto.setEstimatedDoctorReadyTime(formatTime(scheduledTime));
            dto.setTargetArrivalTime(formatTime(clinicRequiredArrival));
            dto.setDepartureWindowStart(formatTime(clinicRequiredArrival.minusMinutes(travelDuration)));
            dto.setDepartureWindowEnd(formatTime(clinicRequiredArrival.minusMinutes(travelDuration)));
            dto.setMinutesUntilDeparture(0);
            dto.setUncertaintyMinutes(0);
            dto.setReliability("HIGH");
            dto.setReliable(true);
            dto.setExplanation(String.format("Consultation with %s has been completed.", doctorName));
            dto.setClinicPolicyNotice("Thank you for visiting MediSync Healthcare.");
            dto.setLastCalculatedAt(LocalDateTime.now().toString());
            return dto;
        }

        // 5. Future day appointments (not today)
        if (!isToday) {
            dto.setDepartureStatus("SCHEDULED_STANDBY");
            dto.setEstimatedDoctorReadyTime(formatTime(scheduledTime));
            dto.setTargetArrivalTime(formatTime(clinicRequiredArrival));

            LocalTime targetDeparture = clinicRequiredArrival.minusMinutes(travelDuration);
            dto.setDepartureWindowStart(formatTime(targetDeparture.minusMinutes(5)));
            dto.setDepartureWindowEnd(formatTime(targetDeparture.plusMinutes(5)));
            dto.setMinutesUntilDeparture(999);
            dto.setUncertaintyMinutes(15);
            dto.setReliability("INSUFFICIENT_DATA");
            dto.setReliable(false);
            dto.setExplanation(String.format("Your appointment is on %s. The live queue is not yet active. Please arrive by %s (15 min check-in buffer) on the day of your visit.",
                appointment.getAppointmentDate(), formatTime(clinicRequiredArrival)));
            dto.setClinicPolicyNotice("MediSync Safety Policy: Live Smart Arrival activates on the morning of your appointment once clinic check-ins open.");
            dto.setLastCalculatedAt(LocalDateTime.now().toString());
            return dto;
        }

        // 6. Active queue calculations for Today
        // Calculate remaining minutes for current consultation
        int currentRemainingMinutes = 0;
        if (currentlyServing != null) {
            int elapsed = calculateElapsedMinutesSinceCall(currentlyServing.getCalledAt(), now);
            currentRemainingMinutes = Math.max(3, avgConsultationMinutes - elapsed);
        }

        int waitMinutesFromNow = currentRemainingMinutes + (patientsAhead * avgConsultationMinutes);
        LocalTime estimatedDoctorReady = now.plusMinutes(waitMinutesFromNow);

        // Compare estimated ready time with scheduled slot to determine doctor schedule variance
        int scheduleDiff = (int) Duration.between(scheduledTime, estimatedDoctorReady).toMinutes();
        int doctorDelay = Math.max(0, scheduleDiff);
        dto.setDoctorDelayMinutes(doctorDelay);

        // Clinic safety arrival rule:
        // If doctor is running late by > 15 minutes, we adjust the target arrival time to estimatedReady minus arrival buffer,
        // but NEVER later than (estimatedReady - 10 min) to ensure the patient is safely present before doctor is ready.
        LocalTime targetArrival;
        if (doctorDelay >= 15) {
            targetArrival = estimatedDoctorReady.minusMinutes(arrivalBufferMinutes);
            // Safety cap: never recommend arriving after estimatedDoctorReady - 10 min
            if (targetArrival.isAfter(estimatedDoctorReady.minusMinutes(10))) {
                targetArrival = estimatedDoctorReady.minusMinutes(10);
            }
        } else {
            // On schedule or minor variance: always require standard clinic required arrival
            targetArrival = clinicRequiredArrival;
        }

        // Calculate Departure Window
        LocalTime recommendedDeparture = targetArrival.minusMinutes(travelDuration);
        LocalTime windowStart = recommendedDeparture.minusMinutes(5);
        LocalTime windowEnd = recommendedDeparture.plusMinutes(5);

        dto.setEstimatedDoctorReadyTime(formatTime(estimatedDoctorReady));
        dto.setTargetArrivalTime(formatTime(targetArrival));
        dto.setDepartureWindowStart(formatTime(windowStart));
        dto.setDepartureWindowEnd(formatTime(windowEnd));

        long minutesUntilDep = Duration.between(now, recommendedDeparture).toMinutes();
        dto.setMinutesUntilDeparture(minutesUntilDep);

        // Determine Departure Status Badge
        if (minutesUntilDep < -15) {
            dto.setDepartureStatus("ARRIVED"); // Likely already arrived or departed
        } else if (minutesUntilDep <= 0) {
            dto.setDepartureStatus("DEPART_NOW");
        } else if (minutesUntilDep <= 15) {
            dto.setDepartureStatus("LEAVE_SOON");
        } else if (minutesUntilDep <= 45) {
            dto.setDepartureStatus("ON_TRACK");
        } else {
            dto.setDepartureStatus("PLENTY_OF_TIME");
        }

        // Determine Uncertainty & Reliability Status
        int uncertainty;
        String reliability;
        boolean reliable;
        String explanation;

        if (doctorAppts.isEmpty() || (currentlyServing == null && waitingList.isEmpty())) {
            uncertainty = 15;
            reliability = "INSUFFICIENT_DATA";
            reliable = false;
            explanation = String.format("Live clinic queue is initializing. Scheduled for %s. Please arrive at the clinic by %s (%d min check-in buffer).",
                appointment.getAppointmentTime(), formatTime(clinicRequiredArrival), arrivalBufferMinutes);
        } else if (patientsAhead <= 1) {
            uncertainty = 5;
            reliability = "HIGH";
            reliable = true;
            if (doctorDelay >= 15) {
                explanation = String.format("%s is currently running %d mins behind schedule. You have %d patient ahead. Recommended departure is %s – %s.",
                    doctorName, doctorDelay, patientsAhead, formatTime(windowStart), formatTime(windowEnd));
            } else {
                explanation = String.format("%s is on schedule. You have %d patient ahead. Departure recommended between %s and %s for timely check-in.",
                    doctorName, patientsAhead, formatTime(windowStart), formatTime(windowEnd));
            }
        } else if (patientsAhead <= 4) {
            uncertainty = 8;
            reliability = "HIGH";
            reliable = true;
            if (doctorDelay >= 15) {
                explanation = String.format("Dr. is running ~%d mins behind with %d patients ahead of Token %s. Recommended departure: %s – %s.",
                    doctorDelay, patientsAhead, appointment.getTokenNumber(), formatTime(windowStart), formatTime(windowEnd));
            } else {
                explanation = String.format("Queue is moving steadily with %d patients ahead of Token %s. Recommended departure: %s – %s.",
                    patientsAhead, appointment.getTokenNumber(), formatTime(windowStart), formatTime(windowEnd));
            }
        } else {
            uncertainty = 12;
            reliability = "MEDIUM";
            reliable = true;
            explanation = String.format("Queue is busy with %d patients ahead. Expected doctor ready time is %s (±%d min). Departure window: %s – %s.",
                patientsAhead, formatTime(estimatedDoctorReady), uncertainty, formatTime(windowStart), formatTime(windowEnd));
        }

        dto.setUncertaintyMinutes(uncertainty);
        dto.setReliability(reliability);
        dto.setReliable(reliable);
        dto.setExplanation(explanation);
        dto.setClinicPolicyNotice("MediSync Safety Policy: Recommended departure times are dynamic estimates based on live queue pacing. Clinical triage & emergency cases always take priority. Please arrive at least 15 minutes before your consultation.");
        dto.setLastCalculatedAt(LocalDateTime.now().toString());

        return dto;
    }

    private int calculateAverageConsultationMinutes(List<Appointment> appts, int fallback) {
        if (appts == null || appts.isEmpty()) return fallback;

        List<Integer> durations = new ArrayList<>();
        for (Appointment a : appts) {
            if ("completed".equalsIgnoreCase(a.getStatus()) && a.getCalledAt() != null && a.getCompletedAt() != null) {
                try {
                    LocalTime called = parseTimeToLocalTime(a.getCalledAt());
                    LocalTime completed = parseTimeToLocalTime(a.getCompletedAt());
                    int diff = (int) Duration.between(called, completed).toMinutes();
                    if (diff >= 4 && diff <= 60) {
                        durations.add(diff);
                    }
                } catch (Exception ignored) {}
            }
        }

        if (durations.isEmpty()) return fallback;
        int sum = 0;
        for (int d : durations) sum += d;
        return Math.max(10, Math.min(45, sum / durations.size()));
    }

    private int calculateElapsedMinutesSinceCall(String calledAtStr, LocalTime now) {
        if (calledAtStr == null || calledAtStr.isBlank()) return 5;
        try {
            LocalTime called = parseTimeToLocalTime(calledAtStr);
            int elapsed = (int) Duration.between(called, now).toMinutes();
            return Math.max(0, Math.min(60, elapsed));
        } catch (Exception e) {
            return 5;
        }
    }

    public static LocalTime parseTimeToLocalTime(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return LocalTime.of(10, 0);
        try {
            String clean = timeStr.trim().toUpperCase();
            Pattern p = Pattern.compile("^(\\d{1,2}):(\\d{2})(?::\\d{2})?\\s*(AM|PM)?$");
            Matcher m = p.matcher(clean);
            if (m.matches()) {
                int hours = Integer.parseInt(m.group(1));
                int minutes = Integer.parseInt(m.group(2));
                String meridiem = m.group(3);
                if ("PM".equalsIgnoreCase(meridiem) && hours < 12) {
                    hours += 12;
                } else if ("AM".equalsIgnoreCase(meridiem) && hours == 12) {
                    hours = 0;
                }
                return LocalTime.of(Math.min(23, Math.max(0, hours)), Math.min(59, Math.max(0, minutes)));
            }
        } catch (Exception ignored) {}
        return LocalTime.of(10, 0);
    }

    public static String formatTime(LocalTime time) {
        if (time == null) return "--";
        return time.format(TIME_FORMATTER_12H);
    }
}
