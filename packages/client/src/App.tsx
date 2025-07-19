import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Toolbar from '@pages/toolbar'
import CanvasAttr from '@components/CanvasAttr'
import LeftPanel from '@/pages/LeftPanel'
import DrawPanel from '@/pages/DrawPanel'

interface CanvasStyleData {
  color: string;
  opacity: number;
  backgroundColor: string;
  fontSize: number;
}

function App() {
  const [canvasStyleData, setCanvasStyleData] = useState<CanvasStyleData>({
    color: '#000000',
    opacity: 100,
    backgroundColor: '#ffffff',
    fontSize: 14,
  });

  const updateCanvasStyleData = (key: string, value: string | number) => {
    setCanvasStyleData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
    console.log(canvasStyleData);
  };

  return (
    <>
      <Toolbar />
      <main className='app-container'>
        {/* 三栏布局 */}
        <section className='left-panel'>
          <LeftPanel />
        </section>
        <section className='draw-panel'>
          <DrawPanel />
        </section>
        <section className='right-panel'>
          <CanvasAttr 
            canvasStyleData={canvasStyleData} 
            updateCanvasStyleData={updateCanvasStyleData} 
          />
        </section>
      </main>
    </>
  )
}

export default App
