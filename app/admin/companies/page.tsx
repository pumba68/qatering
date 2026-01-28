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
  IconButton,
  useToast,
  Spinner,
  SimpleGrid,
  Select,
  FormControl,
  FormLabel,
  Switch,
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
} from '@chakra-ui/react'
import { Plus, Trash2, Edit2, Users, UserPlus } from 'lucide-react'

type SubsidyType = 'NONE' | 'PERCENTAGE' | 'FIXED'

interface Company {
  id: string
  name: string
  contractNumber: string | null
  isActive: boolean
  subsidyType: SubsidyType
  subsidyValue: number | null
  subsidyMaxPerDay: number | null
  validFrom: string | null
  validUntil: string | null
  _count?: { employees: number }
}

interface CompanyEmployee {
  id: string
  userId: string
  employeeNumber: string | null
  department: string | null
  isActive: boolean
  user: {
    id: string
    email: string
    name: string | null
    role: string
  }
}

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isEmployeesOpen, onOpen: onEmployeesOpen, onClose: onEmployeesClose } = useDisclosure()
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [employees, setEmployees] = useState<CompanyEmployee[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const toast = useToast()

  useEffect(() => {
    fetchCompanies()
    fetchUsers()
  }, [])

  async function fetchCompanies() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/companies?includeInactive=true')
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      setCompanies(data)
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Unternehmen',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsers() {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Nutzer:', error)
    }
  }

  async function openEmployeesModal(company: Company) {
    setSelectedCompany(company)
    onEmployeesOpen()
    setLoadingEmployees(true)
    try {
      const response = await fetch(`/api/admin/companies/${company.id}/employees`)
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      setEmployees(data)
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Mitarbeiter',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoadingEmployees(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Möchten Sie dieses Unternehmen wirklich löschen? Alle Mitarbeiter-Zuordnungen werden entfernt.')) return
    try {
      const response = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      fetchCompanies()
      toast({
        title: 'Erfolg',
        description: 'Unternehmen erfolgreich gelöscht',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Löschen',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  async function removeEmployee(companyId: string, employeeId: string) {
    if (!window.confirm('Mitarbeiter von diesem Unternehmen entfernen?')) return
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/employees/${employeeId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Entfernen')
      if (selectedCompany?.id === companyId) {
        setEmployees((prev) => prev.filter((e) => e.id !== employeeId))
      }
      fetchCompanies()
      toast({
        title: 'Erfolg',
        description: 'Mitarbeiter entfernt',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Entfernen',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const getSubsidyLabel = (type: SubsidyType) => {
    switch (type) {
      case 'NONE': return 'Kein Zuschuss'
      case 'PERCENTAGE': return 'Prozent'
      case 'FIXED': return 'Fixbetrag'
    }
  }

  const getSubsidyColor = (type: SubsidyType) => {
    switch (type) {
      case 'NONE': return 'gray'
      case 'PERCENTAGE': return 'blue'
      case 'FIXED': return 'green'
    }
  }

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Unternehmen (Vertragspartner)</Heading>
          <Button
            leftIcon={<Plus />}
            colorScheme="blue"
            onClick={() => {
              setEditingCompany(null)
              onOpen()
            }}
          >
            Neues Unternehmen
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" />
          </Flex>
        ) : companies.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Text color="gray.500">Noch keine Unternehmen angelegt. Erstellen Sie den ersten Vertragspartner.</Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {companies.map((company) => (
              <Card key={company.id} opacity={!company.isActive ? 0.6 : 1}>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <Flex justify="space-between" align="start">
                      <VStack align="start" spacing={1}>
                        <Heading size="sm">{company.name}</Heading>
                        {company.contractNumber && (
                          <Text fontSize="sm" color="gray.600">Vertrag: {company.contractNumber}</Text>
                        )}
                      </VStack>
                      <Badge colorScheme={company.isActive ? 'green' : 'gray'}>
                        {company.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </Flex>

                    <HStack>
                      <Badge colorScheme={getSubsidyColor(company.subsidyType)}>
                        {getSubsidyLabel(company.subsidyType)}
                      </Badge>
                      {company.subsidyType !== 'NONE' && company.subsidyValue != null && (
                        <Text fontSize="sm">
                          {company.subsidyType === 'PERCENTAGE'
                            ? `${company.subsidyValue}%`
                            : `${Number(company.subsidyValue).toFixed(2)} €`}
                          {company.subsidyMaxPerDay != null && (
                            <> / max. {Number(company.subsidyMaxPerDay).toFixed(2)} €/Tag</>
                          )}
                        </Text>
                      )}
                    </HStack>

                    <HStack fontSize="xs" color="gray.600">
                      {company.validFrom && (
                        <Text>Ab: {new Date(company.validFrom).toLocaleDateString('de-DE')}</Text>
                      )}
                      {company.validUntil && (
                        <Text>Bis: {new Date(company.validUntil).toLocaleDateString('de-DE')}</Text>
                      )}
                    </HStack>

                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        leftIcon={<Users size={14} />}
                        onClick={() => openEmployeesModal(company)}
                        variant="outline"
                      >
                        Mitarbeiter ({company._count?.employees ?? 0})
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<Edit2 size={14} />}
                        onClick={() => {
                          setEditingCompany(company)
                          onOpen()
                        }}
                      >
                        Bearbeiten
                      </Button>
                      <IconButton
                        aria-label="Löschen"
                        icon={<Trash2 size={14} />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(company.id)}
                      />
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}

        <CompanyFormModal
          isOpen={isOpen}
          onClose={() => {
            onClose()
            setEditingCompany(null)
          }}
          onSave={() => {
            fetchCompanies()
            onClose()
            setEditingCompany(null)
          }}
          company={editingCompany}
          toast={toast}
        />

        <EmployeesModal
          isOpen={isEmployeesOpen}
          onClose={() => {
            onEmployeesClose()
            setSelectedCompany(null)
            setEmployees([])
          }}
          company={selectedCompany}
          employees={employees}
          loading={loadingEmployees}
          users={users}
          onAddEmployee={async (userId) => {
            if (!selectedCompany) return
            try {
              const r = await fetch(`/api/admin/companies/${selectedCompany.id}/employees`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
              })
              if (!r.ok) {
                const d = await r.json().catch(() => ({}))
                throw new Error(d.error || 'Fehler')
              }
              const newEmp = await r.json()
              setEmployees((prev) => [...prev, newEmp])
              fetchCompanies()
              toast({ title: 'Mitarbeiter hinzugefügt', status: 'success', duration: 2000, isClosable: true })
            } catch (err) {
              toast({
                title: 'Fehler',
                description: err instanceof Error ? err.message : 'Fehler beim Hinzufügen',
                status: 'error',
                duration: 3000,
                isClosable: true,
              })
            }
          }}
          onRemoveEmployee={(employeeId) => {
            if (selectedCompany) void removeEmployee(selectedCompany.id, employeeId)
          }}
          toast={toast}
        />
      </Container>
    </Box>
  )
}

function CompanyFormModal({
  isOpen,
  onClose,
  onSave,
  company,
  toast,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  company: Company | null
  toast: ReturnType<typeof useToast>
}) {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    contractNumber: company?.contractNumber || '',
    isActive: company?.isActive ?? true,
    subsidyType: (company?.subsidyType || 'NONE') as SubsidyType,
    subsidyValue: company?.subsidyValue?.toString() || '',
    subsidyMaxPerDay: company?.subsidyMaxPerDay?.toString() || '',
    validFrom: company?.validFrom ? new Date(company.validFrom).toISOString().split('T')[0] : '',
    validUntil: company?.validUntil ? new Date(company.validUntil).toISOString().split('T')[0] : '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        contractNumber: company.contractNumber || '',
        isActive: company.isActive,
        subsidyType: company.subsidyType,
        subsidyValue: company.subsidyValue?.toString() || '',
        subsidyMaxPerDay: company.subsidyMaxPerDay?.toString() || '',
        validFrom: company.validFrom ? new Date(company.validFrom).toISOString().split('T')[0] : '',
        validUntil: company.validUntil ? new Date(company.validUntil).toISOString().split('T')[0] : '',
      })
    } else {
      setFormData({
        name: '',
        contractNumber: '',
        isActive: true,
        subsidyType: 'NONE',
        subsidyValue: '',
        subsidyMaxPerDay: '',
        validFrom: '',
        validUntil: '',
      })
    }
  }, [company, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const payload = {
        name: formData.name,
        contractNumber: formData.contractNumber || null,
        isActive: formData.isActive,
        subsidyType: formData.subsidyType,
        subsidyValue: formData.subsidyValue ? parseFloat(formData.subsidyValue) : null,
        subsidyMaxPerDay: formData.subsidyMaxPerDay ? parseFloat(formData.subsidyMaxPerDay) : null,
        validFrom: formData.validFrom || null,
        validUntil: formData.validUntil || null,
      }
      const url = company ? `/api/admin/companies/${company.id}` : '/api/admin/companies'
      const method = company ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || 'Fehler beim Speichern')
      }
      toast({ title: 'Erfolg', description: 'Unternehmen gespeichert', status: 'success', duration: 2000, isClosable: true })
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>{company ? 'Unternehmen bearbeiten' : 'Neues Unternehmen'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Muster GmbH"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Vertragsnummer (optional)</FormLabel>
                <Input
                  value={formData.contractNumber}
                  onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                  placeholder="z.B. V-2024-001"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Zuschuss-Typ</FormLabel>
                <Select
                  value={formData.subsidyType}
                  onChange={(e) => setFormData({ ...formData, subsidyType: e.target.value as SubsidyType })}
                >
                  <option value="NONE">Kein Zuschuss</option>
                  <option value="PERCENTAGE">Prozent</option>
                  <option value="FIXED">Fixbetrag (€)</option>
                </Select>
              </FormControl>
              {(formData.subsidyType === 'PERCENTAGE' || formData.subsidyType === 'FIXED') && (
                <>
                  <FormControl isRequired>
                    <FormLabel>
                      {formData.subsidyType === 'PERCENTAGE' ? 'Zuschuss (%)' : 'Zuschuss (€)'}
                    </FormLabel>
                    <Input
                      type="number"
                      step={formData.subsidyType === 'PERCENTAGE' ? '1' : '0.01'}
                      min="0"
                      max={formData.subsidyType === 'PERCENTAGE' ? '100' : undefined}
                      value={formData.subsidyValue}
                      onChange={(e) => setFormData({ ...formData, subsidyValue: e.target.value })}
                      placeholder={formData.subsidyType === 'PERCENTAGE' ? '20' : '3.50'}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Max. Zuschuss pro Tag (€, optional)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.subsidyMaxPerDay}
                      onChange={(e) => setFormData({ ...formData, subsidyMaxPerDay: e.target.value })}
                      placeholder="z.B. 5.00"
                    />
                  </FormControl>
                </>
              )}
              <HStack width="100%" spacing={4}>
                <FormControl>
                  <FormLabel>Gültig ab (optional)</FormLabel>
                  <Input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Gültig bis (optional)</FormLabel>
                  <Input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </FormControl>
              </HStack>
              <FormControl>
                <Flex align="center">
                  <FormLabel mb={0}>Aktiv</FormLabel>
                  <Switch
                    isChecked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                </Flex>
              </FormControl>
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

