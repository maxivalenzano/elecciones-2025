"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, Users, Vote } from "lucide-react"
import { supabase, type Candidato, getConfiguracion } from "@/lib/supabase"

interface ResultadoCandidato extends Candidato {
  total_votos: number
  porcentaje: number
  votos_por_mesa: { [mesa: number]: { votos: number; porcentaje: number } }
}

interface ResultadoMesa {
  mesa: number
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
  const [stats, setStats] = useState({
    totalVotos: 0,
    totalPadron: 0,
    totalVotantes: 0,
    porcentajeParticipacion: 0,
  })

  useEffect(() => {
    checkResultadosPublicos()
  }, [])

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
      // Cargar estadísticas del padrón
      const { data: statsData, count: totalPadronCount } = await supabase
        .from("padron")
        .select("voto_timestamp", { count: "exact" })

      const totalPadron = totalPadronCount || 0
      const totalVotantes = statsData?.filter((p) => p.voto_timestamp).length || 0
      const porcentajeParticipacion = totalPadron > 0 ? Math.round((totalVotantes / totalPadron) * 100) : 0

      // Cargar resultados por candidato y mesa
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

      // Procesar resultados generales
      const resultadosMap = new Map<number, ResultadoCandidato>()
      const mesasMap = new Map<number, ResultadoMesa>()
      let totalVotos = 0

      votosData?.forEach((voto: any) => {
        const candidatoId = voto.candidato_id
        const mesa = voto.mesa
        const votos = voto.cantidad_votos
        totalVotos += votos

        // Resultados generales por candidato
        if (resultadosMap.has(candidatoId)) {
          const existing = resultadosMap.get(candidatoId)!
          existing.total_votos += votos
          existing.votos_por_mesa[mesa] = { votos, porcentaje: 0 }
        } else {
          resultadosMap.set(candidatoId, {
            ...voto.candidatos,
            total_votos: votos,
            porcentaje: 0,
            votos_por_mesa: { [mesa]: { votos, porcentaje: 0 } },
          })
        }

        // Resultados por mesa
        if (mesasMap.has(mesa)) {
          const existingMesa = mesasMap.get(mesa)!
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
          mesasMap.set(mesa, {
            mesa,
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

      // Calcular porcentajes generales
      const resultadosArray = Array.from(resultadosMap.values()).map((candidato) => {
        const porcentajeGeneral = totalVotos > 0 ? Math.round((candidato.total_votos / totalVotos) * 100) : 0

        // Calcular porcentajes por mesa
        Object.keys(candidato.votos_por_mesa).forEach((mesaStr) => {
          const mesa = Number.parseInt(mesaStr)
          const mesaData = mesasMap.get(mesa)
          if (mesaData) {
            const porcentajeMesa =
              mesaData.total_votos > 0
                ? Math.round((candidato.votos_por_mesa[mesa].votos / mesaData.total_votos) * 100)
                : 0
            candidato.votos_por_mesa[mesa].porcentaje = porcentajeMesa
          }
        })

        return {
          ...candidato,
          porcentaje: porcentajeGeneral,
        }
      })

      // Calcular porcentajes por mesa
      const resultadosMesaArray = Array.from(mesasMap.values()).map((mesa) => ({
        ...mesa,
        candidatos: mesa.candidatos.map((candidato) => ({
          ...candidato,
          porcentaje: mesa.total_votos > 0 ? Math.round((candidato.votos / mesa.total_votos) * 100) : 0,
        })),
      }))

      // Ordenar resultados
      resultadosArray.sort((a, b) => b.total_votos - a.total_votos)
      resultadosMesaArray.sort((a, b) => a.mesa - b.mesa)
      resultadosMesaArray.forEach((mesa) => {
        mesa.candidatos.sort((a, b) => b.votos - a.votos)
      })

      setResultados(resultadosArray)
      setResultadosPorMesa(resultadosMesaArray)
      setStats({
        totalVotos,
        totalPadron,
        totalVotantes,
        porcentajeParticipacion,
      })
    } catch (error) {
      console.error("Error loading resultados:", error)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!resultadosPublicos) {
    return ( <div /> )
  }

  {/* 
      <div className="max-w-2xl mx-auto mb-8">
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Resultados no disponibles</h2>
            <p className="text-gray-600">
              Los resultados se publicarán una vez finalizada la jornada electoral.
            </p>
          </CardContent>
        </Card>
      </div>
     */}

  return (
    <div className="max-w-6xl mx-auto mb-8 space-y-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalPadron.toLocaleString()}</div>
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
                <div className="text-2xl font-bold text-green-600">{stats.totalVotos.toLocaleString()}</div>
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
                <div className="text-2xl font-bold text-purple-600">{stats.porcentajeParticipacion}%</div>
                <p className="text-sm text-gray-600">Participación</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados generales */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados Generales</CardTitle>
          <CardDescription>Total: {stats.totalVotos.toLocaleString()} votos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resultados.length > 0 ? (
            resultados.map((candidato, index) => (
              <div key={candidato.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: candidato.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{candidato.nombre}</p>
                      <p className="text-sm text-gray-600">{candidato.partido}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: candidato.color }}>
                      {candidato.total_votos.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">{candidato.porcentaje}%</p>
                  </div>
                </div>
                <Progress value={candidato.porcentaje} className="h-3" />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay resultados disponibles</p>
            </div>
          )}
        </CardContent>
      </Card>

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
                <div key={mesa.mesa} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg">Mesa {mesa.mesa}</h3>
                    <Badge variant="outline">{mesa.total_votos} votos</Badge>
                  </div>
                  <div className="space-y-2">
                    {mesa.candidatos.map((candidato) => (
                      <div key={candidato.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: candidato.color }} />
                          <span className="text-sm font-medium">{candidato.nombre}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{candidato.votos}</span>
                          <span className="text-sm text-gray-600 ml-1">({candidato.porcentaje}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
