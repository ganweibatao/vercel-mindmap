'use client'

import { useState } from 'react'
import MindMapCanvas from '@/components/MindMapCanvas'
import Toolbar from '@/components/Toolbar'
import { MindMapProvider } from '@/contexts/MindMapContext'

export default function Home() {
  return (
    <MindMapProvider>
      <div className="h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">XMind Web</h1>
            <p className="text-sm text-gray-600">在线思维导图工具</p>
          </div>
        </header>
        
        <Toolbar />
        
        <main className="flex-1 relative overflow-hidden">
          <MindMapCanvas />
        </main>
      </div>
    </MindMapProvider>
  )
} 