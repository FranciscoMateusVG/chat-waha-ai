import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Notifications } from '@/pages/Notifications'
import { Chats } from '@/pages/Chats'
import { Knowledge } from '@/pages/Knowledge'
import { AITest } from '@/pages/AITest'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="chats" element={<Chats />} />
          <Route path="knowledge" element={<Knowledge />} />
          <Route path="ai-test" element={<AITest />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
