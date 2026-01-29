'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  useToast,
  Spinner,
  Card,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  Badge,
  Select,
  Link,
} from '@chakra-ui/react'
import { ShoppingBag, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import NextLink from 'next/link'

type SortBy = 'createdAt' | 'pickupDate' | 'totalAmount' | 'status' | 'pickupCode'
type SortOrder = 'asc' | 'desc'

interface Location {
  id: string
  name: string
}

interface User {
  id: string
  email: string
  name: string | null
}

interface OrderItem {
  id: string
  quantity: number
  menuItem: {
    dish: { name: string }
  }
}

interface Order {
  id: string
  pickupCode: string
  status: string
  paymentStatus: string
  totalAmount: string
  finalAmount: string | null
  pickupDate: string
  createdAt: string
  user: { id: string; name: string | null; email: string }
  location: { id: string; name: string }
  items: OrderItem[]
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ausstehend',
  CONFIRMED: 'Bestätigt',
  PREPARING: 'In Zubereitung',
  READY: 'Fertig',
  PICKED_UP: 'Abgeholt',
  CANCELLED: 'Storniert',
}

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: 'Offen',
  COMPLETED: 'Bezahlt',
  PROCESSING: 'In Bearbeitung',
  FAILED: 'Fehlgeschlagen',
  REFUNDED: 'Erstattet',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [locationId, setLocationId] = useState('')
  const [userId, setUserId] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const toast = useToast()

  useEffect(() => {
    fetchLocations()
    fetchUsers()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/orders/page.tsx:mount',message:'AdminOrdersPage mount',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [dateFrom, dateTo, locationId, userId, status, sortBy, sortOrder])

  async function fetchLocations() {
    try {
      const res = await fetch('/api/admin/locations')
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : []
        setLocations(list)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/orders/page.tsx:fetchLocations',message:'fetchLocations success',data:{count:list.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
      }
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/orders/page.tsx:fetchLocations',message:'fetchLocations error',data:{err:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      console.error('Fehler beim Laden der Standorte:', e)
    }
  }

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : []
        setUsers(list)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/orders/page.tsx:fetchUsers',message:'fetchUsers success',data:{count:list.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
      }
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/orders/page.tsx:fetchUsers',message:'fetchUsers error',data:{err:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      console.error('Fehler beim Laden der Nutzer:', e)
    }
  }

  async function fetchOrders() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/orders/page.tsx:fetchOrders',message:'fetchOrders start',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (locationId) params.set('locationId', locationId)
      if (userId) params.set('userId', userId)
      if (status) params.set('status', status)
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      if (!res.ok) throw new Error('Fehler beim Laden')
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setOrders(list)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/orders/page.tsx:fetchOrders',message:'fetchOrders success',data:{count:list.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
    } catch (e) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/orders/page.tsx:fetchOrders',message:'fetchOrders error',data:{err:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      toast({ title: 'Fehler', description: 'Fehler beim Laden der Bestellungen', status: 'error', isClosable: true })
    } finally {
      setLoading(false)
    }
  }

  function toggleSort(field: SortBy) {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  function SortIcon({ field }: { field: SortBy }) {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? (
      <ChevronUp style={{ display: 'inline', width: 16, height: 16, marginLeft: 2 }} />
    ) : (
      <ChevronDown style={{ display: 'inline', width: 16, height: 16, marginLeft: 2 }} />
    )
  }

  const amount = (o: Order) =>
    o.finalAmount && Number(o.finalAmount) > 0 ? Number(o.finalAmount) : Number(o.totalAmount)

  const renderBranch = loading ? 'loading' : orders.length === 0 ? 'empty' : 'table'
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/admin/orders/page.tsx:render',message:'render branch',data:{loading,ordersLen:orders.length,renderBranch},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
  }, [loading, orders.length])

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl" py={8}>
        <Heading size="lg" mb={6} display="flex" alignItems="center" gap={2}>
          <ShoppingBag className="w-8 h-8" />
          Bestellungen
        </Heading>

        <HStack spacing={4} mb={6} flexWrap="wrap" gap={2}>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            maxW="40"
            bg="white"
            _dark={{ bg: 'gray.800' }}
            placeholder="Von"
            size="sm"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            maxW="40"
            bg="white"
            _dark={{ bg: 'gray.800' }}
            placeholder="Bis"
            size="sm"
          />
          <Select
            placeholder="Standort"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            maxW="48"
            bg="white"
            _dark={{ bg: 'gray.800' }}
            size="sm"
          >
            <option value="">Alle Standorte</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
          <Select
            placeholder="Kunde"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            maxW="56"
            bg="white"
            _dark={{ bg: 'gray.800' }}
            size="sm"
          >
            <option value="">Alle Kunden</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email} ({u.email})
              </option>
            ))}
          </Select>
          <Select
            placeholder="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            maxW="40"
            bg="white"
            _dark={{ bg: 'gray.800' }}
            size="sm"
          >
            <option value="">Alle Status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={fetchOrders}>
            Aktualisieren
          </Button>
        </HStack>

        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" />
          </Flex>
        ) : orders.length === 0 ? (
          <Text color="gray.500">Keine Bestellungen gefunden.</Text>
        ) : (
          <Card>
            <TableContainer overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>
                      <Button
                        variant="ghost"
                        size="sm"
                        height="auto"
                        px={1}
                        onClick={() => toggleSort('pickupCode')}
                        rightIcon={<SortIcon field="pickupCode" />}
                        _hover={{ textDecoration: 'underline' }}
                      >
                        Abholcode
                      </Button>
                    </Th>
                    <Th>Kunde</Th>
                    <Th>Standort</Th>
                    <Th>
                      <Button
                        variant="ghost"
                        size="sm"
                        height="auto"
                        px={1}
                        onClick={() => toggleSort('status')}
                        rightIcon={<SortIcon field="status" />}
                        _hover={{ textDecoration: 'underline' }}
                      >
                        Status
                      </Button>
                    </Th>
                    <Th>Zahlung</Th>
                    <Th isNumeric>
                      <Button
                        variant="ghost"
                        size="sm"
                        height="auto"
                        px={1}
                        onClick={() => toggleSort('totalAmount')}
                        rightIcon={<SortIcon field="totalAmount" />}
                        _hover={{ textDecoration: 'underline' }}
                        justifyContent="flex-end"
                        width="full"
                      >
                        Betrag
                      </Button>
                    </Th>
                    <Th>
                      <Button
                        variant="ghost"
                        size="sm"
                        height="auto"
                        px={1}
                        onClick={() => toggleSort('pickupDate')}
                        rightIcon={<SortIcon field="pickupDate" />}
                        _hover={{ textDecoration: 'underline' }}
                      >
                        Abholdatum
                      </Button>
                    </Th>
                    <Th>
                      <Button
                        variant="ghost"
                        size="sm"
                        height="auto"
                        px={1}
                        onClick={() => toggleSort('createdAt')}
                        rightIcon={<SortIcon field="createdAt" />}
                        _hover={{ textDecoration: 'underline' }}
                      >
                        Bestellt am
                      </Button>
                    </Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orders.map((o) => (
                    <Tr key={o.id}>
                      <Td>
                        <Text fontFamily="mono" fontWeight="medium">
                          {o.pickupCode}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontWeight="medium">{o.user.name || '–'}</Text>
                        <Text fontSize="xs" color="gray.600">
                          {o.user.email}
                        </Text>
                      </Td>
                      <Td>{o.location.name}</Td>
                      <Td>
                        <Badge
                          colorScheme={
                            o.status === 'CANCELLED'
                              ? 'red'
                              : o.status === 'PICKED_UP'
                                ? 'green'
                                : o.status === 'READY'
                                  ? 'blue'
                                  : 'gray'
                          }
                        >
                          {STATUS_LABELS[o.status] ?? o.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={o.paymentStatus === 'COMPLETED' ? 'green' : 'yellow'}>
                          {PAYMENT_LABELS[o.paymentStatus] ?? o.paymentStatus}
                        </Badge>
                      </Td>
                      <Td isNumeric fontWeight="medium">
                        {formatCurrency(amount(o))}
                      </Td>
                      <Td>{formatDate(o.pickupDate)}</Td>
                      <Td>
                        {formatDate(o.createdAt)} {formatTime(o.createdAt)}
                      </Td>
                      <Td>
                        <Link
                          as={NextLink}
                          href={`/order/confirmation/${o.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          fontSize="sm"
                          display="inline-flex"
                          alignItems="center"
                          gap={1}
                        >
                          Anzeigen
                          <ExternalLink style={{ width: 14, height: 14 }} />
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Container>
    </Box>
  )
}
