import { useState } from 'react'
import './App.css'
import { api } from './services/api'
import { useEffect } from 'react'

function App() {
  const [response, setResponse] = useState('')

  const getSystemPrompt = async () => {
    try {
      const response = await api.get('knowledge/system-prompt')
      if (response.data.success && response.data.data) {
        setResponse(response.data.data.content || 'Não há nenhum system prompt.')
      }
    } catch (error) {
      console.error(error)
      setResponse('Erro ao conectar com a API')
    }
  }

  useEffect(() => {
    getSystemPrompt()
  }, [])

  return (
    <>
      <h1>API Response:</h1>
      <div className="card">
        <p>
          {response}
        </p>
      </div>
    </>
  )
}

export default App
