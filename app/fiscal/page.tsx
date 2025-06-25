"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function FiscalLoginPage() {
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
      const { data, error } = await supabase
        .from("fiscales")
        .select("*")
        .eq("password", password.trim())
        .eq("activo", true)
        .single()

      if (error || !data) {
        toast({
          title: "Error de acceso",
          description: "Contraseña incorrecta o fiscal inactivo",
          variant: "destructive",
        })
      } else {
        // Guardar datos del fiscal en localStorage
        localStorage.setItem("fiscal", JSON.stringify(data))
        router.push("/fiscal/mesa")
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
            <Users className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <CardTitle>Acceso Fiscal de Mesa</CardTitle>
            <CardDescription>Ingresa tu contraseña asignada para acceder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="text"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <Button onClick={handleLogin} disabled={loading} className="w-full">
              {loading ? "Verificando..." : "Ingresar"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
