import Icon from './Icon';
import { useLanguage } from '../LanguageContext';

export default function Features() {
  const { t } = useLanguage();

  const features = [
    { icon: 'key' as const, title: t.feat1Title, description: t.feat1Desc },
    { icon: 'unlock' as const, title: t.feat2Title, description: t.feat2Desc },
    { icon: 'export' as const, title: t.feat3Title, description: t.feat3Desc },
    { icon: 'search' as const, title: t.feat4Title, description: t.feat4Desc },
    { icon: 'group' as const, title: t.feat5Title, description: t.feat5Desc },
    { icon: 'apple' as const, title: t.feat6Title, description: t.feat6Desc },
  ];

  return (
    <section className="features">
      <h2>{t.featuresTitle}</h2>
      <p className="features-tagline">{t.featuresTagline}</p>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <span className="feature-icon">
              <Icon name={feature.icon} size={36} />
            </span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
