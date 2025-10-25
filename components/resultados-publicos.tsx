"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Vote, FileText, BarChart3 } from "lucide-react"
import { supabase, type Candidato, getConfiguracion, isModoSimplificado } from "@/lib/supabase"
import { useElectionStats } from "@/hooks/use-election-stats"
import { ResultadoMesa } from "@/components/resultado-mesa"
import { ResultadosGenerales } from "@/components/resultados-generales"

// Interfaces actualizadas para usar mesa como string
interface ResultadoCandidato extends Candidato {
  total_votos: number
  porcentaje: number
  votos_por_mesa: { [mesa: string]: { votos: number; porcentaje: number } }
}

interface ResultadoMesa {
  mesa: string
  total_votos: number
  candidatos: Array<{
    id: number
    nombre: string
    partido: string
    color: string
    votos: number
    porcentaje: number
  }>
}

export function ResultadosPublicos() {
  const [resultadosPublicos, setResultadosPublicos] = useState(false)
  const [loading, setLoading] = useState(true)
  const [resultados, setResultados] = useState<ResultadoCandidato[]>([])
  const [resultadosPorMesa, setResultadosPorMesa] = useState<ResultadoMesa[]>([])
  const [modoSimplificado, setModoSimplificado] = useState(false)
  
  // Usar el hook centralizado para estadísticas
  const { totalPadron, totalVotantes, porcentajeParticipacion, totalVotos, totalMesas, loading: statsLoading } = useElectionStats()

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

      if (publicos === "true") {
        await loadResultados()
      }
    } catch (error) {
      console.error("Error checking resultados publicos:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadResultados = async () => {
    try {
      // Resultados de votos por mesa
      const { data: votosData } = await supabase.from("votos").select(`
        mesa,
        candidato_id,
        cantidad_votos,
        candidatos (
          id,
          nombre,
          partido,
          color
        )
      `)

      // Mapas usando string como clave
      const resultadosMap = new Map<number, ResultadoCandidato>()
      const mesasMap = new Map<string, ResultadoMesa>()
      let totalVotosCalculado = 0

      votosData?.forEach((voto: any) => {
        const candidatoId = voto.candidato_id
        const mesaKey = String(voto.mesa)
        const votos = voto.cantidad_votos
        totalVotosCalculado += votos

        // Resultados generales
        if (resultadosMap.has(candidatoId)) {
          const existing = resultadosMap.get(candidatoId)!
          existing.total_votos += votos
          existing.votos_por_mesa[mesaKey] = { votos, porcentaje: 0 }
        } else {
          resultadosMap.set(candidatoId, {
            ...voto.candidatos,
            total_votos: votos,
            porcentaje: 0,
            votos_por_mesa: { [mesaKey]: { votos, porcentaje: 0 } },
          })
        }

        // Resultados por mesa
        if (mesasMap.has(mesaKey)) {
          const existingMesa = mesasMap.get(mesaKey)!
          existingMesa.total_votos += votos
          existingMesa.candidatos.push({
            id: voto.candidatos.id,
            nombre: voto.candidatos.nombre,
            partido: voto.candidatos.partido,
            color: voto.candidatos.color,
            votos,
            porcentaje: 0,
          })
        } else {
          mesasMap.set(mesaKey, {
            mesa: mesaKey,
            total_votos: votos,
            candidatos: [
              {
                id: voto.candidatos.id,
                nombre: voto.candidatos.nombre,
                partido: voto.candidatos.partido,
                color: voto.candidatos.color,
                votos,
                porcentaje: 0,
              },
            ],
          })
        }
      })

      // Calcular porcentajes generales y por mesa
      const resultadosArray = Array.from(resultadosMap.values()).map((candidato) => {
        const porcentajeGeneral = totalVotosCalculado > 0 ? Math.round((candidato.total_votos / totalVotosCalculado) * 100) : 0

        Object.keys(candidato.votos_por_mesa).forEach((mesaKey) => {
          const mesaData = mesasMap.get(mesaKey)
          if (mesaData) {
            const votosMesa = candidato.votos_por_mesa[mesaKey].votos
            const porcentajeMesa = mesaData.total_votos > 0
              ? Math.round((votosMesa / mesaData.total_votos) * 100)
              : 0
            candidato.votos_por_mesa[mesaKey].porcentaje = porcentajeMesa
          }
        })

        return {
          ...candidato,
          porcentaje: porcentajeGeneral,
        }
      })

      const resultadosMesaArray = Array.from(mesasMap.values()).map((mesa) => ({
        ...mesa,
        candidatos: mesa.candidatos.map((candidato) => ({
          ...candidato,
          porcentaje: mesa.total_votos > 0 ? Math.round((candidato.votos / mesa.total_votos) * 100) : 0,
        })),
      }))

      // Ordenar
      resultadosArray.sort((a, b) => b.total_votos - a.total_votos)
      resultadosMesaArray.sort((a, b) => a.mesa.localeCompare(b.mesa, undefined, { numeric: true }))
      resultadosMesaArray.forEach((mesa) => {
        mesa.candidatos.sort((a, b) => b.votos - a.votos)
      })

      setResultados(resultadosArray)
      setResultadosPorMesa(resultadosMesaArray)
    } catch (error) {
      console.error("Error loading resultados:", error)
    }
  }

  if (loading || statsLoading) {
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
                  <div className="text-2xl font-bold text-purple-600">{porcentajeParticipacion}%</div>
                  <p className="text-sm text-gray-600">Participación</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resultados generales */}
      <ResultadosGenerales candidatos={resultados} totalVotos={totalVotos} />

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
