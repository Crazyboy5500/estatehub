import { motion } from 'framer-motion';
import { useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export const fallbackImage = '/img-placeholder.svg';

interface SafeImgProps extends ImgHTMLAttributes<HTMLImageElement> {}

export const SafeImg = ({ src, alt = '', className = '', ...props }: SafeImgProps) => {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed || !src ? fallbackImage : src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      {...props}
    />
  );
};

export const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const FadeInSection = ({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    className={className}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-80px' }}
    variants={fadeIn}
    transition={{ duration: 0.5, delay }}
  >
    {children}
  </motion.div>
);

export const PageLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
  </div>
);

export const Spinner = ({ className = 'h-8 w-8' }: { className?: string }) => (
  <div className="flex justify-center py-10">
    <div className={`${className} animate-spin rounded-full border-4 border-primary-200 border-t-primary-600`} />
  </div>
);

export const EmptyState = ({
  icon = '🔍',
  title,
  message = '',
  action,
}: {
  icon?: string;
  title?: string;
  message?: string;
  action?: ReactNode;
}) => {
  const { t } = useTranslation();
  return (
    <div className="card mx-auto max-w-md p-10 text-center">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold">{title || t('ui.emptyTitle')}</h3>
      {message && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export const Stars = ({ rating = 0, size = 'text-base' }: { rating?: number; size?: string }) => (
  <span className={`${size} text-accent`}>
    {'★'.repeat(Math.round(rating))}
    <span className="text-gray-300 dark:text-gray-700">{'★'.repeat(5 - Math.round(rating))}</span>
  </span>
);