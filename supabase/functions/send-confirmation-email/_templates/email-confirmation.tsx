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
  Button,
} from 'npm:@react-email/components@0.0.22';

interface EmailConfirmationProps {
  confirmationUrl: string;
}

export const EmailConfirmationTemplate = ({
  confirmationUrl,
}: EmailConfirmationProps) => (
  <Html>
    <Head />
    <Preview>Confirma tu correo electrónico</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Logo */}
        <Section style={logoSection}>
          <Text style={logo}>TurnoSmart</Text>
        </Section>
        
        {/* Title */}
        <Heading style={h1}>Confirma tu correo electrónico</Heading>
        
        {/* Greeting */}
        <Text style={greeting}>Hola,</Text>
        
        {/* Main text */}
        <Text style={text}>
          Bienvenido a TurnoSmart. Solo tienes que hacer clic en el siguiente enlace para confirmar tu dirección de correo electrónico.
        </Text>
        
        {/* CTA Button */}
        <Section style={buttonContainer}>
          <Button href={confirmationUrl} style={button}>
            Confirmar correo electrónico
          </Button>
        </Section>
        
        {/* Footer text */}
        <Text style={footerText}>
          Si no has creado una cuenta, simplemente ignora este mensaje.
        </Text>
        
        {/* Social icons placeholder */}
        <Section style={socialSection}>
          <Link href="https://linkedin.com/company/turnosmart" style={socialLink}>in</Link>
          <Link href="https://instagram.com/turnosmart" style={socialLink}>📷</Link>
          <Link href="https://youtube.com/turnosmart" style={socialLink}>▶️</Link>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default EmailConfirmationTemplate;

const main = {
  backgroundColor: '#f0f0f0',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '600px',
  borderRadius: '8px',
};

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '40px',
};

const logo = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#000000',
  margin: '0',
  fontFamily: 'Georgia, serif',
  fontStyle: 'italic',
};

const h1 = {
  color: '#333333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 30px 0',
  textAlign: 'center' as const,
  lineHeight: '1.2',
};

const greeting = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 30px 0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '40px 0',
};

const button = {
  backgroundColor: '#4A90E2',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 32px',
  margin: '0 auto',
};

const footerText = {
  color: '#999999',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '40px 0 20px 0',
  textAlign: 'center' as const,
};

const socialSection = {
  textAlign: 'center' as const,
  margin: '20px 0',
};

const socialLink = {
  color: '#999999',
  fontSize: '16px',
  textDecoration: 'none',
  margin: '0 10px',
  display: 'inline-block',
};