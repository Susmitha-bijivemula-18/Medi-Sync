package com.caretrack.backend.controller;

import com.caretrack.backend.entity.Appointment;
import com.caretrack.backend.entity.Doctor;
import com.caretrack.backend.repository.AppointmentRepository;
import com.caretrack.backend.repository.DoctorRepository;
import com.caretrack.backend.service.QueueNotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"}, allowCredentials = "true")
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final QueueNotificationService queueNotificationService;

    public AppointmentController(
            AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository,
            QueueNotificationService queueNotificationService) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.queueNotificationService = queueNotificationService;
    }

    private UUID resolveDoctorId(String doctorIdStr) {
        if (doctorIdStr == null || doctorIdStr.isBlank()) {
            List<Doctor> all = doctorRepository.findAll();
            return all.isEmpty() ? null : all.get(0).getId();
        }
        try {
            return UUID.fromString(doctorIdStr);
        } catch (Exception e) {
            List<Doctor> docs = doctorRepository.findAll();
            if (docs.isEmpty()) return null;
            try {
                int idx = Integer.parseInt(doctorIdStr);
                if (idx >= 1 && idx <= docs.size()) {
                    if (idx == 1) {
                        return docs.stream().filter(d -> d.getFullName().contains("Ananya")).findFirst().map(Doctor::getId).orElse(docs.get(0).getId());
                    }
                    return docs.get(idx - 1).getId();
                }
            } catch (NumberFormatException ignored) {}

            return docs.stream()
                .filter(d -> d.getFullName().toLowerCase().contains(doctorIdStr.toLowerCase()) || 
                             d.getSpecialization().toLowerCase().contains(doctorIdStr.toLowerCase()))
                .findFirst()
                .map(Doctor::getId)
                .orElse(docs.get(0).getId());
        }
    }

    // ─── Real-Time Server-Sent Events (SSE) Stream ───────────────────────────
    @GetMapping(value = "/queue/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamQueueUpdates() {
        return queueNotificationService.createEmitter();
    }

    // ─── 1. Get All Appointments ─────────────────────────────────────────────
    @GetMapping("/appointments")
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAllByOrderByCreatedAtDesc();
    }

    // ─── 2. Create Appointment (Patient Booking with Validation & Anti-Double-Booking)
    @PostMapping("/appointments")
    public ResponseEntity<?> createAppointment(@RequestBody Map<String, Object> payload) {
        String docIdStr = null;
        if (payload.get("doctor") instanceof Map) {
            Map<?, ?> docMap = (Map<?, ?>) payload.get("doctor");
            if (docMap.get("id") != null) docIdStr = docMap.get("id").toString();
        } else if (payload.get("doctorId") != null) {
            docIdStr = payload.get("doctorId").toString();
        } else if (payload.get("doctor_id") != null) {
            docIdStr = payload.get("doctor_id").toString();
        }

        if (docIdStr == null || docIdStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Doctor ID is required"));
        }

        UUID resolvedDocId = resolveDoctorId(docIdStr);
        if (resolvedDocId == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Selected doctor not found"));
        }

        Optional<Doctor> doctorOpt = doctorRepository.findById(resolvedDocId);
        if (doctorOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Selected doctor not found"));
        }

        Doctor doctor = doctorOpt.get();
        Appointment appointment = new Appointment();
        appointment.setDoctor(doctor);
        appointment.setPatientName(payload.get("patientName") != null ? payload.get("patientName").toString() : "Patient");
        
        int age = 30;
        if (payload.get("patientAge") != null) {
            try {
                age = Integer.parseInt(payload.get("patientAge").toString());
            } catch (Exception ignored) {}
        }
        appointment.setPatientAge(age);

        appointment.setPatientEmail(payload.get("patientEmail") != null ? payload.get("patientEmail").toString() : "");
        appointment.setPatientPhone(payload.get("patientPhone") != null ? payload.get("patientPhone").toString() : "");
        appointment.setBloodGroup(payload.get("bloodGroup") != null ? payload.get("bloodGroup").toString() : (payload.get("blood_group") != null ? payload.get("blood_group").toString() : ""));
        appointment.setLocation(payload.get("location") != null ? payload.get("location").toString() : "");
        appointment.setProblemDescription(payload.get("problemDescription") != null ? payload.get("problemDescription").toString() : "");
        appointment.setProblemCategory(payload.get("problemCategory") != null ? payload.get("problemCategory").toString() : doctor.getSpecialization());

        LocalDate appointmentDate = LocalDate.now();
        if (payload.get("appointmentDate") != null && !payload.get("appointmentDate").toString().isBlank()) {
            try {
                appointmentDate = LocalDate.parse(payload.get("appointmentDate").toString());
            } catch (Exception ignored) {}
        }
        appointment.setAppointmentDate(appointmentDate);

        String appointmentTime = "10:00 AM";
        if (payload.get("appointmentTime") != null && !payload.get("appointmentTime").toString().isBlank()) {
            appointmentTime = payload.get("appointmentTime").toString().trim().toUpperCase();
        }
        appointment.setAppointmentTime(appointmentTime);

        // Check if doctor is on leave on this date
        if (doctor.getOnLeaveDates() != null && doctor.getOnLeaveDates().contains(appointment.getAppointmentDate().toString())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of("message", "Doctor is on leave on the selected date. Please choose another date.")
            );
        }

        // Check for double-booking on the exact same date & time for this doctor (excluding cancelled)
        List<Appointment> existingBookings = appointmentRepository
            .findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(
                doctor.getId(),
                appointment.getAppointmentDate()
            );

        boolean isDoubleBooked = existingBookings.stream().anyMatch(a ->
            !"cancelled".equalsIgnoreCase(a.getStatus()) &&
            a.getAppointmentTime() != null &&
            a.getAppointmentTime().trim().equalsIgnoreCase(appointment.getAppointmentTime().trim())
        );

        if (isDoubleBooked) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of("message", "Selected time slot is already booked. Please choose an alternative slot.")
            );
        }

        // Generate unique token number (e.g. A-28)
        char prefix = (char) ('A' + (Math.abs(doctor.getFullName().hashCode()) % 26));
        long countToday = existingBookings.size() + 1;
        String tokenNumber = String.format("%c-%02d", prefix, countToday);
        appointment.setTokenNumber(tokenNumber);

        appointment.setStatus("waiting");
        appointment.setQueueStatus("waiting");

        Appointment saved = appointmentRepository.save(appointment);

        // Broadcast SSE real-time update to both Doctor and Patient portals
        queueNotificationService.broadcastQueueUpdate("queue-update", Map.of(
            "action", "NEW_BOOKING",
            "doctorId", doctor.getId().toString(),
            "appointmentId", saved.getId().toString(),
            "tokenNumber", saved.getTokenNumber(),
            "patientName", saved.getPatientName()
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ─── 3. Doctor Appointments & Queue Queries ──────────────────────────────

    @GetMapping("/appointments/doctor/{doctorId}")
    public ResponseEntity<?> getDoctorAppointments(@PathVariable String doctorId) {
        UUID docUuid = resolveDoctorId(doctorId);
        if (docUuid == null) return ResponseEntity.ok(Collections.emptyList());
        List<Appointment> list = appointmentRepository.findByDoctorIdOrderByCreatedAtDesc(docUuid);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/appointments/doctor/{doctorId}/today")
    public ResponseEntity<?> getDoctorTodayAppointments(@PathVariable String doctorId) {
        UUID docUuid = resolveDoctorId(doctorId);
        if (docUuid == null) return ResponseEntity.ok(Collections.emptyList());
        List<Appointment> list = appointmentRepository.findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(
            docUuid, LocalDate.now()
        );
        return ResponseEntity.ok(list);
    }

    @GetMapping("/appointments/doctor/{doctorId}/queue")
    public ResponseEntity<?> getDoctorLiveQueue(@PathVariable String doctorId) {
        UUID docUuid = resolveDoctorId(doctorId);
        if (docUuid == null) {
            return ResponseEntity.ok(Map.of(
                "currentPatient", Map.of(),
                "hasCurrentPatient", false,
                "waitingQueue", Collections.emptyList(),
                "completedToday", Collections.emptyList()
            ));
        }

        LocalDate today = LocalDate.now();
        List<Appointment> allToday = appointmentRepository.findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(docUuid, today);

        Appointment currentPatient = allToday.stream()
            .filter(a -> "in-consultation".equalsIgnoreCase(a.getStatus()))
            .findFirst()
            .orElse(null);

        List<Appointment> waitingQueue = allToday.stream()
            .filter(a -> "waiting".equalsIgnoreCase(a.getStatus()))
            .toList();

        List<Appointment> completedToday = allToday.stream()
            .filter(a -> "completed".equalsIgnoreCase(a.getStatus()))
            .toList();

        return ResponseEntity.ok(Map.of(
            "currentPatient", currentPatient != null ? currentPatient : Map.of(),
            "hasCurrentPatient", currentPatient != null,
            "waitingQueue", waitingQueue,
            "completedToday", completedToday
        ));
    }

    // ─── 4. Doctor Queue Action: Call Next Patient ───────────────────────────

    @PostMapping("/appointments/doctor/{doctorId}/call-next")
    public ResponseEntity<?> callNextPatient(@PathVariable String doctorId) {
        UUID docUuid = resolveDoctorId(doctorId);
        if (docUuid == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Doctor not found"));
        }

        LocalDate today = LocalDate.now();
        List<Appointment> allToday = appointmentRepository.findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(docUuid, today);

        // Complete current active consultation if any
        Optional<Appointment> activeOpt = allToday.stream()
            .filter(a -> "in-consultation".equalsIgnoreCase(a.getStatus()))
            .findFirst();

        if (activeOpt.isPresent()) {
            Appointment current = activeOpt.get();
            current.setStatus("completed");
            current.setQueueStatus("completed");
            current.setCompletedAt(LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a")).toUpperCase());
            appointmentRepository.save(current);
        }

        // Find next waiting patient
        Optional<Appointment> nextWaitingOpt = allToday.stream()
            .filter(a -> "waiting".equalsIgnoreCase(a.getStatus()))
            .findFirst();

        if (nextWaitingOpt.isEmpty()) {
            queueNotificationService.broadcastQueueUpdate("queue-update", Map.of(
                "action", "QUEUE_EMPTY",
                "doctorId", docUuid.toString()
            ));
            return ResponseEntity.ok(Map.of("success", false, "message", "No more waiting patients"));
        }

        Appointment nextPatient = nextWaitingOpt.get();
        nextPatient.setStatus("in-consultation");
        nextPatient.setQueueStatus("in-consultation");
        nextPatient.setCalledAt(LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a")).toUpperCase());
        Appointment saved = appointmentRepository.save(nextPatient);

        // Broadcast to patient & doctor portals
        queueNotificationService.broadcastQueueUpdate("queue-update", Map.of(
            "action", "CALL_NEXT",
            "doctorId", docUuid.toString(),
            "calledToken", saved.getTokenNumber(),
            "patientName", saved.getPatientName()
        ));

        return ResponseEntity.ok(Map.of(
            "success", true,
            "calledPatient", saved
        ));
    }

    // ─── 5. Update Appointment Status (Complete, Skip, Reschedule, Notes, Rx) ─

    @PatchMapping("/appointments/{id}/status")
    public ResponseEntity<?> updateAppointmentStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> payload) {

        Optional<Appointment> apptOpt = appointmentRepository.findById(id);
        if (apptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Appointment not found"));
        }

        Appointment appt = apptOpt.get();

        if (payload.containsKey("status")) {
            String newStatus = (String) payload.get("status");
            appt.setStatus(newStatus);
            appt.setQueueStatus(newStatus);

            if ("completed".equalsIgnoreCase(newStatus)) {
                appt.setCompletedAt(LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a")).toUpperCase());
            }
        }

        if (payload.containsKey("clinicalNotes")) {
            appt.setClinicalNotes((String) payload.get("clinicalNotes"));
        }

        if (payload.containsKey("prescription")) {
            appt.setPrescription((String) payload.get("prescription"));
        }

        if (payload.containsKey("appointmentDate")) {
            appt.setAppointmentDate(LocalDate.parse((String) payload.get("appointmentDate")));
        }

        if (payload.containsKey("appointmentTime")) {
            appt.setAppointmentTime(((String) payload.get("appointmentTime")).trim().toUpperCase());
        }

        Appointment saved = appointmentRepository.save(appt);

        // Broadcast real-time update
        queueNotificationService.broadcastQueueUpdate("queue-update", Map.of(
            "action", "STATUS_CHANGE",
            "appointmentId", saved.getId().toString(),
            "status", saved.getStatus(),
            "tokenNumber", saved.getTokenNumber(),
            "doctorId", saved.getDoctor().getId().toString()
        ));

        return ResponseEntity.ok(saved);
    }

    // ─── 6. Doctor Available Slots Calculation (Respects Bookings & Breaks) ───

    @GetMapping("/doctors/{doctorId}/available-slots")
    public ResponseEntity<?> getAvailableSlots(
            @PathVariable String doctorId,
            @RequestParam(name = "date", required = false) String dateStr) {

        UUID docUuid = resolveDoctorId(doctorId);
        if (docUuid == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Doctor not found"));
        }

        Doctor doc = doctorRepository.findById(docUuid).orElse(null);
        if (doc == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Doctor not found"));
        }

        LocalDate targetDate = dateStr != null && !dateStr.isBlank() ? LocalDate.parse(dateStr) : LocalDate.now();

        // Check if doctor is on leave on this date
        if (doc.getOnLeaveDates() != null && doc.getOnLeaveDates().contains(targetDate.toString())) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        // Check if day of week is an available day
        String dayOfWeek = targetDate.getDayOfWeek().toString().substring(0, 1) + 
                           targetDate.getDayOfWeek().toString().substring(1).toLowerCase();
        boolean isWorkingDay = doc.getAvailableDays() == null || doc.getAvailableDays().isEmpty() ||
            doc.getAvailableDays().stream().anyMatch(d -> d.equalsIgnoreCase(dayOfWeek));

        if (!isWorkingDay) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        // Fetch existing bookings for this doctor on target date
        List<Appointment> bookedAppts = appointmentRepository
            .findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(docUuid, targetDate);

        Set<String> bookedTimes = new HashSet<>();
        for (Appointment a : bookedAppts) {
            if (!"cancelled".equalsIgnoreCase(a.getStatus()) && a.getAppointmentTime() != null) {
                bookedTimes.add(a.getAppointmentTime().trim().toUpperCase());
            }
        }

        // Generate slots between availableFrom and availableTo
        LocalTime start = doc.getAvailableFrom() != null ? doc.getAvailableFrom() : LocalTime.of(9, 0);
        LocalTime end = doc.getAvailableTo() != null ? doc.getAvailableTo() : LocalTime.of(17, 0);
        LocalTime breakStart = doc.getBreakStart() != null ? doc.getBreakStart() : LocalTime.of(13, 0);
        LocalTime breakEnd = doc.getBreakEnd() != null ? doc.getBreakEnd() : LocalTime.of(14, 0);
        int duration = doc.getSlotDuration() != null ? doc.getSlotDuration() : 20;

        List<Map<String, Object>> slots = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");

        LocalTime current = start;
        while (!current.plusMinutes(duration).isAfter(end)) {
            // Skip break time
            if (!(current.isBefore(breakEnd) && current.plusMinutes(duration).isAfter(breakStart))) {
                String formatted = current.format(timeFormatter).toUpperCase();
                boolean isBooked = bookedTimes.contains(formatted);
                slots.add(Map.of(
                    "time", formatted,
                    "available", !isBooked
                ));
            }
            current = current.plusMinutes(duration);
        }

        return ResponseEntity.ok(slots);
    }

    // ─── 7. Patient Queue Status Calculation (Live Position & Waiting Time) ───

    @GetMapping("/queue/status")
    public ResponseEntity<?> getQueueStatus(
            @RequestParam(name = "token", required = false) String token,
            @RequestParam(name = "doctorId", required = false) String doctorIdStr) {

        UUID doctorId = resolveDoctorId(doctorIdStr);

        Appointment userAppt = null;
        if (token != null && !token.isBlank()) {
            userAppt = appointmentRepository.findByTokenNumber(token).orElse(null);
            if (userAppt != null && doctorId == null) {
                doctorId = userAppt.getDoctor().getId();
            }
        }

        if (doctorId == null) {
            List<Doctor> docs = doctorRepository.findAll();
            if (!docs.isEmpty()) {
                doctorId = docs.get(0).getId();
            }
        }

        if (doctorId == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "No doctor queue found"));
        }

        Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
        if (doctor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Doctor not found"));
        }

        LocalDate today = LocalDate.now();
        List<Appointment> todayAppts = appointmentRepository.findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(doctorId, today);

        Appointment currentServing = todayAppts.stream()
            .filter(a -> "in-consultation".equalsIgnoreCase(a.getStatus()))
            .findFirst()
            .orElse(null);

        List<Appointment> waitingList = todayAppts.stream()
            .filter(a -> "waiting".equalsIgnoreCase(a.getStatus()))
            .toList();

        int patientsAhead = 0;
        if (userAppt != null) {
            for (int i = 0; i < waitingList.size(); i++) {
                if (waitingList.get(i).getId().equals(userAppt.getId())) {
                    patientsAhead = i;
                    break;
                }
            }
            if ("in-consultation".equalsIgnoreCase(userAppt.getStatus())) {
                patientsAhead = 0;
            }
        } else {
            patientsAhead = waitingList.size();
        }

        int slotDuration = doctor.getSlotDuration() != null ? doctor.getSlotDuration() : 15;
        int estimatedWait = Math.max(5, (patientsAhead + (currentServing != null ? 1 : 0)) * slotDuration);

        return ResponseEntity.ok(Map.of(
            "currentToken", currentServing != null ? currentServing.getTokenNumber() : (waitingList.isEmpty() ? "--" : waitingList.get(0).getTokenNumber()),
            "userToken", userAppt != null ? userAppt.getTokenNumber() : (token != null ? token : "A-23"),
            "doctorName", doctor.getFullName(),
            "specialty", doctor.getSpecialization(),
            "patientsAhead", patientsAhead,
            "estimatedWait", estimatedWait,
            "clinicStatus", doctor.getStatusMessage() != null ? doctor.getStatusMessage() : "In Clinic",
            "appointmentStatus", userAppt != null ? userAppt.getStatus() : "waiting",
            "isCurrentTurn", userAppt != null && "in-consultation".equalsIgnoreCase(userAppt.getStatus())
        ));
    }

    // ─── 8. Patient Appointment History ──────────────────────────────────────

    @GetMapping("/appointments/patient/{query}")
    public ResponseEntity<?> getPatientAppointments(@PathVariable String query) {
        List<Appointment> list = appointmentRepository.findByPatientPhoneOrPatientEmailOrderByCreatedAtDesc(query, query);
        return ResponseEntity.ok(list);
    }
}
