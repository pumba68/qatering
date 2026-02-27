import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../core/providers.dart';
import '../core/api_client.dart';
import '../core/models.dart';

const _dayLabels = {
  'MONDAY': 'Montag',
  'TUESDAY': 'Dienstag',
  'WEDNESDAY': 'Mittwoch',
  'THURSDAY': 'Donnerstag',
  'FRIDAY': 'Freitag',
};

class MenuScreen extends ConsumerWidget {
  const MenuScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationAsync = ref.watch(locationsProvider);
    final selectedId = ref.watch(selectedLocationIdProvider);
    final menuAsync = ref.watch(menuProvider);
    final cart = ref.watch(cartProvider);
    final cartCount = cart.fold(0, (s, c) => s + c.quantity);

    return Scaffold(
      appBar: AppBar(
        title: locationAsync.when(
          data: (locations) => locations.isEmpty
              ? const Text('Menü')
              : DropdownButton<String>(
                  value: selectedId ?? locations.first.id,
                  dropdownColor: Theme.of(context).colorScheme.primary,
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                  icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                  underline: const SizedBox(),
                  onChanged: (id) {
                    if (id != null) {
                      ref.read(selectedLocationIdProvider.notifier).state = id;
                    }
                  },
                  items: locations
                      .map((l) => DropdownMenuItem(value: l.id, child: Text(l.name)))
                      .toList(),
                ),
          loading: () => const Text('Menü'),
          error: (_, __) => const Text('Menü'),
        ),
        actions: [
          if (cartCount > 0)
            Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.shopping_cart),
                  onPressed: () => _showCart(context, ref),
                ),
                Positioned(
                  right: 6,
                  top: 6,
                  child: CircleAvatar(
                    radius: 9,
                    backgroundColor: Colors.red,
                    child: Text('$cartCount',
                        style: const TextStyle(fontSize: 11, color: Colors.white)),
                  ),
                ),
              ],
            ),
        ],
      ),
      body: menuAsync.when(
        data: (menu) {
          if (menu == null) {
            return const Center(child: Text('Bitte Standort auswählen'));
          }
          if (menu.items.isEmpty) {
            return const Center(child: Text('Kein Menü für diese Woche'));
          }
          final byDay = menu.byDay;
          return ListView(
            children: _dayLabels.entries
                .where((e) => byDay.containsKey(e.key))
                .map((e) => _DaySection(
                    day: e.value, items: byDay[e.key]!))
                .toList(),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Fehler: $e')),
      ),
    );
  }

  void _showCart(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _CartSheet(ref: ref),
    );
  }
}

class _DaySection extends StatelessWidget {
  final String day;
  final List<MenuItem> items;
  const _DaySection({required this.day, required this.items});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Text(day,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.bold)),
        ),
        ...items.map((item) => _MenuItemCard(item: item)),
      ],
    );
  }
}

class _MenuItemCard extends ConsumerWidget {
  final MenuItem item;
  const _MenuItemCard({required this.item});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final qty = cart.where((c) => c.menuItem.id == item.id).fold(0, (s, c) => s + c.quantity);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (item.isPromotion)
                        const Padding(
                          padding: EdgeInsets.only(right: 6),
                          child: Icon(Icons.local_fire_department,
                              color: Colors.orange, size: 16),
                        ),
                      Expanded(
                        child: Text(item.name,
                            style: const TextStyle(fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                  if (item.description != null) ...[
                    const SizedBox(height: 4),
                    Text(item.description!,
                        style: Theme.of(context).textTheme.bodySmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                  ],
                  const SizedBox(height: 6),
                  Text(
                    NumberFormat.currency(locale: 'de_DE', symbol: '€')
                        .format(item.price),
                    style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            if (qty == 0)
              IconButton.filled(
                icon: const Icon(Icons.add),
                onPressed: () => ref.read(cartProvider.notifier).add(item),
              )
            else
              Row(
                children: [
                  IconButton.outlined(
                    icon: const Icon(Icons.remove, size: 18),
                    onPressed: () =>
                        ref.read(cartProvider.notifier).remove(item.id),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text('$qty',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                  IconButton.filled(
                    icon: const Icon(Icons.add, size: 18),
                    onPressed: () => ref.read(cartProvider.notifier).add(item),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _CartSheet extends ConsumerStatefulWidget {
  final WidgetRef ref;
  const _CartSheet({required this.ref});

  @override
  ConsumerState<_CartSheet> createState() => _CartSheetState();
}

class _CartSheetState extends ConsumerState<_CartSheet> {
  final _couponCtrl = TextEditingController();
  bool _isOrdering = false;

  @override
  void dispose() {
    _couponCtrl.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    final cart = ref.read(cartProvider);
    final locationId = ref.read(selectedLocationIdProvider);
    if (cart.isEmpty || locationId == null) return;

    setState(() => _isOrdering = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.post('/orders', data: {
        'locationId': locationId,
        'items': cart
            .map((c) => {'menuItemId': c.menuItem.id, 'quantity': c.quantity})
            .toList(),
        'pickupDate': DateTime.now().toIso8601String(),
        if (_couponCtrl.text.isNotEmpty) 'couponCode': _couponCtrl.text.trim(),
      });
      ref.read(cartProvider.notifier).clear();
      ref.invalidate(walletProvider);
      ref.invalidate(ordersProvider);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Bestellung aufgegeben!'),
              backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Fehler: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isOrdering = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final total = cart.fold(0.0, (s, c) => s + c.subtotal);
    final fmt = NumberFormat.currency(locale: 'de_DE', symbol: '€');

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.95,
      minChildSize: 0.4,
      expand: false,
      builder: (_, ctrl) => Column(
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4,
              decoration: BoxDecoration(color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text('Warenkorb',
                style: Theme.of(context).textTheme.titleLarge),
          ),
          Expanded(
            child: ListView.builder(
              controller: ctrl,
              itemCount: cart.length,
              itemBuilder: (_, i) {
                final c = cart[i];
                return ListTile(
                  title: Text(c.menuItem.name),
                  subtitle: Text(fmt.format(c.menuItem.price)),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline),
                        onPressed: () =>
                            ref.read(cartProvider.notifier).remove(c.menuItem.id),
                      ),
                      Text('${c.quantity}',
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline),
                        onPressed: () =>
                            ref.read(cartProvider.notifier).add(c.menuItem),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: TextField(
              controller: _couponCtrl,
              decoration: const InputDecoration(
                labelText: 'Gutscheincode (optional)',
                prefixIcon: Icon(Icons.discount_outlined),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Gesamt',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    Text(fmt.format(total),
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _isOrdering ? null : _placeOrder,
                  child: _isOrdering
                      ? const SizedBox(height: 20, width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : Text('Jetzt bestellen · ${fmt.format(total)}'),
                ),
              ],
            ),
          ),
          SizedBox(height: MediaQuery.of(context).viewInsets.bottom),
        ],
      ),
    );
  }
}
