export default function Button({ icon, children, onClick, className, variant = "primary" }) {
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white",
    secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/20",
    danger: "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50",
    success: "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50",
  };

  return (
    <button
      className={`
        px-6 py-3 rounded-full font-medium flex items-center gap-2 
        transition-all duration-300 transform hover:scale-105
        ${variants[variant]} ${className}
      `}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}