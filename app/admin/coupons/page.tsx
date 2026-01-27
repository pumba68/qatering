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
  Textarea,
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
} from '@chakra-ui/react'
import { Plus, Trash2, Edit2, Tag } from 'lucide-react'

type CouponType = 'DISCOUNT_PERCENTAGE' | 'DISCOUNT_FIXED' | 'FREE_ITEM'

interface Coupon {
  id: string
  code: string
  name: string
  description: string | null
  type: CouponType
  discountValue: number | null
  freeItemDishId: string | null
  locationId: string | null
  startDate: string | null
  endDate: string | null
  maxUses: number | null
  maxUsesPerUser: number
  minOrderAmount: number | null
  isActive: boolean
  currentUses: number
  freeItemDish?: {
    id: string
    name: string
  } | null
  location?: {
    id: string
    name: string
  } | null
  _count?: {
    redemptions: number
  }
}

interface Dish {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [dishes, setDishes] = useState<Dish[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const toast = useToast()

  useEffect(() => {
    fetchCoupons()
    fetchDishes()
    fetchLocations()
  }, [])

  async function fetchCoupons() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/coupons?includeInactive=true')
      if (!response.ok) throw new Error('Fehler beim Laden')
      const data = await response.json()
      setCoupons(data)
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Laden der Coupons',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchDishes() {
    try {
      const response = await fetch('/api/admin/dishes')
      if (response.ok) {
        const data = await response.json()
        setDishes(data.filter((d: Dish & { isActive: boolean }) => d.isActive))
      }
    } catch (error) {
      console.error('Fehler beim Laden der Gerichte:', error)
    }
  }

