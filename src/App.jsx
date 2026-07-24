import './App.css'
import Login from './Components/Login';
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Assessments from "./Components/Assessments";
import Progress from "./Components/Progress";
import Sections from "./Components/Sections";
import Students from "./Components/Students";
import TeacherDashboard from "./Components/TeacherDashboard";
import TeacherLayout from "./Components/TeacherLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="sections" element={<Sections />} />
          <Route path="assessments" element={<Assessments />} />
          <Route path="progress" element={<Progress />} />
        </Route>

        <Route path="/teacher-dashboard" element={<Navigate to="/teacher" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
