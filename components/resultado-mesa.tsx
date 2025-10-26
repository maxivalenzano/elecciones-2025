"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3 } from "lucide-react"
import { formatearPorcentaje } from "@/lib/utils"

interface CandidatoResultado {
  id: number
  nombre: string
  partido: string
  color: string
  votos: number
  porcentaje: number
}

interface ResultadoMesaProps {
  mesa: string
  candidatos: CandidatoResultado[]
  totalVotos: number
  mostrarTitulo?: boolean
  className?: string
  compact?: boolean
}

export function ResultadoMesa({ 
  mesa, 
  candidatos, 
  totalVotos, 
  mostrarTitulo = true,
  className = "",
  compact = false 
}: ResultadoMesaProps) {
  // Ordenar candidatos por votos (mayor a menor)
  const candidatosOrdenados = [...candidatos].sort((a, b) => b.votos - a.votos)

  if (candidatosOrdenados.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay resultados cargados para esta mesa</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {mostrarTitulo && (
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Mesa {mesa}</CardTitle>
            <Badge variant="outline">{totalVotos} votos</Badge>
          </div>
        </CardHeader>
      )}
      <CardContent className={mostrarTitulo ? "" : "p-4"}>
        {!mostrarTitulo && (
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">Mesa {mesa}</h3>
            <Badge variant="outline">{totalVotos} votos</Badge>
          </div>
        )}
        <div className="space-y-3">
          {candidatosOrdenados.map((candidato, index) => (
            <div key={candidato.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-bold text-gray-400 flex-shrink-0">#{index + 1}</span>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: candidato.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{candidato.nombre}</p>
                    {!compact && (
                      <p className="text-xs text-gray-600 truncate">{candidato.partido}</p>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="font-bold text-base">{candidato.votos}</span>
                  <span className="text-sm text-gray-600 ml-1">({formatearPorcentaje(candidato.porcentaje)}%)</span>
                </div>
              </div>
              {!compact && (
                <Progress value={candidato.porcentaje} className="h-2" />
              )}
            </div>
          ))}
        </div>
        {!mostrarTitulo && totalVotos > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-700">Total de votos:</span>
              <span className="font-bold">{totalVotos}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

