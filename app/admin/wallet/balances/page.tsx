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
  Link,
} from '@chakra-ui/react'
import { Wallet, Coins } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import NextLink from 'next/link'

interface UserBalance {
  id: string
  email: string
  name: string | null
  role: string
  balance: number
  walletUpdatedAt: string | null
  transactionCount: number
}

interface Res {
  users: UserBalance[]
  stats: {
    totalBalance: number
    zeroCount: number
    avgBalance: number
    userCount: number
  }
}

export default function WalletBalancesPage() {
  const [data, setData] = useState<Res | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState('balanceDesc')
  const toast = useToast()

  useEffect(() => {
    const t = setTimeout(() => fetchData(), search ? 300 : 0)
    return () => clearTimeout(t)
  }, [search, filter, sort])

  async function fetchData() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filter) params.set('filter', filter)
      if (sort) params.set('sort', sort)
      const res = await fetch(`/api/admin/wallet/balances?${params.toString()}`)
      if (!res.ok) throw new Error('Fehler beim Laden')
      const json = await res.json()
      setData(json)
    } catch (e) {
      toast({ title: 'Fehler', description: 'Fehler beim Laden der Guthaben', status: 'error', isClosable: true })
    } finally {
      setLoading(false)
    }
  }

  const users = data?.users ?? []
  const stats = data?.stats

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl" py={8}>
        <Heading size="lg" mb={6} display="flex" alignItems="center" gap={2}>
          <Wallet className="w-8 h-8" />
          Guthaben verwalten
        </Heading>

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
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--chakra-radii-md)',
              border: '1px solid',
              background: 'var(--chakra-colors-white)',
            }}
          >
            <option value="">Alle</option>
            <option value="low">Niedrig (&lt; 5 €)</option>
            <option value="zero">Null (0 €)</option>
            <option value="negative">Negativ</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--chakra-radii-md)',
              border: '1px solid',
              background: 'var(--chakra-colors-white)',
            }}
          >
            <option value="balanceDesc">Guthaben ↓</option>
            <option value="balanceAsc">Guthaben ↑</option>
            <option value="nameAsc">Name A–Z</option>
          </select>
          <Button size="sm" onClick={fetchData}>
            Aktualisieren
          </Button>
        </HStack>

        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" />
          </Flex>
        ) : users.length === 0 ? (
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
                  {users.map((u) => (
                    <Tr key={u.id}>
                      <Td>
                        <Text fontWeight="medium">{u.name || '–'}</Text>
                        <Text fontSize="xs" color="gray.600">{u.email}</Text>
                      </Td>
                      <Td>{u.role}</Td>
                      <Td isNumeric>
                        <Badge
                          colorScheme={
                            u.balance < 0 ? 'red' : u.balance === 0 ? 'orange' : u.balance < 5 ? 'yellow' : 'green'
                          }
                        >
                          {formatCurrency(u.balance)}
                        </Badge>
                      </Td>
                      <Td>{u.transactionCount}</Td>
                      <Td>
                        <Link as={NextLink} href={`/admin/wallet/top-up?userId=${u.id}`} fontSize="sm">
                          Aufladen
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Card>
        )}

        <Flex mt={6} gap={4}>
          <Button leftIcon={<Coins />} as={NextLink} href="/admin/wallet/top-up" colorScheme="blue" size="sm">
            Guthaben aufladen
          </Button>
        </Flex>
      </Container>
    </Box>
  )
}
