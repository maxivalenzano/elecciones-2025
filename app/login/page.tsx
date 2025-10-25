"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, LogIn } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

const ADMIN_PASSWORD = "sietepalmas869"
const RESULTADOS_PASSWORD = "resultados2610"

export default function LoginPage() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async () => {
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa la contraseña",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (password === ADMIN_PASSWORD) {
        // Acceso de administrador
        localStorage.setItem("admin", "true")
        router.push("/admin/dashboard")
      } else if (password === RESULTADOS_PASSWORD) {
        // Acceso a resultados
        localStorage.setItem("resultados", "true")
        router.push("/resultados")
      } else {
        // Verificar si es un fiscal
        const { data, error } = await supabase
          .from("fiscales")
          .select("*")
          .eq("password", password.trim())
          .eq("activo", true)
          .single()

        if (error || !data) {
          toast({
            title: "Error de acceso",
            description: "Contraseña incorrecta",
            variant: "destructive",
          })
        } else {
          // Guardar datos del fiscal en localStorage
          localStorage.setItem("fiscal", JSON.stringify(data))
          router.push("/fiscal/mesa")
        }
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al iniciar sesión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <LogIn className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa tu contraseña para acceder al sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? "Verificando..." : "Ingresar"}
            </Button>

            <div className="text-center text-sm text-gray-500 space-y-1">
              <p>Fiscales: Ingresar contraseña asignada</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
