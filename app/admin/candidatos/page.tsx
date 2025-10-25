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
import { Plus, Edit, Trash2, ArrowLeft, Palette } from "lucide-react"
import Link from "next/link"
import { supabase, type Candidato } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

const COLORES_DISPONIBLES = [
  "#3B82F6", // Azul
  "#EF4444", // Rojo
  "#10B981", // Verde
  "#F59E0B", // Amarillo
  "#8B5CF6", // Violeta
  "#F97316", // Naranja
  "#06B6D4", // Cian
  "#84CC16", // Lima
  "#EC4899", // Rosa
  "#6B7280", // Gris
]

export default function CandidatosPage() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCandidato, setEditingCandidato] = useState<Candidato | null>(null)
  const [formData, setFormData] = useState({
    nombre: "",
    partido: "",
    color: "#3B82F6",
  })
  const { toast } = useToast()
  useAuth({ requiredRole: "admin", redirectTo: "/admin" })

  useEffect(() => {
    loadCandidatos()
  }, [])

  const loadCandidatos = async () => {
    try {
      const { data, error } = await supabase.from("candidatos").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setCandidatos(data || [])
    } catch (error) {
      console.error("Error loading candidatos:", error)
      toast({
        title: "Error",
        description: "Error al cargar candidatos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim() || !formData.partido.trim()) {
      toast({
        title: "Error",
        description: "Nombre y partido son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingCandidato) {
        // Actualizar candidato existente
        const { error } = await supabase
          .from("candidatos")
          .update({
            nombre: formData.nombre.trim(),
            partido: formData.partido.trim(),
            color: formData.color,
          })
          .eq("id", editingCandidato.id)

        if (error) throw error

        toast({
          title: "¡Éxito!",
          description: "Candidato actualizado correctamente",
        })
      } else {
        // Crear nuevo candidato
        const { error } = await supabase.from("candidatos").insert({
          nombre: formData.nombre.trim(),
          partido: formData.partido.trim(),
          color: formData.color,
          activo: true,
        })

        if (error) throw error

        toast({
          title: "¡Éxito!",
          description: "Candidato creado correctamente",
        })
      }

      // Resetear formulario y cerrar dialog
      setFormData({ nombre: "", partido: "", color: "#3B82F6" })
      setEditingCandidato(null)
      setDialogOpen(false)
      loadCandidatos()
    } catch (error) {
      console.error("Error saving candidato:", error)
      toast({
        title: "Error",
        description: "Error al guardar candidato",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (candidato: Candidato) => {
    setEditingCandidato(candidato)
    setFormData({
      nombre: candidato.nombre,
      partido: candidato.partido,
      color: candidato.color,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (candidato: Candidato) => {
    try {
      const { error } = await supabase.from("candidatos").update({ activo: false }).eq("id", candidato.id)

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Candidato desactivado correctamente",
      })
      loadCandidatos()
    } catch (error) {
      console.error("Error deleting candidato:", error)
      toast({
        title: "Error",
        description: "Error al desactivar candidato",
        variant: "destructive",
      })
    }
  }

  const handleReactivate = async (candidato: Candidato) => {
    try {
      const { error } = await supabase.from("candidatos").update({ activo: true }).eq("id", candidato.id)

      if (error) throw error

      toast({
        title: "¡Éxito!",
        description: "Candidato reactivado correctamente",
      })
      loadCandidatos()
    } catch (error) {
      console.error("Error reactivating candidato:", error)
      toast({
        title: "Error",
        description: "Error al reactivar candidato",
        variant: "destructive",
      })
    }
  }

  const openNewDialog = () => {
    setEditingCandidato(null)
    setFormData({ nombre: "", partido: "", color: "#3B82F6" })
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
              <h1 className="text-3xl font-bold">Gestión de Candidatos</h1>
              <p className="text-gray-600">Administra la lista de candidatos para la elección</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Candidato
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingCandidato ? "Editar Candidato" : "Nuevo Candidato"}</DialogTitle>
                    <DialogDescription>
                      {editingCandidato ? "Modifica los datos del candidato" : "Completa los datos del nuevo candidato"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre completo</Label>
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Ej: Juan Pérez"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partido">Partido político</Label>
                      <Input
                        id="partido"
                        value={formData.partido}
                        onChange={(e) => setFormData({ ...formData, partido: e.target.value })}
                        placeholder="Ej: Partido Democrático"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color representativo</Label>
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
                    <Button type="submit">{editingCandidato ? "Actualizar" : "Crear"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Candidatos</CardTitle>
            <CardDescription>
              {candidatos.filter((c) => c.activo).length} candidatos activos de {candidatos.length} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {candidatos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay candidatos registrados</p>
                  <p className="text-sm">Haz clic en "Nuevo Candidato" para agregar el primero</p>
                </div>
              ) : (
                candidatos.map((candidato) => (
                  <div
                    key={candidato.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      candidato.activo ? "bg-white" : "bg-gray-50 opacity-75"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: candidato.color }}
                      />
                      <div>
                        <p className="font-semibold text-lg">{candidato.nombre}</p>
                        <p className="text-gray-600">{candidato.partido}</p>
                        <p className="text-xs text-gray-500">
                          Creado: {new Date(candidato.created_at).toLocaleDateString("es-AR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={candidato.activo ? "default" : "secondary"}>
                        {candidato.activo ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(candidato)}
                        disabled={!candidato.activo}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {candidato.activo ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Desactivar candidato?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción desactivará a {candidato.nombre}. Podrás reactivarlo más tarde si es
                                necesario.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(candidato)}>Desactivar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleReactivate(candidato)}>
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
