export interface BrandConfig {
  productName: string;
  companyName: string;
  tagline: string;
  logoPath: string;
  accentColor: string;
  accentHover: string;
  accentSoft: string;
  ecosystemApps: Array<{
    id: string;
    name: string;
    description: string;
    url: string;
    accent: string;
  }>;
}

export const brandConfig: BrandConfig = {
  productName: import.meta.env.VITE_PRODUCT_NAME || 'Tejas',
  companyName: import.meta.env.VITE_COMPANY_NAME || 'AkashaVyom Labs',
  tagline: 'A product of AkashaVyom Labs',
  logoPath: '/tejas-logo.png',
  accentColor: '#C4512D',
  accentHover: '#A94222',
  accentSoft: '#FCECE6',
  ecosystemApps: [
    {
      id: 'tejas',
      name: import.meta.env.VITE_PRODUCT_NAME || 'Tejas',
      description: 'Presentation Editor',
      url: '/',
      accent: '#C4512D',
    },
    {
      id: 'titan',
      name: 'Titan',
      description: 'Document Editor',
      url: import.meta.env.VITE_TITAN_URL || '#titan-integration',
      accent: '#1D4ED8',
    },
    {
      id: 'europa',
      name: 'Europa',
      description: 'AI Digital Notebook',
      url: import.meta.env.VITE_EUROPA_URL || '#europa-integration',
      accent: '#0F766E',
    },
  ],
};

