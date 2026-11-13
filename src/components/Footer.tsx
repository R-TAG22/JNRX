import React from 'react';
import { ArrowUp } from 'lucide-react';
import { useRouter } from '../admin/router';
import { useCMS } from '../context/CMSContext';
import { resolveBrandLogoUrl } from '../utils/imageFallbacks';

interface FooterProps {
  onNavigate?: (id: string) => void;
  onOpenInquiry?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenInquiry }) => {
  const { navigate } = useRouter();
  const { activeContent } = useCMS();
  const footerData = activeContent?.footer;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNav = (path: string) => {
    if (path.startsWith('/#')) {
      const sectionId = path.replace('/#', '');
      if (onNavigate) {
        onNavigate(sectionId);
      } else {
        navigate('/');
        setTimeout(() => {
          document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      return;
    }
    if (path.startsWith('mailto:') || path.startsWith('http://') || path.startsWith('https://')) {
      window.open(path, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(path.startsWith('/') ? path : `/${path}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyrightText = footerData?.copyrightText && !footerData.copyrightText.includes('CommerceForge') ? footerData.copyrightText : 'Proudly crafted by JNRX Dev Team. High-performance eCommerce storefronts.';

  const defaultColumns = [
    {
      id: 'col-1',
      title: 'Quick Links',
      links: [
        { id: 'ql-home', label: 'Home', url: '/' },
        { id: 'ql-about', label: 'About', url: '/about' },
        { id: 'ql-work', label: 'Work', url: '/work' },
        { id: 'ql-packages', label: 'Packages', url: '/packages' },
        { id: 'ql-blog', label: 'Blog', url: '/blog' },
        { id: 'ql-faq', label: 'FAQ', url: '/faqs' },
      ],
    },
  ];

  const rawColumns = footerData?.columns && footerData.columns.length > 0 ? footerData.columns : defaultColumns;
  const filteredColumns = rawColumns.filter((col) => {
    const titleLower = String(col?.title || '').toLowerCase().trim();
    return titleLower !== 'selected work' && titleLower !== 'information';
  });
  const columns = filteredColumns.length > 0 ? filteredColumns : defaultColumns;

  const headerData = activeContent?.header;
  const brandName = headerData?.brandName === 'Commerce' ? 'JNR' : (headerData?.brandName || 'JNR');
  const brandHighlight = headerData?.brandHighlight === 'Forge' ? 'X' : (headerData?.brandHighlight !== undefined ? headerData.brandHighlight : 'X');

  return (
    <footer
      id="main-footer"
      className="w-full pt-14 pb-10 transition-colors duration-300 border-t bg-[#0B1711] text-emerald-50/90 border-[#1E3A2B]/50"
      aria-label="Site Footer"
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10">
        {/* Footer Body: Logo & Quick Links side by side */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-8 sm:gap-14 md:gap-16 pb-10 sm:pb-12">
          {/* Left Side: Brand Logo sized to match Quick Links area */}
          <button
            type="button"
            onClick={() => handleNav('/')}
            className="group cursor-pointer focus:outline-none shrink-0"
            aria-label="JNRX Home"
          >
            <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-2xl bg-white p-3 sm:p-4 overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]">
              <img
                src={resolveBrandLogoUrl(headerData?.logoUrl)}
                alt={`${brandName}${brandHighlight} Logo`}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
          </button>

          {/* Quick Links near the logo */}
          <div className="flex flex-wrap gap-10 sm:gap-14">
            {columns.map((col) => (
              <div key={col.id || col.title} className="min-w-[140px]">
                <h4 className="text-xs sm:text-[13px] font-bold uppercase tracking-[0.16em] text-white mb-3.5 sm:mb-4 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B7E84B]" />
                  <span>{col.title}</span>
                </h4>
                <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-[13px]">
                  {col.links.map((link) => (
                    <li key={link.id || link.label}>
                      {link.url.startsWith('mailto:') ? (
                        <a
                          href={link.url}
                          className="text-emerald-100/70 hover:text-[#B7E84B] transition-colors cursor-pointer text-left block truncate"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (link.label.toLowerCase().includes('proposal') && onOpenInquiry) {
                              onOpenInquiry();
                            } else {
                              handleNav(link.url);
                            }
                          }}
                          className="text-emerald-100/70 hover:text-[#B7E84B] transition-colors cursor-pointer text-left block"
                        >
                          {link.label}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Minimalist Social Icons Row */}
        <div className="flex items-center justify-center gap-5 sm:gap-6 py-6 border-t border-emerald-900/40">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="text-emerald-200/60 hover:text-[#B7E84B] transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
          </a>

          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter X"
            className="text-emerald-200/60 hover:text-[#B7E84B] transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-emerald-200/60 hover:text-[#B7E84B] transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-emerald-200/60 hover:text-[#B7E84B] transition-colors"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
        </div>

        {/* Bottom Credits & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs text-emerald-200/50 text-center sm:text-left">
          <p className="leading-relaxed">
            {copyrightText}
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1 hover:text-[#B7E84B] transition-colors cursor-pointer shrink-0"
          >
            <span>Back to Top</span>
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </div>
    </footer>
  );
};
