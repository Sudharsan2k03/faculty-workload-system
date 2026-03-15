import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import FacultyLayout from './layouts/FacultyLayout';

import AdminDashboard from './pages/Admin/AdminDashboard';
import FacultyMgmt from './pages/Admin/FacultyMgmt';
import SubjectMgmt from './pages/Admin/SubjectMgmt';
import ClassroomMgmt from './pages/Admin/ClassroomMgmt';
import WorkloadMgmt from './pages/Admin/WorkloadMgmt';
import TimetableGen from './pages/Admin/TimetableGen';
import DepartmentMgmt from './pages/Admin/DepartmentMgmt';
import Reports from './pages/Admin/Reports';
import RoomTypeMgmt from './pages/Admin/RoomTypeMgmt';

import FacultyDashboard from './pages/Faculty/FacultyDashboard';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'admin' ? '/admin' : '/faculty'} />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={user && user.role === 'admin' ? <AdminLayout /> : <Navigate to="/login" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="departments" element={<DepartmentMgmt />} />
          <Route path="faculty" element={<FacultyMgmt />} />
          <Route path="subjects" element={<SubjectMgmt />} />
          <Route path="classrooms" element={<ClassroomMgmt />} />
          <Route path="workload" element={<WorkloadMgmt />} />
          <Route path="timetable" element={<TimetableGen />} />
          <Route path="reports" element={<Reports />} />
          <Route path="room-types" element={<RoomTypeMgmt />} />
        </Route>

        {/* Faculty Routes */}
        <Route path="/faculty" element={user && user.role === 'faculty' ? <FacultyLayout /> : <Navigate to="/login" />}>
          <Route index element={<FacultyDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
