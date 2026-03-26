import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface ConfigurationState {
  [key: string]: any;
}

const STORAGE_KEY = 'turnosmart_configuration';

export const useConfigurationState = () => {
  const [configurations, setConfigurations] = useState<ConfigurationState>({});
  const [loading, setLoading] = useState(false);

  // Load configurations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setConfigurations(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading configurations:', error);
      }
    }
  }, []);

  // Sync across components: listen for global config updates
  useEffect(() => {
    const handler = (e: any) => {
      try {
        if (e?.detail) {
          setConfigurations(e.detail);
        } else {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) setConfigurations(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Error syncing configurations:', err);
      }
    };

    window.addEventListener('turnosmart_config_updated', handler as EventListener);
    return () => {
      window.removeEventListener('turnosmart_config_updated', handler as EventListener);
    };
  }, []);


  const saveConfiguration = async (configId: string, config: any) => {
    console.log(`Guardando configuración para ${configId}:`, config);
    setLoading(true);
    try {
      const newConfigurations = {
        ...configurations,
        [configId]: {
          ...config,
          updatedAt: new Date().toISOString(),
          status: 'configured'
        }
      };
      
      console.log(`Estado antes de actualizar:`, configurations);
      console.log(`Nuevo estado:`, newConfigurations);
      
      // Actualizar el estado inmediatamente usando callback para forzar re-render
      setConfigurations(prevConfigs => {
        console.log(`Estado previo en callback:`, prevConfigs);
        return newConfigurations;
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfigurations));
      // Broadcast update so other components (like the Hub) refresh immediately
      window.dispatchEvent(new CustomEvent('turnosmart_config_updated', { detail: newConfigurations }));
      
      toast.success('Configuración guardada correctamente');
      
      return true;
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Error al guardar la configuración');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getConfiguration = (configId: string) => {
    return configurations[configId] || null;
  };

  const isConfigured = (configId: string) => {
    const config = configurations[configId];
    const result = config && config.status === 'configured';
    console.log(`Verificando si ${configId} está configurado:`, result, config);
    console.log('Todas las configuraciones actuales:', configurations);
    return result;
  };

  const resetConfiguration = (configId: string) => {
    const newConfigurations = { ...configurations };
    delete newConfigurations[configId];
    setConfigurations(newConfigurations);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfigurations));
    window.dispatchEvent(new CustomEvent('turnosmart_config_updated', { detail: newConfigurations }));
    toast.success('Configuración restablecida');
  };

  const resetAllConfigurations = () => {
    setConfigurations({});
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('turnosmart_config_updated', { detail: {} }));
    toast.success('Todas las configuraciones han sido restablecidas');
  };

  return {
    configurations,
    loading,
    saveConfiguration,
    getConfiguration,
    isConfigured,
    resetConfiguration,
    resetAllConfigurations
  };
};