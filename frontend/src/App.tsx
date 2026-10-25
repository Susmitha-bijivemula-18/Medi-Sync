import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { BookAppointment } from './pages/BookAppointment';
import { AppointmentForm } from './pages/AppointmentForm';
import { SpecialitiesPage } from './pages/SpecialitiesPage';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { QueueTracking } from './pages/QueueTracking';

// Doctor Portal Imports
import { DoctorLayout } from './components/layout/DoctorLayout';
import { DoctorLogin } from './pages/doctor/DoctorLogin';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { DoctorQueue } from './pages/doctor/DoctorQueue';
import { DoctorAppointments } from './pages/doctor/DoctorAppointments';
import { DoctorSchedule } from './pages/doctor/DoctorSchedule';
import { DoctorPatients } from './pages/doctor/DoctorPatients';

// Patient Sub-Pages
import { PatientDoctors } from './pages/patient/PatientDoctors';
import { PatientAppointments } from './pages/patient/PatientAppointments';
import { PatientRecords } from './pages/patient/PatientRecords';
import { PatientNotifications } from './pages/patient/PatientNotifications';
import { PatientProfile } from './pages/patient/PatientProfile';
import { PatientSettings } from './pages/patient/PatientSettings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/specialities" element={<SpecialitiesPage />} />
        <Route path="/specialties" element={<SpecialitiesPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/book-appointment" element={<BookAppointment />} />
        <Route path="/book-appointment/:doctorId" element={<AppointmentForm />} />
        
        {/* Patient Dashboard Routes */}
        <Route path="/patient" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="doctors" element={<PatientDoctors />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="queue" element={<QueueTracking />} />
          <Route path="records" element={<PatientRecords />} />
          <Route path="history" element={<Navigate to="records" replace />} />
          <Route path="notifications" element={<PatientNotifications />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="settings" element={<PatientSettings />} />
        </Route>

        {/* Doctor Portal Routes */}
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="queue" element={<DoctorQueue />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="patients" element={<DoctorPatients />} />
        </Route>

        {/* Catch-all to redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
