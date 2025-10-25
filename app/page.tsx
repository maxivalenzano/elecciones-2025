"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, LogIn } from "lucide-react"
import { ResultadosPublicos } from "@/components/resultados-publicos"
import { isModoSimplificado } from "@/lib/supabase"
import { ELECCIONES } from "@/lib/constants"

export default function HomePage() {
  const [modoSimplificado, setModoSimplificado] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMode = async () => {
      const isSimple = await isModoSimplificado()
      setModoSimplificado(isSimple)
      setLoading(false)
    }
    checkMode()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          <span className="block sm:inline">Elecciones</span>{" "}
          <span className="block sm:inline">{ELECCIONES.lugar}</span>
        </h1>
        <p className="text-xl text-gray-600">{ELECCIONES.fechaCompleta}</p>
      </div>


      {/* Resultados Públicos */}
      <ResultadosPublicos />

      {/* Buscar Mesa - Solo en modo completo */}
      {!loading && !modoSimplificado && (
        <div className="max-w-md mx-auto mt-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Search className="h-12 w-12 mx-auto text-blue-600 mb-2" />
              <CardTitle>Buscar Mesa</CardTitle>
              <CardDescription>Encuentra tu mesa y orden de votación</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/buscar">Buscar por DNI</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botón de Inicio de Sesión */}
      <div className="max-w-md mx-auto mt-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="text-center">
            <LogIn className="h-12 w-12 mx-auto text-blue-600 mb-2" />
            <CardTitle>Acceso al Sistema</CardTitle>
            <CardDescription>Ingresa tu contraseña para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
