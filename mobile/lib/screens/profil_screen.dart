import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/providers.dart';
import '../core/api_client.dart';
import '../core/constants.dart';

class ProfilScreen extends ConsumerWidget {
  const ProfilScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    if (user == null) return const SizedBox();

    return Scaffold(
      appBar: AppBar(title: const Text('Mein Profil')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Avatar + Name
          Center(
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  child: Text(
                    user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                    style: const TextStyle(fontSize: 32, color: Colors.white),
                  ),
                ),
                const SizedBox(height: 12),
                Text(user.name,
                    style: Theme.of(context)
                        .textTheme
                        .titleLarge
                        ?.copyWith(fontWeight: FontWeight.bold)),
                Text(user.email,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(color: Colors.grey)),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Stammdaten
          _SectionCard(
            title: 'Stammdaten',
            children: [
              _EditTile(
                icon: Icons.person_outlined,
                label: 'Name',
                value: user.name,
                onSave: (v) async {
                  final api = ref.read(apiClientProvider);
                  await api.patch(ApiConstants.profilStammdaten, data: {'name': v});
                  ref.invalidate(authProvider);
                },
              ),
              _InfoTile(icon: Icons.email_outlined, label: 'E-Mail', value: user.email),
            ],
          ),
          const SizedBox(height: 12),

          // Einstellungen
          _SectionCard(
            title: 'Einstellungen',
            children: [
              _SwitchTile(
                icon: Icons.email,
                label: 'Marketing-E-Mails',
                value: user.marketingEmailConsent,
                onChanged: (v) async {
                  final api = ref.read(apiClientProvider);
                  await api.patch(ApiConstants.profilEinstellungen,
                      data: {'marketingEmailConsent': v});
                  ref.invalidate(authProvider);
                },
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Sicherheit
          _SectionCard(
            title: 'Sicherheit',
            children: [
              ListTile(
                leading: const Icon(Icons.lock_reset),
                title: const Text('Passwort zurücksetzen'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _requestPasswordReset(context, ref),
              ),
              ListTile(
                leading: const Icon(Icons.alternate_email),
                title: const Text('E-Mail ändern'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showEmailChange(context, ref),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Abmelden
          OutlinedButton.icon(
            onPressed: () => ref.read(authProvider.notifier).logout(),
            icon: const Icon(Icons.logout, color: Colors.red),
            label: const Text('Abmelden', style: TextStyle(color: Colors.red)),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Colors.red),
              minimumSize: const Size(double.infinity, 52),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _requestPasswordReset(BuildContext context, WidgetRef ref) async {
    try {
      final api = ref.read(apiClientProvider);
      await api.post(ApiConstants.profilPasswortReset);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Passwort-Reset-E-Mail wurde gesendet')),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Fehler: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showEmailChange(BuildContext context, WidgetRef ref) {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('E-Mail ändern'),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'Neue E-Mail-Adresse'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Abbrechen')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              try {
                final api = ref.read(apiClientProvider);
                await api.post(ApiConstants.profilEmailAendern,
                    data: {'newEmail': ctrl.text.trim()});
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                        content: Text('Bestätigungs-E-Mail wurde gesendet')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                        content: Text('Fehler: $e'),
                        backgroundColor: Colors.red),
                  );
                }
              }
            },
            child: const Text('Senden'),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 6),
            child: Text(title,
                style: Theme.of(context)
                    .textTheme
                    .labelLarge
                    ?.copyWith(color: Colors.grey[600])),
          ),
          Card(child: Column(children: children)),
        ],
      );
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoTile({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) => ListTile(
        leading: Icon(icon),
        title: Text(label),
        subtitle: Text(value),
      );
}

class _EditTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Future<void> Function(String) onSave;
  const _EditTile(
      {required this.icon,
      required this.label,
      required this.value,
      required this.onSave});

  @override
  Widget build(BuildContext context) => ListTile(
        leading: Icon(icon),
        title: Text(label),
        subtitle: Text(value),
        trailing: IconButton(
          icon: const Icon(Icons.edit_outlined),
          onPressed: () => _showEdit(context),
        ),
      );

  void _showEdit(BuildContext context) {
    final ctrl = TextEditingController(text: value);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('$label ändern'),
        content: TextField(
          controller: ctrl,
          decoration: InputDecoration(labelText: label),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Abbrechen')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await onSave(ctrl.text.trim());
            },
            child: const Text('Speichern'),
          ),
        ],
      ),
    );
  }
}

class _SwitchTile extends StatefulWidget {
  final IconData icon;
  final String label;
  final bool value;
  final Future<void> Function(bool) onChanged;
  const _SwitchTile(
      {required this.icon,
      required this.label,
      required this.value,
      required this.onChanged});

  @override
  State<_SwitchTile> createState() => _SwitchTileState();
}

class _SwitchTileState extends State<_SwitchTile> {
  late bool _val;

  @override
  void initState() {
    super.initState();
    _val = widget.value;
  }

  @override
  Widget build(BuildContext context) => SwitchListTile(
        secondary: Icon(widget.icon),
        title: Text(widget.label),
        value: _val,
        onChanged: (v) async {
          setState(() => _val = v);
          await widget.onChanged(v);
        },
      );
}
