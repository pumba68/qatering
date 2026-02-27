import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'models.dart';
import 'api_client.dart';
import 'constants.dart';

// ── Auth ──────────────────────────────────────────────────────────────────────

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.isLoading = false, this.error});

  bool get isAuthenticated => user != null;
  AuthState copyWith({User? user, bool? isLoading, String? error}) =>
      AuthState(
        user: user ?? this.user,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api;

  AuthNotifier(this._api) : super(const AuthState()) {
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    state = state.copyWith(isLoading: true);
    try {
      final res = await _api.get(ApiConstants.session);
      if (res.data != null && res.data['user'] != null) {
        state = AuthState(user: User.fromJson(res.data['user']));
      } else {
        state = const AuthState();
      }
    } catch (_) {
      state = const AuthState();
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.post(ApiConstants.login, data: {
        'email': email,
        'password': password,
        'csrfToken': '',
        'callbackUrl': '/',
        'json': 'true',
      });
      if (res.statusCode == 200) {
        await _restoreSession();
        return state.isAuthenticated;
      }
      state = state.copyWith(isLoading: false, error: 'Login fehlgeschlagen');
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Verbindungsfehler');
      return false;
    }
  }

  Future<bool> register(String name, String email, String password, String locationId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.post(ApiConstants.register, data: {
        'name': name,
        'email': email,
        'password': password,
        'locationId': locationId,
      });
      if (res.statusCode == 201) {
        return login(email, password);
      }
      final msg = res.data?['message'] ?? 'Registrierung fehlgeschlagen';
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Verbindungsfehler');
      return false;
    }
  }

  Future<void> logout() async {
    await _api.clearSession();
    state = const AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(ref.read(apiClientProvider)),
);

// ── Location ──────────────────────────────────────────────────────────────────

final selectedLocationIdProvider = StateProvider<String?>((ref) => null);

final locationsProvider = FutureProvider<List<Location>>((ref) async {
  final api = ref.read(apiClientProvider);
  final res = await api.get(ApiConstants.locations);
  return (res.data as List).map((e) => Location.fromJson(e)).toList();
});

// ── Menu ──────────────────────────────────────────────────────────────────────

final menuProvider = FutureProvider<Menu?>((ref) async {
  final locationId = ref.watch(selectedLocationIdProvider);
  if (locationId == null) return null;
  final api = ref.read(apiClientProvider);
  final res = await api.get(ApiConstants.menus, params: {'locationId': locationId});
  return Menu.fromJson(res.data);
});

// ── Cart ──────────────────────────────────────────────────────────────────────

class CartNotifier extends StateNotifier<List<CartItem>> {
  CartNotifier() : super([]);

  void add(MenuItem item) {
    final idx = state.indexWhere((c) => c.menuItem.id == item.id);
    if (idx >= 0) {
      state = [
        ...state.sublist(0, idx),
        CartItem(menuItem: item, quantity: state[idx].quantity + 1),
        ...state.sublist(idx + 1),
      ];
    } else {
      state = [...state, CartItem(menuItem: item)];
    }
  }

  void remove(String itemId) {
    final idx = state.indexWhere((c) => c.menuItem.id == itemId);
    if (idx < 0) return;
    if (state[idx].quantity > 1) {
      state = [
        ...state.sublist(0, idx),
        CartItem(menuItem: state[idx].menuItem, quantity: state[idx].quantity - 1),
        ...state.sublist(idx + 1),
      ];
    } else {
      state = [...state.where((c) => c.menuItem.id != itemId)];
    }
  }

  void clear() => state = [];

  double get total => state.fold(0, (sum, c) => sum + c.subtotal);
  int get itemCount => state.fold(0, (sum, c) => sum + c.quantity);
}

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItem>>(
  (_) => CartNotifier(),
);

// ── Wallet ────────────────────────────────────────────────────────────────────

final walletProvider = FutureProvider<WalletBalance>((ref) async {
  final api = ref.read(apiClientProvider);
  final res = await api.get(ApiConstants.wallet);
  return WalletBalance.fromJson(res.data);
});

final walletTransactionsProvider = FutureProvider<List<WalletTransaction>>((ref) async {
  final api = ref.read(apiClientProvider);
  final res = await api.get(ApiConstants.walletTransactions);
  return (res.data['transactions'] as List)
      .map((e) => WalletTransaction.fromJson(e))
      .toList();
});

// ── Orders ────────────────────────────────────────────────────────────────────

class OrdersState {
  final List<Order> upcoming;
  final List<Order> history;

  const OrdersState({this.upcoming = const [], this.history = const []});
}

final ordersProvider = FutureProvider<OrdersState>((ref) async {
  final api = ref.read(apiClientProvider);
  final res = await api.get(ApiConstants.profilBestellungen);
  return OrdersState(
    upcoming: (res.data['upcoming'] as List).map((e) => Order.fromJson(e)).toList(),
    history: (res.data['history'] as List).map((e) => Order.fromJson(e)).toList(),
  );
});
