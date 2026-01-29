'use client'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Top Gerichte</CardTitle>
        <CardDescription className="text-sm">Beliebteste Gerichte diesen Monat</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
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
    </Card>
  )
}