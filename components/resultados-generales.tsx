"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart3 } from "lucide-react"
import type { Candidato } from "@/lib/supabase"

interface CandidatoResultado extends Candidato {
  total_votos: number
  porcentaje: number
}

interface ResultadosGeneralesProps {
  candidatos: CandidatoResultado[]
  totalVotos: number
  titulo?: string
  descripcion?: string
  mostrarCard?: boolean
  className?: string
}

export function ResultadosGenerales({
  candidatos,
  totalVotos,
  titulo = "Resultados Generales",
  descripcion,
  mostrarCard = true,
  className = "",
}: ResultadosGeneralesProps) {
  // Ordenar candidatos por votos (mayor a menor)
  const candidatosOrdenados = [...candidatos].sort((a, b) => b.total_votos - a.total_votos)

  const contenido = (
    <div className="space-y-4">
      {candidatosOrdenados.length > 0 ? (
        candidatosOrdenados.map((candidato, index) => (
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
    </div>
  )

  if (!mostrarCard) {
    return <div className={className}>{contenido}</div>
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        {descripcion && <CardDescription>{descripcion}</CardDescription>}
        {!descripcion && totalVotos > 0 && (
          <CardDescription>Total: {totalVotos.toLocaleString()} votos</CardDescription>
        )}
      </CardHeader>
      <CardContent>{contenido}</CardContent>
    </Card>
  )
}

