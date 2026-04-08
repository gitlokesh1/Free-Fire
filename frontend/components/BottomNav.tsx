'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Swords, Wallet, User } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home, img: '/images/home.png', activeImg: '/images/home1.png' },
  { href: '/matches', label: 'Matches', icon: Swords, img: null, activeImg: null },
  { href: '/wallet', label: 'Wallet', icon: Wallet, img: '/images/wallet.png', activeImg: '/images/wallet2.png' },
  { href: '/profile', label: 'Profile', icon: User, img: '/images/my.png', activeImg: '/images/myimg.png' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      <div className="absolute inset-0">
        <Image
          src="/images/tabBarBg.png"
          alt=""
          fill
          className="object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
      <div className="relative z-10 flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const imgSrc = isActive ? (item.activeImg || item.img) : item.img;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {imgSrc ? (
                <div className="relative w-6 h-6">
                  <Image
                    src={imgSrc}
                    alt={item.label}
                    fill
                    className="object-contain"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <Icon size={22} />
              )}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
