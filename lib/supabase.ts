import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos de datos
export interface PadronRecord {
  id: number
  dni: string
  sexo: string
  clase: string
  apellido_nombre: string
  domicilio: string
  mesa: string
  orden: number
  voto_timestamp: string | null
  created_at: string
}

export interface Candidato {
  id: number
  nombre: string
  partido: string
  color: string
  activo: boolean
  created_at: string
}

export interface Fiscal {
  id: number
  nombre: string
  mesa_asignada: string
  password: string
  activo: boolean
  created_at: string
}

export interface Voto {
  id: number
  mesa: string
  candidato_id: number
  cantidad_votos: number
  created_at: string
  updated_at: string
}

export interface ConfiguracionEleccion {
  id: number
  clave: string
  valor: string
  descripcion: string
  updated_at: string
}

// NUEVOS: Tipos para etiquetas
export interface Etiqueta {
  id: number
  nombre: string
  color: string
  descripcion: string
  activa: boolean
  created_at: string
  updated_at: string
}

export interface PadronEtiqueta {
  id: number
  padron_id: number
  etiqueta_id: number
  asignada_por: string
  created_at: string
}

// Tipo extendido para padrón con etiquetas
export interface PadronRecordWithEtiquetas extends PadronRecord {
  etiquetas?: Array<{
    id: number
    nombre: string
    color: string
    descripcion: string
    asignada_por: string
  }>
}

// Función helper para obtener configuración
export const getConfiguracion = async (clave: string): Promise<string | null> => {
  const { data, error } = await supabase.from("configuracion_eleccion").select("valor").eq("clave", clave).single()

  if (error) return null
  return data?.valor || null
}

// Función helper para actualizar configuración
export const updateConfiguracion = async (clave: string, valor: string): Promise<boolean> => {
  const { error } = await supabase.from("configuracion_eleccion").update({ valor }).eq("clave", clave)

  return !error
}

// Función helper para verificar modo simplificado
export const isModoSimplificado = async (): Promise<boolean> => {
  const modo = await getConfiguracion("modo_simplificado")
  return modo === "true"
}

// Función helper para obtener todas las mesas únicas del padrón
export const getMesasUnicas = async (): Promise<{
  mesas: string[]
  total: number
  error: string | null
}> => {
  try {
    // Intentar usar la función RPC optimizada primero
    const { data: mesasData, error: mesasError } = await supabase.rpc("get_mesas_unicas").single()

    if (!mesasError && mesasData) {
      const mesas = (mesasData as { mesas: string[] })?.mesas || []
      return {
        mesas: mesas.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
        total: mesas.length,
        error: null,
      }
    }

    // Método alternativo: obtener todas las mesas con paginación
    console.log("Función get_mesas_unicas no encontrada, usando método alternativo...")
    
    let allMesas: string[] = []
    let hasMore = true
    let offset = 0
    const batchSize = 1000

    while (hasMore) {
      const { data: batchData, error: batchError } = await supabase
        .from("padron")
        .select("mesa")
        .range(offset, offset + batchSize - 1)
        .order("mesa", { ascending: true })

      if (batchError) throw batchError

      if (batchData && batchData.length > 0) {
        const batchMesas = batchData.map((p) => p.mesa)
        allMesas = [...allMesas, ...batchMesas]

        if (batchData.length < batchSize) {
          hasMore = false
        } else {
          offset += batchSize
        }
      } else {
        hasMore = false
      }
    }

    // Obtener mesas únicas y ordenarlas
    const mesasUnicas = Array.from(new Set(allMesas)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    return {
      mesas: mesasUnicas,
      total: mesasUnicas.length,
      error: null,
    }
  } catch (error) {
    console.error("Error obteniendo mesas únicas:", error)
    return {
      mesas: [],
      total: 0,
      error: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}