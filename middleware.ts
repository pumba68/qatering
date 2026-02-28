export { default } from 'next-auth/middleware'

export const config = {
  // /menu ist öffentlich (PROJ-25) – kein Auth-Schutz mehr hier
  matcher: ['/kitchen/:path*', '/admin/:path*', '/wallet/:path*', '/order/:path*', '/profil/:path*', '/pos/:path*', '/pos'],
}
