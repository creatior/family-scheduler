export const COLOR_PALETTE = [
    '#FF6B6B', '#4ECDC4', '#1E6575', '#FFA07A', '#1DF0BB',
    '#F06292', '#65EB63', '#7D6E96', '#C4C460', '#B32246',
    '#5FFF5C', '#FFD54F', '#FF8A65', '#A1887F', '#6B28A6'
  ];
  
  export const timeSlots = Array.from({ length: 16 }, (_, i) => i + 8);
  
  export const getUserColor = (userId) => {
    if (!userId) return 'rgba(74, 107, 223, 0.7)';
    try {
      const index = parseInt(userId) % COLOR_PALETTE.length;
      return COLOR_PALETTE[index];
    } catch {
      return 'rgba(74, 107, 223, 0.7)';
    }
  };