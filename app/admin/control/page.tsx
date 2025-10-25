"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, EyeOff, Trash2, RotateCcw, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { getConfiguracion, updateConfiguracion } from "@/lib/supabase"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useElectionStats } from "@/hooks/use-election-stats"
import { useAuth } from "@/hooks/use-auth"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ControlElectoralPage() {
  const [loading, setLoading] = useState(true)
  const [cargaResultadosHabilitada, setCargaResultadosHabilitada] = useState(false)
  const [eleccionFinalizada, setEleccionFinalizada] = useState(false)
  const [resultadosPublicos, setResultadosPublicos] = useState(false)
  const [modoSimplificado, setModoSimplificado] = useState(false)

  // Estados para las operaciones de limpieza
  const [vaciandoResultados, setVaciandoResultados] = useState(false)
  const [reiniciandoVotos, setReiniciandoVotos] = useState(false)
  const [vaciandoPadron, setVaciandoPadron] = useState(false)

  const { toast } = useToast()
  useAuth({ requiredRole: "admin", redirectTo: "/admin" })
  
  // Usar el hook centralizado para estadísticas
  const { totalPadron, totalVotantes, totalVotos, loading: statsLoading, refresh: refreshStats } = useElectionStats()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Cargar configuración
      const cargaHabilitada = await getConfiguracion("carga_resultados_habilitada")
      const eleccionFinal = await getConfiguracion("eleccion_finalizada")
      const resultadosPublicosConfig = await getConfiguracion("resultados_publicos")
      const modoSimple = await getConfiguracion("modo_simplificado")

      setCargaResultadosHabilitada(cargaHabilitada === "true")
      setEleccionFinalizada(eleccionFinal === "true")
      setResultadosPublicos(resultadosPublicosConfig === "true")
      setModoSimplificado(modoSimple === "true")
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Error al cargar datos de configuración",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleCargaResultados = async () => {
    const nuevoValor = !cargaResultadosHabilitada
    const success = await updateConfiguracion("carga_resultados_habilitada", nuevoValor.toString())

    if (success) {
      setCargaResultadosHabilitada(nuevoValor)
      toast({
        title: "¡Actualizado!",
        description: `Carga de resultados ${nuevoValor ? "habilitada" : "deshabilitada"}`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      })
    }
  }

  const toggleEleccionFinalizada = async () => {
    const nuevoValor = !eleccionFinalizada
    const success = await updateConfiguracion("eleccion_finalizada", nuevoValor.toString())

    if (success) {
      setEleccionFinalizada(nuevoValor)
      toast({
        title: "¡Actualizado!",
        description: `Elección ${nuevoValor ? "finalizada" : "reabierta"}`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const toggleResultadosPublicos = async () => {
    const nuevoValor = !resultadosPublicos
    const success = await updateConfiguracion("resultados_publicos", nuevoValor.toString())

    if (success) {
      setResultadosPublicos(nuevoValor)
      toast({
        title: "¡Actualizado!",
        description: `Resultados ${nuevoValor ? "públicos" : "privados"}`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive",
      })
    }
  }

  const toggleModoSimplificado = async () => {
    const nuevoValor = !modoSimplificado
    const success = await updateConfiguracion("modo_simplificado", nuevoValor.toString())

    if (success) {
      setModoSimplificado(nuevoValor)
      toast({
        title: "¡Modo actualizado!",
        description: nuevoValor 
          ? "Modo Simplificado: Solo carga de resultados por mesa" 
          : "Modo Completo: Con padrón y marcación individual",
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el modo",
        variant: "destructive",
      })
    }
  }

  const vaciarResultados = async () => {
    setVaciandoResultados(true)
    try {
      const { error } = await supabase.from("votos").delete().neq("id", 0)

      if (error) throw error

      toast({
        title: "¡Resultados vaciados!",
        description: "Todos los resultados de las mesas han sido eliminados",
      })

      // Recargar datos
      refreshStats()
    } catch (error) {
      console.error("Error vaciando resultados:", error)
      toast({
        title: "Error",
        description: "No se pudieron vaciar los resultados",
        variant: "destructive",
      })
    } finally {
      setVaciandoResultados(false)
    }
  }

  const reiniciarVotos = async () => {
    setReiniciandoVotos(true)
    try {
      const { error } = await supabase.from("padron").update({ voto_timestamp: null }).not("voto_timestamp", "is", null)

      if (error) throw error

      toast({
        title: "¡Votos reiniciados!",
        description: "Se ha eliminado el estado de voto de todos los registros del padrón",
      })

      // Recargar datos
      refreshStats()
    } catch (error) {
      console.error("Error reiniciando votos:", error)
      toast({
        title: "Error",
        description: "No se pudieron reiniciar los votos",
        variant: "destructive",
      })
    } finally {
      setReiniciandoVotos(false)
    }
  }

  const vaciarPadron = async () => {
    setVaciandoPadron(true)
    try {
      // Primero eliminar las etiquetas asociadas
      const { error: etiquetasError } = await supabase.from("padron_etiquetas").delete().neq("id", 0)

      if (etiquetasError) {
        console.error("Error eliminando etiquetas:", etiquetasError)
        // Continuar aunque falle, ya que puede no haber etiquetas
      }

      // Luego eliminar el padrón
      const { error: padronError } = await supabase.from("padron").delete().neq("id", 0)

      if (padronError) throw padronError

      toast({
        title: "¡Padrón vaciado!",
        description: "Todos los registros del padrón electoral han sido eliminados",
      })

      // Recargar datos
      refreshStats()
    } catch (error) {
      console.error("Error vaciando padrón:", error)
      toast({
        title: "Error",
        description: "No se pudo vaciar el padrón electoral",
        variant: "destructive",
      })
    } finally {
      setVaciandoPadron(false)
    }
  }

  if (loading || statsLoading) {
    return <div className="container mx-auto px-4 py-8">Cargando...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Control Electoral</h1>
            <p className="text-gray-600">Configuración y operaciones del sistema electoral</p>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{totalPadron.toLocaleString()}</div>
              <p className="text-sm text-gray-600">Total Padrón</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{totalVotantes.toLocaleString()}</div>
              <p className="text-sm text-gray-600">Ya Votaron</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{totalVotos.toLocaleString()}</div>
              <p className="text-sm text-gray-600">Resultados Cargados</p>
            </CardContent>
          </Card>
        </div>

        {/* Configuración Electoral */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuración Electoral</CardTitle>
            <CardDescription>Control de la carga de resultados y visibilidad pública</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
              <div>
                <h3 className="font-semibold">Carga de Resultados</h3>
                <p className="text-sm text-gray-600">Permite a los fiscales cargar los resultados de sus mesas</p>
                <p className="text-xs text-gray-500 mt-1">
                  Estado actual: {cargaResultadosHabilitada ? "✅ Habilitada" : "❌ Deshabilitada"}
                </p>
              </div>
              <Button
                onClick={toggleCargaResultados}
                variant={cargaResultadosHabilitada ? "destructive" : "default"}
                className="w-full sm:w-auto"
              >
                {cargaResultadosHabilitada ? "Deshabilitar" : "Habilitar"}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
              <div>
                <h3 className="font-semibold">Estado de la Elección</h3>
                <p className="text-sm text-gray-600">
                  {eleccionFinalizada ? "La elección ha finalizado" : "La elección está en curso"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Estado actual: {eleccionFinalizada ? "🏁 Finalizada" : "🗳️ En curso"}
                </p>
              </div>
              <Button
                onClick={toggleEleccionFinalizada}
                variant={eleccionFinalizada ? "destructive" : "default"}
                className="w-full sm:w-auto"
              >
                {eleccionFinalizada ? "Reabrir" : "Finalizar"}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4">
              <div>
                <h3 className="font-semibold">Resultados Públicos</h3>
                <p className="text-sm text-gray-600">
                  {resultadosPublicos
                    ? "Los resultados son visibles en la página principal"
                    : "Los resultados están protegidos con contraseña"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Estado actual: {resultadosPublicos ? "👁️ Públicos" : "🔒 Privados"}
                </p>
              </div>
              <Button
                onClick={toggleResultadosPublicos}
                variant={resultadosPublicos ? "destructive" : "default"}
                className="w-full sm:w-auto"
              >
                {resultadosPublicos ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Publicar
                  </>
                )}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 bg-blue-50 border-blue-200">
              <div>
                <h3 className="font-semibold text-blue-900">Modo de Operación</h3>
                <p className="text-sm text-blue-700">
                  {modoSimplificado
                    ? "Modo Simplificado: Solo carga de resultados por mesa (sin padrón completo)"
                    : "Modo Completo: Con padrón electoral, marcación individual y etiquetas"}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Estado actual: {modoSimplificado ? "⚡ Simplificado" : "📋 Completo"}
                </p>
                {modoSimplificado && (
                  <div className="mt-2 text-xs text-blue-800 bg-blue-100 p-2 rounded">
                    ℹ️ En modo simplificado se ocultan: búsqueda por DNI, marcación de votantes y gestión de etiquetas
                  </div>
                )}
              </div>
              <Button
                onClick={toggleModoSimplificado}
                variant={modoSimplificado ? "default" : "outline"}
                className="w-full sm:w-auto"
              >
                {modoSimplificado ? "Cambiar a Completo" : "Cambiar a Simplificado"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Operaciones de Limpieza */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Operaciones de Limpieza
            </CardTitle>
            <CardDescription>⚠️ Estas operaciones son irreversibles. Úsalas con extrema precaución.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vaciar Resultados */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-red-200 rounded-lg gap-4 bg-red-50">
              <div>
                <h3 className="font-semibold text-red-800">Vaciar Resultados de Mesas</h3>
                <p className="text-sm text-red-600">
                  Elimina todos los resultados cargados por los fiscales en todas las mesas
                </p>
                <p className="text-xs text-red-500 mt-1">
                  📊 Actualmente hay {totalVotos.toLocaleString()} resultados cargados
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto" disabled={vaciandoResultados}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {vaciandoResultados ? "Vaciando..." : "Vaciar Resultados"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      ¿Vaciar todos los resultados?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <div className="space-y-2">
                        <p>
                          Esta acción eliminará <strong>TODOS</strong> los resultados cargados por los fiscales en todas
                          las mesas.
                        </p>
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                          <p className="text-red-800 font-medium">⚠️ ADVERTENCIA:</p>
                          <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                            <li>Se perderán {totalVotos.toLocaleString()} resultados registrados</li>
                            <li>Los fiscales tendrán que volver a cargar los resultados</li>
                            <li>Esta operación NO se puede deshacer</li>
                          </ul>
                        </div>
                        <p className="text-sm">¿Estás seguro de que quieres continuar?</p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={vaciarResultados} className="bg-red-600 hover:bg-red-700">
                      Sí, vaciar resultados
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Reiniciar Estado de Votos */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-orange-200 rounded-lg gap-4 bg-orange-50">
              <div>
                <h3 className="font-semibold text-orange-800">Reiniciar Estado de Votos</h3>
                <p className="text-sm text-orange-600">Elimina el estado "Ya votó" de todos los registros del padrón</p>
                <p className="text-xs text-orange-500 mt-1">
                  👥 Actualmente {totalVotantes.toLocaleString()} personas han votado
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto" disabled={reiniciandoVotos}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    {reiniciandoVotos ? "Reiniciando..." : "Reiniciar Votos"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      ¿Reiniciar estado de todos los votos?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <div className="space-y-2">
                        <p>
                          Esta acción eliminará el estado "Ya votó" de <strong>TODOS</strong> los registros del padrón
                          electoral.
                        </p>
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <p className="text-orange-800 font-medium">⚠️ ADVERTENCIA:</p>
                          <ul className="text-orange-700 text-sm mt-1 list-disc list-inside">
                            <li>
                              Todos los {totalVotantes.toLocaleString()} votantes aparecerán como "No votaron"
                            </li>
                            <li>Se perderá el registro de quién ya votó</li>
                            <li>Los fiscales tendrán que volver a marcar los votos</li>
                            <li>Esta operación NO se puede deshacer</li>
                          </ul>
                        </div>
                        <p className="text-sm">¿Estás seguro de que quieres continuar?</p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={reiniciarVotos} className="bg-orange-600 hover:bg-orange-700">
                      Sí, reiniciar votos
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Vaciar Padrón Electoral */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-red-300 rounded-lg gap-4 bg-red-100">
              <div>
                <h3 className="font-semibold text-red-900">Vaciar Padrón Electoral</h3>
                <p className="text-sm text-red-700">
                  Elimina TODOS los registros del padrón electoral y sus etiquetas asociadas
                </p>
                <p className="text-xs text-red-600 mt-1">
                  📋 Actualmente hay {totalPadron.toLocaleString()} registros en el padrón
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto bg-red-700 hover:bg-red-800"
                    disabled={vaciandoPadron}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {vaciandoPadron ? "Vaciando..." : "Vaciar Padrón"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      ¿VACIAR TODO EL PADRÓN ELECTORAL?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <div className="space-y-2">
                        <p className="font-bold text-red-800">🚨 OPERACIÓN EXTREMADAMENTE PELIGROSA 🚨</p>
                        <p>
                          Esta acción eliminará <strong>TODOS</strong> los registros del padrón electoral.
                        </p>
                        <div className="bg-red-100 p-3 rounded-lg border border-red-300">
                          <p className="text-red-900 font-bold">💀 CONSECUENCIAS IRREVERSIBLES:</p>
                          <ul className="text-red-800 text-sm mt-1 list-disc list-inside">
                            <li>
                              <strong>
                                Se perderán TODOS los votantes ({totalPadron.toLocaleString()} registros)
                              </strong>
                            </li>
                            <li>
                              <strong>Se eliminarán TODAS las etiquetas asignadas</strong>
                            </li>
                            <li>
                              <strong>Se perderá TODO el historial de votos</strong>
                            </li>
                            <li>
                              <strong>Tendrás que volver a cargar el padrón desde cero</strong>
                            </li>
                            <li>
                              <strong>Esta operación NO se puede deshacer JAMÁS</strong>
                            </li>
                          </ul>
                        </div>
                        <p className="text-sm font-bold text-red-900">
                          Solo procede si estás 100% seguro de que quieres eliminar todo el padrón electoral.
                        </p>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={vaciarPadron} className="bg-red-700 hover:bg-red-800">
                      SÍ, ELIMINAR TODO EL PADRÓN
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Información Importante</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Las configuraciones se aplican inmediatamente a todo el sistema</li>
                  <li>• Los fiscales verán los cambios en tiempo real</li>
                  <li>• Las operaciones de limpieza son irreversibles</li>
                  <li>• Siempre haz una copia de seguridad antes de operaciones críticas</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
