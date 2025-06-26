"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, ArrowLeft, MapPin, Hash } from "lucide-react"
import Link from "next/link"
import { supabase, type PadronRecord } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function BuscarPage() {
  const [searchType, setSearchType] = useState<"dni" | "nombre">("dni")
  const [searchValue, setSearchValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PadronRecord | null>(null)
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un valor para buscar",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let query = supabase.from("padron").select("*")

      if (searchType === "dni") {
        query = query.eq("dni", searchValue.trim())
      } else {
        query = query.ilike("apellido_nombre", `%${searchValue.trim()}%`)
      }

      const { data, error } = await query.single()

      if (error) {
        if (error.code === "PGRST116") {
          toast({
            title: "No encontrado",
            description: "No se encontró ningún registro con esos datos",
            variant: "destructive",
          })
        } else {
          throw error
        }
        setResult(null)
      } else {
        setResult(data)
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al buscar. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-center mb-2">Buscar Mesa Electoral</h1>
          <p className="text-center text-gray-600">Encuentra tu mesa y orden de votación</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Búsqueda de Votante
            </CardTitle>
            <CardDescription>Busca por DNI o por apellido y nombre</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                variant={searchType === "dni" ? "default" : "outline"}
                onClick={() => setSearchType("dni")}
                className="flex-1"
              >
                Por DNI
              </Button>
              <Button
                variant={searchType === "nombre" ? "default" : "outline"}
                onClick={() => setSearchType("nombre")}
                className="flex-1"
              >
                Por Nombre
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">{searchType === "dni" ? "Número de DNI" : "Apellido y Nombre"}</Label>
              <Input
                id="search"
                placeholder={searchType === "dni" ? "Ej: 12345678" : "Ej: García, Pedro"}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <Button onClick={handleSearch} disabled={loading} className="w-full">
              {loading ? "Buscando..." : "Buscar"}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-6 border-green-200 bg-green-50">
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{result.apellido_nombre}</h3>
                <p className="text-gray-600">DNI: {result.dni}</p>
                <p className="text-gray-600">Domicilio: {result.domicilio}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="font-semibold">Mesa</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{result.mesa}</p>
                </div>

                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center mb-2">
                    <Hash className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-semibold">Orden</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{result.orden}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {result?.voto_timestamp && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-yellow-800 font-semibold">
              ✓ Votó el {new Date(result.voto_timestamp).toLocaleString("es-AR")}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