function EmployeesModal({
  isOpen,
  onClose,
  company,
  employees,
  loading,
  users,
  onAddEmployee,
  onRemoveEmployee,
  toast,
}: {
  isOpen: boolean
  onClose: () => void
  company: Company | null
  employees: CompanyEmployee[]
  loading: boolean
  users: User[]
  onAddEmployee: (userId: string) => void
  onRemoveEmployee: (employeeId: string) => void
  toast: ReturnType<typeof useToast>
}) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const addableUsers = users.filter(
    (u) => !employees.some((e) => e.user.id === u.id)
  )

  const handleAdd = () => {
    if (!selectedUserId) {
      toast({ title: 'Bitte Nutzer wählen', status: 'warning', duration: 2000, isClosable: true })
      return
    }
    onAddEmployee(selectedUserId)
    setSelectedUserId('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Mitarbeiter – {company?.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <HStack>
              <Select
                placeholder="Nutzer hinzufügen..."
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                flex={1}
              >
                {addableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} ({u.email}) – {u.role}
                  </option>
                ))}
              </Select>
              <Button leftIcon={<UserPlus size={16} />} colorScheme="blue" onClick={handleAdd} isDisabled={!selectedUserId}>
                Hinzufügen
              </Button>
            </HStack>
            {loading ? (
              <Flex justify="center" py={4}><Spinner /></Flex>
            ) : (
              <TableContainer width="100%">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Name / E-Mail</Th>
                      <Th>Rolle</Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {employees.map((emp) => (
                      <Tr key={emp.id}>
                        <Td>{emp.user.name || emp.user.email}</Td>
                        <Td>{emp.user.email}</Td>
                        <Td>
                          <IconButton
                            aria-label="Entfernen"
                            icon={<Trash2 size={14} />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => onRemoveEmployee(emp.id)}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                {employees.length === 0 && !loading && (
                  <Text py={4} color="gray.500" fontSize="sm">Noch keine Mitarbeiter zugeordnet.</Text>
                )}
              </TableContainer>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Schließen</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
