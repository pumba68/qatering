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
  VStack,
  FormControl,
  FormLabel,
  useToast,
  Spinner,
  Card,
  CardBody,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  HStack,
  Badge,
} from '@chakra-ui/react'
import { Wallet, Coins } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserBalance {
  id: string
  email: string
  name: string | null
  role: string
  balance: number
  walletUpdatedAt: string | null
  transactionCount: number
}

interface BalancesRes {
  users: UserBalance[]
  stats: {
    totalBalance: number
    zeroCount: number
    avgBalance: number
    userCount: number
  }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'uebersicht' | 'aufladen'

export default function AdminWalletPage() {
  const [tab, setTab] = useState<Tab>('uebersicht')
  const toast = useToast()

  // Read userId from URL on mount (redirect from old /admin/wallet/top-up?userId=xxx)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const uid = params.get('userId')
    if (uid) {
      setSelectedUserId(uid)
      setTab('aufladen')
    }
  }, [])

  // ── Übersicht state ────────────────────────────────────────────────────────
  const [balancesData, setBalancesData] = useState<BalancesRes | null>(null)
  const [balancesLoading, setBalancesLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState('balanceDesc')

  useEffect(() => {
    const t = setTimeout(() => fetchBalances(), search ? 300 : 0)
    return () => clearTimeout(t)
  }, [search, filter, sort])

  async function fetchBalances() {
    try {
      setBalancesLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filter) params.set('filter', filter)
      if (sort) params.set('sort', sort)
      const res = await fetch(`/api/admin/wallet/balances?${params.toString()}`)
      if (!res.ok) throw new Error()
      setBalancesData(await res.json())
    } catch {
      toast({ title: 'Fehler beim Laden der Guthaben', status: 'error', isClosable: true })
    } finally {
      setBalancesLoading(false)
    }
  }

  const handleAufladen = (userId: string) => {
    setSelectedUserId(userId)
    setTab('aufladen')
  }

  // ── Aufladen state ─────────────────────────────────────────────────────────
  const [users, setUsers] = useState<(UserBalance & { balance: number })[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  // Fetch full user list when aufladen tab is opened
  useEffect(() => {
    if (tab !== 'aufladen') return
    setUsersLoading(true)
    Promise.all([
      fetch('/api/admin/users').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/admin/wallet/balances').then((r) => (r.ok ? r.json() : { users: [] })),
    ])
      .then(([usersData, balancesRes]) => {
        const byId = new Map<string, number>()
        for (const u of (balancesRes.users ?? [])) byId.set(u.id, u.balance ?? 0)
        setUsers(usersData.map((u: UserBalance) => ({ ...u, balance: byId.get(u.id) ?? 0 })))
      })
      .catch(() => toast({ title: 'Fehler beim Laden der Nutzer', status: 'error', isClosable: true }))
      .finally(() => setUsersLoading(false))
  }, [tab])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!selectedUserId || isNaN(amt) || amt < 5 || amt > 200) {
      toast({ title: 'Ungültig', description: 'Nutzer wählen und Betrag zwischen 5 € und 200 € angeben.', status: 'warning', isClosable: true })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/wallet/top-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, amount: amt, note: note || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler beim Aufladen')
      toast({ title: `${amt.toFixed(2)} € erfolgreich aufgeladen.`, status: 'success', isClosable: true })
      setAmount('')
      setNote('')
      // Refresh balances in background
      fetchBalances()
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : 'Fehler beim Aufladen', status: 'error', isClosable: true })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)
  const users_ = balancesData?.users ?? []
  const stats = balancesData?.stats

  // ── Tab Button ─────────────────────────────────────────────────────────────

  function TabButton({ id, label, icon }: { id: Tab; label: string; icon: React.ReactNode }) {
    const active = tab === id
    return (
      <button
        onClick={() => setTab(id)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
          active
            ? 'bg-background text-foreground shadow-sm border border-border'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {icon}
        {label}
      </button>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl" py={8}>
        <Heading size="lg" mb={6} display="flex" alignItems="center" gap={2}>
          <Wallet className="w-8 h-8" />
          Guthaben verwalten
        </Heading>

        {/* Tab Switcher */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 border border-border mb-6 w-fit">
          <TabButton id="uebersicht" label="Übersicht" icon={<Wallet className="w-4 h-4" />} />
          <TabButton id="aufladen" label="Aufladen" icon={<Coins className="w-4 h-4" />} />
        </div>

        {/* ── Tab: Übersicht ────────────────────────────────────────────── */}
        {tab === 'uebersicht' && (
          <>
            {stats && (
              <HStack spacing={4} mb={6} flexWrap="wrap">
                <Badge colorScheme="green" px={3} py={1} borderRadius="md">
                  Gesamtguthaben: {formatCurrency(stats.totalBalance)}
                </Badge>
                <Badge colorScheme="gray" px={3} py={1} borderRadius="md">
                  Nutzer mit 0 €: {stats.zeroCount}
                </Badge>
                <Badge colorScheme="blue" px={3} py={1} borderRadius="md">
                  Ø pro Nutzer: {formatCurrency(stats.avgBalance)}
                </Badge>
              </HStack>
            )}

            <HStack spacing={4} mb={4} flexWrap="wrap">
              <Input
                placeholder="Suche (E-Mail, Name)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxW="xs"
                bg="white"
                _dark={{ bg: 'gray.800' }}
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--chakra-radii-md)', border: '1px solid var(--chakra-colors-gray-200)', background: 'white' }}
              >
                <option value="">Alle</option>
                <option value="low">Niedrig (&lt; 5 €)</option>
                <option value="zero">Null (0 €)</option>
                <option value="negative">Negativ</option>
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: 'var(--chakra-radii-md)', border: '1px solid var(--chakra-colors-gray-200)', background: 'white' }}
              >
                <option value="balanceDesc">Guthaben ↓</option>
                <option value="balanceAsc">Guthaben ↑</option>
                <option value="nameAsc">Name A–Z</option>
              </select>
              <Button size="sm" onClick={fetchBalances}>Aktualisieren</Button>
            </HStack>

            {balancesLoading ? (
              <Flex justify="center" py={12}><Spinner size="xl" /></Flex>
            ) : users_.length === 0 ? (
              <Text color="gray.500">Keine Nutzer gefunden.</Text>
            ) : (
              <Card>
                <TableContainer>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Nutzer</Th>
                        <Th>Rolle</Th>
                        <Th isNumeric>Guthaben</Th>
                        <Th>Transaktionen</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {users_.map((u) => (
                        <Tr key={u.id}>
                          <Td>
                            <Text fontWeight="medium">{u.name || '–'}</Text>
                            <Text fontSize="xs" color="gray.600">{u.email}</Text>
                          </Td>
                          <Td>{u.role}</Td>
                          <Td isNumeric>
                            <Badge colorScheme={u.balance < 0 ? 'red' : u.balance === 0 ? 'orange' : u.balance < 5 ? 'yellow' : 'green'}>
                              {formatCurrency(u.balance)}
                            </Badge>
                          </Td>
                          <Td>{u.transactionCount}</Td>
                          <Td>
                            <Button size="xs" variant="outline" colorScheme="blue" onClick={() => handleAufladen(u.id)}>
                              Aufladen
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Card>
            )}
          </>
        )}

        {/* ── Tab: Aufladen ─────────────────────────────────────────────── */}
        {tab === 'aufladen' && (
          <Box maxW="md">
            {usersLoading ? (
              <Flex justify="center" py={12}><Spinner size="xl" /></Flex>
            ) : (
              <Card>
                <CardBody>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <FormControl isRequired>
                        <FormLabel>Mitarbeiter auswählen</FormLabel>
                        <Select
                          value={selectedUserId}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          placeholder="– Bitte wählen –"
                        >
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name || u.email} · {formatCurrency(u.balance)}
                            </option>
                          ))}
                        </Select>
                        {selectedUser && (
                          <Text mt={2} fontSize="sm" color="gray.600">
                            Aktuelles Guthaben: {formatCurrency(selectedUser.balance)}
                          </Text>
                        )}
                      </FormControl>
                      <FormControl isRequired>
                        <FormLabel>Betrag (€)</FormLabel>
                        <Input
                          type="number"
                          min={5}
                          max={200}
                          step="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="z.B. 50"
                        />
                        <Text mt={1} fontSize="xs" color="gray.500">Min. 5 €, max. 200 € pro Aufladung</Text>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Notiz (optional)</FormLabel>
                        <Input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="z.B. Barzahlung 2026-01-24"
                        />
                      </FormControl>
                      <Button type="submit" colorScheme="blue" width="full" isLoading={submitting}>
                        Guthaben hinzufügen
                      </Button>
                    </VStack>
                  </form>
                </CardBody>
              </Card>
            )}
          </Box>
        )}
      </Container>
    </Box>
  )
}
