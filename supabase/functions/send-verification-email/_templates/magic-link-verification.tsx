
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface MagicLinkVerificationProps {
  customerName: string
  magicLink: string
}

export const MagicLinkVerification = ({
  customerName,
  magicLink,
}: MagicLinkVerificationProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Complaindesk – Confirm Your Email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Heading style={logo}>Complaindesk</Heading>
        </Section>
        
        <Heading style={h1}>Welcome to Complaindesk! 🎉</Heading>
        
        <Text style={text}>Dear {customerName},</Text>
        
        <Text style={text}>
          Welcome to <strong>Complaindesk</strong>, your trusted Complaint Management System.
        </Text>
        
        <Text style={text}>
          To activate your account and start managing your complaints, please confirm your email by clicking the button below:
        </Text>
        
        <Section style={buttonSection}>
          <Button style={button} href={magicLink}>
            🔐 Confirm My Account
          </Button>
        </Section>
        
        <Text style={text}>
          Or paste the following link in your browser:
        </Text>
        
        <Text style={linkText}>
          <Link href={magicLink} style={link}>
            {magicLink}
          </Link>
        </Text>
        
        <Text style={warningText}>
          This link is valid for the next 15 minutes. If you did not sign up for Complaindesk, please ignore this email.
        </Text>
        
        <Text style={footer}>
          Thank you,<br />
          The Complaindesk Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkVerification

const main = {
  backgroundColor: '#f6f9fc',
  padding: '10px 0',
}

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  padding: '45px',
  margin: '40px auto',
  borderRadius: '8px',
  maxWidth: '600px',
}

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
}

const logo = {
  color: '#1f2937',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#1f2937',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 28px',
  margin: '0 auto',
  maxWidth: '200px',
}

const linkText = {
  color: '#6b7280',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: '14px',
  margin: '16px 0',
  wordBreak: 'break-all' as const,
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}

const warningText = {
  color: '#ef4444',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: '14px',
  margin: '24px 0',
  fontStyle: 'italic',
}

const footer = {
  color: '#6b7280',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  fontSize: '14px',
  lineHeight: '22px',
  marginTop: '32px',
}
