import { Routes, Route} from 'react-router-dom'
import SignupForm from './components/Signup'
import Signin from './components/Signin'

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/signin" element={<Signin />} />
    </Routes>
  )
}

export default App
