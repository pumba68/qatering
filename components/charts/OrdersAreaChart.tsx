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
    color: 'hsl(var(--chart-1))',
  },
  lastMonth: {
    label: 'Vormonat',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

export function OrdersAreaChart({ data }: OrdersAreaChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bestellungen - Trend</CardTitle>
        <CardDescription>
          Vergleich: Aktueller Monat vs. Vormonat
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
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
              tickFormatter={(value) => value.split(' ')[1]}
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