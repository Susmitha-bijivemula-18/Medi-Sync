package com.caretrack.backend.dto;

import java.util.UUID;

public class SmartArrivalDTO {
    private UUID appointmentId;
    private String patientName;
    private UUID doctorId;
    private String doctorName;
    private String specialization;
    private String tokenNumber;
    private String appointmentDate;
    private String appointmentTime;
    private String status;
    private int queuePosition;
    private int patientsAhead;
    private String currentlyServingToken;
    private int travelDurationMinutes;
    private int arrivalBufferMinutes;
    private int avgConsultationMinutes;
    private int doctorDelayMinutes;
    private String estimatedDoctorReadyTime;
    private String clinicRequiredArrivalTime;
    private String targetArrivalTime;
    private String departureWindowStart;
    private String departureWindowEnd;
    private String departureStatus;
    private long minutesUntilDeparture;
    private int uncertaintyMinutes;
    private String reliability;
    private boolean isReliable;
    private String explanation;
    private String clinicPolicyNotice;
    private String lastCalculatedAt;

    public SmartArrivalDTO() {}

    public UUID getAppointmentId() { return appointmentId; }
    public void setAppointmentId(UUID appointmentId) { this.appointmentId = appointmentId; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public UUID getDoctorId() { return doctorId; }
    public void setDoctorId(UUID doctorId) { this.doctorId = doctorId; }

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getTokenNumber() { return tokenNumber; }
    public void setTokenNumber(String tokenNumber) { this.tokenNumber = tokenNumber; }

    public String getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getAppointmentTime() { return appointmentTime; }
    public void setAppointmentTime(String appointmentTime) { this.appointmentTime = appointmentTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getQueuePosition() { return queuePosition; }
    public void setQueuePosition(int queuePosition) { this.queuePosition = queuePosition; }

    public int getPatientsAhead() { return patientsAhead; }
    public void setPatientsAhead(int patientsAhead) { this.patientsAhead = patientsAhead; }

    public String getCurrentlyServingToken() { return currentlyServingToken; }
    public void setCurrentlyServingToken(String currentlyServingToken) { this.currentlyServingToken = currentlyServingToken; }

    public int getTravelDurationMinutes() { return travelDurationMinutes; }
    public void setTravelDurationMinutes(int travelDurationMinutes) { this.travelDurationMinutes = travelDurationMinutes; }

    public int getArrivalBufferMinutes() { return arrivalBufferMinutes; }
    public void setArrivalBufferMinutes(int arrivalBufferMinutes) { this.arrivalBufferMinutes = arrivalBufferMinutes; }

    public int getAvgConsultationMinutes() { return avgConsultationMinutes; }
    public void setAvgConsultationMinutes(int avgConsultationMinutes) { this.avgConsultationMinutes = avgConsultationMinutes; }

    public int getDoctorDelayMinutes() { return doctorDelayMinutes; }
    public void setDoctorDelayMinutes(int doctorDelayMinutes) { this.doctorDelayMinutes = doctorDelayMinutes; }

    public String getEstimatedDoctorReadyTime() { return estimatedDoctorReadyTime; }
    public void setEstimatedDoctorReadyTime(String estimatedDoctorReadyTime) { this.estimatedDoctorReadyTime = estimatedDoctorReadyTime; }

    public String getClinicRequiredArrivalTime() { return clinicRequiredArrivalTime; }
    public void setClinicRequiredArrivalTime(String clinicRequiredArrivalTime) { this.clinicRequiredArrivalTime = clinicRequiredArrivalTime; }

    public String getTargetArrivalTime() { return targetArrivalTime; }
    public void setTargetArrivalTime(String targetArrivalTime) { this.targetArrivalTime = targetArrivalTime; }

    public String getDepartureWindowStart() { return departureWindowStart; }
    public void setDepartureWindowStart(String departureWindowStart) { this.departureWindowStart = departureWindowStart; }

    public String getDepartureWindowEnd() { return departureWindowEnd; }
    public void setDepartureWindowEnd(String departureWindowEnd) { this.departureWindowEnd = departureWindowEnd; }

    public String getDepartureStatus() { return departureStatus; }
    public void setDepartureStatus(String departureStatus) { this.departureStatus = departureStatus; }

    public long getMinutesUntilDeparture() { return minutesUntilDeparture; }
    public void setMinutesUntilDeparture(long minutesUntilDeparture) { this.minutesUntilDeparture = minutesUntilDeparture; }

    public int getUncertaintyMinutes() { return uncertaintyMinutes; }
    public void setUncertaintyMinutes(int uncertaintyMinutes) { this.uncertaintyMinutes = uncertaintyMinutes; }

    public String getReliability() { return reliability; }
    public void setReliability(String reliability) { this.reliability = reliability; }

    public boolean isReliable() { return isReliable; }
    public void setReliable(boolean reliable) { isReliable = reliable; }

    public String getExplanation() { return explanation; }
    public void setExplanation(String explanation) { this.explanation = explanation; }

    public String getClinicPolicyNotice() { return clinicPolicyNotice; }
    public void setClinicPolicyNotice(String clinicPolicyNotice) { this.clinicPolicyNotice = clinicPolicyNotice; }

    public String getLastCalculatedAt() { return lastCalculatedAt; }
    public void setLastCalculatedAt(String lastCalculatedAt) { this.lastCalculatedAt = lastCalculatedAt; }
}
