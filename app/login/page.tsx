import { redirect } from 'next/navigation'

/** Legacy URL — Neon Auth sign-in lives at `/auth/sign-in`. */
export default function LoginRedirectPage() {
    redirect('/auth/sign-in')
}
