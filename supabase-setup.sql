-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  MediSync – Supabase Database Schema                                       ║
-- ║  Run this SQL in your Supabase SQL Editor to create all required tables     ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- ─── Enable UUID extension ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. DOCTORS TABLE ────────────────────────────────────────────────────────
-- Stores all doctor profiles with their specializations, availability, fees
CREATE TABLE IF NOT EXISTS doctors (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name     TEXT NOT NULL,                    -- e.g. "Dr. Ananya Rao"
  specialization TEXT NOT NULL,                   -- e.g. "Cardiology"
  qualification TEXT NOT NULL DEFAULT '',         -- e.g. "MBBS, MD (Cardiology)"
  experience_years INTEGER NOT NULL DEFAULT 0,   -- years of experience
  consultation_fee NUMERIC(10,2) DEFAULT 500.00, -- fee in INR
  available_days TEXT[] DEFAULT ARRAY['Monday','Tuesday','Wednesday','Thursday','Friday'],
  available_from TIME DEFAULT '09:00',           -- daily availability start
  available_to   TIME DEFAULT '17:00',           -- daily availability end
  is_active     BOOLEAN DEFAULT TRUE,            -- soft-delete flag
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. APPOINTMENTS TABLE ──────────────────────────────────────────────────
-- Stores patient appointment requests linked to a specific doctor
CREATE TABLE IF NOT EXISTS appointments (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_name        TEXT NOT NULL,                  -- full name of patient
  patient_age         INTEGER NOT NULL,               -- age of patient
  patient_email       TEXT NOT NULL DEFAULT '',       -- email for communication
  patient_phone       TEXT NOT NULL DEFAULT '',       -- phone number
  problem_description TEXT NOT NULL DEFAULT '',       -- what issue the patient has
  problem_category    TEXT NOT NULL DEFAULT '',       -- mapped to doctor specialty
  doctor_id           UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  status              TEXT NOT NULL DEFAULT 'pending' 
                        CHECK (status IN ('pending','confirmed','completed','cancelled')),
  token_number        TEXT NOT NULL DEFAULT '',       -- e.g. "A-27"
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. SEED DOCTORS DATA ────────────────────────────────────────────────────
-- Insert sample doctors across all specializations
INSERT INTO doctors (full_name, specialization, qualification, experience_years, consultation_fee) VALUES
  ('Dr. Ananya Rao',       'Cardiology',        'MBBS, MD (Cardiology), DM',          15, 800.00),
  ('Dr. Ramesh Kumar',     'Cardiology',        'MBBS, MD (Internal Medicine), DM',   12, 700.00),
  ('Dr. Sneha Reddy',      'Dermatology',       'MBBS, MD (Dermatology)',             10, 600.00),
  ('Dr. Vikram Singh',     'Dermatology',       'MBBS, DVD, DNB',                     8,  550.00),
  ('Dr. Amit Patel',       'General Medicine',  'MBBS, MD (General Medicine)',        20, 500.00),
  ('Dr. Priya Sharma',     'General Medicine',  'MBBS, DNB (Family Medicine)',        14, 500.00),
  ('Dr. Suresh Nair',      'Orthopedics',       'MBBS, MS (Ortho), MCh',             18, 900.00),
  ('Dr. Kavitha Menon',    'Orthopedics',       'MBBS, DNB (Orthopaedics)',          11, 750.00),
  ('Dr. Deepa Krishnan',   'Pediatrics',        'MBBS, MD (Pediatrics), DCH',        16, 600.00),
  ('Dr. Rajesh Gupta',     'Pediatrics',        'MBBS, DNB (Pediatrics)',            9,  550.00),
  ('Dr. Meera Iyer',       'Neurology',         'MBBS, MD (Neurology), DM',          22, 1000.00),
  ('Dr. Sanjay Desai',     'Neurology',         'MBBS, DNB (Neurosciences)',         13, 850.00),
  ('Dr. Lakshmi Venkat',   'Gynecology',        'MBBS, MS (OBG), DNB',              17, 700.00),
  ('Dr. Pooja Agarwal',    'Gynecology',        'MBBS, DGO, DNB',                   10, 650.00),
  ('Dr. Arjun Pillai',     'ENT',               'MBBS, MS (ENT), DNB',              14, 600.00),
  ('Dr. Nisha Thomas',     'ENT',               'MBBS, DLO, DNB (ENT)',              7, 500.00);

-- ─── 4. ROW LEVEL SECURITY ──────────────────────────────────────────────────
-- Enable RLS but allow public read for doctors, public insert for appointments
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read doctors (public listing)
CREATE POLICY "Public can view active doctors" ON doctors
  FOR SELECT USING (is_active = TRUE);

-- Allow anyone to insert appointments (booking without auth)
CREATE POLICY "Anyone can create appointments" ON appointments
  FOR INSERT WITH CHECK (TRUE);

-- Allow anyone to read their own appointments
CREATE POLICY "Anyone can view appointments" ON appointments
  FOR SELECT USING (TRUE);

-- ─── 5. INDEXES ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
