import type { ComponentType, JSX } from 'react';

import { IndexPage } from '@/pages/IndexPage.tsx';
import { InitDataPage } from '@/pages/InitDataPage.tsx';
import StartParamRouter from '@/pages/StartParamRouter.tsx';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: '/', Component: StartParamRouter },
  // { path: '/', Component: IndexPage },
  { path: '/init-data', Component: InitDataPage, title: 'Init Data' },
];
