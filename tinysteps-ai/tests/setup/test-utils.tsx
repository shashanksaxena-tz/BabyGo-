import React from 'react';
import { render, RenderOptions } from '@testing-library/react';

// The tinysteps-ai app uses component-switching (no router), so no BrowserRouter wrapper is needed.
// This file provides a custom render function for future wrapper needs (e.g., context providers).

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

function customRender(
  ui: React.ReactElement,
  options?: CustomRenderOptions
) {
  const { wrapper: Wrapper, ...renderOptions } = options ?? {};

  if (Wrapper) {
    return render(<Wrapper>{ui}</Wrapper>, renderOptions);
  }

  return render(ui, renderOptions);
}

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };
