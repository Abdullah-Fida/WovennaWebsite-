export default function Logo({ className }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 120 100" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="60"
        y="82"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="100"
        fontWeight="300"
        fontStyle="italic"
      >W</text>
    </svg>
  );
}
