import './App.css'
import Login from './Components/Login';
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Assessments from "./Components/Teacher/Assessments";
import Progress from "./Components/Teacher/Progress";
import Sections from "./Components/Teacher/Sections";
import Students from "./Components/Teacher/Students";
import TeacherDashboard from "./Components/Teacher/TeacherDashboard";
import TeacherLayout from "./Components/Teacher/TeacherLayout";
import Downloadpage from "./Components/Downloadpage";
import ResetPassword from "./Components/resetpassword";
import SuperAdminDashboard from "./Components/SuperAdmin/SuperAdminDashboard";
import SuperAdminLayout from "./Components/SuperAdmin/SuperAdminLayout";
import SuperAdminSections from "./Components/SuperAdmin/SuperAdminSections";
import SuperAdminStudents from "./Components/SuperAdmin/SuperAdminStudents";
import SuperAdminTeachers from "./Components/SuperAdmin/SuperAdminTeachers";
import CreateTeacherPassword from "./Components/Teacher/CreateTeacherPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/teacherpassword" element={<CreateTeacherPassword />} />
        <Route path="download" element={<Downloadpage />} />
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="sections" element={<Sections />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="progress" element={<Progress />} />
        </Route>

        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="students" element={<SuperAdminStudents />} />
          <Route path="sections" element={<SuperAdminSections />} />
          <Route path="teachers" element={<SuperAdminTeachers />} />
        </Route>

        <Route path="/teacher-dashboard" element={<Navigate to="/teacher" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
