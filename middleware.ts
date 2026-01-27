export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/kitchen/:path*', '/menu', '/admin/:path*'],
}
