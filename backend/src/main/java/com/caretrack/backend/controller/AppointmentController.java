package com.caretrack.backend.controller;

import com.caretrack.backend.dto.SmartArrivalDTO;
import com.caretrack.backend.entity.Appointment;
import com.caretrack.backend.entity.Doctor;
import com.caretrack.backend.entity.PatientUser;
import com.caretrack.backend.repository.AppointmentRepository;
import com.caretrack.backend.repository.DoctorRepository;
import com.caretrack.backend.repository.PatientUserRepository;
import com.caretrack.backend.service.QueueNotificationService;
import com.caretrack.backend.service.SmartArrivalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"}, allowCredentials = "true")
public class AppointmentController {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientUserRepository patientUserRepository;
    private final QueueNotificationService queueNotificationService;
    private final SmartArrivalService smartArrivalService;

    public AppointmentController(
            AppointmentRepository appointmentRepository,
            DoctorRepository doctorRepository,
            PatientUserRepository patientUserRepository,
            QueueNotificationService queueNotificationService,
            SmartArrivalService smartArrivalService) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientUserRepository = patientUserRepository;
        this.queueNotificationService = queueNotificationService;
        this.smartArrivalService = smartArrivalService;
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

    private int parseTimeToMinutes(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return 9999;
        try {
            String clean = timeStr.trim().toUpperCase();
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("^(\\d{1,2}):(\\d{2})(?::\\d{2})?\\s*(AM|PM)?$").matcher(clean);
            if (m.matches()) {
                int hours = Integer.parseInt(m.group(1));
                int minutes = Integer.parseInt(m.group(2));
                String meridiem = m.group(3);
                if ("PM".equalsIgnoreCase(meridiem) && hours < 12) {
                    hours += 12;
                } else if ("AM".equalsIgnoreCase(meridiem) && hours == 12) {
                    hours = 0;
                }
                return hours * 60 + minutes;
            }
        } catch (Exception ignored) {}
        return 9999;
    }

    private final Comparator<Appointment> APPOINTMENT_TIME_COMPARATOR = (a, b) -> {
        int timeA = parseTimeToMinutes(a.getAppointmentTime());
        int timeB = parseTimeToMinutes(b.getAppointmentTime());
        if (timeA != timeB) {
            return Integer.compare(timeA, timeB);
        }
        if (a.getTokenNumber() != null && b.getTokenNumber() != null) {
            return a.getTokenNumber().compareTo(b.getTokenNumber());
        }
        return 0;
    };

