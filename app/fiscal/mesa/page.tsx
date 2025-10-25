"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Check, X, BarChart3, Tag, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  supabase,
  type Fiscal,
  getConfiguracion,
  isModoSimplificado,
  type Candidato,
  type Etiqueta,
  type PadronRecordWithEtiquetas,
} from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function FiscalMesaPage() {
  const [fiscal, setFiscal] = useState<Fiscal | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PadronRecordWithEtiquetas | null>(null)
  const [votantes, setVotantes] = useState<PadronRecordWithEtiquetas[]>([])
  const router = useRouter()
  const { toast } = useToast()
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [cargaResultadosHabilitada, setCargaResultadosHabilitada] = useState(false)
  const [resultadosDialog, setResultadosDialog] = useState(false)
  const [resultadosData, setResultadosData] = useState<{ [key: number]: number }>({})
  const [cargandoResultados, setCargandoResultados] = useState(false)
  const [modoSimplificado, setModoSimplificado] = useState(false)

  // Estados para etiquetas
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([])
  const [etiquetasDialog, setEtiquetasDialog] = useState(false)
  const [votanteSeleccionado, setVotanteSeleccionado] = useState<PadronRecordWithEtiquetas | null>(null)
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<number[]>([])
  const [cargandoEtiquetas, setCargandoEtiquetas] = useState(false)

  // NUEVO: Estados para deshacer voto
  const [deshacerVotoDialog, setDeshacerVotoDialog] = useState(false)
  const [votanteParaDeshacer, setVotanteParaDeshacer] = useState<PadronRecordWithEtiquetas | null>(null)
  const [deshaciendo, setDeshaciendo] = useState(false)

  const loadCandidatos = async () => {
    try {
      const { data, error } = await supabase.from("candidatos").select("*").eq("activo", true).order("nombre")

      if (error) throw error
      setCandidatos(data || [])

      // Inicializar resultados en 0
      const initialResults: { [key: number]: number } = {}
      data?.forEach((candidato) => {
        initialResults[candidato.id] = 0
      })
      setResultadosData(initialResults)
    } catch (error) {
      console.error("Error loading candidatos:", error)
    }
  }

  // NUEVA FUNCIÓN: Cargar resultados existentes de la mesa
  const loadResultadosExistentes = async (mesa: string) => {
    try {
      const { data, error } = await supabase
        .from("votos")
        .select("candidato_id, cantidad_votos")
        .eq("mesa", mesa)

      if (error) throw error

      // Crear objeto con los resultados existentes
      const resultadosExistentes: { [key: number]: number } = {}
      data?.forEach((voto) => {
        resultadosExistentes[voto.candidato_id] = voto.cantidad_votos
      })

      // Combinar con los candidatos activos (mantener 0 para candidatos sin votos)
      const resultadosCompletos: { [key: number]: number } = {}
      candidatos.forEach((candidato) => {
        resultadosCompletos[candidato.id] = resultadosExistentes[candidato.id] || 0
      })

      setResultadosData(resultadosCompletos)
    } catch (error) {
      console.error("Error loading resultados existentes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los resultados existentes",
        variant: "destructive",
      })
    }
  }

  const loadEtiquetas = async () => {
    try {
      const { data, error } = await supabase.from("etiquetas").select("*").eq("activa", true).order("nombre")

      if (error) throw error
      setEtiquetas(data || [])
    } catch (error) {
      console.error("Error loading etiquetas:", error)
    }
  }

  const loadVotantesMesa = async (mesa: string) => {
    try {
      const { data, error } = await supabase
        .from("padron")
        .select(`
          *,
          padron_etiquetas (
            id,
            etiqueta_id,
            asignada_por,
            created_at,
            etiquetas (
              id,
              nombre,
              color,
              descripcion
            )
          )
        `)
        .eq("mesa", mesa)
        .order("orden")

      if (error) throw error

      // Transformar datos para incluir etiquetas de forma más accesible
      const votantesConEtiquetas: PadronRecordWithEtiquetas[] = (data || []).map((votante: any) => ({
        ...votante,
        etiquetas:
          votante.padron_etiquetas?.map((pe: any) => ({
            id: pe.etiquetas.id,
            nombre: pe.etiquetas.nombre,
            color: pe.etiquetas.color,
            descripcion: pe.etiquetas.descripcion,
            asignada_por: pe.asignada_por,
          })) || [],
      }))

      setVotantes(votantesConEtiquetas)
    } catch (error) {
      console.error("Error loading votantes:", error)
    }
  }

  const checkCargaResultados = async () => {
    const habilitada = await getConfiguracion("carga_resultados_habilitada")
    setCargaResultadosHabilitada(habilitada === "true")
  }

  const checkModoSimplificado = async () => {
    const isSimple = await isModoSimplificado()
    setModoSimplificado(isSimple)
  }

  useEffect(() => {
    const fiscalData = localStorage.getItem("fiscal")
    if (!fiscalData) {
      router.push("/fiscal")
      return
    }

    const parsedFiscal = JSON.parse(fiscalData)
    setFiscal(parsedFiscal)
    checkModoSimplificado()
    loadCandidatos()
    loadEtiquetas()
    checkCargaResultados()
    
    // Solo cargar votantes si NO está en modo simplificado
    isModoSimplificado().then(isSimple => {
      if (!isSimple) {
        loadVotantesMesa(parsedFiscal.mesa_asignada)
      }
    })
  }, [router])

  const handleSearch = async () => {
    if (!searchValue.trim() || !fiscal) return

    setLoading(true)
    try {
      let query = supabase
        .from("padron")
        .select(`
          *,
          padron_etiquetas (
            id,
            etiqueta_id,
            asignada_por,
            created_at,
            etiquetas (
              id,
              nombre,
              color,
              descripcion
            )
          )
        `)
        .eq("mesa", fiscal.mesa_asignada)

      query = query.eq("dni", searchValue.trim())

      const { data, error } = await query.single()

      if (error) {
        toast({
          title: "No encontrado",
          description: "No se encontró el votante en esta mesa",
          variant: "destructive",
        })
        setResult(null)
      } else {
        // Transformar datos igual que en loadVotantesMesa
        const votanteConEtiquetas: PadronRecordWithEtiquetas = {
          ...data,
          etiquetas:
            data.padron_etiquetas?.map((pe: any) => ({
              id: pe.etiquetas.id,
              nombre: pe.etiquetas.nombre,
              color: pe.etiquetas.color,
              descripcion: pe.etiquetas.descripcion,
              asignada_por: pe.asignada_por,
            })) || [],
        }
        setResult(votanteConEtiquetas)
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Error al buscar votante",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const marcarVoto = async (votante: PadronRecordWithEtiquetas) => {
    try {
      const { error } = await supabase
        .from("padron")
        .update({ voto_timestamp: new Date().toISOString() })
        .eq("id", votante.id)

      if (error) throw error

      toast({
        title: "¡Voto registrado!",
        description: `${votante.apellido_nombre} marcado como votante`,
      })

      // Recargar datos
      if (fiscal) {
        loadVotantesMesa(fiscal.mesa_asignada)
      }
      setResult(null)
      setSearchValue("")
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el voto",
        variant: "destructive",
      })
    }
  }

  // NUEVO: Función para deshacer voto
  const deshacerVoto = async () => {
    if (!votanteParaDeshacer) return

    setDeshaciendo(true)
    try {
      const { error } = await supabase.from("padron").update({ voto_timestamp: null }).eq("id", votanteParaDeshacer.id)

      if (error) throw error

      toast({
        title: "¡Voto deshecho!",
        description: `Se eliminó el registro de voto de ${votanteParaDeshacer.apellido_nombre}`,
      })

      // Recargar datos
      if (fiscal) {
        loadVotantesMesa(fiscal.mesa_asignada)
      }

      // Limpiar estados
      setDeshacerVotoDialog(false)
      setVotanteParaDeshacer(null)
      setResult(null)
      setSearchValue("")
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo deshacer el voto",
        variant: "destructive",
      })
    } finally {
      setDeshaciendo(false)
    }
  }

  // NUEVO: Abrir dialog para deshacer voto
  const abrirDeshacerVotoDialog = (votante: PadronRecordWithEtiquetas) => {
    setVotanteParaDeshacer(votante)
    setDeshacerVotoDialog(true)
  }

  const abrirEtiquetasDialog = (votante: PadronRecordWithEtiquetas) => {
    setVotanteSeleccionado(votante)
    setEtiquetasSeleccionadas(votante.etiquetas?.map((e) => e.id) || [])
    setEtiquetasDialog(true)
  }

  const guardarEtiquetas = async () => {
    if (!votanteSeleccionado || !fiscal) return

    setCargandoEtiquetas(true)
    try {
      // Eliminar todas las etiquetas actuales del votante
      await supabase.from("padron_etiquetas").delete().eq("padron_id", votanteSeleccionado.id)

      // Insertar las nuevas etiquetas seleccionadas
      if (etiquetasSeleccionadas.length > 0) {
        const etiquetasToInsert = etiquetasSeleccionadas.map((etiquetaId) => ({
          padron_id: votanteSeleccionado.id,
          etiqueta_id: etiquetaId,
          asignada_por: fiscal.nombre,
        }))

        const { error } = await supabase.from("padron_etiquetas").insert(etiquetasToInsert)

        if (error) throw error
      }

      toast({
        title: "¡Éxito!",
        description: "Etiquetas actualizadas correctamente",
      })

      // Recargar datos y cerrar dialog
      if (fiscal) {
        loadVotantesMesa(fiscal.mesa_asignada)
      }
      setEtiquetasDialog(false)
      setVotanteSeleccionado(null)
      setEtiquetasSeleccionadas([])
    } catch (error) {
      console.error("Error saving etiquetas:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las etiquetas",
        variant: "destructive",
      })
    } finally {
      setCargandoEtiquetas(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("fiscal")
    router.push("/")
  }

  if (!fiscal) {
    return <div>Cargando...</div>
  }

  const votantesQueVotaron = votantes.filter((v) => v.voto_timestamp)
  const porcentajeParticipacion =
    votantes.length > 0 ? Math.round((votantesQueVotaron.length / votantes.length) * 100) : 0

  const handleResultadosSubmit = async () => {
    if (!fiscal) return

    setCargandoResultados(true)
    try {
      // Verificar que la suma de votos sea razonable
      const totalVotos = Object.values(resultadosData).reduce((sum, votos) => sum + votos, 0)

      if (totalVotos === 0) {
        toast({
          title: "Error",
          description: "Debe ingresar al menos un voto",
          variant: "destructive",
        })
        return
      }

      // Insertar o actualizar resultados
      const votosToInsert = Object.entries(resultadosData).map(([candidatoId, cantidadVotos]) => ({
        mesa: fiscal.mesa_asignada,
        candidato_id: Number.parseInt(candidatoId),
        cantidad_votos: cantidadVotos,
      }))

      const { error } = await supabase.from("votos").upsert(votosToInsert, {
        onConflict: "mesa,candidato_id",
      })

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: `Resultados cargados para la mesa ${fiscal.mesa_asignada}`,
      })

      setResultadosDialog(false)
    } catch (error) {
      console.error("Error saving resultados:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los resultados",
        variant: "destructive",
      })
    } finally {
      setCargandoResultados(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mesa {fiscal.mesa_asignada}</h1>
            <p className="text-gray-600">Fiscal: {fiscal.nombre}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            Cerrar Sesión
          </Button>
        </div>

        {/* Estadísticas - Solo en modo completo */}
        {!modoSimplificado && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{votantes.length}</div>
                <p className="text-sm text-gray-600">Total Padrón</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{votantesQueVotaron.length}</div>
                <p className="text-sm text-gray-600">Ya Votaron</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">{porcentajeParticipacion}%</div>
                <p className="text-sm text-gray-600">Participación</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mensaje en modo simplificado */}
        {modoSimplificado && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-800">Modo Simplificado Activo</p>
                  <p className="text-sm text-blue-700">
                    Solo puede cargar los resultados finales de la mesa. La marcación individual de votantes está deshabilitada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botón de carga de resultados */}
        {cargaResultadosHabilitada && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Carga de Resultados</h3>
                  <p className="text-sm text-gray-600">
                    Cargar los resultados finales de la mesa {fiscal.mesa_asignada}
                  </p>
                </div>
                <Dialog 
                  open={resultadosDialog} 
                  onOpenChange={(open) => {
                    setResultadosDialog(open)
                    // Cargar resultados existentes cuando se abre el diálogo
                    if (open && fiscal) {
                      loadResultadosExistentes(fiscal.mesa_asignada)
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Cargar Resultados
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Resultados Mesa {fiscal.mesa_asignada}</DialogTitle>
                      <DialogDescription>Ingresa la cantidad de votos obtenidos por cada candidato</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {candidatos.map((candidato) => (
                        <div key={candidato.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: candidato.color }} />
                            <div>
                              <p className="font-medium">{candidato.nombre}</p>
                              <p className="text-sm text-gray-600">{candidato.partido}</p>
                            </div>
                          </div>
                          <div className="w-20">
                            <Input
                              type="number"
                              min="0"
                              value={resultadosData[candidato.id] || 0}
                              onChange={(e) =>
                                setResultadosData({
                                  ...resultadosData,
                                  [candidato.id]: Number.parseInt(e.target.value) || 0,
                                })
                              }
                              className="text-center"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Total de votos:</span>
                          <span>{Object.values(resultadosData).reduce((sum, votos) => sum + votos, 0)}</span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setResultadosDialog(false)}
                        disabled={cargandoResultados}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleResultadosSubmit} disabled={cargandoResultados}>
                        {cargandoResultados ? "Guardando..." : "Guardar Resultados"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Búsqueda - Solo en modo completo */}
        {!modoSimplificado && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Buscar Votante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="DNI"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado de búsqueda - Solo en modo completo */}
        {!modoSimplificado && result && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{result.apellido_nombre}</h3>
                  <p className="text-gray-600">
                    DNI: {result.dni} | Orden: {result.orden}
                  </p>

                  {/* Mostrar etiquetas del votante */}
                  {result.etiquetas && result.etiquetas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {result.etiquetas.map((etiqueta) => (
                        <Badge
                          key={etiqueta.id}
                          variant="outline"
                          style={{
                            backgroundColor: `${etiqueta.color}20`,
                            borderColor: etiqueta.color,
                            color: etiqueta.color,
                          }}
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {etiqueta.nombre}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {result.voto_timestamp ? (
                    <Badge
                      variant="secondary"
                      className="mt-2 cursor-pointer hover:bg-red-100 hover:text-red-800 transition-colors"
                      onClick={() => abrirDeshacerVotoDialog(result)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Ya votó - {new Date(result.voto_timestamp).toLocaleTimeString()} (Click para deshacer)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-2">
                      <X className="h-4 w-4 mr-1" />
                      No ha votado
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {/* Botón para gestionar etiquetas */}
                  <Button variant="outline" size="sm" onClick={() => abrirEtiquetasDialog(result)}>
                    <Tag className="h-4 w-4 mr-1" />
                    Etiquetas
                  </Button>
                  {!result.voto_timestamp && <Button onClick={() => marcarVoto(result)}>Marcar como Votó</Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de votantes - Solo en modo completo */}
        {!modoSimplificado && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Lista de Votantes - Mesa {fiscal.mesa_asignada}</CardTitle>
              <CardDescription className="text-sm">
                {votantesQueVotaron.length} de {votantes.length} votantes han participado
              </CardDescription>
            </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {votantes.map((votante) => (
                <div
                  key={votante.id}
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 rounded-lg border ${
                    votante.voto_timestamp ? "bg-green-50 border-green-200" : "bg-gray-50"
                  }`}
                >
                  <div className="flex-1 w-full">
                    <p className="font-medium text-sm sm:text-base">
                      {votante.orden}. {votante.apellido_nombre}
                    </p>
                    <p className="text-xs text-gray-600">DNI: {votante.dni}</p>

                    {votante?.etiquetas && votante?.etiquetas?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {votante?.etiquetas?.map((etiqueta) => (
                          <Badge
                            key={etiqueta.id}
                            variant="outline"
                            className="text-xs"
                            style={{
                              backgroundColor: `${etiqueta.color}20`,
                              borderColor: etiqueta.color,
                              color: etiqueta.color,
                            }}
                          >
                            {etiqueta.nombre}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirEtiquetasDialog(votante)}
                      className="w-full sm:w-auto"
                    >
                      <Tag className="h-4 w-4" />
                    </Button>

                    {votante.voto_timestamp ? (
                      <Badge
                        variant="secondary"
                        className="flex items-center justify-center gap-1 w-full sm:w-auto cursor-pointer hover:bg-red-100 hover:text-red-800 transition-colors"
                        onClick={() => abrirDeshacerVotoDialog(votante)}
                      >
                        <Check className="h-4 w-4" />
                        Votó
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => marcarVoto(votante)} className="w-full sm:w-auto">
                        Marcar voto
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* NUEVO: Dialog para deshacer voto */}
        <AlertDialog open={deshacerVotoDialog} onOpenChange={setDeshacerVotoDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                ¿Deshacer voto?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {votanteParaDeshacer && (
                  <div className="space-y-2">
                    <p>
                      Estás a punto de <strong>eliminar el registro de voto</strong> de:
                    </p>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-semibold">{votanteParaDeshacer.apellido_nombre}</p>
                      <p className="text-sm text-gray-600">DNI: {votanteParaDeshacer.dni}</p>
                      <p className="text-sm text-gray-600">
                        Votó el:{" "}
                        {votanteParaDeshacer.voto_timestamp &&
                          new Date(votanteParaDeshacer.voto_timestamp).toLocaleString("es-AR")}
                      </p>
                    </div>
                    <p className="text-sm text-orange-600">
                      ⚠️ Esta acción eliminará el registro de que esta persona votó. Podrás volver a marcarla como
                      votante si es necesario.
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deshaciendo}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={deshacerVoto} disabled={deshaciendo} className="bg-red-600 hover:bg-red-700">
                {deshaciendo ? "Deshaciendo..." : "Sí, deshacer voto"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog para gestionar etiquetas */}
        <Dialog open={etiquetasDialog} onOpenChange={setEtiquetasDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Gestionar Etiquetas</DialogTitle>
              <DialogDescription>
                {votanteSeleccionado?.apellido_nombre} - DNI: {votanteSeleccionado?.dni}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">Selecciona las etiquetas que aplican a este votante:</p>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {etiquetas.map((etiqueta) => (
                  <div key={etiqueta.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`etiqueta-${etiqueta.id}`}
                      checked={etiquetasSeleccionadas.includes(etiqueta.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEtiquetasSeleccionadas([...etiquetasSeleccionadas, etiqueta.id])
                        } else {
                          setEtiquetasSeleccionadas(etiquetasSeleccionadas.filter((id) => id !== etiqueta.id))
                        }
                      }}
                    />
                    <label
                      htmlFor={`etiqueta-${etiqueta.id}`}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: etiqueta.color }} />
                      <div>
                        <p className="font-medium">{etiqueta.nombre}</p>
                        {etiqueta.descripcion && <p className="text-xs text-gray-500">{etiqueta.descripcion}</p>}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              {etiquetas.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No hay etiquetas disponibles. Contacta al administrador.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEtiquetasDialog(false)
                  setVotanteSeleccionado(null)
                  setEtiquetasSeleccionadas([])
                }}
                disabled={cargandoEtiquetas}
              >
                Cancelar
              </Button>
              <Button onClick={guardarEtiquetas} disabled={cargandoEtiquetas}>
                {cargandoEtiquetas ? "Guardando..." : "Guardar Etiquetas"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
