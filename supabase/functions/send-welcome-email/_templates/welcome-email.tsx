import React from 'npm:react@18.3.1';
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22';

interface WelcomeEmailProps {
  firstName: string;
  lastName: string;
  companyName: string;
  dashboardUrl: string;
}

export const WelcomeEmail = ({
  firstName,
  lastName,
  companyName,
  dashboardUrl,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Bienvenido a TurnoSmart</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Logo */}
        <Section style={logoSection}>
          <Text style={logo}>TurnoSmart</Text>
        </Section>
        
        {/* Title */}
        <Heading style={h1}>Bienvenido a TurnoSmart</Heading>
        
        {/* Greeting */}
        <Text style={greeting}>
          Hola {firstName},<br />
          Acabas de crear tu cuenta de prueba TurnoSmart,<br />
          ¡felicitaciones! 🎉
        </Text>
        
        {/* Mission */}
        <Text style={missionTitle}>Nuestra misión:</Text>
        <Text style={missionText}>
          Liberarte de la pesadilla administrativa con una sencilla<br />
          herramienta de gestión de turnos diseñada para los equipos.
        </Text>
        
        {/* Steps */}
        <Text style={stepsTitle}>Para empezar, es así de sencillo:</Text>
        
        {/* Step 1 */}
        <Section style={stepContainer}>
          <Text style={stepText}>
            <strong>Descubre la herramienta a tu propio ritmo</strong><br />
            <Link href="https://turnosmart.app/help" style={stepLink} target="_blank">
              Crea tus primeros horarios en 3 sencillos pasos
            </Link>
          </Text>
          <Section style={stepIcon}>→</Section>
        </Section>
        
        {/* Step 2 */}
        <Section style={stepContainer}>
          <Text style={stepText}>
            <strong>¿Quieres hablar con nuestro equipo?</strong><br />
            <Link href="https://turnosmart.app/get-a-demo" style={stepLink} target="_blank">
              Concierta una cita para una demostración completa de la herramienta y de nuestras opciones (máquina de fichar, SMS...)
            </Link>
          </Text>
          <Section style={stepIcon}>→</Section>
        </Section>
        
        {/* Step 3 */}
        <Section style={stepContainer}>
          <Text style={stepText}>
            <strong>¿Ya estás convencido?</strong><br />
            <Link href="https://turnosmart.app/plan" style={stepLink} target="_blank">
              Inicia tu suscripción. El pago comenzará después de los 7 días de prueba, es mensual y sin compromisos.
            </Link>
          </Text>
          <Section style={stepIcon}>→</Section>
        </Section>
        
        {/* CTA Button */}
        <Text style={ctaTitle}>Inicia sesión ahora:</Text>
        <Section style={buttonContainer}>
          <Link
            href="https://turnosmart.app/auth"
            style={button}
            target="_blank"
          >
            Conectar
          </Link>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
  padding: '0 40px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#4A90E2',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  margin: '0 auto',
  width: '200px',
};

const list = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
  padding: '0 40px',
};

const listItem = {
  margin: '8px 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 40px',
};

const footer = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '32px 0 16px',
  padding: '0 40px',
};

const logoSection = {
  textAlign: 'center' as const,
  margin: '40px 0 20px 0',
};

const logo = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#000000',
  margin: '0',
  fontFamily: 'Georgia, serif',
  fontStyle: 'italic',
};

const greeting = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '20px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const missionTitle = {
  color: '#333333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '40px 0 10px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const missionText = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 30px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const stepsTitle = {
  color: '#333333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '40px 0 20px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const stepContainer = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  margin: '16px 40px',
  padding: '20px',
  position: 'relative' as const,
};

const stepText = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
  textAlign: 'center' as const,
};

const stepLink = {
  color: '#6b7280',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'block',
  marginTop: '8px',
};

const stepIcon = {
  position: 'absolute' as const,
  right: '20px',
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: '18px',
  color: '#6b7280',
};

const ctaTitle = {
  color: '#333333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '40px 0 20px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};