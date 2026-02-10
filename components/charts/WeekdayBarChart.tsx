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
  /** Im Dashboard-Grid: Karte und Chart füllen die Zelle (responsive Höhe) */
  fillContainer?: boolean
}

const chartConfig = {
  count: {
    label: 'Bestellungen',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export function WeekdayBarChart({ data, fillContainer }: WeekdayBarChartProps) {
  const hasData = data.some((d) => d.count > 0)
  const cardClass = fillContainer ? 'border-border/50 shadow-sm rounded-2xl h-full flex flex-col min-h-0' : 'border-border/50 shadow-sm rounded-2xl'

  if (!hasData) {
    return (
      <Card className={cardClass}>
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="text-lg font-bold text-foreground">Bestellungen pro Wochentag</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Verteilung Mo–So im gewählten Zeitraum
          </CardDescription>
        </CardHeader>
        <CardContent className={fillContainer ? 'flex-1 min-h-0 flex items-center justify-center' : 'h-[280px] flex items-center justify-center'}>
          <p className="text-sm text-muted-foreground">Keine Bestellungen im Zeitraum</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cardClass}>
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-lg font-bold text-foreground">Bestellungen pro Wochentag</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Verteilung Mo–So im gewählten Zeitraum
        </CardDescription>
      </CardHeader>
      <CardContent className={fillContainer ? 'flex-1 min-h-0' : 'h-[280px]'}>
        <ChartContainer config={chartConfig} className="h-full min-h-0">
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