    public static String getDoctorTokenPrefix(String doctorName) {
        if (doctorName == null || doctorName.isBlank()) return "OPD";
        String clean = doctorName.replaceFirst("(?i)^Dr\\.?\\s*", "").trim();
        String lower = clean.toLowerCase();

        if (lower.startsWith("ananya")) return "A";
        if (lower.startsWith("amit")) return "AP";
        if (lower.startsWith("arjun")) return "AJ";
        if (lower.startsWith("sneha")) return "S";
        if (lower.startsWith("sanjay")) return "SD";
        if (lower.startsWith("suresh")) return "SN";
        if (lower.startsWith("priya")) return "PS";
        if (lower.startsWith("pooja")) return "P";
        if (lower.startsWith("ramesh")) return "R";
        if (lower.startsWith("rajesh")) return "RG";
        if (lower.startsWith("kavitha")) return "K";
        if (lower.startsWith("deepa")) return "D";
        if (lower.startsWith("meera")) return "M";
        if (lower.startsWith("vikram")) return "V";
        if (lower.startsWith("lakshmi")) return "L";
        if (lower.startsWith("nisha")) return "N";

        String[] parts = clean.split("\\s+");
        if (parts.length >= 2) {
            return ("" + parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return clean.substring(0, Math.min(2, clean.length())).toUpperCase();
    }

    private String generateUniqueTokenNumber(Doctor doctor, LocalDate appointmentDate, String requestedToken) {
        String prefix = getDoctorTokenPrefix(doctor.getFullName());
        List<Appointment> allOnDate = appointmentRepository.findByAppointmentDate(appointmentDate);
        Set<String> usedTokensOnDate = allOnDate.stream()
            .map(Appointment::getTokenNumber)
            .filter(t -> t != null && !t.isBlank())
            .map(String::trim)
            .map(String::toUpperCase)
            .collect(Collectors.toSet());

        // If requested token is non-empty and NOT used on this date, accept it
        if (requestedToken != null && !requestedToken.isBlank()) {
            String cleanReq = requestedToken.trim().toUpperCase();
            if (!usedTokensOnDate.contains(cleanReq)) {
                return cleanReq;
            }
        }

        // Find max sequence number for this prefix on this date
        int maxSeq = 0;
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^" + java.util.regex.Pattern.quote(prefix) + "-(\\d+)$");
        for (String t : usedTokensOnDate) {
            java.util.regex.Matcher m = pattern.matcher(t);
            if (m.matches()) {
                try {
                    int seq = Integer.parseInt(m.group(1));
                    if (seq > maxSeq) maxSeq = seq;
                } catch (Exception ignored) {}
            }
        }

        int nextSeq = maxSeq + 1;
        String candidate = String.format("%s-%02d", prefix, nextSeq);
        while (usedTokensOnDate.contains(candidate)) {
            nextSeq++;
            candidate = String.format("%s-%02d", prefix, nextSeq);
        }
        return candidate;
    }

    // ─── Real-Time Server-Sent Events (SSE) Stream ───────────────────────────
    @GetMapping(value = "/queue/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamQueueUpdates() {
        return queueNotificationService.createEmitter();
    }

    // ─── 1. Get All Appointments ─────────────────────────────────────────────
    @GetMapping("/appointments")
    public List<Appointment> getAllAppointments() {
        List<Appointment> list = appointmentRepository.findAll();
        boolean hasUpdates = false;

        // Group by appointmentDate and ensure every appointment has a UNIQUE token without duplicates
        Map<LocalDate, Set<String>> usedByDate = new HashMap<>();
        for (Appointment a : list) {
            if (a.getAppointmentDate() == null || a.getDoctor() == null) continue;
            LocalDate d = a.getAppointmentDate();
            usedByDate.computeIfAbsent(d, k -> new HashSet<>());

            String currentToken = a.getTokenNumber() != null ? a.getTokenNumber().trim().toUpperCase() : "";
            // If token is missing or is already duplicate on this date
            if (currentToken.isBlank() || usedByDate.get(d).contains(currentToken)) {
                String prefix = getDoctorTokenPrefix(a.getDoctor().getFullName());
                int maxSeq = 0;
                java.util.regex.Pattern p = java.util.regex.Pattern.compile("^" + java.util.regex.Pattern.quote(prefix) + "-(\\d+)$");
                for (String t : usedByDate.get(d)) {
                    java.util.regex.Matcher m = p.matcher(t);
                    if (m.matches()) {
                        try {
                            int seq = Integer.parseInt(m.group(1));
                            if (seq > maxSeq) maxSeq = seq;
                        } catch (Exception ignored) {}
                    }
                }
                int nextSeq = maxSeq + 1;
                String uniqueToken = String.format("%s-%02d", prefix, nextSeq);
                while (usedByDate.get(d).contains(uniqueToken)) {
                    nextSeq++;
                    uniqueToken = String.format("%s-%02d", prefix, nextSeq);
                }
                a.setTokenNumber(uniqueToken);
                usedByDate.get(d).add(uniqueToken);
                hasUpdates = true;
            } else {
                usedByDate.get(d).add(currentToken);
            }
        }
        if (hasUpdates) {
            try {
                appointmentRepository.saveAll(list);
            } catch (Exception ignored) {}
        }
        list.sort((a, b) -> {
            if (a.getAppointmentDate() != null && b.getAppointmentDate() != null) {
                int dateComp = b.getAppointmentDate().compareTo(a.getAppointmentDate());
                if (dateComp != 0) return dateComp;
            }
            return APPOINTMENT_TIME_COMPARATOR.compare(a, b);
        });
        return list;
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

        String patientName = payload.get("patientName") != null ? payload.get("patientName").toString().trim() : 
                            (payload.get("patient_name") != null ? payload.get("patient_name").toString().trim() : "Patient");
        appointment.setPatientName(patientName);
        
        int age = 30;
        if (payload.get("patientAge") != null) {
            try {
                age = Integer.parseInt(payload.get("patientAge").toString());
            } catch (Exception ignored) {}
        } else if (payload.get("patient_age") != null) {
            try {
                age = Integer.parseInt(payload.get("patient_age").toString());
            } catch (Exception ignored) {}
        }
        appointment.setPatientAge(age);

        String patientEmail = payload.get("patientEmail") != null ? payload.get("patientEmail").toString().trim() : 
                             (payload.get("patient_email") != null ? payload.get("patient_email").toString().trim() : "");
        String patientPhone = payload.get("patientPhone") != null ? payload.get("patientPhone").toString().trim() : 
                              (payload.get("patient_phone") != null ? payload.get("patient_phone").toString().trim() : "");
        String bloodGroup = payload.get("bloodGroup") != null ? payload.get("bloodGroup").toString().trim() : 
                            (payload.get("blood_group") != null ? payload.get("blood_group").toString().trim() : "");
        String location = payload.get("location") != null ? payload.get("location").toString().trim() : "";

        appointment.setPatientEmail(patientEmail);
        appointment.setPatientPhone(patientPhone);
        appointment.setBloodGroup(bloodGroup);
        appointment.setLocation(location);
        appointment.setProblemDescription(payload.get("problemDescription") != null ? payload.get("problemDescription").toString() : "");
        appointment.setProblemCategory(payload.get("problemCategory") != null ? payload.get("problemCategory").toString() : doctor.getSpecialization());

        // Resolve and link patientId with PatientUser database entity
        String patientId = "";
        if (payload.get("patientId") != null && !payload.get("patientId").toString().isBlank()) {
            patientId = payload.get("patientId").toString().trim();
        } else if (payload.get("patient_id") != null && !payload.get("patient_id").toString().isBlank()) {
            patientId = payload.get("patient_id").toString().trim();
        }

        if ((patientId == null || patientId.isBlank()) && !patientEmail.isBlank()) {
            try {
                Optional<PatientUser> existingPatient = patientUserRepository.findByEmail(patientEmail);
                if (existingPatient.isPresent()) {
                    PatientUser pu = existingPatient.get();
                    patientId = pu.getId().toString();
                    boolean changed = false;
                    if ((pu.getFullName() == null || pu.getFullName().isBlank()) && !patientName.isBlank()) {
                        pu.setFullName(patientName);
                        changed = true;
                    }
                    if ((pu.getPhone() == null || pu.getPhone().isBlank()) && !patientPhone.isBlank()) {
                        pu.setPhone(patientPhone);
                        changed = true;
                    }
                    if ((pu.getBloodGroup() == null || pu.getBloodGroup().isBlank()) && !bloodGroup.isBlank()) {
                        pu.setBloodGroup(bloodGroup);
                        changed = true;
                    }
                    if ((pu.getLocation() == null || pu.getLocation().isBlank()) && !location.isBlank()) {
                        pu.setLocation(location);
                        changed = true;
                    }
                    if (changed) patientUserRepository.save(pu);
                } else {
                    PatientUser newPu = new PatientUser();
                    newPu.setEmail(patientEmail);
                    newPu.setPassword("patient123");
                    newPu.setFullName(patientName);
                    newPu.setPhone(patientPhone);
                    newPu.setAge(age);
                    newPu.setBloodGroup(bloodGroup);
                    newPu.setLocation(location);
                    PatientUser savedPu = patientUserRepository.save(newPu);
                    patientId = savedPu.getId().toString();
                }
            } catch (Exception ignored) {}
        }
        appointment.setPatientId(patientId);

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

        LocalDate today = LocalDate.now();
        if (appointment.getAppointmentDate().isBefore(today)) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Cannot book an appointment for a past date.")
            );
        }

        // Validate that time slot for today is not in the past
        if (appointment.getAppointmentDate().isEqual(today)) {
            try {
                DateTimeFormatter timeCheckFormatter = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);
                LocalTime slotTime = LocalTime.parse(appointment.getAppointmentTime().trim().toUpperCase(), timeCheckFormatter);
                if (slotTime.isBefore(LocalTime.now())) {
                    return ResponseEntity.badRequest().body(
                        Map.of("message", "The selected time slot has already passed for today. Please select an upcoming slot.")
                    );
                }
            } catch (Exception ignored) {}
        }

