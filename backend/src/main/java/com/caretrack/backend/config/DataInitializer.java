package com.caretrack.backend.config;

import com.caretrack.backend.entity.Appointment;
import com.caretrack.backend.entity.Doctor;
import com.caretrack.backend.repository.AppointmentRepository;
import com.caretrack.backend.repository.DoctorRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;

    public DataInitializer(DoctorRepository doctorRepository, AppointmentRepository appointmentRepository) {
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Override
    public void run(String... args) {
        if (doctorRepository.count() == 0) {
            seedDoctors();
        }

        // Normalize future appointments: if appointment date is not today, reset token and mark as 'scheduled'
        LocalDate today = LocalDate.now();
        List<Appointment> allAppts = appointmentRepository.findAll();
        for (Appointment a : allAppts) {
            if (a.getAppointmentDate() != null && !a.getAppointmentDate().isEqual(today)) {
                if ("in-consultation".equalsIgnoreCase(a.getStatus()) || "waiting".equalsIgnoreCase(a.getStatus()) || (a.getTokenNumber() != null && !a.getTokenNumber().isBlank())) {
                    a.setStatus("scheduled");
                    a.setQueueStatus("scheduled");
                    a.setTokenNumber("");
                    a.setCalledAt("");
                    appointmentRepository.save(a);
                }
            }
        }
    }

    private void seedDoctors() {
        List<Doctor> doctors = new ArrayList<>();

        doctors.add(createDoc("Dr. Ananya Rao", "Cardiology", "MBBS, MD (Cardiology), DM", 15, "800.00"));
        doctors.add(createDoc("Dr. Ramesh Kumar", "Cardiology", "MBBS, MD (Internal Medicine), DM", 12, "700.00"));
        doctors.add(createDoc("Dr. Sneha Reddy", "Dermatology", "MBBS, MD (Dermatology)", 10, "600.00"));
        doctors.add(createDoc("Dr. Vikram Singh", "Dermatology", "MBBS, DVD, DNB", 8, "550.00"));
        doctors.add(createDoc("Dr. Amit Patel", "General Medicine", "MBBS, MD (General Medicine)", 20, "500.00"));
        doctors.add(createDoc("Dr. Priya Sharma", "General Medicine", "MBBS, DNB (Family Medicine)", 14, "500.00"));
        doctors.add(createDoc("Dr. Suresh Nair", "Orthopedics", "MBBS, MS (Ortho), MCh", 18, "900.00"));
        doctors.add(createDoc("Dr. Kavitha Menon", "Orthopedics", "MBBS, DNB (Orthopaedics)", 11, "750.00"));
        doctors.add(createDoc("Dr. Deepa Krishnan", "Pediatrics", "MBBS, MD (Pediatrics), DCH", 16, "600.00"));
        doctors.add(createDoc("Dr. Rajesh Gupta", "Pediatrics", "MBBS, DNB (Pediatrics)", 9, "550.00"));
        doctors.add(createDoc("Dr. Meera Iyer", "Neurology", "MBBS, MD (Neurology), DM", 22, "1000.00"));
        doctors.add(createDoc("Dr. Sanjay Desai", "Neurology", "MBBS, DNB (Neurosciences)", 13, "850.00"));
        doctors.add(createDoc("Dr. Lakshmi Venkat", "Gynecology", "MBBS, MS (OBG), DNB", 17, "700.00"));
        doctors.add(createDoc("Dr. Pooja Agarwal", "Gynecology", "MBBS, DGO, DNB", 10, "650.00"));
        doctors.add(createDoc("Dr. Arjun Pillai", "ENT", "MBBS, MS (ENT), DNB", 14, "600.00"));
        doctors.add(createDoc("Dr. Nisha Thomas", "ENT", "MBBS, DLO, DNB (ENT)", 7, "500.00"));

        doctorRepository.saveAll(doctors);
    }

    private Doctor createDoc(String name, String spec, String qual, int exp, String fee) {
        Doctor doc = new Doctor();
        doc.setFullName(name);
        doc.setSpecialization(spec);
        doc.setQualification(qual);
        doc.setExperienceYears(exp);
        doc.setConsultationFee(new BigDecimal(fee));
        doc.setAvailableDays(new ArrayList<>(List.of("Monday", "Tuesday", "Wednesday", "Thursday", "Friday")));
        doc.setAvailableFrom(LocalTime.of(9, 0));
        doc.setAvailableTo(LocalTime.of(17, 0));
        doc.setSlotDuration(20);
        doc.setBreakStart(LocalTime.of(13, 0));
        doc.setBreakEnd(LocalTime.of(14, 0));
        doc.setClinicStatus("active");
        doc.setStatusMessage("In Clinic · Calling patients on time");
        return doc;
    }
}
