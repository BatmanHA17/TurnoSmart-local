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
  Img,
  Hr,
} from 'npm:@react-email/components@0.0.22';

interface CommercialEmailProps {
  firstName: string;
  email: string;
}

export const CommercialEmail = ({
  firstName,
  email,
}: CommercialEmailProps) => (
  <Html>
    <Head />
    <Preview>interested in TurnoSmart? 🤔</Preview>
    <Body style={main}>
      <Container style={container}>
        
        <Text style={greeting}>Hello {firstName},</Text>
        
        <Text style={text}>
          Are you interested in TurnoSmart's solutions? Unfortunately, our solution is not yet available in your country.<br />
          But if you have an establishment in the following countries, you can request a call back by replying to this email.
        </Text>
        
        <Text style={text}>
          <strong>Available countries :</strong>
        </Text>
        
        <ul style={list}>
          <li style={listItem}>France</li>
          <li style={listItem}>Spain</li>
          <li style={listItem}>Belgium</li>
          <li style={listItem}>Luxembourg</li>
          <li style={listItem}>Switzerland</li>
          <li style={listItem}>Monaco</li>
          <li style={listItem}>Andorra</li>
        </ul>
        
        <Hr style={hr} />
        
        {/* Signature */}
        <Section style={signature}>
          <Section style={profileSection}>
            <Img
              src="https://via.placeholder.com/80x80/6366f1/ffffff?text=JC"
              alt="Jean-Carlos MARTINEZ"
              style={profileImage}
            />
            <Section style={profileInfo}>
              <Text style={profileName}>Jean-Carlos MARTINEZ</Text>
              <Text style={profileTitle}>TurnoSmart Expert</Text>
              <Text style={profileEmail}>jean-carlos.martinez@turnosmart.com</Text>
              
              {/* Logo */}
              <Text style={logoText}>TurnoSmart</Text>
              
              {/* Social links */}
              <Section style={socialLinks}>
                <Link href="https://facebook.com/turnosmart" style={socialLink}>
                  <Img src="https://via.placeholder.com/24/1877f2/ffffff?text=f" alt="Facebook" style={socialIcon} />
                </Link>
                <Link href="https://linkedin.com/company/turnosmart" style={socialLink}>
                  <Img src="https://via.placeholder.com/24/0a66c2/ffffff?text=in" alt="LinkedIn" style={socialIcon} />
                </Link>
                <Link href="https://instagram.com/turnosmart" style={socialLink}>
                  <Img src="https://via.placeholder.com/24/e4405f/ffffff?text=ig" alt="Instagram" style={socialIcon} />
                </Link>
                <Link href="https://youtube.com/turnosmart" style={socialLink}>
                  <Img src="https://via.placeholder.com/24/ff0000/ffffff?text=yt" alt="YouTube" style={socialIcon} />
                </Link>
              </Section>
            </Section>
          </Section>
        </Section>
        
        <Hr style={hr} />
        
        {/* Footer */}
        <Text style={footerText}>
          Sent to: {email}
        </Text>
        
        <Text style={footerText}>
          <Link href="mailto:unsubscribe@turnosmart.com?subject=Unsubscribe" style={unsubscribeLink}>
            Unsubscribe
          </Link>
        </Text>
        
        <Text style={footerText}>
          TurnoSmart, 37 rue de Bellefond, 75009 Paris, France
        </Text>
        
      </Container>
    </Body>
  </Html>
);

export default CommercialEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
};

const greeting = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '20px 0',
};

const text = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '16px 0',
};

const list = {
  margin: '16px 0',
  paddingLeft: '20px',
};

const listItem = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '4px 0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const signature = {
  margin: '32px 0',
};

const profileSection = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '16px',
};

const profileImage = {
  width: '80px',
  height: '80px',
  borderRadius: '8px',
  marginRight: '16px',
};

const profileInfo = {
  flex: '1',
};

const profileName = {
  color: '#333333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 4px 0',
};

const profileTitle = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 4px 0',
};

const profileEmail = {
  color: '#4A90E2',
  fontSize: '14px',
  margin: '0 0 16px 0',
  textDecoration: 'none',
};

const logoText = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#000000',
  margin: '8px 0 16px 0',
  fontFamily: 'Georgia, serif',
  fontStyle: 'italic',
};

const socialLinks = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
};

const socialLink = {
  textDecoration: 'none',
  marginRight: '8px',
};

const socialIcon = {
  width: '24px',
  height: '24px',
  borderRadius: '4px',
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const unsubscribeLink = {
  color: '#4A90E2',
  textDecoration: 'underline',
};