  async function fetchLocations() {
    try {
      // TODO: Location-API erstellen oder aus Settings holen
      setLocations([{ id: 'demo-location-1', name: 'Hauptstandort Berlin' }])
    } catch (error) {
      console.error('Fehler beim Laden der Locations:', error)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Möchten Sie diesen Coupon wirklich löschen?')) return

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Fehler beim Löschen')
      fetchCoupons()
      toast({
        title: 'Erfolg',
        description: 'Coupon erfolgreich gelöscht',
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

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (!response.ok) throw new Error('Fehler beim Aktualisieren')
      fetchCoupons()
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Aktualisieren',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const getTypeLabel = (type: CouponType) => {
    switch (type) {
      case 'DISCOUNT_PERCENTAGE':
        return 'Prozentrabatt'
      case 'DISCOUNT_FIXED':
        return 'Fixer Rabatt'
      case 'FREE_ITEM':
        return 'Kostenloses Extra'
    }
  }

  const getTypeColor = (type: CouponType) => {
    switch (type) {
      case 'DISCOUNT_PERCENTAGE':
        return 'blue'
      case 'DISCOUNT_FIXED':
        return 'green'
      case 'FREE_ITEM':
        return 'purple'
    }
  }

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: 'gray.900' }}>
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Coupon-Verwaltung</Heading>
          <Button
            leftIcon={<Plus />}
            colorScheme="blue"
            onClick={() => {
              setEditingCoupon(null)
              onOpen()
            }}
          >
            Neuer Coupon
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" />
          </Flex>
        ) : coupons.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Text color="gray.500">Noch keine Coupons vorhanden. Erstellen Sie den ersten Coupon!</Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {coupons.map((coupon) => (
              <Card key={coupon.id} opacity={!coupon.isActive ? 0.6 : 1}>
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                    <Flex justify="space-between" align="start">
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Heading size="sm">{coupon.code}</Heading>
                          <Badge colorScheme={getTypeColor(coupon.type)}>
                            {getTypeLabel(coupon.type)}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" fontWeight="medium">
                          {coupon.name}
                        </Text>
                      </VStack>
                      <Badge colorScheme={coupon.isActive ? 'green' : 'gray'}>
                        {coupon.isActive ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </Flex>

                    {coupon.description && (
                      <Text fontSize="xs" color="gray.600">
                        {coupon.description}
                      </Text>
                    )}

                    <Box>
                      {coupon.type === 'DISCOUNT_PERCENTAGE' && (
                        <Text fontSize="sm">
                          <strong>{coupon.discountValue}%</strong> Rabatt
                        </Text>
                      )}
                      {coupon.type === 'DISCOUNT_FIXED' && (
                        <Text fontSize="sm">
                          <strong>{Number(coupon.discountValue).toFixed(2)}€</strong> Rabatt
                        </Text>
                      )}
                      {coupon.type === 'FREE_ITEM' && coupon.freeItemDish && (
                        <Text fontSize="sm">
                          Kostenlos: <strong>{coupon.freeItemDish.name}</strong>
                        </Text>
                      )}
                    </Box>

                    <VStack align="stretch" spacing={1} fontSize="xs" color="gray.600">
                      {coupon.startDate && (
                        <Text>Gültig ab: {new Date(coupon.startDate).toLocaleDateString('de-DE')}</Text>
                      )}
                      {coupon.endDate && (
                        <Text>Gültig bis: {new Date(coupon.endDate).toLocaleDateString('de-DE')}</Text>
                      )}
                      {coupon.maxUses && (
                        <Text>
                          Genutzt: {coupon.currentUses} / {coupon.maxUses}
                        </Text>
                      )}
                      {coupon.maxUsesPerUser > 0 && (
                        <Text>Max. {coupon.maxUsesPerUser}x pro Kunde</Text>
                      )}
                      {coupon.minOrderAmount && (
                        <Text>Mindestbestellwert: {Number(coupon.minOrderAmount).toFixed(2)}€</Text>
                      )}
                    </VStack>

                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        flex={1}
                        leftIcon={<Edit2 size={14} />}
                        onClick={() => {
                          setEditingCoupon(coupon)
                          onOpen()
                        }}
                      >
                        Bearbeiten
                      </Button>
                      <Button
                        size="sm"
                        variant={coupon.isActive ? 'outline' : 'solid'}
                        onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                      >
                        {coupon.isActive ? 'Deaktivieren' : 'Aktivieren'}
                      </Button>
                      <IconButton
                        aria-label="Löschen"
                        icon={<Trash2 size={14} />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(coupon.id)}
                      />
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}

        <CouponFormModal
          isOpen={isOpen}
          onClose={() => {
            onClose()
            setEditingCoupon(null)
          }}
          onSave={() => {
            fetchCoupons()
            onClose()
            setEditingCoupon(null)
          }}
          coupon={editingCoupon}
          dishes={dishes}
          locations={locations}
          toast={toast}
        />
      </Container>
    </Box>
  )
}

function CouponFormModal({
  isOpen,
  onClose,
  onSave,
  coupon,
  dishes,
  locations,
  toast,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  coupon: Coupon | null
  dishes: Dish[]
  locations: Location[]
  toast: any
}) {
  const [formData, setFormData] = useState({
    code: coupon?.code || '',
    name: coupon?.name || '',
    description: coupon?.description || '',
    type: (coupon?.type || 'DISCOUNT_PERCENTAGE') as CouponType,
    discountValue: coupon?.discountValue?.toString() || '',
    freeItemDishId: coupon?.freeItemDishId || '',
    locationId: coupon?.locationId || '',
    startDate: coupon?.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
    endDate: coupon?.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
    maxUses: coupon?.maxUses?.toString() || '',
    maxUsesPerUser: coupon?.maxUsesPerUser?.toString() || '1',
    minOrderAmount: coupon?.minOrderAmount?.toString() || '',
    isActive: coupon?.isActive ?? true,
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        discountValue: formData.discountValue ? parseFloat(formData.discountValue) : null,
        freeItemDishId: formData.freeItemDishId || null,
        locationId: formData.locationId || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        maxUsesPerUser: parseInt(formData.maxUsesPerUser),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
        isActive: formData.isActive,
      }

      const url = coupon ? `/api/admin/coupons/${coupon.id}` : '/api/admin/coupons'
      const method = coupon ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Fehler beim Speichern')
      }

      toast({
        title: 'Erfolg',
        description: 'Coupon erfolgreich gespeichert',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
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
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>{coupon ? 'Coupon bearbeiten' : 'Neuer Coupon'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Code</FormLabel>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="z.B. SUMMER2024"
                  isDisabled={!!coupon}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Name der Aktion"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Beschreibung</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optionale Beschreibung..."
                  rows={2}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Typ</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CouponType })}
                >
                  <option value="DISCOUNT_PERCENTAGE">Prozentrabatt</option>
                  <option value="DISCOUNT_FIXED">Fixer Rabatt</option>
                  <option value="FREE_ITEM">Kostenloses Extra</option>
                </Select>
              </FormControl>

              {(formData.type === 'DISCOUNT_PERCENTAGE' || formData.type === 'DISCOUNT_FIXED') && (
                <FormControl isRequired>
                  <FormLabel>
                    {formData.type === 'DISCOUNT_PERCENTAGE' ? 'Rabatt (%)' : 'Rabatt (€)'}
                  </FormLabel>
                  <Input
                    type="number"
                    step={formData.type === 'DISCOUNT_PERCENTAGE' ? '1' : '0.01'}
                    min="0"
                    max={formData.type === 'DISCOUNT_PERCENTAGE' ? '100' : undefined}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder={formData.type === 'DISCOUNT_PERCENTAGE' ? '10' : '5.00'}
                  />
                </FormControl>
              )}

              {formData.type === 'FREE_ITEM' && (
                <FormControl isRequired>
                  <FormLabel>Kostenloses Gericht</FormLabel>
                  <Select
                    value={formData.freeItemDishId}
                    onChange={(e) => setFormData({ ...formData, freeItemDishId: e.target.value })}
                  >
                    <option value="">-- Bitte wählen --</option>
                    {dishes.map((dish) => (
                      <option key={dish.id} value={dish.id}>
                        {dish.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Location (optional)</FormLabel>
                <Select
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                >
                  <option value="">-- Alle Locations --</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <HStack spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Gültig ab (optional)</FormLabel>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Gültig bis (optional)</FormLabel>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} width="100%">
                <FormControl>
                  <FormLabel>Max. Nutzungen gesamt (optional)</FormLabel>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="z.B. 100"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Max. Nutzungen pro Kunde</FormLabel>
                  <Input
                    type="number"
                    min="1"
                    value={formData.maxUsesPerUser}
                    onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Mindestbestellwert (optional, €)</FormLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  placeholder="z.B. 10.00"
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Aktiv</FormLabel>
                <Switch
                  isChecked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" colorScheme="blue" isLoading={isSaving}>
              Speichern
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
