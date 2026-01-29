'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export interface WeekdayDataItem {
  day: string
  count: number
}

interface WeekdayBarChartProps {
  data: WeekdayDataItem[]
}

const chartConfig = {
  count: {
    label: 'Bestellungen',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export function WeekdayBarChart({ data }: WeekdayBarChartProps) {
  const hasData = data.some((d) => d.count > 0)

  if (!hasData) {
    return (
      <Card className="border-border/50 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-foreground">Bestellungen pro Wochentag</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Verteilung Mo–So im gewählten Zeitraum
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Keine Bestellungen im Zeitraum</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm rounded-2xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground">Bestellungen pro Wochentag</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Verteilung Mo–So im gewählten Zeitraum
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ChartContainer config={chartConfig} className="h-full">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis dataKey="count" tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
