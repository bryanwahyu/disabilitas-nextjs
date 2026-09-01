

import { Facebook, Instagram, Mail, Phone, MapPin, Linkedin } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const TikTokIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.26 6.26 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.05a8.16 8.16 0 0 0 4.76 1.52V7.12a4.84 4.84 0 0 1-1-.43z"/>
  </svg>
);

const Footer = () => {
  const footerLinks = {
    platform: [
      { name: 'Tentang Kami', href: '/tentang' },
      { name: 'Cara Kerja', href: '/cara-kerja' },
      { name: 'Kemitraan & CSR', href: '/kemitraan' },
      { name: 'Keamanan & Privasi', href: '/keamanan' },
      { name: 'Syarat & Ketentuan', href: '/syarat-ketentuan' }
    ],
    layanan: [
      { name: 'Skrining Tumbuh Kembang', href: '/tumbuh-kembang' },
      { name: 'Terapis', href: '/terapis' },
      { name: 'Forum Komunitas', href: '/forum' },
      { name: 'Event & Workshop', href: '/acara' }
    ],
    dukungan: [
      { name: 'Pusat Bantuan', href: '/bantuan' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Layanan Keluhan', href: '/keluhan' },
      { name: 'Feedback', href: '/feedback' },
      { name: 'Kontak Support', href: 'mailto:bryanwahyukp95@gmail.com' }
    ],
    aksesibilitas: [
      { name: 'Panduan Aksesibilitas', href: '/aksesibilitas' },
      { name: 'Fitur WCAG', href: '/aksesibilitas' },
      { name: 'Umpan Balik', href: '/feedback' },
      { name: 'Saran Perbaikan', href: '/feedback' }
    ]
  };

  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <img
                loading="lazy"
                decoding="async"
                src="/icon-dark.svg"
                alt="DisabilitasKu logo"
                width={40}
                height={40}
                className="w-10 h-10 rounded-lg mr-3"
              />
              <span className="text-xl font-bold">
                Disabilitas<span className="text-violet-400">Ku</span>
              </span>
            </Link>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Platform inklusif yang menghubungkan penyandang disabilitas dengan layanan terapi profesional dan dukungan komunitas.
            </p>

            {/* Social Media */}
            <div className="flex space-x-4">
              <a
                href="https://www.tiktok.com/@disabilitasku.id"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                aria-label="Ikuti kami di TikTok"
              >
                <TikTokIcon size={24} />
              </a>
              <a
                href="https://www.instagram.com/disabilitasku/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                aria-label="Ikuti kami di Instagram"
              >
                <Instagram size={24} />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Layanan</h4>
            <ul className="space-y-3">
              {footerLinks.layanan.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Dukungan</h4>
            <ul className="space-y-3">
              {footerLinks.dukungan.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('mailto:') ? (
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Accessibility Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Aksesibilitas</h4>
            <ul className="space-y-3 mb-6">
              {footerLinks.aksesibilitas.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <Mail size={16} className="mr-2 text-primary" aria-hidden="true" />
                <a
                  href="mailto:bryanwahyukp95@gmail.com"
                  className="hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  bryanwahyukp95@gmail.com
                </a>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone size={16} className="mr-2 text-primary" aria-hidden="true" />
                <a
                  href="https://wa.me/628990076060"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  +62 899 007 6060
                </a>
              </div>
              <div className="flex items-start text-gray-300">
                <MapPin size={16} className="mr-2 mt-1 text-primary flex-shrink-0" aria-hidden="true" />
                <span>Jakarta, Indonesia</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tim Kami Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <h4 className="font-semibold text-white mb-4">Tim Kami</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bryan - Founder */}
            <div>
              <p className="text-gray-300 font-medium mb-2">Bryan Wahyu <span className="text-violet-300 text-sm">(Founder)</span></p>
              <div className="flex space-x-3">
                <a
                  href="https://www.facebook.com/bryan.wahyu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  aria-label="Facebook Bryan Wahyu"
                >
                  <Facebook size={20} />
                </a>
                <a
                  href="https://www.instagram.com/bryanwahyu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  aria-label="Instagram Bryan Wahyu"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href="https://www.linkedin.com/in/bryan-wahyu-2b0360377/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  aria-label="LinkedIn Bryan Wahyu"
                >
                  <Linkedin size={20} />
                </a>
              </div>
            </div>
            {/* Awany */}
            <div>
              <p className="text-gray-300 font-medium mb-2">Awany Desyar</p>
              <div className="flex space-x-3">
                <a
                  href="https://www.instagram.com/awanydesyar28/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                  aria-label="Instagram Awany Desyar"
                >
                  <Instagram size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              © 2026 DisabilitasKu. Semua hak cipta dilindungi.
            </div>

            {/* WCAG Compliance Badge */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <div className="bg-primary text-white px-2 py-1 rounded text-xs font-semibold mr-2">
                  WCAG 2.1 AA
                </div>
                <span>Compliant</span>
              </div>
              <div className="text-sm text-gray-500">
                <Link
                  to="/aksesibilitas"
                  className="hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
                >
                  Laporan Aksesibilitas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
