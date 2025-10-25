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