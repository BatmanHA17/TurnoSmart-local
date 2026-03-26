import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Building2 } from "lucide-react";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";

export default function EstablishmentsSettings() {
  const navigate = useNavigate();
  const { organizations: orgsBasic } = useOrganizations();
  const { organizations, refresh } = useOrganizationsUnified();
  const [searchTerm, setSearchTerm] = useState("");

  const establishments = organizations.map(org => ({
    id: org.id,
    name: org.name,
    address: org.establishment_address || "No rellenado",
    teams: "Rota"
  }));

  const handleAddEstablishment = () => {
    navigate("/settings/locations/new");
  };

  useEffect(() => {
    document.title = "Establecimientos | TurnoSmart";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Establecimientos</h1>
              <p className="text-gray-600">
                Configurar cada de uno de sus establecimientos: convenio colectivo, normas de asignación de comidas, objetivos de productividad, etc.
              </p>
            </div>
            <Button 
              onClick={handleAddEstablishment}
              className="bg-black text-white hover:bg-gray-800 rounded-full flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Añadir un establecimiento
            </Button>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar un establecimiento"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300"
              />
            </div>
            <Select defaultValue="activos">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activos">Establecimientos activos</SelectItem>
                <SelectItem value="todos">Todos los establecimientos</SelectItem>
                <SelectItem value="inactivos">Establecimientos inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Establecimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dirección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Equipos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {establishments.map((establishment) => (
                    <tr key={establishment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="h-4 w-4 text-gray-400 mr-3" />
                          <span 
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                            onClick={() => {
                              console.log('Clicking on establishment:', establishment.name);
                              console.log('Navigating to:', `/settings/locations/${establishment.name}`);
                              navigate(`/settings/locations/${establishment.name}`);
                            }}
                          >
                            {establishment.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {establishment.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {establishment.teams}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </div>
  );
}