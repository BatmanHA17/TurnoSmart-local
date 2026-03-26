// Sistema de eventos para sincronizar balance de compensación de horas extras
type EventListener = (colaboradorId: string, newBalance: number) => void;

class CompensatoryTimeEventEmitter {
  private listeners: EventListener[] = [];

  subscribe(listener: EventListener) {
    this.listeners.push(listener);
    
    // Devolver función para desuscribirse
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  emit(colaboradorId: string, newBalance: number) {
    this.listeners.forEach(listener => {
      try {
        listener(colaboradorId, newBalance);
      } catch (error) {
        console.error('Error in compensatory time event listener:', error);
      }
    });
  }
}

export const compensatoryTimeEvents = new CompensatoryTimeEventEmitter();