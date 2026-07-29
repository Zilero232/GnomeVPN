export const emailStyles = {
  body: {
    margin: 0,
    padding: '32px 0',
    backgroundColor: '#0a0a0a',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  },
  outer: {
    maxWidth: '520px',
    margin: '0 auto',
    padding: '0 16px'
  },
  card: {
    padding: '36px 32px',
    borderRadius: '16px',
    border: '1px solid #1f1f1f',
    backgroundColor: '#111111'
  },
  brand: {
    margin: '0 0 24px',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#34d399'
  },
  heading: {
    margin: '0 0 14px',
    fontSize: '21px',
    fontWeight: 600,
    lineHeight: '1.3',
    color: '#f5f5f5'
  },
  text: {
    margin: '0 0 12px',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#a3a3a3'
  },
  button: {
    display: 'inline-block',
    padding: '12px 26px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#04140d',
    backgroundColor: '#34d399',
    textDecoration: 'none'
  },
  hr: {
    margin: '28px 0 18px',
    border: 'none',
    borderTop: '1px solid #1f1f1f'
  },
  footnote: {
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#737373'
  },
  link: {
    color: '#34d399',
    wordBreak: 'break-all' as const
  }
} as const;
