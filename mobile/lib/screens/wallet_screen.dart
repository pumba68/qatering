import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../core/providers.dart';
import '../core/models.dart';
import '../core/api_client.dart';
import '../core/constants.dart';

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final walletAsync = ref.watch(walletProvider);
    final txAsync = ref.watch(walletTransactionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Guthaben')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(walletProvider);
          ref.invalidate(walletTransactionsProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            walletAsync.when(
              data: (w) => _BalanceCard(wallet: w),
              loading: () => const _BalanceSkeleton(),
              error: (e, _) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Text('Fehler beim Laden: $e'),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const _TopUpSection(),
            const SizedBox(height: 24),
            Text('Transaktionen',
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            txAsync.when(
              data: (txs) => txs.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(child: Text('Noch keine Transaktionen')),
                    )
                  : Column(
                      children: txs.map((tx) => _TxTile(tx: tx)).toList()),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text('Fehler: $e'),
            ),
          ],
        ),
      ),
    );
  }
}

class _BalanceCard extends StatelessWidget {
  final WalletBalance wallet;
  const _BalanceCard({required this.wallet});

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'de_DE', symbol: '€');
    return Card(
      color: Theme.of(context).colorScheme.primary,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Aktuelles Guthaben',
                style: TextStyle(color: Colors.white70, fontSize: 14)),
            const SizedBox(height: 8),
            Text(fmt.format(wallet.balance),
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.bold)),
            if (wallet.isLow)
              const Padding(
                padding: EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    Icon(Icons.warning_amber, color: Colors.amber, size: 16),
                    SizedBox(width: 4),
                    Text('Guthaben ist niedrig',
                        style: TextStyle(color: Colors.amber, fontSize: 13)),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _BalanceSkeleton extends StatelessWidget {
  const _BalanceSkeleton();

  @override
  Widget build(BuildContext context) => Card(
        child: Container(
          height: 120,
          alignment: Alignment.center,
          child: const CircularProgressIndicator(),
        ),
      );
}

class _TopUpSection extends ConsumerStatefulWidget {
  const _TopUpSection();

  @override
  ConsumerState<_TopUpSection> createState() => _TopUpSectionState();
}

class _TopUpSectionState extends ConsumerState<_TopUpSection> {
  int? _selected;
  bool _loading = false;
  final _amounts = [10, 20, 25, 50];

  Future<void> _topUp() async {
    if (_selected == null) return;
    setState(() => _loading = true);
    try {
      final api = ref.read(apiClientProvider);
      final res = await api.post(ApiConstants.stripeCreateIntent,
          data: {'amount': _selected});
      final clientSecret = res.data['clientSecret'] as String?;
      if (clientSecret == null) throw Exception('Kein clientSecret erhalten');
      // In einer echten App: Stripe-Payment-Sheet öffnen
      // Für MVP: Direkt verify aufrufen (nur für Testzwecke)
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Stripe-Integration: clientSecret erhalten. '
                  'Bitte Stripe SDK einbinden für echte Zahlung.'),
              duration: Duration(seconds: 4)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Fehler: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'de_DE', symbol: '€', decimalDigits: 0);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Guthaben aufladen',
            style: Theme.of(context)
                .textTheme
                .titleMedium
                ?.copyWith(fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: _amounts.map((a) => ChoiceChip(
                label: Text(fmt.format(a)),
                selected: _selected == a,
                onSelected: (_) => setState(() => _selected = a),
              )).toList(),
        ),
        const SizedBox(height: 12),
        ElevatedButton.icon(
          onPressed: (_selected == null || _loading) ? null : _topUp,
          icon: _loading
              ? const SizedBox(height: 18, width: 18,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.add_card),
          label: Text(_selected == null
              ? 'Betrag auswählen'
              : 'Jetzt ${fmt.format(_selected)} aufladen'),
        ),
      ],
    );
  }
}

class _TxTile extends StatelessWidget {
  final WalletTransaction tx;
  const _TxTile({required this.tx});

  IconData _icon(String type) => switch (type) {
        'TOP_UP' => Icons.add_circle,
        'ORDER_PAYMENT' => Icons.restaurant,
        'REFUND' => Icons.undo,
        'ADJUSTMENT' => Icons.tune,
        _ => Icons.swap_horiz,
      };

  Color _color(String type) => switch (type) {
        'TOP_UP' => Colors.green,
        'REFUND' => Colors.blue,
        'ORDER_PAYMENT' => Colors.red,
        _ => Colors.grey,
      };

  String _label(String type) => switch (type) {
        'TOP_UP' => 'Aufladung',
        'ORDER_PAYMENT' => 'Bestellung',
        'REFUND' => 'Rückerstattung',
        'ADJUSTMENT' => 'Anpassung',
        _ => type,
      };

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(locale: 'de_DE', symbol: '€');
    final dateFmt = DateFormat('dd.MM.yy HH:mm', 'de_DE');
    final isPositive = tx.amount > 0;

    return ListTile(
      leading: CircleAvatar(
        backgroundColor: _color(tx.type).withAlpha(30),
        child: Icon(_icon(tx.type), color: _color(tx.type), size: 20),
      ),
      title: Text(_label(tx.type)),
      subtitle: Text(tx.description ?? dateFmt.format(tx.createdAt),
          style: Theme.of(context).textTheme.bodySmall),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            '${isPositive ? '+' : ''}${fmt.format(tx.amount)}',
            style: TextStyle(
                color: isPositive ? Colors.green : Colors.red,
                fontWeight: FontWeight.bold),
          ),
          Text(fmt.format(tx.balanceAfter),
              style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
