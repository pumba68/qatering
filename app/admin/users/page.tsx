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
  HStack,
  Card,
  CardBody,
  Badge,
  useToast,
  Spinner,
  SimpleGrid,
  Select,
  FormControl,
  FormLabel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import { Edit2, Search, User } from 'lucide-react'

type UserRole = 'CUSTOMER' | 'KITCHEN_STAFF' | 'ADMIN' | 'SUPER_ADMIN'

interface UserWithRelations {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: string
  organizationId: string | null
  organization?: { id: string; name: string } | null
  companyEmployees: Array<{
    id: string
    company: { id: string; name: string }
  }>
}

interface Organization {
  id: string
  name: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRelations[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingUser, setEditingUser] = useState<UserWithRelations | null>(null)
  const toast = useToast()

  useEffect(() => {
    fetchUsers()
    fetchOrganizations()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      const response = await fetch(`/api/admin/users?${params.toString()}`)
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Nutzer',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchOrganizations() {
    try {
      const res = await fetch('/api/admin/organizations')
      if (res.ok) {
        const data = await res.json()
        setOrganizations(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Organisationen:', error)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(), 300)
    return () => clearTimeout(t)
  }, [search, roleFilter])

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'CUSTOMER': return 'Kunde'
      case 'KITCHEN_STAFF': return 'Küche'
      case 'ADMIN': return 'Admin'
      case 'SUPER_ADMIN': return 'Super Admin'
      default: return role
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'CUSTOMER': return 'gray'
      case 'KITCHEN_STAFF': return 'blue'
      case 'ADMIN': return 'purple'
      case 'SUPER_ADMIN': return 'red'
      default: return 'gray'
    }
  }

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
          <Heading size="lg">Nutzerverwaltung</Heading>
          <HStack spacing={3} flexWrap="wrap">
            <InputGroup maxW="xs">
              <InputLeftElement pointerEvents="none"><Search size={16} color="gray" /></InputLeftElement>
              <Input
                placeholder="Suche (Name/E-Mail)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                bg="white"
                _dark={{ bg: 'gray.800' }}
              />
            </InputGroup>
            <Select
              placeholder="Rolle"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              maxW="40"
              bg="white"
              _dark={{ bg: 'gray.800' }}
            >
              <option value="CUSTOMER">Kunde</option>
              <option value="KITCHEN_STAFF">Küche</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </Select>
          </HStack>
        </Flex>

        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" />
          </Flex>
        ) : users.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Text color="gray.500">Keine Nutzer gefunden.</Text>
          </Box>
        ) : (
          <Card bg="white" _dark={{ bg: 'gray.800' }}>
            <TableContainer>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Name / E-Mail</Th>
                    <Th>Rolle</Th>
                    <Th>Organisation (Kantine)</Th>
                    <Th>Unternehmen (Vertragspartner)</Th>
                    <Th>Registriert</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {users.map((user) => (
                    <Tr key={user.id}>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">{user.name || '–'}</Text>
                          <Text fontSize="xs" color="gray.600">{user.email}</Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={getRoleColor(user.role)}>{getRoleLabel(user.role)}</Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">{user.organization?.name ?? '–'}</Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {user.companyEmployees?.length
                            ? user.companyEmployees.map((ce) => ce.company.name).join(', ')
                            : '–'}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="xs" color="gray.600">
                          {new Date(user.createdAt).toLocaleDateString('de-DE')}
                        </Text>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          leftIcon={<Edit2 size={14} />}
                          onClick={() => {
                            setEditingUser(user)
                            onOpen()
                          }}
                        >
                          Bearbeiten
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Card>
        )}

        <UserEditModal
          isOpen={isOpen}
          onClose={() => {
            onClose()
            setEditingUser(null)
          }}
          onSave={() => {
            fetchUsers()
            onClose()
            setEditingUser(null)
          }}
          user={editingUser}
          organizations={organizations}
          toast={toast}
        />
      </Container>
    </Box>
  )
}

function UserEditModal({
  isOpen,
  onClose,
  onSave,
  user,
  organizations,
  toast,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  user: UserWithRelations | null
  organizations: Organization[]
  toast: ReturnType<typeof useToast>
}) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    role: (user?.role || 'CUSTOMER') as UserRole,
    organizationId: user?.organizationId || '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        role: user.role,
        organizationId: user.organizationId || '',
      })
    }
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name || null,
          role: formData.role,
          organizationId: formData.organizationId || null,
        }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Fehler beim Speichern')
      }
      toast({ title: 'Erfolg', description: 'Nutzer aktualisiert', status: 'success', duration: 2000, isClosable: true })
      onSave()
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Speichern',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Nutzer bearbeiten</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>E-Mail</FormLabel>
                <Input value={user.email} isReadOnly bg="gray.50" _dark={{ bg: 'gray.700' }} />
              </FormControl>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Anzeigename"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Rolle</FormLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  <option value="CUSTOMER">Kunde</option>
                  <option value="KITCHEN_STAFF">Küche</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </Select>
              </FormControl>
              {organizations.length > 0 && (
                <FormControl>
                  <FormLabel>Organisation (Kantine-Betreiber)</FormLabel>
                  <Select
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                  >
                    <option value="">– Keine –</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Box width="100%" pt={2}>
                <Text fontSize="sm" color="gray.600">
                  Zuordnung zu Vertragspartner-Unternehmen (für Zuschuss) erfolgt unter „Unternehmen“ → Mitarbeiter.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Abbrechen</Button>
            <Button colorScheme="blue" type="submit" isLoading={isSaving}>Speichern</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
