class ApiConstants {
  // Basis-URL – für Produktion auf die Vercel-URL setzen
  static const String baseUrl = 'https://qatering.vercel.app/api';

  // Auth
  static const String login = '/auth/callback/credentials';
  static const String register = '/auth/register';
  static const String session = '/auth/session';

  // Menu
  static const String menus = '/menus';

  // Orders
  static const String orders = '/orders';

  // Wallet
  static const String wallet = '/wallet';
  static const String walletTransactions = '/wallet/transactions';

  // Payments
  static const String stripeCreateIntent = '/payments/stripe/create-intent';
  static const String stripeVerify = '/payments/stripe/verify';

  // Profile
  static const String profil = '/profil';
  static const String profilStammdaten = '/profil/stammdaten';
  static const String profilEinstellungen = '/profil/einstellungen';
  static const String profilPraeferenzen = '/profil/praeferenzen';
  static const String profilBestellungen = '/profil/bestellungen';
  static const String profilEmailAendern = '/profil/email-aendern';
  static const String profilPasswortReset = '/profil/passwort-reset';

  // Coupons
  static const String couponsValidate = '/coupons/validate';

  // Incentives
  static const String myIncentives = '/incentives/my-codes';

  // Locations
  static const String locations = '/locations';
}
