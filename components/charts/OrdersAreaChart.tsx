'use client'

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface OrderTrendData {
  day: string
  currentMonth: number
  lastMonth: number
}

interface OrdersAreaChartProps {
  data: OrderTrendData[]
}

const chartConfig = {
  currentMonth: {
    label: 'Dieser Monat',
    color: 'hsl(262, 83%, 58%)', // Purple
  },
  lastMonth: {
    label: 'Vormonat',
    color: 'hsl(340, 82%, 52%)', // Pink
  },
} satisfies ChartConfig

export function OrdersAreaChart({ data }: OrdersAreaChartProps) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground">Bestellverlauf</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Bestellungen pro Tag (Zeitraum vs. Vormonat bei Monatsansicht)
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ChartContainer config={chartConfig} className="h-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => (typeof value === 'string' && value.startsWith('Tag ') ? value.split(' ')[1] : value)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="currentMonth"
              type="natural"
              fill="var(--color-currentMonth)"
              fillOpacity={0.4}
              stroke="var(--color-currentMonth)"
              stackId="a"
            />
            <Area
              dataKey="lastMonth"
              type="natural"
              fill="var(--color-lastMonth)"
              fillOpacity={0.4}
              stroke="var(--color-lastMonth)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}