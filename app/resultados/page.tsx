"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  Users,
  Vote,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  FileText,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase, type Candidato, type PadronRecord, type Etiqueta, isModoSimplificado } from "@/lib/supabase"
import { useElectionStats } from "@/hooks/use-election-stats"

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

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalRecords: number
  recordsPerPage: number
  startRecord: number
  endRecord: number
}

// Extender el tipo PadronRecord para incluir etiquetas
interface PadronRecordWithEtiquetas extends PadronRecord {
  etiquetas?: Array<{
    id: number
    nombre: string
    color: string
  }>
}

export default function ResultadosPage() {
  const [activeTab, setActiveTab] = useState("candidatos")
  const [resultados, setResultados] = useState<ResultadoCandidato[]>([])
  const [resultadosPorMesa, setResultadosPorMesa] = useState<ResultadoMesa[]>([])
  const [padronPaginado, setPadronPaginado] = useState<PadronRecordWithEtiquetas[]>([])
  const [mesas, setMesas] = useState<string[]>([])
  const [loadingMesas, setLoadingMesas] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingPadron, setLoadingPadron] = useState(false)
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([])
  const [modoSimplificado, setModoSimplificado] = useState(false)
  const router = useRouter()

  // Usar el hook centralizado para estadísticas
  const { totalPadron, totalVotantes, porcentajeParticipacion, totalVotos, loading: statsLoading } = useElectionStats()

  // Paginación y filtros para el padrón
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 0,
    totalRecords: 0,
    recordsPerPage: 50,
    startRecord: 0,
    endRecord: 0,
  })

  const [filtros, setFiltros] = useState({
    busqueda: "",
    estadoVoto: "todos",
    mesa: "todas",
    etiqueta: "todas",
  })

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Verificar acceso
    const hasAccess = localStorage.getItem("resultados") || localStorage.getItem("admin")
    if (!hasAccess) {
      router.push("/login")
      return
    }

    // Cargar modo simplificado
    isModoSimplificado().then(setModoSimplificado)

    loadInitialData()
  }, [router])

  useEffect(() => {
    if (activeTab === "padron") {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }

      const timeout = setTimeout(() => {
        loadPadronData(1)
      }, 300)

      setSearchTimeout(timeout)

      return () => {
        if (timeout) clearTimeout(timeout)
      }
    }
  }, [filtros, activeTab])

  const logout = () => {
    localStorage.removeItem("resultados")
    localStorage.removeItem("admin")
    router.push("/")
  }

  const loadAllMesas = async () => {
    setLoadingMesas(true)
    try {
      let mesasUnicas: string[] = []

      try {
        const { data: mesasData, error: mesasError } = await supabase.rpc("get_mesas_unicas").single()

        if (mesasError) {
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

          mesasUnicas = Array.from(new Set(allMesas)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        } else {
          mesasUnicas = (mesasData as { mesas: string[] })?.mesas || []
        }
      } catch (error) {
        console.error("Error obteniendo mesas:", error)
        const { data: fallbackData } = await supabase.from("padron").select("mesa").order("mesa", { ascending: true })
        mesasUnicas = Array.from(new Set(fallbackData?.map((p) => p.mesa) || [])).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      }

      setMesas(mesasUnicas)
    } catch (error) {
      console.error("Error loading all mesas:", error)
    } finally {
      setLoadingMesas(false)
    }
  }

  const loadInitialData = async () => {
    try {
      await loadAllMesas()

      const { data: etiquetasData } = await supabase.from("etiquetas").select("*").eq("activa", true).order("nombre")
      setEtiquetas(etiquetasData || [])

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
      const mesasMap = new Map<string, ResultadoMesa>()
      let totalVotosCalculado = 0

      votosData?.forEach((voto: any) => {
        const candidatoId = voto.candidato_id
        const mesa = voto.mesa
        const votos = voto.cantidad_votos
        totalVotosCalculado += votos

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
        const porcentajeGeneral = totalVotosCalculado > 0 ? Math.round((candidato.total_votos / totalVotosCalculado) * 100) : 0

        // Calcular porcentajes por mesa
        Object.keys(candidato.votos_por_mesa).forEach((mesaStr) => {
          const mesa = mesaStr
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
      resultadosMesaArray.sort((a, b) => a.mesa.localeCompare(b.mesa))
      resultadosMesaArray.forEach((mesa) => {
        mesa.candidatos.sort((a, b) => b.votos - a.votos)
      })

      setResultados(resultadosArray)
      setResultadosPorMesa(resultadosMesaArray)

      setPagination((prev) => ({
        ...prev,
        totalRecords: totalPadron,
      }))
    } catch (error) {
      console.error("Error loading initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadPadronData = async (page: number) => {
    setLoadingPadron(true)
    try {
      const recordsPerPage = pagination.recordsPerPage
      const offset = (page - 1) * recordsPerPage

      let query

      if (filtros.etiqueta !== "todas") {
        query = supabase
          .from("padron")
          .select(
            `
            *,
            padron_etiquetas!inner (
              etiqueta_id,
              etiquetas (
                id,
                nombre,
                color
              )
            )
          `,
            { count: "exact" },
          )
          .eq("padron_etiquetas.etiqueta_id", Number.parseInt(filtros.etiqueta))
      } else {
        query = supabase.from("padron").select(
          `
            *,
            padron_etiquetas (
              etiqueta_id,
              etiquetas (
                id,
                nombre,
                color
              )
            )
          `,
          { count: "exact" },
        )
      }

      query = query.order("apellido_nombre", { ascending: true })

      if (filtros.busqueda.trim()) {
        const busqueda = filtros.busqueda.trim()
        query = query.or(`dni.eq.${busqueda},apellido_nombre.ilike.%${busqueda}%`)
      }

      if (filtros.estadoVoto === "votaron") {
        query = query.not("voto_timestamp", "is", null)
      } else if (filtros.estadoVoto === "no_votaron") {
        query = query.is("voto_timestamp", null)
      }

      if (filtros.mesa !== "todas") {
        query = query.eq("mesa", filtros.mesa)
      }

      query = query.range(offset, offset + recordsPerPage - 1)

      const { data, error, count } = await query

      if (error) throw error

      const padronConEtiquetas = (data || []).map((persona: any) => ({
        ...persona,
        etiquetas:
          persona.padron_etiquetas?.map((pe: any) => ({
            id: pe.etiquetas?.id || pe.etiqueta_id,
            nombre: pe.etiquetas?.nombre || "Etiqueta",
            color: pe.etiquetas?.color || "#6B7280",
          })) || [],
      }))

      const totalRecords = count || 0
      const totalPages = Math.ceil(totalRecords / recordsPerPage)
      const startRecord = totalRecords > 0 ? offset + 1 : 0
      const endRecord = Math.min(offset + recordsPerPage, totalRecords)

      setPadronPaginado(padronConEtiquetas)
      setPagination({
        currentPage: page,
        totalPages,
        totalRecords,
        recordsPerPage,
        startRecord,
        endRecord,
      })
    } catch (error) {
      console.error("Error loading padron data:", error)
    } finally {
      setLoadingPadron(false)
    }
  }

  const handleCardClick = (cardType: string) => {
    if (cardType === "votos") {
      setActiveTab("candidatos")
    } else if (cardType === "padron") {
      setActiveTab("padron")
      if (padronPaginado.length === 0) {
        loadPadronData(1)
      }
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadPadronData(newPage)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFiltros((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFiltros({ busqueda: "", estadoVoto: "todos", mesa: "todas", etiqueta: "todas" })
  }

  const PaginationControls = () => (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Mostrando {pagination.startRecord} a {pagination.endRecord} de {pagination.totalRecords.toLocaleString()}{" "}
          registros
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={pagination.currentPage === 1 || loadingPadron}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={pagination.currentPage === 1 || loadingPadron}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            let pageNum
            if (pagination.totalPages <= 5) {
              pageNum = i + 1
            } else if (pagination.currentPage <= 3) {
              pageNum = i + 1
            } else if (pagination.currentPage >= pagination.totalPages - 2) {
              pageNum = pagination.totalPages - 4 + i
            } else {
              pageNum = pagination.currentPage - 2 + i
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === pagination.currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                disabled={loadingPadron}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={pagination.currentPage === pagination.totalPages || loadingPadron}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={pagination.currentPage === pagination.totalPages || loadingPadron}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  if (loading || statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Cargando resultados...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-center mb-2">Resultados Elecciones</h1>
            <p className="text-center text-gray-600">Siete Palmas - 29 de Junio 2025</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Estadísticas generales - Ajustadas según modo */}
        {modoSimplificado ? (
          // Modo Simplificado: Solo votos y mesas
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCardClick("votos")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{totalVotos.toLocaleString()}</div>
                    <p className="text-sm text-gray-600">Votos Emitidos</p>
                    <p className="text-xs text-gray-500 mt-1">Click para ver resultados</p>
                  </div>
                  <Vote className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{mesas.length}</div>
                    <p className="text-sm text-gray-600">Total Mesas</p>
                    <p className="text-xs text-gray-500 mt-1">Mesas electorales</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Modo Completo: Todas las estadísticas
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCardClick("padron")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{totalPadron.toLocaleString()}</div>
                    <p className="text-sm text-gray-600">Total Padrón</p>
                    <p className="text-xs text-gray-500 mt-1">Click para ver detalle</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleCardClick("votos")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{totalVotos.toLocaleString()}</div>
                    <p className="text-sm text-gray-600">Votos Emitidos</p>
                    <p className="text-xs text-gray-500 mt-1">Click para ver resultados</p>
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
                    <p className="text-xs text-gray-500 mt-1">
                      {totalVotantes.toLocaleString()} de {totalPadron.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList
            className={`flex flex-col sm:grid ${modoSimplificado ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} w-full gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1 py-4 sm:py-0`}
          >
            <TabsTrigger
              value="candidatos"
              className="w-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Resultados Generales
            </TabsTrigger>
            <TabsTrigger
              value="mesas"
              className="w-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Resultados por Mesa
            </TabsTrigger>
            {!modoSimplificado && (
              <TabsTrigger
                value="padron"
                className="w-full data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Padrón Electoral
              </TabsTrigger>
            )}
          </TabsList>

          {/* Resultados Generales */}
          <TabsContent value="candidatos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resultados Generales</CardTitle>
                <CardDescription>
                  Distribución total de votos - Total: {totalVotos.toLocaleString()} votos
                </CardDescription>
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
          </TabsContent>

          {/* Resultados por Mesa */}
          <TabsContent value="mesas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resultados por Mesa</CardTitle>
                <CardDescription>Detalle de votos discriminados por mesa electoral</CardDescription>
              </CardHeader>
              <CardContent>
                {resultadosPorMesa.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {resultadosPorMesa.map((mesa) => (
                      <div key={mesa.mesa} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-lg">Mesa {mesa.mesa}</h3>
                          <Badge variant="outline">{mesa.total_votos} votos</Badge>
                        </div>
                        <div className="space-y-2">
                          {mesa.candidatos.map((candidato, index) => (
                            <div key={candidato.id} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: candidato.color }} />
                                  <span className="text-sm font-medium">{candidato.nombre}</span>
                                </div>
                                <div className="text-right">
                                  <span className="font-bold">{candidato.votos}</span>
                                  <span className="text-sm text-gray-600 ml-1">({candidato.porcentaje}%)</span>
                                </div>
                              </div>
                              <Progress value={candidato.porcentaje} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay resultados por mesa disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Padrón Electoral - Solo en modo completo */}
          {!modoSimplificado && (
            <TabsContent value="padron" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Padrón Electoral</CardTitle>
                <CardDescription>
                  Listado: {totalPadron.toLocaleString()} electores,{" "}
                  {totalVotantes.toLocaleString()} ya votaron - {mesas.length}{" "}
                  mesas disponibles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar por DNI o Nombre</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="DNI o nombre..."
                        value={filtros.busqueda}
                        onChange={(e) => handleFilterChange("busqueda", e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado de Voto</label>
                    <Select
                      value={filtros.estadoVoto}
                      onValueChange={(value) => handleFilterChange("estadoVoto", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="votaron">Ya votaron</SelectItem>
                        <SelectItem value="no_votaron">No votaron</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mesa Electoral</label>
                    <Select
                      value={filtros.mesa}
                      onValueChange={(value) => handleFilterChange("mesa", value)}
                      disabled={loadingMesas}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">
                          {loadingMesas ? "Cargando mesas..." : `Todas las mesas (${mesas.length})`}
                        </SelectItem>
                        {mesas.map((mesa) => (
                          <SelectItem key={mesa} value={mesa}>
                            Mesa {mesa}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Etiqueta</label>
                    <Select value={filtros.etiqueta} onValueChange={(value) => handleFilterChange("etiqueta", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas las etiquetas</SelectItem>
                        {etiquetas.map((etiqueta) => (
                          <SelectItem key={etiqueta.id} value={etiqueta.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: etiqueta.color }} />
                              {etiqueta.nombre}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Acciones</label>
                    <Button variant="outline" onClick={clearFilters} className="w-full" disabled={loadingPadron}>
                      <Filter className="h-4 w-4 mr-2" />
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>

                {/* Tabla del padrón */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            DNI
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Apellido y Nombre
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Mesa
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Orden
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clase
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Domicilio
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Etiquetas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {loadingPadron ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                              <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                Cargando registros...
                              </div>
                            </td>
                          </tr>
                        ) : padronPaginado.length > 0 ? (
                          padronPaginado.map((persona) => (
                            <tr key={persona.id} className="hover:bg-gray-50">
                              <td className="pl-3 py-4 whitespace-nowrap">
                                {persona.voto_timestamp ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Votó
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-gray-600">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    No votó
                                  </Badge>
                                )}
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {persona.dni}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-900">{persona.apellido_nombre}</td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  Mesa {persona.mesa}
                                </Badge>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                <Badge variant="outline" className="bg-gray-50">
                                  #{persona.orden}
                                </Badge>
                              </td>
                              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                                <Badge variant="outline">{persona.clase}</Badge>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-900">{persona.domicilio}</td>
                              <td className="px-3 py-4 text-sm text-gray-900">
                                {persona.etiquetas && persona.etiquetas.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {persona.etiquetas.map((etiqueta, index) => (
                                      <Badge
                                        key={`${persona.id}-${etiqueta.id || index}`}
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
                                ) : (
                                  <span className="text-gray-400">Sin etiquetas</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                              No se encontraron registros con los filtros aplicados
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {pagination.totalPages > 1 && <PaginationControls />}
                </div>

                {/* Estadísticas de filtros */}
                {(filtros.busqueda || filtros.estadoVoto !== "todos" || filtros.mesa !== "todas") && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">Filtros aplicados</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-blue-600 font-medium">Total encontrado:</span>
                        <span className="ml-1">{pagination.totalRecords.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium">Página actual:</span>
                        <span className="ml-1">
                          {pagination.currentPage} de {pagination.totalPages}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-600 font-medium">Registros por página:</span>
                        <span className="ml-1">{pagination.recordsPerPage}</span>
                      </div>
                      {filtros.mesa !== "todas" && (
                        <div>
                          <span className="text-blue-600 font-medium">Mesa seleccionada:</span>
                          <span className="ml-1">Mesa {filtros.mesa}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          )}
        </Tabs>

        {totalVotos > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Última actualización: {new Date().toLocaleString("es-AR")} | Datos basados en{" "}
              {totalPadron.toLocaleString()} registros totales | {mesas.length} mesas disponibles
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
