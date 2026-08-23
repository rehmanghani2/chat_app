import React, { useContext } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import CallPage from './pages/CallPage'
import IncomingCallModal from './components/IncomingCallModal'
import {Toaster} from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext'

const App = () => {
  const {authUser} = useContext(AuthContext);
  return (
    <div className="bg-[url('/bgImage.svg')] bg-contain">
      <Toaster />
      <IncomingCallModal />
      <Routes>
        <Route path='/'  element={authUser ? <HomePage/> : <Navigate to="/login" /> } />
        <Route path='/login' element={!authUser ? <LoginPage/> : <Navigate to="/"/> } />
        <Route path='/profile' element={authUser ? <ProfilePage/> : <Navigate to="/login" /> } />
        <Route path='/call/:id' element={ <CallPage /> } />
      </Routes>
    </div>
  )
}

export default App