        // Determine guaranteed unique token number for this appointment date
        boolean isToday = appointment.getAppointmentDate().isEqual(today);

        String reqToken = null;
        if (payload.get("tokenNumber") != null && !payload.get("tokenNumber").toString().isBlank()) {
            reqToken = payload.get("tokenNumber").toString().trim();
        } else if (payload.get("token_number") != null && !payload.get("token_number").toString().isBlank()) {
            reqToken = payload.get("token_number").toString().trim();
        }

        String tokenNumber = generateUniqueTokenNumber(doctor, appointment.getAppointmentDate(), reqToken);

        String status = isToday ? "waiting" : "scheduled";
        String queueStatus = isToday ? "waiting" : "scheduled";

        appointment.setTokenNumber(tokenNumber);
        appointment.setStatus(status);
        appointment.setQueueStatus(queueStatus);

        Appointment saved = appointmentRepository.save(appointment);

        // Broadcast SSE real-time update to both Doctor and Patient portals with linked doctor & patient info
        queueNotificationService.broadcastQueueUpdate("queue-update", Map.of(
            "action", "NEW_BOOKING",
            "doctorId", doctor.getId().toString(),
            "doctorName", doctor.getFullName(),
            "specialization", doctor.getSpecialization(),
            "patientId", saved.getPatientId() != null ? saved.getPatientId() : "",
            "patientName", saved.getPatientName(),
            "appointmentId", saved.getId().toString(),
            "tokenNumber", saved.getTokenNumber() != null ? saved.getTokenNumber() : ""
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // ─── 3. Doctor Appointments & Queue Queries ──────────────────────────────

    @GetMapping("/appointments/doctor/{doctorId}")
    public ResponseEntity<?> getDoctorAppointments(@PathVariable String doctorId) {
        UUID docUuid = resolveDoctorId(doctorId);
        if (docUuid == null) return ResponseEntity.ok(Collections.emptyList());
        List<Appointment> list = new ArrayList<>(appointmentRepository.findByDoctorIdOrderByCreatedAtDesc(docUuid));
        list.sort((a, b) -> {
            if (a.getAppointmentDate() != null && b.getAppointmentDate() != null) {
                int dateComp = b.getAppointmentDate().compareTo(a.getAppointmentDate());
                if (dateComp != 0) return dateComp;
            }
            return APPOINTMENT_TIME_COMPARATOR.compare(a, b);
        });
        return ResponseEntity.ok(list);
    }

    @GetMapping("/appointments/doctor/{doctorId}/today")
    public ResponseEntity<?> getDoctorTodayAppointments(@PathVariable String doctorId) {
        UUID docUuid = resolveDoctorId(doctorId);
        if (docUuid == null) return ResponseEntity.ok(Collections.emptyList());
        List<Appointment> list = new ArrayList<>(appointmentRepository.findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(
            docUuid, LocalDate.now()
        ));
        list.sort(APPOINTMENT_TIME_COMPARATOR);
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

        // Live Queue ONLY serves today's appointments sorted by timing
        LocalDate today = LocalDate.now();
        List<Appointment> allToday = appointmentRepository.findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(docUuid, today);

        Appointment currentPatient = allToday.stream()
            .filter(a -> "in-consultation".equalsIgnoreCase(a.getStatus()))
            .findFirst()
            .orElse(null);

        List<Appointment> waitingQueue = allToday.stream()
            .filter(a -> "waiting".equalsIgnoreCase(a.getStatus()))
            .sorted(APPOINTMENT_TIME_COMPARATOR)
            .toList();

        List<Appointment> completedToday = allToday.stream()
            .filter(a -> "completed".equalsIgnoreCase(a.getStatus()))
            .sorted(APPOINTMENT_TIME_COMPARATOR)
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

        // Find next waiting patient ordered by appointment timing
        Optional<Appointment> nextWaitingOpt = allToday.stream()
            .filter(a -> "waiting".equalsIgnoreCase(a.getStatus()))
            .sorted(APPOINTMENT_TIME_COMPARATOR)
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

    // ─── 4b. Patient Check-In / Token Generation On Clinic Day ──────────────

    @PostMapping("/appointments/{id}/check-in")
    public ResponseEntity<?> checkInAppointment(@PathVariable UUID id) {
        Optional<Appointment> apptOpt = appointmentRepository.findById(id);
        if (apptOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Appointment not found"));
        }

        Appointment appt = apptOpt.get();
        Doctor doc = appt.getDoctor();

        if (appt.getTokenNumber() == null || appt.getTokenNumber().isBlank()) {
            String cleanName = doc != null ? doc.getFullName().replaceFirst("(?i)^Dr\\.?\\s*", "").trim() : "Doc";
            char prefix = Character.toUpperCase(cleanName.isEmpty() ? 'A' : cleanName.charAt(0));
            List<Appointment> todayBookings = appointmentRepository
                .findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(doc.getId(), appt.getAppointmentDate());
            long count = todayBookings.stream().filter(a -> a.getTokenNumber() != null && !a.getTokenNumber().isBlank()).count() + 1;
            appt.setTokenNumber(String.format("%c-%02d", prefix, count));
        }

        appt.setStatus("waiting");
        appt.setQueueStatus("waiting");
        Appointment saved = appointmentRepository.save(appt);

        queueNotificationService.broadcastQueueUpdate("queue-update", Map.of(
            "action", "CHECK_IN",
            "doctorId", saved.getDoctor().getId().toString(),
            "appointmentId", saved.getId().toString(),
            "tokenNumber", saved.getTokenNumber(),
            "patientName", saved.getPatientName()
        ));

        return ResponseEntity.ok(saved);
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

        if (payload.containsKey("tokenNumber")) {
            appt.setTokenNumber((String) payload.get("tokenNumber"));
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
            doc.getAvailableDays().stream().anyMatch(d -> d.equalsIgnoreCase(dayOfWeek)) ||
            dayOfWeek.equalsIgnoreCase("Saturday") || dayOfWeek.equalsIgnoreCase("Sunday");

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

        // Generate slots between availableFrom and availableTo (Extended to 9:00 PM / 21:00)
        LocalTime start = doc.getAvailableFrom() != null ? doc.getAvailableFrom() : LocalTime.of(9, 0);
        LocalTime end = doc.getAvailableTo() != null ? doc.getAvailableTo() : LocalTime.of(21, 0);
        if (end.isBefore(LocalTime.of(21, 0))) {
            end = LocalTime.of(21, 0);
        }
        LocalTime breakStart = doc.getBreakStart() != null ? doc.getBreakStart() : LocalTime.of(13, 0);
        LocalTime breakEnd = doc.getBreakEnd() != null ? doc.getBreakEnd() : LocalTime.of(14, 0);
        int duration = doc.getSlotDuration() != null ? doc.getSlotDuration() : 20;

        List<Map<String, Object>> slots = new ArrayList<>();
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("hh:mm a");

        LocalDate today = LocalDate.now();
        LocalTime nowTime = LocalTime.now();

        LocalTime current = start;
        while (!current.plusMinutes(duration).isAfter(end)) {
            // Skip break time
            if (!(current.isBefore(breakEnd) && current.plusMinutes(duration).isAfter(breakStart))) {
                String formatted = current.format(timeFormatter).toUpperCase();
                boolean isBooked = bookedTimes.contains(formatted);
                boolean isPast = targetDate.isBefore(today) || (targetDate.isEqual(today) && current.isBefore(nowTime));
                boolean isAvailable = !isBooked && !isPast;

                slots.add(Map.of(
                    "time", formatted,
                    "available", isAvailable,
                    "isPast", isPast,
                    "isBooked", isBooked
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

        UUID doctorId = null;
        if (doctorIdStr != null && !doctorIdStr.isBlank()) {
            doctorId = resolveDoctorId(doctorIdStr);
        }

        Appointment userAppt = null;
        if (token != null && !token.isBlank()) {
            String cleanToken = token.trim();
            List<Appointment> tokenMatches = appointmentRepository.findByTokenNumberOrderByCreatedAtDesc(cleanToken);
            userAppt = !tokenMatches.isEmpty() ? tokenMatches.get(0) : null;
            if (userAppt == null) {
                userAppt = appointmentRepository.findAll().stream()
                    .filter(a -> a.getTokenNumber() != null && a.getTokenNumber().trim().equalsIgnoreCase(cleanToken))
                    .findFirst()
                    .orElse(null);
            }

            if (userAppt != null && doctorId == null && userAppt.getDoctor() != null) {
                doctorId = userAppt.getDoctor().getId();
            }
        }

        if (doctorId == null) {
            doctorId = resolveDoctorId(null);
        }

        if (doctorId == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "No doctor queue found"));
        }

        Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
        if (doctor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Doctor not found"));
        }

        LocalDate targetDate = (userAppt != null && userAppt.getAppointmentDate() != null)
            ? userAppt.getAppointmentDate()
            : LocalDate.now();
        List<Appointment> todayAppts = appointmentRepository.findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(doctorId, targetDate);

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

        boolean isCurrentTurn = userAppt != null && "in-consultation".equalsIgnoreCase(userAppt.getStatus());
        String currentToken = currentServing != null ? currentServing.getTokenNumber() : "--";
        String userToken = userAppt != null ? userAppt.getTokenNumber() : (token != null ? token : "--");

        return ResponseEntity.ok(Map.of(
            "currentToken", currentToken,
            "userToken", userToken,
            "doctorName", doctor.getFullName(),
            "specialty", doctor.getSpecialization(),
            "patientsAhead", isCurrentTurn ? 0 : patientsAhead,
            "estimatedWait", isCurrentTurn ? 0 : estimatedWait,
            "clinicStatus", doctor.getStatusMessage() != null ? doctor.getStatusMessage() : (currentServing != null ? "In Consultation" : "In Clinic"),
            "appointmentStatus", userAppt != null ? userAppt.getStatus() : "waiting",
            "isCurrentTurn", isCurrentTurn
        ));
    }

    // ─── 7b. MediSync Smart Arrival Endpoints ─────────────────────────────────

    @GetMapping("/appointments/{id}/smart-arrival")
    public ResponseEntity<?> getAppointmentSmartArrival(@PathVariable UUID id) {
        Appointment appt = appointmentRepository.findById(id).orElse(null);
        if (appt == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Appointment not found"));
        }
        SmartArrivalDTO dto = smartArrivalService.calculateSmartArrival(appt);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/appointments/{id}/travel-duration")
    public ResponseEntity<?> updateTravelDuration(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> payload) {
        Appointment appt = appointmentRepository.findById(id).orElse(null);
        if (appt == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Appointment not found"));
        }

        if (payload.containsKey("travelDurationMinutes")) {
            try {
                int minutes = Integer.parseInt(payload.get("travelDurationMinutes").toString());
                appt.setTravelDurationMinutes(Math.max(5, Math.min(240, minutes)));
                appointmentRepository.save(appt);
            } catch (Exception ignored) {}
        }

        SmartArrivalDTO dto = smartArrivalService.calculateSmartArrival(appt);

        // Broadcast real-time event to SSE clients
        queueNotificationService.broadcastQueueUpdate("smart-arrival-update", dto);
        queueNotificationService.broadcastQueueUpdate("queue-update", Map.of(
            "action", "TRAVEL_DURATION_UPDATED",
            "appointmentId", appt.getId().toString(),
            "travelDurationMinutes", appt.getTravelDurationMinutes()
        ));

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/queue/smart-arrival")
    public ResponseEntity<?> getQueueSmartArrival(
            @RequestParam(name = "token", required = false) String token,
            @RequestParam(name = "appointmentId", required = false) String appointmentIdStr) {
        Appointment appt = null;
        if (appointmentIdStr != null && !appointmentIdStr.isBlank()) {
            try {
                appt = appointmentRepository.findById(UUID.fromString(appointmentIdStr)).orElse(null);
            } catch (Exception ignored) {}
        }
        if (appt == null && token != null && !token.isBlank()) {
            List<Appointment> list = appointmentRepository.findByTokenNumberOrderByCreatedAtDesc(token.trim().toUpperCase());
            if (!list.isEmpty()) {
                appt = list.get(0);
            } else {
                appt = appointmentRepository.findAll().stream()
                    .filter(a -> a.getTokenNumber() != null && a.getTokenNumber().trim().equalsIgnoreCase(token.trim()))
                    .findFirst()
                    .orElse(null);
            }
        }
        if (appt == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Appointment not found for Smart Arrival"));
        }
        SmartArrivalDTO dto = smartArrivalService.calculateSmartArrival(appt);
        return ResponseEntity.ok(dto);
    }

    // ─── 8. Patient Appointment History & Doctor Patients Linkage ────────────

    @GetMapping("/appointments/patient/{query}")
    public ResponseEntity<?> getPatientAppointments(@PathVariable String query) {
        List<Appointment> list = new ArrayList<>();
        list.addAll(appointmentRepository.findByPatientIdOrderByCreatedAtDesc(query));
        list.addAll(appointmentRepository.findByPatientEmailOrderByCreatedAtDesc(query));
        list.addAll(appointmentRepository.findByPatientPhoneOrPatientEmailOrderByCreatedAtDesc(query, query));
        
        Map<UUID, Appointment> unique = new LinkedHashMap<>();
        for (Appointment a : list) {
            unique.putIfAbsent(a.getId(), a);
        }
        return ResponseEntity.ok(new ArrayList<>(unique.values()));
    }

    @GetMapping("/doctors/{doctorId}/patients")
    public ResponseEntity<?> getDoctorPatients(@PathVariable String doctorId) {
        UUID docUuid = resolveDoctorId(doctorId);
        if (docUuid == null) {
            return ResponseEntity.ok(Collections.emptyList());
        }

        List<Appointment> docAppts = appointmentRepository.findByDoctorIdOrderByCreatedAtDesc(docUuid);
        Map<String, Map<String, Object>> patientMap = new LinkedHashMap<>();

        for (Appointment a : docAppts) {
            String key = (a.getPatientId() != null && !a.getPatientId().isBlank())
                ? a.getPatientId()
                : ((a.getPatientEmail() != null && !a.getPatientEmail().isBlank()) ? a.getPatientEmail() : a.getPatientPhone());
            
            if (key == null || key.isBlank()) key = a.getPatientName();

            if (!patientMap.containsKey(key)) {
                Map<String, Object> patientInfo = new LinkedHashMap<>();
                patientInfo.put("patientId", a.getPatientId() != null ? a.getPatientId() : "");
                patientInfo.put("patientName", a.getPatientName());
                patientInfo.put("patientAge", a.getPatientAge());
                patientInfo.put("patientEmail", a.getPatientEmail());
                patientInfo.put("patientPhone", a.getPatientPhone());
                patientInfo.put("bloodGroup", a.getBloodGroup());
                patientInfo.put("location", a.getLocation());
                patientInfo.put("totalAppointments", 1);
                patientInfo.put("latestAppointmentDate", a.getAppointmentDate());
                patientInfo.put("latestAppointmentTime", a.getAppointmentTime());
                patientInfo.put("latestStatus", a.getStatus());
                patientInfo.put("latestToken", a.getTokenNumber());
                patientInfo.put("doctorId", docUuid.toString());
                patientInfo.put("doctorName", a.getDoctor() != null ? a.getDoctor().getFullName() : "");
                patientInfo.put("specialization", a.getDoctor() != null ? a.getDoctor().getSpecialization() : "");
                List<Appointment> records = new ArrayList<>();
                records.add(a);
                patientInfo.put("records", records);
                patientMap.put(key, patientInfo);
            } else {
                Map<String, Object> existing = patientMap.get(key);
                existing.put("totalAppointments", ((Integer) existing.get("totalAppointments")) + 1);
                @SuppressWarnings("unchecked")
                List<Appointment> records = (List<Appointment>) existing.get("records");
                records.add(a);
            }
        }

        return ResponseEntity.ok(new ArrayList<>(patientMap.values()));
    }

    // ─── 9. Delete Appointment & Purge Dummy Data ────────────────────────────

    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<?> deleteAppointment(@PathVariable UUID id) {
        if (appointmentRepository.existsById(id)) {
            appointmentRepository.deleteById(id);
            queueNotificationService.broadcastQueueUpdate("queue-update", Map.of(
                "action", "APPOINTMENT_DELETED",
                "appointmentId", id.toString()
            ));
            return ResponseEntity.ok(Map.of("success", true, "message", "Appointment deleted"));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/appointments/dummy")
    public ResponseEntity<?> purgeDummyAppointments() {
        List<Appointment> all = appointmentRepository.findAll();
        List<Appointment> toDelete = all.stream().filter(a -> 
            a.getPatientName() == null || 
            a.getPatientName().equalsIgnoreCase("Test Patient") ||
            a.getPatientName().equalsIgnoreCase("Ramesh Verma") ||
            (a.getPatientEmail() != null && a.getPatientEmail().contains("test@example.com"))
        ).toList();
        appointmentRepository.deleteAll(toDelete);
        queueNotificationService.broadcastQueueUpdate("queue-update", Map.of(
            "action", "PURGE_DUMMY",
            "deletedCount", toDelete.size()
        ));
        return ResponseEntity.ok(Map.of("success", true, "deletedCount", toDelete.size()));
    }
}
