import { Text } from "@react-email/components"

interface EmailGreetingProps {
  name?: string | null
}

export function EmailGreeting({ name }: EmailGreetingProps) {
  const trimmedName = name?.trim()

  return <Text>{trimmedName ? `Hey ${trimmedName}!` : "Hey there!"}</Text>
}
