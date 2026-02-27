import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../core/providers.dart';
import '../core/models.dart';

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(ordersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Meine Bestellungen')),
      body: ordersAsync.when(
        data: (state) {
          if (state.upcoming.isEmpty && state.history.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.receipt_long, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('Noch keine Bestellungen'),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(ordersProvider),
            child: ListView(
              padding: const EdgeInsets.all(12),
              children: [
                if (state.upcoming.isNotEmpty) ...[
                  _SectionHeader(title: 'Aktuelle Bestellungen (${state.upcoming.length})'),
                  ...state.upcoming.map((o) => _OrderCard(order: o, isActive: true)),
                ],
                if (state.history.isNotEmpty) ...[
                  _SectionHeader(title: 'Verlauf'),
                  ...state.history.map((o) => _OrderCard(order: o, isActive: false)),
                ],
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 8),
              Text('$e'),
              TextButton(
                onPressed: () => ref.invalidate(ordersProvider),
                child: const Text('Erneut versuchen'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 12, 4, 6),
        child: Text(title,
            style: Theme.of(context)
                .textTheme
                .titleSmall
                ?.copyWith(fontWeight: FontWeight.bold, color: Colors.grey[700])),
      );
}

class _OrderCard extends StatelessWidget {
  final Order order;
  final bool isActive;
  const _OrderCard({required this.order, required this.isActive});

  Color _statusColor(String status) => switch (status) {
        'PENDING' => Colors.orange,
        'CONFIRMED' => Colors.blue,
        'PREPARING' => Colors.purple,
        'READY' => Colors.green,
        'PICKED_UP' => Colors.grey,
        'CANCELLED' => Colors.red,
        _ => Colors.grey,
      };

  String _statusLabel(String status) => switch (status) {
        'PENDING' => 'Ausstehend',
        'CONFIRMED' => 'Bestätigt',
        'PREPARING' => 'In Zubereitung',
        'READY' => 'Abholbereit',
        'PICKED_UP' => 'Abgeholt',
        'CANCELLED' => 'Storniert',
        _ => status,
      };

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'de_DE', symbol: '€');
    final dateFmt = DateFormat('dd.MM.yyyy', 'de_DE');

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(dateFmt.format(order.createdAt),
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _statusColor(order.status).withAlpha(30),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: _statusColor(order.status)),
                  ),
                  child: Text(
                    _statusLabel(order.status),
                    style: TextStyle(
                        color: _statusColor(order.status),
                        fontSize: 12,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            if (order.locationName != null) ...[
              const SizedBox(height: 4),
              Text(order.locationName!,
                  style: Theme.of(context).textTheme.bodySmall),
            ],
            const Divider(height: 16),
            ...order.items.map((item) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('${item.quantity}× ${item.productName}',
                          style: Theme.of(context).textTheme.bodyMedium),
                      Text(fmt.format(item.price * item.quantity),
                          style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ),
                )),
            const Divider(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Gesamt', style: TextStyle(fontWeight: FontWeight.bold)),
                Text(fmt.format(order.finalAmount),
                    style: const TextStyle(fontWeight: FontWeight.bold)),
              ],
            ),
            if (isActive && order.pickupCode != null) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.green.withAlpha(20),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.qr_code, color: Colors.green),
                    const SizedBox(width: 8),
                    Text('Abholcode: ${order.pickupCode}',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, color: Colors.green)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
