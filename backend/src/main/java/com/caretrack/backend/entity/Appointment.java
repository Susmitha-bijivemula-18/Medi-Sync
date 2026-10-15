package com.caretrack.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "appointments")
public class Appointment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id")
    private String patientId = "";

    @Column(name = "patient_name", nullable = false)
    private String patientName = "";

    @Column(name = "patient_age", nullable = false)
    private Integer patientAge = 0;

    @Column(name = "patient_email", nullable = false)
    private String patientEmail = "";

    @Column(name = "patient_phone", nullable = false)
    private String patientPhone = "";

    @Column(name = "blood_group")
    private String bloodGroup = "";

    @Column(name = "location")
    private String location = "";

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

    public Appointment() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public Integer getPatientAge() { return patientAge; }
    public void setPatientAge(Integer patientAge) { this.patientAge = patientAge; }

    public String getPatientEmail() { return patientEmail; }
    public void setPatientEmail(String patientEmail) { this.patientEmail = patientEmail; }

    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getProblemDescription() { return problemDescription; }
    public void setProblemDescription(String problemDescription) { this.problemDescription = problemDescription; }

    public String getProblemCategory() { return problemCategory; }
    public void setProblemCategory(String problemCategory) { this.problemCategory = problemCategory; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(String appointmentTime) { this.appointmentTime = appointmentTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getQueueStatus() { return queueStatus; }
    public void setQueueStatus(String queueStatus) { this.queueStatus = queueStatus; }

    public String getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }

    public String getVitalsBp() { return vitalsBp; }
    public void setVitalsBp(String vitalsBp) { this.vitalsBp = vitalsBp; }

    public String getVitalsPulse() { return vitalsPulse; }
    public void setVitalsPulse(String vitalsPulse) { this.vitalsPulse = vitalsPulse; }

    public String getVitalsTemp() { return vitalsTemp; }
    public void setVitalsTemp(String vitalsTemp) { this.vitalsTemp = vitalsTemp; }

    public String getVitalsWeight() { return vitalsWeight; }
    public void setVitalsWeight(String vitalsWeight) { this.vitalsWeight = vitalsWeight; }

    public String getClinicalNotes() { return clinicalNotes; }
    public void setClinicalNotes(String clinicalNotes) { this.clinicalNotes = clinicalNotes; }

    public String getPrescription() { return prescription; }
    public void setPrescription(String prescription) { this.prescription = prescription; }

    public String getCalledAt() { return calledAt; }
    public void setCalledAt(String calledAt) { this.calledAt = calledAt; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
