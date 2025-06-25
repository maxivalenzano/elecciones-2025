"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, ArrowLeft, Users, Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase, type Fiscal } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function FiscalesPage() {
  const [fiscales, setFiscales] = useState<Fiscal[]>([])
  const [mesas, setMesas] = useState<number[]>([])
  const [totalMesas, setTotalMesas] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFiscal, setEditingFiscal] = useState<Fiscal | null>(null)
  const [showPassword, setShowPassword] = useState<{ [key: number]: boolean }>({})
  const [formData, setFormData] = useState({
    nombre: "",
    mesa_asignada: "",
    password: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin")
    if (!isAdmin) {
      router.push("/admin")
      return
    }
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      // Cargar fiscales
      const { data: fiscalesData, error: fiscalesError } = await supabase
        .from("fiscales")
        .select("*")
        .order("mesa_asignada", { ascending: true })

      if (fiscalesError) throw fiscalesError
      setFiscales(fiscalesData || [])

      // Cargar TODAS las mesas disponibles del padrón usando una consulta optimizada
      // Primero obtenemos todas las mesas únicas sin limitación
      const { data: mesasData, error: mesasError } = await supabase
        .rpc("get_mesas_unicas") // Usaremos una función SQL personalizada
        .single()

      if (mesasError) {
        // Si la función no existe, usar método alternativo
        console.log("Función get_mesas_unicas no encontrada, usando método alternativo...")

        // Método alternativo: obtener mesas con DISTINCT
        const { data: mesasAlternativas, error: mesasAltError } = await supabase
          .from("padron")
          .select("mesa")
          .order("mesa", { ascending: true })

        if (mesasAltError) throw mesasAltError

        // Extraer mesas únicas manualmente
        const mesasUnicas = Array.from(new Set(mesasAlternativas?.map((p) => p.mesa) || [])).sort((a, b) => a - b)
        setMesas(mesasUnicas)
        setTotalMesas(mesasUnicas.length)
      } else {
        // Si la función existe, usar su resultado
        setMesas(mesasData.mesas || [])
        setTotalMesas(mesasData.total || 0)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Error al cargar datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
    let password = ""
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim() || !formData.mesa_asignada || !formData.password.trim()) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }

    // Verificar que la mesa no esté ya asignada (excepto si estamos editando el mismo fiscal)
    const mesaYaAsignada = fiscales.find(
      (f) => f.mesa_asignada === Number.parseInt(formData.mesa_asignada) && f.activo && f.id !== editingFiscal?.id,
    )

    if (mesaYaAsignada) {
      toast({
        title: "Error",
        description: `La mesa ${formData.mesa_asignada} ya está asignada a ${mesaYaAsignada.nombre}`,
        variant: "destructive",
      })
      return
    }

    try {
      if (editingFiscal) {
        // Actualizar fiscal existente
        const { error } = await supabase
          .from("fiscales")
          .update({
            nombre: formData.nombre.trim(),
            mesa_asignada: Number.parseInt(formData.mesa_asignada),
            password: formData.password.trim(),
          })
          .eq("id", editingFiscal.id)

        if (error) throw error

        toast({
          title: "¡Éxito!",
          description: "Fiscal actualizado correctamente",
        })
      } else {
        // Crear nuevo fiscal
        const { error } = await supabase.from("fiscales").insert({
          nombre: formData.nombre.trim(),
          mesa_asignada: Number.parseInt(formData.mesa_asignada),
          password: formData.password.trim(),
          activo: true,
        })

        if (error) throw error

        toast({
          title: "¡Éxito!",
          description: "Fiscal creado correctamente",
        })
      }

      // Resetear formulario y cerrar dialog
      setFormData({ nombre: "", mesa_asignada: "", password: "" })
      setEditingFiscal(null)
      setDialogOpen(false)
      loadData()
    } catch (error) {
      console.error("Error saving fiscal:", error)
      toast({
        title: "Error",
        description: "Error al guardar fiscal",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (fiscal: Fiscal) => {
    setEditingFiscal(fiscal)
    setFormData({
      nombre: fiscal.nombre,
      mesa_asignada: fiscal.mesa_asignada.toString(),
      password: fiscal.password,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (fiscal: Fiscal) => {
    try {
      const { error } = await supabase.from("fiscales").update({ activo: false }).eq("id", fiscal.id)

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Fiscal desactivado correctamente",
      })
      loadData()
    } catch (error) {
      console.error("Error deleting fiscal:", error)
      toast({
        title: "Error",
        description: "Error al desactivar fiscal",
        variant: "destructive",
      })
    }
  }

  const handleReactivate = async (fiscal: Fiscal) => {
    try {
      const { error } = await supabase.from("fiscales").update({ activo: true }).eq("id", fiscal.id)

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Fiscal reactivado correctamente",
      })
      loadData()
    } catch (error) {
      console.error("Error reactivating fiscal:", error)
      toast({
        title: "Error",
        description: "Error al reactivar fiscal",
        variant: "destructive",
      })
    }
  }

  const togglePasswordVisibility = (fiscalId: number) => {
    setShowPassword((prev) => ({
      ...prev,
      [fiscalId]: !prev[fiscalId],
    }))
  }

  const openNewDialog = () => {
    setEditingFiscal(null)
    setFormData({ nombre: "", mesa_asignada: "", password: "" })
    setDialogOpen(true)
  }

  const getMesasDisponibles = () => {
    const mesasAsignadas = fiscales.filter((f) => f.activo && f.id !== editingFiscal?.id).map((f) => f.mesa_asignada)

    return mesas.filter((mesa) => !mesasAsignadas.includes(mesa))
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Cargando...</div>
  }

  const mesasAsignadas = fiscales.filter((f) => f.activo).length
  const mesasSinAsignar = totalMesas - mesasAsignadas

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Gestión de Fiscales</h1>
              <p className="text-gray-600">Administra los fiscales asignados a cada mesa</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Fiscal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingFiscal ? "Editar Fiscal" : "Nuevo Fiscal"}</DialogTitle>
                    <DialogDescription>
                      {editingFiscal ? "Modifica los datos del fiscal" : "Completa los datos del nuevo fiscal"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre completo</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: María González"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mesa">Mesa asignada</Label>
                      <Select
                        value={formData.mesa_asignada}
                        onValueChange={(value) => setFormData({ ...formData, mesa_asignada: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una mesa" />
                        </SelectTrigger>
                        <SelectContent>
                          {editingFiscal && (
                            <SelectItem value={editingFiscal.mesa_asignada.toString()}>
                              Mesa {editingFiscal.mesa_asignada} (actual)
                            </SelectItem>
                          )}
                          {getMesasDisponibles().map((mesa) => (
                            <SelectItem key={mesa} value={mesa.toString()}>
                              Mesa {mesa}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        {getMesasDisponibles().length} mesas disponibles de {totalMesas} totales
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña</Label>
                      <div className="flex gap-2">
                        <Input
                          id="password"
                          type="text"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Contraseña del fiscal"
                          required
                        />
                        <Button type="button" variant="outline" onClick={generatePassword}>
                          Generar
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Esta contraseña será usada por el fiscal para acceder al sistema
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingFiscal ? "Actualizar" : "Crear"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estadísticas de asignación */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{totalMesas}</div>
              <p className="text-sm text-gray-600">Total Mesas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{mesasAsignadas}</div>
              <p className="text-sm text-gray-600">Mesas Asignadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{mesasSinAsignar}</div>
              <p className="text-sm text-gray-600">Sin Asignar</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerta si hay mesas sin asignar */}
        {mesasSinAsignar > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-800">Atención: Mesas sin fiscal asignado</p>
                  <p className="text-sm text-orange-700">
                    Hay {mesasSinAsignar} mesa{mesasSinAsignar !== 1 ? "s" : ""} que aún no tienen fiscal asignado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Fiscales</CardTitle>
            <CardDescription>
              {fiscales.filter((f) => f.activo).length} fiscales activos de {fiscales.length} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fiscales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay fiscales registrados</p>
                  <p className="text-sm">Haz clic en "Nuevo Fiscal" para agregar el primero</p>
                </div>
              ) : (
                fiscales.map((fiscal) => (
                  <div
                    key={fiscal.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      fiscal.activo ? "bg-white" : "bg-gray-50 opacity-75"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{fiscal.nombre}</p>
                        <p className="text-gray-600">Mesa {fiscal.mesa_asignada}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Contraseña:</span>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {showPassword[fiscal.id] ? fiscal.password : "••••••••"}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePasswordVisibility(fiscal.id)}
                            className="h-6 w-6 p-0"
                          >
                            {showPassword[fiscal.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Creado: {new Date(fiscal.created_at).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={fiscal.activo ? "default" : "secondary"}>
                        {fiscal.activo ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(fiscal)} disabled={!fiscal.activo}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {fiscal.activo ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Desactivar fiscal?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción desactivará a {fiscal.nombre} de la mesa {fiscal.mesa_asignada}. Podrás
                                reactivarlo más tarde si es necesario.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(fiscal)}>Desactivar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleReactivate(fiscal)}>
                          Reactivar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resumen de mesas */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resumen de Mesas</CardTitle>
            <CardDescription>Estado de asignación de fiscales por mesa ({totalMesas} mesas totales)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {mesas.map((mesa) => {
                const fiscal = fiscales.find((f) => f.mesa_asignada === mesa && f.activo)
                return (
                  <div
                    key={mesa}
                    className={`p-3 rounded-lg border text-center ${
                      fiscal ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p className="font-semibold">Mesa {mesa}</p>
                    <p className="text-xs truncate" title={fiscal?.nombre}>
                      {fiscal ? fiscal.nombre : "Sin fiscal"}
                    </p>
                  </div>
                )
              })}
            </div>

            {totalMesas > mesas.length && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Mostrando {mesas.length} de {totalMesas} mesas. Algunas mesas pueden no estar visibles.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
