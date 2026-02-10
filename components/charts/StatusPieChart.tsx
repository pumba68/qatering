'use client'

import { Cell, Pie, PieChart } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ausstehend',
  CONFIRMED: 'Bestätigt',
  PREPARING: 'In Zubereitung',
  READY: 'Fertig',
  PICKED_UP: 'Abgeholt',
  CANCELLED: 'Storniert',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'hsl(45, 93%, 47%)',      // yellow/amber
  CONFIRMED: 'hsl(217, 91%, 60%)',   // blue
  PREPARING: 'hsl(262, 83%, 58%)',   // purple
  READY: 'hsl(142, 71%, 45%)',       // green
  PICKED_UP: 'hsl(215, 14%, 34%)',  // gray
  CANCELLED: 'hsl(0, 84%, 60%)',     // red
}

export interface StatusDistributionItem {
  status: string
  count: number
}

interface StatusPieChartProps {
  data: StatusDistributionItem[]
  /** Im Dashboard-Grid: Karte und Chart füllen die Zelle (responsive Höhe) */
  fillContainer?: boolean
}

function buildChartConfig(data: StatusDistributionItem[]): ChartConfig {
  const config: ChartConfig = {}
  data.forEach((item) => {
    config[item.status] = {
      label: STATUS_LABELS[item.status] ?? item.status,
      color: STATUS_COLORS[item.status] ?? 'hsl(var(--muted-foreground))',
    }
  })
  return config
}

export function StatusPieChart({ data, fillContainer }: StatusPieChartProps) {
  const chartData = data.map((item) => ({
    name: item.status,
    value: item.count,
    label: STATUS_LABELS[item.status] ?? item.status,
  }))

  const total = chartData.reduce((sum, d) => sum + d.value, 0)
  const config = buildChartConfig(data)
  const cardClass = fillContainer ? 'border-border/50 shadow-sm rounded-2xl h-full flex flex-col min-h-0' : 'border-border/50 shadow-sm rounded-2xl'
  const contentClass = fillContainer ? 'flex-1 min-h-0 pb-4' : ''
  const chartClass = fillContainer ? 'h-full min-h-0 w-full' : 'h-[240px]'

  if (chartData.length === 0 || total === 0) {
    return (
      <Card className={cardClass}>
        <CardHeader className="pb-3 shrink-0">
          <CardTitle className="text-lg font-bold text-foreground">Bestellstatus</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Verteilung der Bestellungen nach Status
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
        <CardTitle className="text-lg font-bold text-foreground">Bestellstatus</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Verteilung der Bestellungen nach Status
        </CardDescription>
      </CardHeader>
      <CardContent className={contentClass || 'pb-4'}>
        <ChartContainer config={config} className={chartClass}>
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${value} Bestellungen`, undefined]}
                  nameKey="label"
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              verticalAlign="bottom"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
