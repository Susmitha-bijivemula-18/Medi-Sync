package com.caretrack.backend.repository;

import com.caretrack.backend.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID> {
    List<Appointment> findAllByOrderByCreatedAtDesc();

    List<Appointment> findByDoctorIdOrderByCreatedAtDesc(UUID doctorId);

    List<Appointment> findByDoctorIdAndAppointmentDateOrderByCreatedAtAsc(UUID doctorId, LocalDate appointmentDate);

    List<Appointment> findByDoctorIdAndAppointmentDateAndStatusOrderByCreatedAtAsc(UUID doctorId, LocalDate appointmentDate, String status);

    List<Appointment> findByDoctorIdAndAppointmentDateAndAppointmentTimeAndStatusNot(
        UUID doctorId, LocalDate appointmentDate, String appointmentTime, String status
    );

    List<Appointment> findByPatientPhoneOrPatientEmailOrderByCreatedAtDesc(String patientPhone, String patientEmail);

    List<Appointment> findByPatientIdOrderByCreatedAtDesc(String patientId);

    List<Appointment> findByPatientEmailOrderByCreatedAtDesc(String patientEmail);

    List<Appointment> findByAppointmentDate(LocalDate appointmentDate);

    List<Appointment> findByTokenNumberOrderByCreatedAtDesc(String tokenNumber);
}
