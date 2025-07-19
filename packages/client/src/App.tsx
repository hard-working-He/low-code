import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Toolbar from '@pages/toolbar'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Toolbar />
      
    </>
  )
}

export default App
