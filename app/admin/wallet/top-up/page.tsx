import { redirect } from 'next/navigation'

export default function WalletTopUpRedirect() {
  redirect('/admin/wallet')
}
