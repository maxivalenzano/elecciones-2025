import { useState, useEffect } from "react"
import { supabase, type Candidato } from "@/lib/supabase"

export interface ResultadoCandidato extends Candidato {
  total_votos: number
  porcentaje: number
  votos_por_mesa: { [mesa: string]: { votos: number; porcentaje: number } }
}

export interface ResultadoMesa {
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

interface UseResultadosMesaReturn {
  resultadosGenerales: ResultadoCandidato[]
  resultadosPorMesa: ResultadoMesa[]
  totalVotos: number
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useResultadosMesa(): UseResultadosMesaReturn {
  const [resultadosGenerales, setResultadosGenerales] = useState<ResultadoCandidato[]>([])
  const [resultadosPorMesa, setResultadosPorMesa] = useState<ResultadoMesa[]>([])
  const [totalVotos, setTotalVotos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadResultados = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar resultados de votos por mesa
      const { data: votosData, error: votosError } = await supabase.from("votos").select(`
        mesa,
        candidato_id,
        cantidad_votos,
        candidatos (
          id,
          nombre,
          partido,
          color,
          activo
        )
      `)

      if (votosError) throw votosError

      if (!votosData || votosData.length === 0) {
        setResultadosGenerales([])
        setResultadosPorMesa([])
        setTotalVotos(0)
        setLoading(false)
        return
      }

      // Mapas para procesar resultados
      const resultadosMap = new Map<number, ResultadoCandidato>()
      const mesasMap = new Map<string, ResultadoMesa>()
      let totalVotosCalculado = 0

      // Procesar cada voto
      votosData.forEach((voto: any) => {
        const candidatoId = voto.candidato_id
        const mesaKey = String(voto.mesa)
        const votos = voto.cantidad_votos
        totalVotosCalculado += votos

        // Resultados generales por candidato
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
        const porcentajeGeneral =
          totalVotosCalculado > 0 ? Math.round((candidato.total_votos / totalVotosCalculado) * 100) : 0

        // Calcular porcentajes por mesa
        Object.keys(candidato.votos_por_mesa).forEach((mesaKey) => {
          const mesaData = mesasMap.get(mesaKey)
          if (mesaData) {
            const votosMesa = candidato.votos_por_mesa[mesaKey].votos
            const porcentajeMesa =
              mesaData.total_votos > 0 ? Math.round((votosMesa / mesaData.total_votos) * 100) : 0
            candidato.votos_por_mesa[mesaKey].porcentaje = porcentajeMesa
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
      resultadosMesaArray.sort((a, b) => a.mesa.localeCompare(b.mesa, undefined, { numeric: true }))
      resultadosMesaArray.forEach((mesa) => {
        mesa.candidatos.sort((a, b) => b.votos - a.votos)
      })

      // Actualizar estado
      setResultadosGenerales(resultadosArray)
      setResultadosPorMesa(resultadosMesaArray)
      setTotalVotos(totalVotosCalculado)
    } catch (err) {
      console.error("Error loading resultados:", err)
      setError(err instanceof Error ? err.message : "Error al cargar resultados")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResultados()
  }, [])

  return {
    resultadosGenerales,
    resultadosPorMesa,
    totalVotos,
    loading,
    error,
    refresh: loadResultados,
  }
}

