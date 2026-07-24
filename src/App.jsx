import './App.css'
import Login from './Components/Login';
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import TeacherDashboard from "./Components/TeacherDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/teacher-dashboard"
          element={<TeacherDashboard />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
