"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Vote, BarChart3, Upload, UserPlus, Settings, LogOut, FileText, Tag } from "lucide-react"
import { supabase, type Candidato, type Fiscal } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useElectionStats } from "@/hooks/use-election-stats"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { AdminMobileNav } from "@/components/admin-mobile-nav"
import { ELECCIONES } from "@/lib/constants"
import { formatearPorcentaje } from "@/lib/utils"

export default function AdminDashboard() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [fiscales, setFiscales] = useState<Fiscal[]>([])
  const [loading, setLoading] = useState(true)

  const { toast } = useToast()
  const { logout } = useAuth({ requiredRole: "admin", redirectTo: "/admin" })
  const { totalPadron, totalVotantes, porcentajeParticipacion, totalMesas, loading: statsLoading, error: statsError, refresh: refreshStats } = useElectionStats()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Cargar candidatos
      const { data: candidatosData, error: candidatosError } = await supabase
        .from("candidatos")
        .select("*")
        .eq("activo", true)
        .order("nombre")

      if (candidatosError) throw candidatosError
      setCandidatos(candidatosData || [])

      // Cargar fiscales
      const { data: fiscalesData, error: fiscalesError } = await supabase
        .from("fiscales")
        .select("*")
        .eq("activo", true)
        .order("mesa_asignada")

      if (fiscalesError) throw fiscalesError
      setFiscales(fiscalesData || [])
    } catch (error) {
      console.error("Error loading dashboard:", error)
      toast({
        title: "Error",
        description: "Error al cargar datos del dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // logout function now comes from useAuth hook

  if (loading || statsLoading) {
    return <div className="container mx-auto px-4 py-8">Cargando...</div>
  }

  if (statsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          <p>Error al cargar estadísticas: {statsError}</p>
          <Button onClick={refreshStats} className="mt-4">Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-gray-600">{ELECCIONES.tituloCompleto} {ELECCIONES.año}</p>
          </div>
          <Button variant="outline" onClick={() => logout("admin")}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Estadísticas principales con totales exactos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalPadron.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Total Padrón</p>
                  <p className="text-xs text-gray-500">Registros completos</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">{totalVotantes.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Ya Votaron</p>
                  <p className="text-xs text-gray-500">De {totalPadron.toLocaleString()} total</p>
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
                  <p className="text-xs text-gray-500">
                    {totalVotantes.toLocaleString()} / {totalPadron.toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-orange-600">{totalMesas}</div>
                  <p className="text-sm text-gray-600">Total Mesas</p>
                  <p className="text-xs text-gray-500">Todas las mesas</p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navegación Mobile Mejorada */}
        <AdminMobileNav
          currentPage="overview"
          stats={{
            totalPadron,
            totalVotantes,
            porcentajeParticipacion,
          }}
        />

        {/* Tabs de gestión - Solo Desktop */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="hidden md:grid w-full grid-cols-6">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="padron" asChild>
              <Link href="/admin/padron">Padrón</Link>
            </TabsTrigger>
            <TabsTrigger value="candidatos" asChild>
              <Link href="/admin/candidatos">Candidatos</Link>
            </TabsTrigger>
            <TabsTrigger value="fiscales" asChild>
              <Link href="/admin/fiscales">Fiscales</Link>
            </TabsTrigger>
            <TabsTrigger value="etiquetas" asChild>
              <Link href="/admin/etiquetas">Etiquetas</Link>
            </TabsTrigger>
            <TabsTrigger value="control" asChild>
              <Link href="/admin/control">Control</Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/admin/padron">
                      <Upload className="h-4 w-4 mr-2" />
                      Cargar Padrón CSV
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/admin/fiscales">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Gestionar Fiscales
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/admin/candidatos">
                      <Settings className="h-4 w-4 mr-2" />
                      Gestionar Candidatos
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/admin/etiquetas">
                      <Tag className="h-4 w-4 mr-2" />
                      Gestionar Etiquetas
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/admin/control">
                      <Settings className="h-4 w-4 mr-2" />
                      Control Electoral
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/resultados">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Ver Resultados Completos
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado de Fiscales</CardTitle>
                  <CardDescription>
                    {fiscales.length} fiscales activos de {totalMesas} mesas totales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {fiscales.slice(0, 5).map((fiscal) => (
                      <div key={fiscal.id} className="flex justify-between items-center">
                        <span className="text-sm">{fiscal.nombre}</span>
                        <Badge variant="outline">Mesa {fiscal.mesa_asignada}</Badge>
                      </div>
                    ))}
                    {fiscales.length > 5 && (
                      <p className="text-sm text-gray-500">Y {fiscales.length - 5} fiscales más...</p>
                    )}
                    {fiscales.length < totalMesas && (
                      <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                        <p className="text-sm text-orange-800">
                          ⚠️ {totalMesas - fiscales.length} mesa
                          {totalMesas - fiscales.length !== 1 ? "s" : ""} sin fiscal asignado
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
