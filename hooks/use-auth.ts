import { useEffect } from "react"
import { useRouter } from "next/navigation"

export type AuthRole = "admin" | "resultados" | "fiscal"

interface UseAuthOptions {
  requiredRole?: AuthRole | AuthRole[]
  redirectTo?: string
}

export function useAuth(options?: UseAuthOptions) {
  const router = useRouter()
  const { requiredRole, redirectTo = "/login" } = options || {}

  useEffect(() => {
    // Check authentication
    const isAdmin = localStorage.getItem("admin")
    const hasResultadosAccess = localStorage.getItem("resultados")
    const fiscalData = localStorage.getItem("fiscal")

    // If no required role, just check if any authentication exists
    if (!requiredRole) {
      if (!isAdmin && !hasResultadosAccess && !fiscalData) {
        router.push(redirectTo)
      }
      return
    }

    // Convert to array for easier checking
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

    // Check if user has any of the required roles
    const hasAccess = requiredRoles.some((role) => {
      switch (role) {
        case "admin":
          return isAdmin === "true"
        case "resultados":
          return hasResultadosAccess === "true" || isAdmin === "true"
        case "fiscal":
          return fiscalData !== null
        default:
          return false
      }
    })

    if (!hasAccess) {
      router.push(redirectTo)
    }
  }, [router, requiredRole, redirectTo])

  // Return helper functions
  return {
    isAdmin: () => localStorage.getItem("admin") === "true",
    hasResultadosAccess: () =>
      localStorage.getItem("resultados") === "true" || localStorage.getItem("admin") === "true",
    getFiscalData: () => {
      const data = localStorage.getItem("fiscal")
      return data ? JSON.parse(data) : null
    },
    logout: (role: AuthRole = "admin") => {
      switch (role) {
        case "admin":
          localStorage.removeItem("admin")
          break
        case "resultados":
          localStorage.removeItem("resultados")
          break
        case "fiscal":
          localStorage.removeItem("fiscal")
          break
      }
      router.push("/")
    },
  }
}

