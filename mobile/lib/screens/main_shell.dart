import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/menu')) return 0;
    if (location.startsWith('/orders')) return 1;
    if (location.startsWith('/wallet')) return 2;
    if (location.startsWith('/profil')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex(context),
        onTap: (i) {
          switch (i) {
            case 0: context.go('/menu'); break;
            case 1: context.go('/orders'); break;
            case 2: context.go('/wallet'); break;
            case 3: context.go('/profil'); break;
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.restaurant_menu), label: 'Menü'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long), label: 'Bestellungen'),
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet), label: 'Guthaben'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }
}
