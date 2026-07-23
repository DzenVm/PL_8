'use client'
import { useEffect } from 'react'
import { runProbe } from '@/lib/probe'

export default function Probe() {
  useEffect(() => { runProbe() }, [])
  return null
}
