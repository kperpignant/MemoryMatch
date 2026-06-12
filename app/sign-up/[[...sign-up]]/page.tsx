import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="flex min-h-[80vh] items-center justify-center p-5">
      <SignUp />
    </main>
  )
}
