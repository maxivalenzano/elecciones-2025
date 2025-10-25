"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Edit, Trash2, ArrowLeft, Tag, Palette } from "lucide-react"
import Link from "next/link"
import { supabase, type Etiqueta } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

const COLORES_DISPONIBLES = [
  "#EF4444", // Rojo
  "#F59E0B", // Amarillo
  "#10B981", // Verde
  "#3B82F6", // Azul
  "#8B5CF6", // Violeta
  "#EC4899", // Rosa
  "#F97316", // Naranja
  "#06B6D4", // Cian
  "#84CC16", // Lima
  "#6B7280", // Gris
]

export default function EtiquetasPage() {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEtiqueta, setEditingEtiqueta] = useState<Etiqueta | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    color: "#6B7280",
    descripcion: "",
  })
  const { toast } = useToast()
  useAuth({ requiredRole: "admin", redirectTo: "/admin" })

  useEffect(() => {
    loadEtiquetas()
  }, [])

  const loadEtiquetas = async () => {
    try {
      const { data, error } = await supabase.from("etiquetas").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setEtiquetas(data || [])
    } catch (error) {
      console.error("Error loading etiquetas:", error)
      toast({
        title: "Error",
        description: "Error al cargar etiquetas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingEtiqueta) {
        // Actualizar etiqueta existente
        const { error } = await supabase
          .from("etiquetas")
          .update({
            nombre: formData.nombre.trim(),
            color: formData.color,
            descripcion: formData.descripcion.trim(),
          })
          .eq("id", editingEtiqueta.id)

        if (error) throw error

        toast({
          title: "¡Éxito!",
          description: "Etiqueta actualizada correctamente",
        })
      } else {
        // Crear nueva etiqueta
        const { error } = await supabase.from("etiquetas").insert({
          nombre: formData.nombre.trim(),
          color: formData.color,
          descripcion: formData.descripcion.trim(),
          activa: true,
        })

        if (error) throw error

        toast({
          title: "¡Éxito!",
          description: "Etiqueta creada correctamente",
        })
      }

      // Resetear formulario y cerrar dialog
      setFormData({ nombre: "", color: "#6B7280", descripcion: "" })
      setEditingEtiqueta(null)
      setDialogOpen(false)
      loadEtiquetas()
    } catch (error) {
      console.error("Error saving etiqueta:", error)
      toast({
        title: "Error",
        description: "Error al guardar etiqueta",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (etiqueta: Etiqueta) => {
    setEditingEtiqueta(etiqueta)
    setFormData({
      nombre: etiqueta.nombre,
      color: etiqueta.color,
      descripcion: etiqueta.descripcion,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (etiqueta: Etiqueta) => {
    try {
      const { error } = await supabase.from("etiquetas").update({ activa: false }).eq("id", etiqueta.id)

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Etiqueta desactivada correctamente",
      })
      loadEtiquetas()
    } catch (error) {
      console.error("Error deleting etiqueta:", error)
      toast({
        title: "Error",
        description: "Error al desactivar etiqueta",
        variant: "destructive",
      })
    }
  }

  const handleReactivate = async (etiqueta: Etiqueta) => {
    try {
      const { error } = await supabase.from("etiquetas").update({ activa: true }).eq("id", etiqueta.id)

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Etiqueta reactivada correctamente",
      })
      loadEtiquetas()
    } catch (error) {
      console.error("Error reactivating etiqueta:", error)
      toast({
        title: "Error",
        description: "Error al reactivar etiqueta",
        variant: "destructive",
      })
    }
  }

  const openNewDialog = () => {
    setEditingEtiqueta(null)
    setFormData({ nombre: "", color: "#6B7280", descripcion: "" })
    setDialogOpen(true)
  }

  if (loading) {
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Gestión de Etiquetas</h1>
              <p className="text-gray-600">Administra las etiquetas que pueden asignarse a los votantes</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Etiqueta
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingEtiqueta ? "Editar Etiqueta" : "Nueva Etiqueta"}</DialogTitle>
                    <DialogDescription>
                      {editingEtiqueta
                        ? "Modifica los datos de la etiqueta"
                        : "Completa los datos de la nueva etiqueta"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre de la etiqueta</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Adulto Mayor"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descripcion">Descripción (opcional)</Label>
                      <Textarea
                        id="descripcion"
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        placeholder="Descripción de la etiqueta..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color de la etiqueta</Label>
                      <div className="flex gap-2 flex-wrap">
                        {COLORES_DISPONIBLES.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 ${
                              formData.color === color ? "border-gray-900" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData({ ...formData, color })}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Palette className="h-4 w-4" />
                        <Input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-16 h-8"
                        />
                        <span className="text-sm text-gray-600">{formData.color}</span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">{editingEtiqueta ? "Actualizar" : "Crear"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Etiquetas</CardTitle>
            <CardDescription>
              {etiquetas.filter((e) => e.activa).length} etiquetas activas de {etiquetas.length} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {etiquetas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay etiquetas registradas</p>
                  <p className="text-sm">Haz clic en "Nueva Etiqueta" para agregar la primera</p>
                </div>
              ) : (
                etiquetas.map((etiqueta) => (
                  <div
                    key={etiqueta.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      etiqueta.activa ? "bg-white" : "bg-gray-50 opacity-75"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: etiqueta.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-lg">{etiqueta.nombre}</p>
                          <Badge
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
                        </div>
                        {etiqueta.descripcion && <p className="text-gray-600 text-sm">{etiqueta.descripcion}</p>}
                        <p className="text-xs text-gray-500">
                          Creada: {new Date(etiqueta.created_at).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={etiqueta.activa ? "default" : "secondary"}>
                        {etiqueta.activa ? "Activa" : "Inactiva"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(etiqueta)}
                        disabled={!etiqueta.activa}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {etiqueta.activa ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Desactivar etiqueta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción desactivará la etiqueta "{etiqueta.nombre}". Las asignaciones existentes se
                                mantendrán, pero no se podrá asignar a nuevos votantes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(etiqueta)}>Desactivar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleReactivate(etiqueta)}>
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
      </div>
    </div>
  )
}
