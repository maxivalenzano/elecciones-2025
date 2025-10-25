"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, RefreshCw } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useResultadosMesa } from "@/hooks/use-resultados-mesa"
import { ResultadosGenerales } from "@/components/resultados-generales"

export default function ResultadosAdminPage() {
  const { toast } = useToast()
  useAuth({ requiredRole: "admin", redirectTo: "/admin" })
  
  const { 
    resultadosGenerales: resumen, 
    resultadosPorMesa, 
    totalVotos, 
    loading, 
    error,
    refresh: loadResultados 
  } = useResultadosMesa()

  // Extraer mesas únicas de los resultados
  const mesas = resultadosPorMesa.map(m => m.mesa).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  // Mostrar error si existe
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  const exportarResultados = () => {
    // Crear CSV con los resultados
    let csvContent = "Mesa,Candidato,Partido,Votos\n"

    resultadosPorMesa.forEach((mesaData) => {
      mesaData.candidatos.forEach((candidato) => {
        csvContent += `${mesaData.mesa},"${candidato.nombre}","${candidato.partido}",${candidato.votos}\n`
      })
    })

    // Descargar archivo
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `resultados_eleccion_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Cargando...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Link>
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Resultados de la Elección</h1>
              <p className="text-gray-600">Resultados cargados por los fiscales de mesa</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadResultados}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
              <Button onClick={exportarResultados} disabled={resultadosPorMesa.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Estadísticas generales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{totalVotos}</div>
              <p className="text-sm text-gray-600">Total Votos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{mesas.length}</div>
              <p className="text-sm text-gray-600">Mesas con Resultados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{resumen.length}</div>
              <p className="text-sm text-gray-600">Candidatos</p>
            </CardContent>
          </Card>
        </div>

        {/* Resumen por candidato */}
        <ResultadosGenerales
          candidatos={resumen}
          totalVotos={totalVotos}
          titulo="Resumen General"
          descripcion="Resultados totales por candidato"
          className="mb-6"
        />

        {/* Resultados por mesa */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados por Mesa</CardTitle>
            <CardDescription>Detalle de votos por mesa y candidato</CardDescription>
          </CardHeader>
          <CardContent>
            {resultadosPorMesa.length > 0 ? (
              <div className="space-y-4">
                {resultadosPorMesa.map((mesaData) => (
                  <div key={mesaData.mesa} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">Mesa {mesaData.mesa}</h3>
                      <Badge variant="outline">{mesaData.total_votos} votos</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {mesaData.candidatos.map((candidato) => (
                        <div
                          key={`${mesaData.mesa}-${candidato.id}`}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: candidato.color }}
                            />
                            <span className="text-sm font-medium">{candidato.nombre}</span>
                          </div>
                          <span className="font-bold">{candidato.votos}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No hay resultados por mesa disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
