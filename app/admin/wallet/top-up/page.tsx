'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
} from '@chakra-ui/react'
import { Coins } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  balance?: number
}

export default function WalletTopUpPage() {
  const searchParams = useSearchParams()
  const userIdFromQuery = searchParams.get('userId') || ''
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(userIdFromQuery)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const toast = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const [usersRes, balancesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/wallet/balances'),
      ])
      const usersData = usersRes.ok ? await usersRes.json() : []
      const balancesData = balancesRes.ok ? await balancesRes.json() : { users: [] }
      const byId = new Map<string, number>()
      for (const u of balancesData.users || []) byId.set(u.id, u.balance ?? 0)
      const list = usersData.map((u: User) => ({
        ...u,
        balance: byId.get(u.id) ?? 0,
      }))
      setUsers(list)
      if (userIdFromQuery && list.some((u: User) => u.id === userIdFromQuery)) setSelectedUserId(userIdFromQuery)
    } catch (e) {
      toast({ title: 'Fehler', description: 'Fehler beim Laden der Nutzer', status: 'error', isClosable: true })
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!selectedUserId || isNaN(amt) || amt < 5 || amt > 200) {
      toast({
        title: 'Ungültig',
        description: 'Benutzer wählen und Betrag zwischen 5 € und 200 € angeben.',
        status: 'warning',
        isClosable: true,
      })
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
      toast({
        title: 'Erfolg',
        description: `${amt.toFixed(2)} € erfolgreich aufgeladen.`,
        status: 'success',
        isClosable: true,
      })
      setAmount('')
      setNote('')
      fetchUsers()
    } catch (err) {
      toast({
        title: 'Fehler',
        description: err instanceof Error ? err.message : 'Fehler beim Aufladen',
        status: 'error',
        isClosable: true,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selected = users.find((u) => u.id === selectedUserId)
  const balance = selected?.balance ?? 0

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="md" py={8}>
        <Heading size="lg" mb={6} display="flex" alignItems="center" gap={2}>
          <Coins className="w-8 h-8" />
          Guthaben aufladen
        </Heading>

        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" />
          </Flex>
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
                          {u.name || u.email} ({u.email}) · Guthaben: {(u.balance ?? 0).toFixed(2)} €
                        </option>
                      ))}
                    </Select>
                    {selected && (
                      <Text mt={2} fontSize="sm" color="gray.600">
                        Aktuelles Guthaben: {balance.toFixed(2)} €
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
                    <Text mt={1} fontSize="xs" color="gray.500">
                      Min. 5 €, max. 200 € pro Aufladung
                    </Text>
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
      </Container>
    </Box>
  )
}
