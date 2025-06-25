"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Users, Upload, Vote, UserPlus, BarChart3, Settings, Menu, ChevronRight, Tag } from "lucide-react"
import Link from "next/link"

interface AdminMobileNavProps {
  currentPage?: string
  stats?: {
    totalPadron: number
    totalVotantes: number
    porcentajeParticipacion: number
  }
}

export function AdminMobileNav({ currentPage = "overview", stats }: AdminMobileNavProps) {
  const [open, setOpen] = useState(false)

  const navigationItems = [
    {
      id: "overview",
      title: "Resumen General",
      description: "Vista general del sistema",
      icon: Users,
      href: "/admin/dashboard",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "padron",
      title: "Gestión del Padrón",
      description: "Cargar y administrar votantes",
      icon: Upload,
      href: "/admin/padron",
      color: "text-green-600",
      bgColor: "bg-green-50",
      badge: stats ? `${stats.totalPadron.toLocaleString()} registros` : undefined,
    },
    {
      id: "candidatos",
      title: "Candidatos",
      description: "Gestionar lista de candidatos",
      icon: Vote,
      href: "/admin/candidatos",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "fiscales",
      title: "Fiscales de Mesa",
      description: "Asignar fiscales a mesas",
      icon: UserPlus,
      href: "/admin/fiscales",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      id: "resultados",
      title: "Resultados",
      description: "Ver resultados de la elección",
      icon: BarChart3,
      href: "/admin/resultados",
      color: "text-red-600",
      bgColor: "bg-red-50",
      badge: stats ? `${stats.porcentajeParticipacion}% participación` : undefined,
    },
    {
      id: "control",
      title: "Control Electoral",
      description: "Configuración y operaciones",
      icon: Settings,
      href: "/admin/control",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      id: "etiquetas",
      title: "Etiquetas",
      description: "Gestionar etiquetas de votantes",
      icon: Tag,
      href: "/admin/etiquetas",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ]

  const currentItem = navigationItems.find((item) => item.id === currentPage)

  return (
    <>
      {/* Mobile Navigation Button */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Menu className="h-4 w-4 mr-2" />
              {currentItem ? currentItem.title : "Navegación"}
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Panel de Administración</SheetTitle>
              <SheetDescription>Selecciona una sección para gestionar</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-3">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = item.id === currentPage

                return (
                  <Card
                    key={item.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isActive ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    }`}
                    asChild
                  >
                    <Link href={item.href} onClick={() => setOpen(false)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${item.bgColor}`}>
                            <Icon className={`h-5 w-5 ${item.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-sm">{item.title}</h3>
                              {isActive && <Badge variant="default">Actual</Badge>}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                            {item.badge && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 mt-1" />
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                )
              })}
            </div>

            {/* Quick Stats in Mobile Nav
            {stats && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-sm mb-3">Estadísticas Rápidas</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-blue-600">{stats.totalPadron.toLocaleString()}</div>
                    <div className="text-xs text-blue-700">Total Padrón</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="text-lg font-bold text-green-600">{stats.totalVotantes.toLocaleString()}</div>
                    <div className="text-xs text-green-700">Ya Votaron</div>
                  </div>
                </div>
              </div>
            )}
             */}
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile Quick Actions Grid 
      <div className="md:hidden grid grid-cols-2 gap-3 mt-4">
        {navigationItems.slice(0, 6).map((item) => {
          const Icon = item.icon
          const isActive = item.id === currentPage

          return (
            <Card
              key={item.id}
              className={`cursor-pointer hover:shadow-md transition-all ${
                isActive ? "ring-2 ring-blue-500 bg-blue-50" : ""
              }`}
              asChild
            >
              <Link href={item.href}>
                <CardContent className="p-4 text-center">
                  <div className={`inline-flex p-2 rounded-lg ${item.bgColor} mb-2`}>
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <p className="text-sm font-medium">{item.title}</p>
                  {item.badge && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>
      */}
    </>
  )
}
