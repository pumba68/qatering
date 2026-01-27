// Utility-Funktionen für Wochen-Berechnung

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export function getWeekStartDate(weekNumber: number, year: number): Date {
  const date = new Date(year, 0, 1)
  const daysToAdd = (weekNumber - 1) * 7
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() + daysToAdd - date.getDay() + 1) // Montag
  startOfWeek.setHours(0, 0, 0, 0)
  return startOfWeek
}

export function getWeekDays(weekNumber: number, year: number): Date[] {
  const startDate = getWeekStartDate(weekNumber, year)
  const days: Date[] = []
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate)
    day.setDate(startDate.getDate() + i)
    days.push(day)
  }
  
  return days
}

export function formatDayName(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', { weekday: 'long' }).format(date)
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}
