"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Vote, FileText, BarChart3 } from "lucide-react"
import { getConfiguracion, isModoSimplificado } from "@/lib/supabase"
import { useElectionStats } from "@/hooks/use-election-stats"
import { useResultadosMesa } from "@/hooks/use-resultados-mesa"
import { ResultadoMesa } from "@/components/resultado-mesa"
import { ResultadosGenerales } from "@/components/resultados-generales"
import { formatearPorcentaje } from "@/lib/utils"

export function ResultadosPublicos() {
  const [resultadosPublicos, setResultadosPublicos] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modoSimplificado, setModoSimplificado] = useState(false)
  
  // Usar los hooks centralizados
  const { totalPadron, totalVotantes, porcentajeParticipacion, totalMesas, loading: statsLoading } = useElectionStats()
  const { 
    resultadosGenerales, 
    resultadosPorMesa, 
    totalVotos,
    loading: resultadosLoading 
  } = useResultadosMesa()

  useEffect(() => {
    checkResultadosPublicos()
    checkModoSimplificado()
  }, [])

  const checkModoSimplificado = async () => {
    const isSimple = await isModoSimplificado()
    setModoSimplificado(isSimple)
  }

  const checkResultadosPublicos = async () => {
    try {
      const publicos = await getConfiguracion("resultados_publicos")
      setResultadosPublicos(publicos === "true")
    } catch (error) {
      console.error("Error checking resultados publicos:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || statsLoading || resultadosLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!resultadosPublicos) {
    return <div />
  }

  return (
    <div className="max-w-6xl mx-auto mb-8 space-y-6">
      {/* Estadísticas generales - Ajustadas según modo */}
      {modoSimplificado ? (
        // Modo Simplificado: Solo votos y mesas
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{totalVotos.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Votos Emitidos</p>
                </div>
                <Vote className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalMesas}</div>
                  <p className="text-sm text-gray-600">Total Mesas</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Modo Completo: Todas las estadísticas
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalPadron.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Total Padrón</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{totalVotos.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Votos Emitidos</p>
                </div>
                <Vote className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{formatearPorcentaje(porcentajeParticipacion)}%</div>
                  <p className="text-sm text-gray-600">Participación</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resultados generales */}
      <ResultadosGenerales candidatos={resultadosGenerales} totalVotos={totalVotos} />

      {/* Resultados por mesa */}
      {resultadosPorMesa.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados por Mesa</CardTitle>
            <CardDescription>Detalle de votos por mesa electoral</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {resultadosPorMesa.map((mesa) => (
                <ResultadoMesa
                  key={mesa.mesa}
                  mesa={mesa.mesa}
                  candidatos={mesa.candidatos}
                  totalVotos={mesa.total_votos}
                  mostrarTitulo={false}
                  compact={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center text-sm text-gray-500">
        <p>Última actualización: {new Date().toLocaleString("es-AR")}</p>
      </div>
    </div>
  )
}
