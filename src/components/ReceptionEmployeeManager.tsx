import { useState, useEffect } from 'react';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { supabase } from '@/integrations/supabase/client';
import { getReceptionRoles } from '@/constants/receptionRules';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface ReceptionEmployee {
  id: string;
  nombre: string;
  email: string;
  role: string;
  org_id: string;
}

/**
 * Reception Employee Manager - Simplified UI for managing 7 Reception roles
 * Provides: create, view, delete employees within the Recepción department
 */
export function ReceptionEmployeeManager() {
  const { org, loading: orgLoading } = useCurrentOrganization();
  const [employees, setEmployees] = useState<ReceptionEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    role: ''
  });

  const receptionRoles = getReceptionRoles();

  useEffect(() => {
    if (org) {
      fetchEmployees();
    }
  }, [org?.id]);

  async function fetchEmployees() {
    if (!org) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('colaboradores')
        .select(`
          id,
          nombre,
          email,
          department,
          jobs(job_title_id, job_titles(name))
        `)
        .eq('org_id', org.id)
        .eq('department', 'Recepción')
        .order('nombre');

      if (error) throw error;

      setEmployees(
        (data || []).map(emp => {
          // Get role from job assignment (first one if multiple)
          const jobRole = emp.jobs?.[0]?.job_titles?.name || 'Sin rol asignado';
          return {
            id: emp.id,
            nombre: emp.nombre,
            email: emp.email,
            role: jobRole,
            org_id: org.id
          };
        })
      );
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!org || !formData.nombre || !formData.email || !formData.role) {
      alert('Complete all fields');
      return;
    }

    try {
      setLoading(true);

      // 1. Create collaborator
      const { data: newEmployee, error: empError } = await supabase
        .from('colaboradores')
        .insert({
          nombre: formData.nombre,
          email: formData.email,
          org_id: org.id,
          department: 'Recepción',
          status: 'activo'
        })
        .select()
        .single();

      if (empError) throw empError;

      // 2. Get job_title_id for the selected role
      const { data: jobTitle, error: jobError } = await supabase
        .from('job_titles')
        .select('id')
        .eq('name', formData.role)
        .single();

      if (jobError) {
        console.warn('Job title not found:', formData.role);
        // Continue anyway - employee created without job assignment
      } else if (jobTitle) {
        // 3. Create job assignment (employee -> job title)
        const { error: assignError } = await supabase
          .from('jobs')
          .insert({
            colaborador_id: newEmployee.id,
            job_title_id: jobTitle.id
          });

        if (assignError) {
          console.warn('Could not assign job title:', assignError);
        }
      }

      // Reset form and refresh
      setFormData({ nombre: '', email: '', role: '' });
      setShowForm(false);
      await fetchEmployees();
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Error creating employee');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteEmployee(empId: string) {
    if (!confirm('Delete this employee?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', empId);

      if (error) throw error;
      await fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error deleting employee');
    } finally {
      setLoading(false);
    }
  }

  if (orgLoading) {
    return <div className="p-6">Loading organization...</div>;
  }

  if (!org) {
    return <div className="p-6 text-red-600">No organization found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Recepción - Employee Manager</h1>
        <p className="text-gray-600">
          Managing 7 roles: {receptionRoles.length} positions
        </p>
      </div>

      {/* Add Employee Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Reception Employee</CardTitle>
          <CardDescription>Create a new employee in Recepción department</CardDescription>
        </CardHeader>
        <CardContent>
          {showForm ? (
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="john@example.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={loading}
                >
                  <option value="">Select role...</option>
                  {receptionRoles.map(role => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Creating...' : 'Create Employee'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              + Add New Employee
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Employees List */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Current Employees ({employees.length})</h2>

        {employees.length === 0 ? (
          <p className="text-gray-500">No employees added yet.</p>
        ) : (
          <div className="grid gap-2">
            {employees.map(emp => (
              <Card key={emp.id} className="hover:shadow-md">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{emp.nombre}</h3>
                    <p className="text-sm text-gray-600">{emp.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{emp.role}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteEmployee(emp.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Role Reference */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Reception Roles (7)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {receptionRoles.map(role => (
              <li key={role} className="text-gray-700">
                • {role}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
