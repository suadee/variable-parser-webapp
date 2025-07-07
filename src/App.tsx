import { useState } from 'react'
import ParserRule from './components/ParserRule'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>디자인 토큰 파서</h1>
        <p>JSON 파일을 CSS 변수 또는 토큰으로 변환합니다</p>
      </header>
      <main className="app-main">
        <ParserRule />
      </main>
      <footer className="app-footer">
        <p>&copy; 2025 디자인 토큰 파서. 모든 권리 보유.</p>
      </footer>
    </div>
  )
}

export default App
