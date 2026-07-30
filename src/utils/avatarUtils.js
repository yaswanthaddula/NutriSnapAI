export const getAvatarColor = (name) => {
  if (!name) return '#00C853'; // default green
  const charCode = name.charCodeAt(0) || 0;
  
  // A palette of nice, modern, lighter pastel UI colors
  const colors = [
    '#81C784', // Light Green
    '#64B5F6', // Light Blue
    '#BA68C8', // Light Purple
    '#E57373', // Light Red/Coral
    '#FFB74D', // Light Orange
    '#4DD0E1', // Light Cyan
    '#F06292', // Light Pink
    '#7986CB', // Light Indigo
    '#4DB6AC', // Light Teal
    '#FF8A65'  // Light Deep Orange
  ];
  
  return colors[charCode % colors.length];
};
