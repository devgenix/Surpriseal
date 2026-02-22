import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    fontSize: 16,
    colorPrimary: '#e64c19',
    colorTextBase: '#1F1F1F',
    borderRadius: 12,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  },
  components: {
    Button: {
      colorPrimary: '#e64c19',
      algorithm: true, // Use default algorithm for button states
      borderRadius: 12,
    },
     Input: {
        colorPrimary: '#e64c19',
        algorithm: true,
        borderRadius: 12,
     }
  }
};

export default theme;
