import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import RoomEntry from './pages/RoomEntry'
import RoomHome from './pages/Room/RoomHome'
import Attendees from './pages/Room/Attendees'
import DishesList from './pages/Room/Dishes/DishesList'
import DishDetail from './pages/Room/Dishes/DishDetail'
import IngredientsList from './pages/Room/Ingredients/IngredientsList'
import IngredientDetail from './pages/Room/Ingredients/IngredientDetail'
import AssignmentsList from './pages/Room/Assignments/AssignmentsList'
import MembersList from './pages/Room/Members/MembersList'
import AdminLogin from './pages/Admin/AdminLogin'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminRoomSetup from './pages/Admin/AdminRoomSetup'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/rooms/:slug" element={<AdminRoomSetup />} />
      <Route path="/room/:slug" element={<RoomEntry />} />
      <Route path="/room/:slug/home" element={<RoomHome />} />
      <Route path="/room/:slug/attendees" element={<Attendees />} />
      <Route path="/room/:slug/dishes" element={<DishesList />} />
      <Route path="/room/:slug/dishes/:dishId" element={<DishDetail />} />
      <Route path="/room/:slug/ingredients" element={<IngredientsList />} />
      <Route path="/room/:slug/ingredients/:ingredientId" element={<IngredientDetail />} />
      <Route path="/room/:slug/assignments" element={<AssignmentsList />} />
      <Route path="/room/:slug/members" element={<MembersList />} />
    </Routes>
  )
}
