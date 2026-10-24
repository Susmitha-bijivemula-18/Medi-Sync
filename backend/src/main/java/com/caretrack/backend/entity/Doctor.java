package com.caretrack.backend.entity;

import com.caretrack.backend.config.StringListConverter;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "doctors")
public class Doctor {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "full_name", nullable = false)
    private String fullName = "";

    @Column(nullable = false)
    private String specialization = "";

    @Column(nullable = false)
    private String qualification = "";

    @Column(name = "experience_years", nullable = false)
    private Integer experienceYears = 0;

    @Column(name = "consultation_fee")
    private BigDecimal consultationFee = new BigDecimal("500.00");

    @Convert(converter = StringListConverter.class)
    @Column(name = "available_days", length = 500)
    private List<String> availableDays = new ArrayList<>(List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"));

    @Column(name = "available_from")
    private LocalTime availableFrom = LocalTime.of(9, 0);

    @Column(name = "available_to")
    private LocalTime availableTo = LocalTime.of(21, 0);

    @Column(name = "slot_duration")
    private Integer slotDuration = 20;

    @Column(name = "break_start")
    private LocalTime breakStart = LocalTime.of(13, 0);

    @Column(name = "break_end")
    private LocalTime breakEnd = LocalTime.of(14, 0);

    @Column(name = "clinic_status")
    private String clinicStatus = "active";

    @Column(name = "status_message", length = 500)
    private String statusMessage = "In Clinic · Calling patients on time";

    @Convert(converter = StringListConverter.class)
    @Column(name = "on_leave_dates", length = 1000)
    private List<String> onLeaveDates = new ArrayList<>();

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Doctor() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public BigDecimal getConsultationFee() { return consultationFee; }
    public void setConsultationFee(BigDecimal consultationFee) { this.consultationFee = consultationFee; }

    public List<String> getAvailableDays() { return availableDays; }
    public void setAvailableDays(List<String> availableDays) { this.availableDays = availableDays; }

    public LocalTime getAvailableFrom() { return availableFrom; }
    public void setAvailableFrom(LocalTime availableFrom) { this.availableFrom = availableFrom; }

    public LocalTime getAvailableTo() { return availableTo; }
    public void setAvailableTo(LocalTime availableTo) { this.availableTo = availableTo; }

    public Integer getSlotDuration() { return slotDuration; }
    public void setSlotDuration(Integer slotDuration) { this.slotDuration = slotDuration; }

    public LocalTime getBreakStart() { return breakStart; }
    public void setBreakStart(LocalTime breakStart) { this.breakStart = breakStart; }

    public LocalTime getBreakEnd() { return breakEnd; }
    public void setBreakEnd(LocalTime breakEnd) { this.breakEnd = breakEnd; }

    public String getClinicStatus() { return clinicStatus; }
    public void setClinicStatus(String clinicStatus) { this.clinicStatus = clinicStatus; }

    public String getStatusMessage() { return statusMessage; }
    public void setStatusMessage(String statusMessage) { this.statusMessage = statusMessage; }

    public List<String> getOnLeaveDates() { return onLeaveDates; }
    public void setOnLeaveDates(List<String> onLeaveDates) { this.onLeaveDates = onLeaveDates; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
