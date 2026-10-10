import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LEGAL_DOCUMENTS, getLegalDocument, type LegalDocument } from '@/data/legalDocuments';
import { LEGAL_OPERATOR } from '@/config/legal';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { ShieldAlert } from 'lucide-react';

function LegalDocView({ doc }: { doc: LegalDocument }) {
  return (
    <div className="legal-content">
      <div className="legal-doc-header">
        <h1>{doc.title}</h1>
        <div className="legal-doc-meta">
          <span className="legal-doc-version">Версия {doc.version}</span>
          <span className="legal-doc-version">Дата обновления: {new Date(doc.lastUpdated).toLocaleDateString('ru-RU')}</span>
          {doc.isDraft && <span className="legal-draft-badge"><ShieldAlert size={12} /> Проект документа</span>}
        </div>
      </div>

      <div className="legal-toc">
        <p className="legal-toc-title">Оглавление</p>
        <ol>
          {doc.sections.map((s, i) => (
            <li key={i}>{s.title}</li>
          ))}
        </ol>
      </div>

      {doc.sections.map((s, i) => (
        <div className="legal-section" key={i}>
          <h2>{s.title}</h2>
          {s.paragraphs?.map((p, j) => <p key={j}>{p}</p>)}
          {s.list?.map((item, j) => (
            <ul key={j}><li>{item}</li></ul>
          ))}
        </div>
      ))}

      <div className="legal-operator">
        <h3>Оператор</h3>
        <p>{LEGAL_OPERATOR.operatorName}</p>
        <p>ИНН: {LEGAL_OPERATOR.inn}</p>
        <p>ОГРНИП: {LEGAL_OPERATOR.ogrnip}</p>
        <p>Email: {LEGAL_OPERATOR.email}</p>
        <p>Адрес: {LEGAL_OPERATOR.address}</p>
        <p>Сайт: {LEGAL_OPERATOR.website}</p>
      </div>
    </div>
  );
}

function LegalContent() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!slug) navigate('/legal/privacy', { replace: true });
  }, [slug, navigate]);

  const doc = slug ? getLegalDocument(slug) : undefined;

  if (!doc) {
    return (
      <div className="legal-content">
        <div className="legal-doc-header">
          <h1>Правовая база СВЯЗКА</h1>
          <p className="legal-doc-version">Выберите документ в меню слева</p>
        </div>
        <div className="legal-toc">
          <p className="legal-toc-title">Документы</p>
          <ol>
            {LEGAL_DOCUMENTS.map((d) => (
              <li key={d.slug}>
                <a href={`/legal/${d.slug}`} onClick={(e) => { e.preventDefault(); navigate(`/legal/${d.slug}`); }}>
                  {d.navLabel}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return <LegalDocView doc={doc} />;
}

export function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const activeSlug = slug || 'privacy';

  return (
    <PlatformLayout>
      <div className="dashboard-page">
        <div className="dashboard-body" style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="legal-layout">
            <div className="legal-sidebar">
              <h2 className="legal-sidebar-title">Правовая база</h2>
              <nav className="legal-nav">
                {LEGAL_DOCUMENTS.map((d) => (
                  <a
                    key={d.slug}
                    href={`/legal/${d.slug}`}
                    className={`legal-nav-item ${activeSlug === d.slug ? 'active' : ''}`}
                    onClick={(e) => { e.preventDefault(); navigate(`/legal/${d.slug}`); }}
                  >
                    {d.navLabel}
                  </a>
                ))}
              </nav>
            </div>
            <LegalContent />
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
}
