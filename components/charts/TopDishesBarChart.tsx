'use client'

import { TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface TopDish {
  dish: string
  orders: number
  rank: number
}

interface TopDishesBarChartProps {
  data: TopDish[]
}

const chartConfig = {
  orders: {
    label: 'Bestellungen',
    color: 'hsl(var(--chart-1))',
  },
  label: {
    color: 'var(--background)',
  },
} satisfies ChartConfig

export function TopDishesBarChart({ data }: TopDishesBarChartProps) {
  // Bereite Daten für Chart vor (Top 5)
  const chartData = data.slice(0, 5).map((item) => ({
    dish: item.dish,
    orders: item.orders,
    rank: item.rank,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Gerichte</CardTitle>
        <CardDescription>Beliebteste Gerichte diesen Monat</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ChartContainer config={chartConfig} className="h-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 16,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="dish"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => (value.length > 15 ? value.slice(0, 15) + '...' : value)}
              hide
            />
            <XAxis dataKey="orders" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="orders"
              layout="vertical"
              fill="var(--color-orders)"
              radius={4}
            >
              <LabelList
                dataKey="dish"
                position="insideLeft"
                offset={8}
                className="fill-[--color-label]"
                fontSize={12}
              />
              <LabelList
                dataKey="orders"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Top {chartData.length} Gerichte diesen Monat <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Sortiert nach Anzahl der Bestellungen
        </div>
      </CardFooter>
    </Card>
  )
}