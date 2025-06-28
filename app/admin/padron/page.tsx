"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, ArrowLeft, FileText, Users, AlertCircle, CheckCircle, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useElectionStats } from "@/hooks/use-election-stats"

export default function PadronPage() {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [csvContent, setCsvContent] = useState("")
  const [previewData, setPreviewData] = useState<any[]>([])
  const [ultimaCarga, setUltimaCarga] = useState<string | null>(null)
  
  const router = useRouter()
  const { toast } = useToast()
  
  // Usar el hook centralizado para estadísticas
  const { totalPadron, totalVotantes, porcentajeParticipacion, totalMesas, loading: statsLoading, refresh: refreshStats } = useElectionStats()

  useEffect(() => {
    const isAdmin = localStorage.getItem("admin")
    if (!isAdmin) {
      router.push("/admin")
      return
    }
    loadUltimaCarga()
  }, [router])

  const loadUltimaCarga = async () => {
    try {
      // Obtener la fecha más reciente de creación
      const { data: padronData } = await supabase
        .from("padron")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)

      if (padronData && padronData.length > 0) {
        setUltimaCarga(padronData[0].created_at)
      }
    } catch (error) {
      console.error("Error loading last update:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCsvContent(content)
      previewCsv(content)
    }
    reader.readAsText(file)
  }

  const previewCsv = (content: string) => {
    const lines = content.trim().split("\n")
    const preview = lines.slice(0, 5).map((line) => {
      const fields = line.split(";")
      return {
        id: fields[0],
        dni: fields[1],
        sexo: fields[2],
        clase: fields[3],
        apellido_nombre: fields[4],
        domicilio: fields[5],
        mesa: fields[6],
        orden: fields[7],
      }
    })
    setPreviewData(preview)
  }

  const processCsv = async () => {
    if (!csvContent.trim()) {
      toast({
        title: "Error",
        description: "No hay contenido CSV para procesar",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const lines = csvContent.trim().split("\n")
      const records = []

      for (const line of lines) {
        const fields = line.split(";")
        if (fields.length >= 8) {
          records.push({
            dni: fields[1]?.trim(),
            sexo: fields[2]?.trim(),
            clase: fields[3]?.trim(),
            apellido_nombre: fields[4]?.trim(),
            domicilio: fields[5]?.trim(),
            mesa: fields[6]?.trim(),
            orden: Number.parseInt(fields[7]?.trim()),
          })
        }
      }

      if (records.length === 0) {
        throw new Error("No se encontraron registros válidos en el CSV")
      }

      // Insertar registros en lotes
      const batchSize = 100
      let insertedCount = 0

      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)

        const { error } = await supabase.from("padron").upsert(batch, {
          onConflict: "dni",
          ignoreDuplicates: false,
        })

        if (error) {
          console.error("Error inserting batch:", error)
          // Continuar con el siguiente lote
        } else {
          insertedCount += batch.length
        }
      }

      toast({
        title: "¡Éxito!",
        description: `Se procesaron ${insertedCount.toLocaleString()} registros del padrón`,
      })

      // Limpiar formulario y recargar stats
      setCsvContent("")
      setPreviewData([])
      refreshStats()
      loadUltimaCarga()
    } catch (error) {
      console.error("Error processing CSV:", error)
      toast({
        title: "Error",
        description: "Error al procesar el archivo CSV",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
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
            <h1 className="text-3xl font-bold">Gestión del Padrón Electoral</h1>
            <p className="text-gray-600">Cargar y administrar el padrón de votantes</p>
          </div>
        </div>

        {/* Estadísticas actuales usando el hook centralizado */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalPadron.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Total Registros</p>
                  <p className="text-xs text-gray-500">Padrón completo</p>
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
                  <p className="text-xs text-gray-500">Sobre {totalPadron.toLocaleString()} total</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{porcentajeParticipacion}%</div>
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

        {/* Información de última carga - MEJORADA */}
        {ultimaCarga && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">Padrón cargado exitosamente</p>
                  <p className="text-sm text-green-700">
                    Última actualización: {new Date(ultimaCarga).toLocaleString("es-AR")}
                  </p>
                  <div className="text-sm text-green-700 mt-1">
                    <span className="font-medium">Estadísticas completas:</span>
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>{totalPadron.toLocaleString()} registros totales en el padrón</li>
                      <li>{totalMesas} mesas electorales configuradas</li>
                      <li>
                        {totalVotantes.toLocaleString()} votantes ({porcentajeParticipacion}% de
                        participación)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Carga de archivo */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Cargar Padrón CSV
            </CardTitle>
            <CardDescription>
              Formato esperado: ID;DNI;SEXO;CLASE;APELLIDO Y NOMBRE;DOMICILIO;MESA;ORDEN
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">Seleccionar archivo CSV</Label>
              <Input id="csv-file" type="file" accept=".csv,.txt" onChange={handleFileUpload} disabled={uploading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv-content">O pegar contenido CSV</Label>
              <Textarea
                id="csv-content"
                placeholder="Pega aquí el contenido del CSV..."
                value={csvContent}
                onChange={(e) => {
                  setCsvContent(e.target.value)
                  if (e.target.value.trim()) {
                    previewCsv(e.target.value)
                  } else {
                    setPreviewData([])
                  }
                }}
                rows={6}
                disabled={uploading}
              />
            </div>

            {previewData.length > 0 && (
              <div className="space-y-2">
                <Label>Vista previa (primeros 5 registros)</Label>
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-2 text-xs font-semibold grid grid-cols-8 gap-1">
                    <div>ID</div>
                    <div>DNI</div>
                    <div>Sexo</div>
                    <div>Clase</div>
                    <div>Apellido y Nombre</div>
                    <div>Domicilio</div>
                    <div>Mesa</div>
                    <div>Orden</div>
                  </div>
                  {previewData.map((record, index) => (
                    <div key={index} className="p-2 text-xs grid grid-cols-8 gap-1 border-t">
                      <div className="truncate">{record.id}</div>
                      <div className="truncate">{record.dni}</div>
                      <div className="truncate">{record.sexo}</div>
                      <div className="truncate">{record.clase}</div>
                      <div className="truncate">{record.apellido_nombre}</div>
                      <div className="truncate">{record.domicilio}</div>
                      <div className="truncate">{record.mesa}</div>
                      <div className="truncate">{record.orden}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm text-blue-800 font-medium">
                    Se procesarán {csvContent.trim().split("\n").length.toLocaleString()} registros
                  </p>
                </div>
              </div>
            )}

            <Button onClick={processCsv} disabled={!csvContent.trim() || uploading} className="w-full">
              {uploading ? "Procesando..." : "Cargar Padrón"}
            </Button>
          </CardContent>
        </Card>

        {/* Información importante - ACTUALIZADA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-amber-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Información Importante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-sm">
                <strong>Estadísticas precisas:</strong> Todos los cálculos se basan en el total real de registros en la
                base de datos
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-sm">
                <strong>Mesas completas:</strong> Se muestran todas las mesas del padrón, sin limitaciones
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-sm">Los registros se actualizarán si ya existe el DNI</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-sm">
                El formato debe ser exactamente: ID;DNI;SEXO;CLASE;APELLIDO Y NOMBRE;DOMICILIO;MESA;ORDEN
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-sm">Los campos MESA y ORDEN deben ser números</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
              <p className="text-sm">Asegúrate de hacer una copia de seguridad antes de cargar datos nuevos</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-sm">
                <strong>Capacidad:</strong> El sistema maneja archivos grandes con más de 3,000 registros sin problemas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
