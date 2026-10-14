package com.caretrack.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@Entity
@Table(name = "appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id")
    private String patientId = "";

    @Column(name = "patient_name", nullable = false)
    private String patientName;

    @Column(name = "patient_age", nullable = false)
    private Integer patientAge;

    @Column(name = "patient_email", nullable = false)
    private String patientEmail = "";

    @Column(name = "patient_phone", nullable = false)
    private String patientPhone = "";

    @Column(name = "problem_description", length = 1000)
    private String problemDescription = "";

    @Column(name = "problem_category")
    private String problemCategory = "";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Doctor doctor;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate = LocalDate.now();

    @Column(name = "appointment_time")
    private String appointmentTime = "10:00 AM";

    @Column(nullable = false)
    private String status = "waiting";

    @Column(name = "queue_status")
    private String queueStatus = "waiting";

    @Column(name = "token_number", nullable = false)
    private String tokenNumber = "";

    @Column(name = "vitals_bp")
    private String vitalsBp = "";

    @Column(name = "vitals_pulse")
    private String vitalsPulse = "";

    @Column(name = "vitals_temp")
    private String vitalsTemp = "";

    @Column(name = "vitals_weight")
    private String vitalsWeight = "";

    @Column(name = "clinical_notes", length = 2000)
    private String clinicalNotes = "";

    @Column(name = "prescription", length = 2000)
    private String prescription = "";

    @Column(name = "called_at")
    private String calledAt = "";

    @Column(name = "completed_at")
    private String completedAt = "";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
