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

        List<Doctor> savedDoctors = doctorRepository.saveAll(doctors);

        // Seed initial appointments for Dr. Ananya Rao
        Doctor ananya = savedDoctors.get(0);
        LocalDate today = LocalDate.now();

        Appointment a1 = new Appointment();
        a1.setPatientName("Ramesh Verma");
        a1.setPatientAge(58);
        a1.setPatientPhone("+91 98765 43210");
        a1.setPatientEmail("ramesh.v@example.com");
        a1.setDoctor(ananya);
        a1.setAppointmentDate(today);
        a1.setAppointmentTime("10:00 AM");
        a1.setProblemCategory("Cardiology");
        a1.setProblemDescription("Experiencing mild chest tightness on brisk walking and elevated BP readings (150/95) at home.");
        a1.setStatus("in-consultation");
        a1.setQueueStatus("in-consultation");
        a1.setTokenNumber("A-23");
        a1.setVitalsBp("148/92 mmHg");
        a1.setVitalsPulse("78 bpm");
        a1.setVitalsTemp("98.4 °F");
        a1.setVitalsWeight("74 kg");
        a1.setCalledAt("10:05 AM");

        Appointment a2 = new Appointment();
        a2.setPatientName("Sujatha Reddy");
        a2.setPatientAge(46);
        a2.setPatientPhone("+91 98480 22334");
        a2.setPatientEmail("sujatha.r@example.com");
        a2.setDoctor(ananya);
        a2.setAppointmentDate(today);
        a2.setAppointmentTime("10:20 AM");
        a2.setProblemCategory("Cardiology");
        a2.setProblemDescription("Palpitations after climbing stairs, routine quarterly lipid and ECG review.");
        a2.setStatus("waiting");
        a2.setQueueStatus("waiting");
        a2.setTokenNumber("A-24");
        a2.setVitalsBp("130/84 mmHg");
        a2.setVitalsPulse("86 bpm");
        a2.setVitalsTemp("98.6 °F");
        a2.setVitalsWeight("62 kg");

        Appointment a3 = new Appointment();
        a3.setPatientName("Venkatesh Murthy");
        a3.setPatientAge(64);
        a3.setPatientPhone("+91 94401 55667");
        a3.setPatientEmail("v.murthy@example.com");
        a3.setDoctor(ananya);
        a3.setAppointmentDate(today);
        a3.setAppointmentTime("10:40 AM");
        a3.setProblemCategory("Cardiology");
        a3.setProblemDescription("Post-stent 6-month checkup, breathlessness subsided, reviewing medication tolerance.");
        a3.setStatus("waiting");
        a3.setQueueStatus("waiting");
        a3.setTokenNumber("A-25");
        a3.setVitalsBp("124/80 mmHg");
        a3.setVitalsPulse("72 bpm");
        a3.setVitalsTemp("98.1 °F");
        a3.setVitalsWeight("68 kg");

        Appointment a4 = new Appointment();
        a4.setPatientName("Padma Lakshmi");
        a4.setPatientAge(52);
        a4.setPatientPhone("+91 91234 56789");
        a4.setPatientEmail("padma.l@example.com");
        a4.setDoctor(ananya);
        a4.setAppointmentDate(today);
        a4.setAppointmentTime("11:00 AM");
        a4.setProblemCategory("Cardiology");
        a4.setProblemDescription("Occasional lightheadedness upon standing up quickly, history of mild sinus bradycardia.");
        a4.setStatus("waiting");
        a4.setQueueStatus("waiting");
        a4.setTokenNumber("A-26");
        a4.setVitalsBp("118/76 mmHg");
        a4.setVitalsPulse("64 bpm");
        a4.setVitalsTemp("98.4 °F");
        a4.setVitalsWeight("57 kg");

        appointmentRepository.saveAll(List.of(a1, a2, a3, a4));
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
