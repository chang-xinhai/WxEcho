import { useLanguage } from '../LanguageContext';

export default function VersionSupport() {
  const { t } = useLanguage();

  return (
    <section className="version-support">
      <h2>{t.versionSupportTitle}</h2>
      <div className="version-table">
        <table>
          <thead>
            <tr>
              <th>{t.versionCol}</th>
              <th>{t.versionStatus}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>4.x (latest tested: 4.1.7.1)</td>
              <td>✅ {t.versionTested}</td>
            </tr>
            <tr>
              <td>4.1.5.240</td>
              <td>✅ {t.versionTested}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="version-note">
        {t.versionNpmNote} 2026-04-06 (v1.1.1)
      </p>
    </section>
  );
}
