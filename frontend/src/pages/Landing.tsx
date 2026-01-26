import { useEffect, useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Google Sheets integration URL - preserved from original landing page
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwwXdcjkv9P915_pbZbkrGboWyFB5q5NMjdyJPuS_NApoUxpDOSC0SVkgOfTbPLtlvqrQ/exec';

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      setIsSuccess(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting the form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const previewContent: Record<string, { title: string; description: string; features: string[]; url: string }> = {
    dashboard: {
      title: 'Your Health at a Glance',
      description: 'The dashboard gives you an instant overview of your health journey. See trends in symptoms vs. positive effects, track your active medications, and get alerts when logged symptoms match known side effects.',
      features: ['Side effect alerts', 'Trend visualization', 'Quick actions', 'Activity timeline'],
      url: 'app.healthread.com/dashboard'
    },
    'log-entry': {
      title: 'Log Symptoms & Effects Easily',
      description: 'Quick entry forms let you log symptoms, positive effects, or medication doses in seconds. See known side effects for your medications right alongside your entry, and track patterns with similar past entries.',
      features: ['Quick symptom tags', 'Severity scale', 'Medication linking', 'Known effects panel'],
      url: 'app.healthread.com/log'
    },
    'ai-insights': {
      title: 'AI-Powered Health Insights',
      description: 'Get personalized health summaries and recommendations based on your logged data. Ask questions about your health history, upload medical records for AI analysis, and receive actionable insights about your medications and symptoms.',
      features: ['Weekly health summaries', 'Smart recommendations', 'Chat with your health data', 'Medical record analysis'],
      url: 'app.healthread.com/ai-insights'
    },
    'share-report': {
      title: 'Share with Your Care Team',
      description: 'Generate professional health summaries to share with doctors. Reports include medication history, symptom patterns, positive effects, and automatically detected correlations between your meds and symptoms.',
      features: ['Secure sharing links', 'PDF export', 'Correlation detection', 'Customizable content'],
      url: 'app.healthread.com/reports'
    }
  };

  return (
    <div className="landing-page">
      <style>{`
        .landing-page {
          --color-bg: #FDFBF7;
          --color-bg-warm: #F7F3EB;
          --color-text: #1A1A1A;
          --color-text-muted: #5C5C5C;
          --color-primary: #2D5A4A;
          --color-primary-light: #3D7A64;
          --color-accent: #E8B86D;
          --color-accent-light: #F5D9A8;
          --color-card: #FFFFFF;
          --color-border: #E5E0D5;
          --color-success: #059669;
          --color-success-soft: #D1FAE5;
          --font-display: 'DM Serif Display', Georgia, serif;
          --font-body: 'Plus Jakarta Sans', -apple-system, sans-serif;
          --shadow-soft: 0 4px 24px rgba(45, 90, 74, 0.08);
          --shadow-medium: 0 8px 40px rgba(45, 90, 74, 0.12);
          --shadow-large: 0 20px 60px rgba(45, 90, 74, 0.15);
          --radius-sm: 8px;
          --radius-md: 16px;
          --radius-lg: 24px;
          font-family: var(--font-body);
          background: var(--color-bg);
          color: var(--color-text);
          line-height: 1.6;
          overflow-x: hidden;
        }

        .landing-page::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
          z-index: 1000;
        }

        /* Navigation */
        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 1.5rem 4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(253, 251, 247, 0.9);
          backdrop-filter: blur(20px);
          z-index: 100;
          border-bottom: 1px solid var(--color-border);
        }

        .landing-logo {
          font-family: var(--font-display);
          font-size: 1.75rem;
          color: var(--color-primary);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
        }

        .nav-links {
          display: flex;
          gap: 2.5rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-links button {
          color: var(--color-text-muted);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: color 0.2s ease;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .nav-links button:hover {
          color: var(--color-primary);
        }

        .nav-cta {
          background: var(--color-primary);
          color: white !important;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-sm);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .nav-cta:hover {
          background: var(--color-primary-light);
          transform: translateY(-1px);
        }

        .nav-auth {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .nav-login {
          color: var(--color-text-muted);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: color 0.2s ease;
        }

        .nav-login:hover {
          color: var(--color-primary);
        }

        /* Hero Section */
        .hero {
          min-height: 100vh;
          display: flex;
          align-items: center;
          padding: 8rem 4rem 4rem;
          position: relative;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          top: -20%;
          right: -10%;
          width: 70%;
          height: 140%;
          background: radial-gradient(ellipse at center, var(--color-accent-light) 0%, transparent 70%);
          opacity: 0.4;
          z-index: -1;
          animation: float 20s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(2deg); }
          66% { transform: translate(-20px, 20px) rotate(-1deg); }
        }

        .hero-content {
          max-width: 640px;
          animation: fadeInUp 0.8s ease-out;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--color-card);
          border: 1px solid var(--color-border);
          padding: 0.5rem 1rem;
          border-radius: 100px;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--color-text-muted);
          margin-bottom: 1.5rem;
          box-shadow: var(--shadow-soft);
        }

        .hero-badge-dot {
          width: 8px;
          height: 8px;
          background: var(--color-accent);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }

        .hero h1 {
          font-family: var(--font-display);
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 400;
          line-height: 1.15;
          margin-bottom: 1.5rem;
          color: var(--color-text);
        }

        .hero h1 em {
          color: var(--color-primary);
          font-style: italic;
        }

        .hero p {
          font-size: 1.2rem;
          color: var(--color-text-muted);
          margin-bottom: 2.5rem;
          max-width: 520px;
          line-height: 1.7;
        }

        .hero-cta {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: var(--color-primary);
          color: white;
          padding: 1rem 2rem;
          border-radius: var(--radius-sm);
          text-decoration: none;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          border: none;
          cursor: pointer;
        }

        .btn-primary:hover {
          background: var(--color-primary-light);
          transform: translateY(-2px);
          box-shadow: var(--shadow-medium);
        }

        .btn-secondary {
          background: transparent;
          color: var(--color-text);
          padding: 1rem 2rem;
          border-radius: var(--radius-sm);
          text-decoration: none;
          font-weight: 600;
          font-size: 1rem;
          border: 2px solid var(--color-border);
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .btn-secondary:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .hero-visual {
          position: absolute;
          right: 4rem;
          top: 50%;
          transform: translateY(-50%);
          width: 45%;
          max-width: 600px;
          animation: fadeInRight 1s ease-out 0.3s both;
        }

        @keyframes fadeInRight {
          from { opacity: 0; transform: translateY(-50%) translateX(40px); }
          to { opacity: 1; transform: translateY(-50%) translateX(0); }
        }

        .hero-mockup {
          background: var(--color-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-medium);
          padding: 1.5rem;
          border: 1px solid var(--color-border);
        }

        .mockup-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--color-border);
        }

        .mockup-avatar {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
        }

        .mockup-user-info h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.2rem;
        }

        .mockup-user-info span {
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .mockup-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          background: var(--color-bg-warm);
          padding: 1rem;
          border-radius: var(--radius-sm);
          text-align: center;
        }

        .stat-card .value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-primary);
          display: block;
        }

        .stat-card .label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mockup-chart {
          background: var(--color-bg-warm);
          border-radius: var(--radius-sm);
          padding: 1rem;
          height: 120px;
          position: relative;
          overflow: hidden;
        }

        .chart-line {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          height: 60px;
        }

        .chart-line svg {
          width: 100%;
          height: 100%;
        }

        .chart-line path {
          stroke: var(--color-primary);
          stroke-width: 3;
          fill: none;
          stroke-linecap: round;
        }

        /* Features Section */
        .features {
          padding: 6rem 4rem;
          background: var(--color-bg-warm);
        }

        .section-header {
          text-align: center;
          max-width: 600px;
          margin: 0 auto 4rem;
        }

        .section-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 1rem;
          display: block;
        }

        .section-header h2 {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 400;
          margin-bottom: 1rem;
        }

        .section-header p {
          color: var(--color-text-muted);
          font-size: 1.1rem;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .feature-card {
          background: var(--color-card);
          border-radius: var(--radius-md);
          padding: 2rem;
          border: 1px solid var(--color-border);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-medium);
        }

        .feature-card:hover::before {
          transform: scaleX(1);
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .feature-icon svg {
          width: 28px;
          height: 28px;
          color: white;
        }

        .feature-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .feature-card p {
          color: var(--color-text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* App Preview Section */
        .app-preview {
          padding: 6rem 4rem;
          background: var(--color-bg);
          overflow: hidden;
        }

        .preview-container {
          max-width: 1400px;
          margin: 0 auto;
        }

        .preview-tabs {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .preview-tab {
          padding: 0.875rem 1.5rem;
          background: var(--color-card);
          border: 2px solid var(--color-border);
          border-radius: 100px;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .preview-tab:hover {
          border-color: var(--color-primary-light);
        }

        .preview-tab.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .preview-tab svg {
          width: 18px;
          height: 18px;
        }

        .screen-wrapper {
          background: var(--color-card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-large);
          overflow: hidden;
          border: 1px solid var(--color-border);
        }

        .screen-browser-bar {
          background: #F3F4F6;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid var(--color-border);
        }

        .browser-dots {
          display: flex;
          gap: 6px;
        }

        .browser-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .browser-dot.red { background: #EF4444; }
        .browser-dot.yellow { background: #F59E0B; }
        .browser-dot.green { background: #10B981; }

        .browser-url {
          flex: 1;
          background: white;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.8rem;
          color: var(--color-text-muted);
          margin-left: 1rem;
        }

        .screen-content {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #F8F6F2 0%, #E8E4DC 100%);
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }

        .screen-placeholder {
          text-align: center;
          max-width: 500px;
        }

        .screen-placeholder-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .screen-placeholder-icon svg {
          width: 40px;
          height: 40px;
          color: white;
        }

        .screen-placeholder h4 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--color-text);
        }

        .screen-placeholder p {
          color: var(--color-text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }

        .screen-placeholder .try-app-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--color-primary);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .screen-placeholder .try-app-btn:hover {
          background: var(--color-primary-light);
          transform: translateY(-1px);
        }

        .screen-description {
          display: flex;
          align-items: flex-start;
          gap: 2rem;
          margin-top: 2rem;
          padding: 0 1rem;
        }

        .screen-info {
          flex: 1;
        }

        .screen-info h3 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .screen-info p {
          color: var(--color-text-muted);
          font-size: 1rem;
          line-height: 1.6;
        }

        .screen-features {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }

        .screen-feature-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.875rem;
          background: var(--color-bg-warm);
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--color-text);
        }

        .screen-feature-tag svg {
          width: 14px;
          height: 14px;
          color: var(--color-primary);
        }

        /* How It Works */
        .how-it-works {
          padding: 6rem 4rem;
          background: var(--color-bg-warm);
        }

        .steps {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }

        .step {
          display: flex;
          gap: 2rem;
          align-items: flex-start;
        }

        .step-number {
          width: 64px;
          height: 64px;
          background: var(--color-card);
          border: 2px solid var(--color-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 1.5rem;
          color: var(--color-primary);
          flex-shrink: 0;
        }

        .step-content h3 {
          font-size: 1.35rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .step-content p {
          color: var(--color-text-muted);
          font-size: 1rem;
          line-height: 1.7;
          max-width: 600px;
        }

        /* For Who Section */
        .for-who {
          padding: 6rem 4rem;
          background: var(--color-primary);
          color: white;
          position: relative;
          overflow: hidden;
        }

        .for-who::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at 20% 50%, rgba(232, 184, 109, 0.15) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
        }

        .for-who .section-header {
          position: relative;
          z-index: 1;
        }

        .for-who .section-label {
          color: var(--color-accent);
        }

        .for-who .section-header p {
          color: rgba(255, 255, 255, 0.8);
        }

        .audience-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .audience-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-md);
          padding: 2rem;
        }

        .audience-card h3 {
          font-size: 1.35rem;
          font-weight: 600;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .audience-card ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .audience-card li {
          padding: 0.5rem 0;
          padding-left: 1.5rem;
          position: relative;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.95rem;
        }

        .audience-card li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          background: var(--color-accent);
          border-radius: 50%;
        }

        /* Waitlist Section */
        .waitlist {
          padding: 6rem 4rem;
          background: var(--color-bg);
        }

        .waitlist-container {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
        }

        .waitlist h2 {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4vw, 2.75rem);
          font-weight: 400;
          margin-bottom: 1rem;
        }

        .waitlist > .waitlist-container > p {
          color: var(--color-text-muted);
          font-size: 1.1rem;
          margin-bottom: 2.5rem;
        }

        .waitlist-form {
          background: var(--color-card);
          border-radius: var(--radius-lg);
          padding: 2.5rem;
          box-shadow: var(--shadow-medium);
          border: 1px solid var(--color-border);
          text-align: left;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          font-weight: 500;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
          color: var(--color-text);
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-sm);
          font-size: 1rem;
          font-family: var(--font-body);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          background: var(--color-bg);
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(45, 90, 74, 0.1);
        }

        .form-group input::placeholder {
          color: #A0A0A0;
        }

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .role-option {
          position: relative;
        }

        .role-option input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .role-option label {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1rem;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--color-bg);
        }

        .role-option label:hover {
          border-color: var(--color-primary-light);
        }

        .role-option input:checked + label {
          border-color: var(--color-primary);
          background: rgba(45, 90, 74, 0.05);
        }

        .role-option .role-icon {
          width: 48px;
          height: 48px;
          background: var(--color-bg-warm);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
          transition: all 0.2s ease;
        }

        .role-option input:checked + label .role-icon {
          background: var(--color-primary);
          color: white;
        }

        .role-option .role-title {
          font-weight: 600;
          font-size: 1rem;
          margin-bottom: 0.25rem;
        }

        .role-option .role-desc {
          font-size: 0.8rem;
          color: var(--color-text-muted);
        }

        .submit-btn {
          width: 100%;
          background: var(--color-primary);
          color: white;
          padding: 1rem 2rem;
          border: none;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-size: 1rem;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          background: var(--color-primary-light);
          transform: translateY(-2px);
          box-shadow: var(--shadow-medium);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .form-note {
          text-align: center;
          margin-top: 1rem;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .success-message {
          text-align: center;
          padding: 2rem;
        }

        .success-icon {
          width: 64px;
          height: 64px;
          background: var(--color-primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          animation: scaleIn 0.4s ease-out;
        }

        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }

        .success-message h3 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .success-message p {
          color: var(--color-text-muted);
        }

        /* Footer */
        .landing-footer {
          padding: 3rem 4rem;
          background: var(--color-text);
          color: white;
          text-align: center;
        }

        .landing-footer .landing-logo {
          color: white;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .landing-footer p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .hero-visual {
            display: none;
          }

          .hero-content {
            max-width: 100%;
          }

          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .landing-nav {
            padding: 1rem 1.5rem;
          }

          .nav-links {
            display: none;
          }

          .hero, .features, .how-it-works, .for-who, .waitlist, .app-preview {
            padding: 4rem 1.5rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .audience-cards {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .step {
            flex-direction: column;
            gap: 1rem;
          }

          .preview-tabs {
            gap: 0.5rem;
          }

          .preview-tab {
            padding: 0.625rem 0.875rem;
            font-size: 0.75rem;
          }

          .preview-tab svg {
            width: 14px;
            height: 14px;
          }

          .screen-description {
            flex-direction: column;
            gap: 1rem;
          }

          .screen-info h3 {
            font-size: 1.25rem;
          }

          .screen-info p {
            font-size: 0.9rem;
          }

          .screen-feature-tag {
            padding: 0.375rem 0.625rem;
            font-size: 0.7rem;
          }

          .role-selector {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className="landing-nav">
        <a href="#" className="landing-logo">
          <svg className="logo-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="2"/>
            <path d="M18 8v20M10 14c4 4 12 4 16 0M10 22c4-4 12-4 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Healthread
        </a>
        <ul className="nav-links">
          <li><button onClick={() => scrollToSection('features')}>Features</button></li>
          <li><button onClick={() => scrollToSection('preview')}>Preview</button></li>
          <li><button onClick={() => scrollToSection('how-it-works')}>How It Works</button></li>
          <li><button onClick={() => scrollToSection('for-who')}>Who It's For</button></li>
        </ul>
        <div className="nav-auth">
          <Link to="/login" className="nav-login">Sign In</Link>
          <Link to="/register" className="nav-cta">Try Beta</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <span className="hero-badge">
            <span className="hero-badge-dot"></span>
            Beta Available
          </span>
          <h1>Your health journey, <em>threaded</em> together</h1>
          <p>Track symptoms, medications, and vitals over time. Share meaningful summaries with your healthcare providers. Finally understand how treatments affect your wellbeing.</p>
          <div className="hero-cta">
            <Link to="/register" className="btn-primary">
              Try Beta Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <button onClick={() => scrollToSection('preview')} className="btn-secondary">See Preview</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-mockup">
            <div className="mockup-header">
              <div className="mockup-avatar">JD</div>
              <div className="mockup-user-info">
                <h4>Jane Doe</h4>
                <span>Recovery tracking · Week 3</span>
              </div>
            </div>
            <div className="mockup-stats">
              <div className="stat-card">
                <span className="value">72</span>
                <span className="label">Avg BPM</span>
              </div>
              <div className="stat-card">
                <span className="value">3</span>
                <span className="label">Active Meds</span>
              </div>
              <div className="stat-card">
                <span className="value">↓ 40%</span>
                <span className="label">Symptoms</span>
              </div>
            </div>
            <div className="mockup-chart">
              <div className="chart-line">
                <svg viewBox="0 0 300 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#2D5A4A', stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: '#2D5A4A', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  <path d="M0,45 Q30,50 60,40 T120,35 T180,25 T240,20 T300,15" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-header">
          <span className="section-label">Features</span>
          <h2>Everything you need to understand your health</h2>
          <p>A complete toolkit for tracking, analyzing, and communicating your health journey.</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
            <h3>Symptom Tracking</h3>
            <p>Log symptoms with severity ratings, duration, and notes. Track patterns over time with intuitive visualizations.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
                <path d="m8.5 8.5 7 7"/>
              </svg>
            </div>
            <h3>Medication Management</h3>
            <p>Track medications, dosages, and schedules. See known side effects and correlate them with your symptoms.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <h3>Side Effect Matching</h3>
            <p>Automatically match your symptoms to known medication side effects. Know if what you're experiencing is expected.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3>Doctor Summaries</h3>
            <p>Generate comprehensive health reports to share with your healthcare providers. No more forgetting symptoms at appointments.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <h3>Trend Analysis</h3>
            <p>Visualize correlations between medications and symptoms. Understand what's working and what isn't.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h3>Privacy First</h3>
            <p>Your health data stays yours. Secure encryption keeps your information private and protected.</p>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="app-preview" id="preview">
        <div className="preview-container">
          <div className="section-header">
            <span className="section-label">Preview</span>
            <h2>See Healthread in action</h2>
            <p>Explore the dashboard, log entries, and share reports with your healthcare team.</p>
          </div>

          <div className="preview-tabs">
            <button
              className={`preview-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Dashboard
            </button>
            <button
              className={`preview-tab ${activeTab === 'log-entry' ? 'active' : ''}`}
              onClick={() => setActiveTab('log-entry')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Log Entry
            </button>
            <button
              className={`preview-tab ${activeTab === 'ai-insights' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai-insights')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/>
                <circle cx="12" cy="14" r="2"/>
              </svg>
              AI Insights
            </button>
            <button
              className={`preview-tab ${activeTab === 'share-report' ? 'active' : ''}`}
              onClick={() => setActiveTab('share-report')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share Report
            </button>
          </div>

          <div className="screen-wrapper">
            <div className="screen-browser-bar">
              <div className="browser-dots">
                <span className="browser-dot red"></span>
                <span className="browser-dot yellow"></span>
                <span className="browser-dot green"></span>
              </div>
              <div className="browser-url">{previewContent[activeTab].url}</div>
            </div>
            <div className="screen-content">
              <div className="screen-placeholder">
                <div className="screen-placeholder-icon">
                  {activeTab === 'dashboard' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  )}
                  {activeTab === 'log-entry' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  )}
                  {activeTab === 'ai-insights' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/>
                      <circle cx="12" cy="14" r="2"/>
                    </svg>
                  )}
                  {activeTab === 'share-report' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  )}
                </div>
                <h4>{previewContent[activeTab].title}</h4>
                <p>{previewContent[activeTab].description}</p>
                <Link to="/register" className="try-app-btn">
                  Try It Now
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          <div className="screen-description">
            <div className="screen-info">
              <h3>{previewContent[activeTab].title}</h3>
              <p>{previewContent[activeTab].description}</p>
              <div className="screen-features">
                {previewContent[activeTab].features.map((feature, index) => (
                  <span key={index} className="screen-feature-tag">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-header">
          <span className="section-label">How It Works</span>
          <h2>Simple tracking, powerful insights</h2>
          <p>Get started in minutes and build a complete picture of your health over time.</p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Add your medications</h3>
              <p>Enter the medications you're currently taking, including dosages and schedules. We'll pull in known side effects automatically so you know what to watch for.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Log symptoms as they happen</h3>
              <p>Quick-add symptoms with severity ratings. Takes just seconds. Add notes when you want to remember context. The more you log, the clearer the picture becomes.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Track positive effects too</h3>
              <p>Don't just track what's wrong—log improvements and positive changes. This helps you and your doctor understand what's actually working.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Share with your care team</h3>
              <p>Generate a summary report before your next appointment. Your doctor sees the full timeline—symptoms, medications, positive effects—in one clear view.</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="for-who" id="for-who">
        <div className="section-header">
          <span className="section-label">Who It's For</span>
          <h2>Built for patients and providers</h2>
          <p>Whether you're managing your own health or caring for others, Healthread helps you see the complete picture.</p>
        </div>
        <div className="audience-cards">
          <div className="audience-card">
            <h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Patients
            </h3>
            <ul>
              <li>Recovering from surgery or illness</li>
              <li>Managing chronic conditions</li>
              <li>Starting new medications</li>
              <li>Tracking mental health treatments</li>
              <li>Monitoring ongoing symptoms</li>
            </ul>
          </div>
          <div className="audience-card">
            <h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
              Healthcare Professionals
            </h3>
            <ul>
              <li>Primary care physicians</li>
              <li>Specialists and surgeons</li>
              <li>Mental health providers</li>
              <li>Nurses and care coordinators</li>
              <li>Physical therapists</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="waitlist" id="waitlist">
        <div className="waitlist-container">
          <span className="section-label">Early Access</span>
          <h2>Be the first to try Healthread</h2>
          <p>Join our waitlist to get early access when we launch. We're building this with real input from patients and providers.</p>

          <div className="waitlist-form">
            {!isSuccess ? (
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      placeholder="Jane"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="jane@example.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>I am a...</label>
                  <div className="role-selector">
                    <div className="role-option">
                      <input
                        type="radio"
                        id="role-patient"
                        name="role"
                        value="Patient"
                        required
                        checked={formData.role === 'Patient'}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                      />
                      <label htmlFor="role-patient">
                        <span className="role-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                        </span>
                        <span className="role-title">Patient</span>
                        <span className="role-desc">Track my own health</span>
                      </label>
                    </div>
                    <div className="role-option">
                      <input
                        type="radio"
                        id="role-provider"
                        name="role"
                        value="Healthcare Professional"
                        required
                        checked={formData.role === 'Healthcare Professional'}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                      />
                      <label htmlFor="role-provider">
                        <span className="role-icon">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
                            <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
                            <circle cx="20" cy="10" r="2"/>
                          </svg>
                        </span>
                        <span className="role-title">Healthcare Pro</span>
                        <span className="role-desc">View patient summaries</span>
                      </label>
                    </div>
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  <span>{isSubmitting ? 'Joining...' : 'Join the Waitlist'}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
                <p className="form-note">We'll only email you about Healthread. No spam, ever.</p>
              </form>
            ) : (
              <div className="success-message">
                <div className="success-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3>You're on the list!</h3>
                <p>We'll be in touch soon with early access details.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <a href="#" className="landing-logo">
          <svg className="logo-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="18" cy="18" r="16" stroke="currentColor" strokeWidth="2"/>
            <path d="M18 8v20M10 14c4 4 12 4 16 0M10 22c4-4 12-4 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Healthread
        </a>
        <p>&copy; 2026 Healthread. All rights reserved.</p>
      </footer>
    </div>
  );
}
