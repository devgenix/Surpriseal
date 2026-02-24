'use client';

import React from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { useTheme } from '@/context/ThemeContext';
import themeConfig from '../../theme/themeConfig';

const ThemeRegistry = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  
  return (
    <AntdRegistry>
      <ConfigProvider 
        theme={{
          ...themeConfig,
          algorithm: resolvedTheme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm
        }}
      >
        {children}
      </ConfigProvider>
    </AntdRegistry>
  );
};

export default ThemeRegistry;
