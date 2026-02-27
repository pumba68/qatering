// ── Auth ─────────────────────────────────────────────────────────────────────

class User {
  final String id;
  final String name;
  final String email;
  final String role;
  final bool marketingEmailConsent;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.marketingEmailConsent,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        email: json['email'] as String,
        role: json['role'] as String? ?? 'CUSTOMER',
        marketingEmailConsent: json['marketingEmailConsent'] as bool? ?? false,
      );
}

// ── Location ──────────────────────────────────────────────────────────────────

class Location {
  final String id;
  final String name;

  const Location({required this.id, required this.name});

  factory Location.fromJson(Map<String, dynamic> json) =>
      Location(id: json['id'] as String, name: json['name'] as String);
}

// ── Menu ──────────────────────────────────────────────────────────────────────

class MenuItem {
  final String id;
  final String dishId;
  final String name;
  final String? description;
  final double price;
  final String? imageUrl;
  final bool available;
  final bool isPromotion;
  final String? dayOfWeek;
  final List<String> allergens;
  final List<String> dietLabels;

  const MenuItem({
    required this.id,
    required this.dishId,
    required this.name,
    this.description,
    required this.price,
    this.imageUrl,
    required this.available,
    required this.isPromotion,
    this.dayOfWeek,
    required this.allergens,
    required this.dietLabels,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    final dish = json['dish'] as Map<String, dynamic>? ?? {};
    final meta = dish['metadata'] as List<dynamic>? ?? [];
    final allergens = meta
        .where((m) => (m['type'] as String?) == 'ALLERGEN')
        .map((m) => m['name'] as String)
        .toList();
    final diets = meta
        .where((m) => (m['type'] as String?) == 'DIET')
        .map((m) => m['name'] as String)
        .toList();

    return MenuItem(
      id: json['id'] as String,
      dishId: json['dishId'] as String? ?? '',
      name: dish['name'] as String? ?? json['name'] as String? ?? '',
      description: dish['description'] as String?,
      price: (json['price'] as num).toDouble(),
      imageUrl: dish['imageUrl'] as String?,
      available: json['available'] as bool? ?? true,
      isPromotion: json['isPromotion'] as bool? ?? false,
      dayOfWeek: json['dayOfWeek'] as String?,
      allergens: allergens,
      dietLabels: diets,
    );
  }
}

class Menu {
  final String id;
  final int weekNumber;
  final int year;
  final List<MenuItem> items;

  const Menu({
    required this.id,
    required this.weekNumber,
    required this.year,
    required this.items,
  });

  factory Menu.fromJson(Map<String, dynamic> json) => Menu(
        id: json['id'] as String,
        weekNumber: json['weekNumber'] as int,
        year: json['year'] as int,
        items: (json['menuItems'] as List<dynamic>? ?? [])
            .map((e) => MenuItem.fromJson(e as Map<String, dynamic>))
            .toList(),
      );

  Map<String, List<MenuItem>> get byDay {
    final days = <String, List<MenuItem>>{};
    for (final item in items.where((i) => i.available)) {
      final day = item.dayOfWeek ?? 'SONSTIGE';
      days.putIfAbsent(day, () => []).add(item);
    }
    return days;
  }
}

// ── Order ─────────────────────────────────────────────────────────────────────

class OrderItem {
  final String id;
  final String productName;
  final int quantity;
  final double price;

  const OrderItem({
    required this.id,
    required this.productName,
    required this.quantity,
    required this.price,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
        id: json['id'] as String,
        productName: json['productName'] as String? ??
            (json['dish'] as Map?)?['name'] as String? ?? '',
        quantity: json['quantity'] as int,
        price: (json['price'] as num).toDouble(),
      );
}

class Order {
  final String id;
  final String status;
  final String? pickupCode;
  final double totalAmount;
  final double finalAmount;
  final double discountAmount;
  final DateTime createdAt;
  final DateTime? pickupDate;
  final String? notes;
  final List<OrderItem> items;
  final String? locationName;

  const Order({
    required this.id,
    required this.status,
    this.pickupCode,
    required this.totalAmount,
    required this.finalAmount,
    required this.discountAmount,
    required this.createdAt,
    this.pickupDate,
    this.notes,
    required this.items,
    this.locationName,
  });

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: json['id'] as String,
        status: json['status'] as String,
        pickupCode: json['pickupCode'] as String?,
        totalAmount: (json['totalAmount'] as num).toDouble(),
        finalAmount: (json['finalAmount'] as num? ?? json['totalAmount'] as num).toDouble(),
        discountAmount: (json['discountAmount'] as num? ?? 0).toDouble(),
        createdAt: DateTime.parse(json['createdAt'] as String),
        pickupDate: json['pickupDate'] != null
            ? DateTime.parse(json['pickupDate'] as String)
            : null,
        notes: json['notes'] as String?,
        items: (json['items'] as List<dynamic>? ?? [])
            .map((e) => OrderItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        locationName: (json['location'] as Map?)?['name'] as String?,
      );

  bool get isActive => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].contains(status);
}

// ── Wallet ────────────────────────────────────────────────────────────────────

class WalletBalance {
  final double balance;
  final bool isLow;
  final bool isZero;

  const WalletBalance({
    required this.balance,
    required this.isLow,
    required this.isZero,
  });

  factory WalletBalance.fromJson(Map<String, dynamic> json) => WalletBalance(
        balance: (json['balance'] as num).toDouble(),
        isLow: json['isLow'] as bool? ?? false,
        isZero: json['isZero'] as bool? ?? false,
      );
}

class WalletTransaction {
  final String id;
  final String type;
  final double amount;
  final double balanceBefore;
  final double balanceAfter;
  final String? description;
  final DateTime createdAt;

  const WalletTransaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.balanceBefore,
    required this.balanceAfter,
    this.description,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) =>
      WalletTransaction(
        id: json['id'] as String,
        type: json['type'] as String,
        amount: (json['amount'] as num).toDouble(),
        balanceBefore: (json['balanceBefore'] as num).toDouble(),
        balanceAfter: (json['balanceAfter'] as num).toDouble(),
        description: json['description'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

// ── Cart ──────────────────────────────────────────────────────────────────────

class CartItem {
  final MenuItem menuItem;
  int quantity;

  CartItem({required this.menuItem, this.quantity = 1});

  double get subtotal => menuItem.price * quantity;
}
