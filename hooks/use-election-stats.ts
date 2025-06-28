import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

export interface ElectionStats {
  totalPadron: number
  totalVotantes: number
  porcentajeParticipacion: number
  totalMesas: number
  totalVotos: number
  loading: boolean
  error: string | null
}

export function useElectionStats() {
  const [stats, setStats] = useState<ElectionStats>({
    totalPadron: 0,
    totalVotantes: 0,
    porcentajeParticipacion: 0,
    totalMesas: 0,
    totalVotos: 0,
    loading: true,
    error: null,
  })

  const loadStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }))

      // 1. Obtener total del padrón
      const { count: totalPadronCount } = await supabase
        .from("padron")
        .select("*", { count: "exact", head: true })

      // 2. Obtener total de votantes (solo los que ya votaron)
      const { count: totalVotantesCount } = await supabase
        .from("padron")
        .select("*", { count: "exact", head: true })
        .not("voto_timestamp", "is", null)

      // 3. Obtener total de votos emitidos usando SQL nativo
      let totalVotos = 0
      try {
        const { data: votosData, error: votosError } = await supabase.rpc("get_total_votos").single()

        if (votosError) {
          console.log("Función get_total_votos no encontrada, usando método alternativo...")
          // Método alternativo: obtener todos los votos en lotes
          let allVotos: number[] = []
          let hasMore = true
          let offset = 0
          const batchSize = 1000

          while (hasMore) {
            const { data: batchData, error: batchError } = await supabase
              .from("votos")
              .select("cantidad_votos")
              .range(offset, offset + batchSize - 1)

            if (batchError) throw batchError

            if (batchData && batchData.length > 0) {
              const batchVotos = batchData.map((v) => v.cantidad_votos || 0)
              allVotos = [...allVotos, ...batchVotos]

              if (batchData.length < batchSize) {
                hasMore = false
              } else {
                offset += batchSize
              }
            } else {
              hasMore = false
            }
          }

          totalVotos = allVotos.reduce((sum, votos) => sum + votos, 0)
        } else {
          totalVotos = (votosData as { total: number })?.total || 0
        }
      } catch (error) {
        console.error("Error obteniendo total de votos:", error)
        // Fallback: obtener solo los primeros 1000 registros
        const { data: fallbackData } = await supabase
          .from("votos")
          .select("cantidad_votos")
          .limit(1000)

        totalVotos = fallbackData?.reduce((sum, voto) => sum + (voto.cantidad_votos || 0), 0) || 0
      }

      // 4. Obtener total de mesas
      let totalMesas = 0
      try {
        const { data: mesasData, error: mesasError } = await supabase.rpc("get_mesas_unicas").single()

        if (mesasError) {
          console.log("Función get_mesas_unicas no encontrada, usando método alternativo...")
          // Método alternativo: obtener todas las mesas
          const { data: mesasAlternativas, error: mesasAltError } = await supabase
            .from("padron")
            .select("mesa")
            .order("mesa", { ascending: true })

          if (mesasAltError) throw mesasAltError

          const mesasUnicas = new Set(mesasAlternativas?.map((p) => p.mesa) || [])
          totalMesas = mesasUnicas.size
        } else {
          totalMesas = (mesasData as { total: number })?.total || 0
        }
      } catch (error) {
        console.error("Error obteniendo mesas:", error)
        // Fallback: obtener mesas únicas con una consulta optimizada
        const { data: mesasFallback, error: mesasFallbackError } = await supabase
          .from("padron")
          .select("mesa")
          .order("mesa", { ascending: true })

        if (!mesasFallbackError && mesasFallback) {
          const mesasUnicas = new Set(mesasFallback.map((p) => p.mesa))
          totalMesas = mesasUnicas.size
        }
      }

      const totalPadron = totalPadronCount || 0
      const totalVotantes = totalVotantesCount || 0
      const porcentajeParticipacion = totalPadron > 0 ? Math.round((totalVotantes / totalPadron) * 100) : 0

      setStats({
        totalPadron,
        totalVotantes,
        porcentajeParticipacion,
        totalMesas,
        totalVotos,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error("Error loading election stats:", error)
      setStats(prev => ({
        ...prev,
        loading: false,
        error: "Error al cargar estadísticas electorales",
      }))
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  return {
    ...stats,
    refresh: loadStats,
  }
}
