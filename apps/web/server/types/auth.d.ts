declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string | null
    isAdmin: boolean | null
  }
}

export {}
