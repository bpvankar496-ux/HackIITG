import React from 'react';

export const Logo: React.FC = () => {
  return (
    <span className="inline-flex items-center gap-2 select-none group">
      <svg
        width="26"
        height="30"
        viewBox="0 0 24 28"
        aria-hidden="true"
        className="transition-transform group-hover:scale-105"
      >
        <path
          d="M2 27V12a10 10 0 0 1 20 0v15M7 27V13a5 5 0 0 1 10 0v14M2 27h20"
          fill="none"
          stroke="#B65F43"
          strokeWidth="1.8"
        />
      </svg>
      <span className="font-serif text-2xl font-bold tracking-wide text-[#292821]">
        Virasat Quest
      </span>
    </span>
  );
};

export default Logo;
