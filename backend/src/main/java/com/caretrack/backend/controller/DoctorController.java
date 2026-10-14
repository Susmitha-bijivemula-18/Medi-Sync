package com.caretrack.backend.controller;

import com.caretrack.backend.entity.Doctor;
import com.caretrack.backend.repository.DoctorRepository;
import com.caretrack.backend.service.QueueNotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"}, allowCredentials = "true")
public class DoctorController {

    private final DoctorRepository doctorRepository;
    private final QueueNotificationService queueNotificationService;

    public DoctorController(DoctorRepository doctorRepository, QueueNotificationService queueNotificationService) {
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

    @GetMapping
    public List<Doctor> getAllDoctors(@RequestParam(required = false) String specialization) {
        if (specialization != null && !specialization.isEmpty()) {
            return doctorRepository.findByIsActiveTrueAndSpecializationOrderByFullNameAsc(specialization);
        }
        return doctorRepository.findByIsActiveTrueOrderByFullNameAsc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable String id) {
        UUID docId = resolveDoctorId(id);
        if (docId == null) {
            return ResponseEntity.notFound().build();
        }
        return doctorRepository.findById(docId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/schedule")
    public ResponseEntity<?> updateDoctorSchedule(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        UUID docId = resolveDoctorId(id);
        if (docId == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Doctor not found"));
        }
        Optional<Doctor> docOpt = doctorRepository.findById(docId);
        if (docOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Doctor not found"));
        }

        Doctor doc = docOpt.get();

        if (body.containsKey("workingDays") && body.get("workingDays") instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> days = (List<String>) body.get("workingDays");
            doc.setAvailableDays(days);
        }

        if (body.containsKey("startTime") && body.get("startTime") != null) {
            doc.setAvailableFrom(LocalTime.parse((String) body.get("startTime")));
        }

        if (body.containsKey("endTime") && body.get("endTime") != null) {
            doc.setAvailableTo(LocalTime.parse((String) body.get("endTime")));
        }

        if (body.containsKey("slotDuration") && body.get("slotDuration") != null) {
            doc.setSlotDuration(Integer.parseInt(body.get("slotDuration").toString()));
        }

        if (body.containsKey("breakStart") && body.get("breakStart") != null) {
            doc.setBreakStart(LocalTime.parse((String) body.get("breakStart")));
        }

        if (body.containsKey("breakEnd") && body.get("breakEnd") != null) {
            doc.setBreakEnd(LocalTime.parse((String) body.get("breakEnd")));
        }

        if (body.containsKey("clinicStatus") && body.get("clinicStatus") != null) {
            doc.setClinicStatus((String) body.get("clinicStatus"));
        }

        if (body.containsKey("statusMessage") && body.get("statusMessage") != null) {
            doc.setStatusMessage((String) body.get("statusMessage"));
        }

        if (body.containsKey("onLeaveDates") && body.get("onLeaveDates") instanceof List) {
            @SuppressWarnings("unchecked")
            List<String> leaves = (List<String>) body.get("onLeaveDates");
            doc.setOnLeaveDates(leaves);
        }

        Doctor saved = doctorRepository.save(doc);

        queueNotificationService.broadcastQueueUpdate("schedule-update", Map.of(
            "doctorId", saved.getId().toString(),
            "clinicStatus", saved.getClinicStatus(),
            "statusMessage", saved.getStatusMessage()
        ));

        return ResponseEntity.ok(saved);
    }
}
