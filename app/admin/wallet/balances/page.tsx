import { redirect } from 'next/navigation'

export default function WalletBalancesRedirect() {
  redirect('/admin/wallet')
}
