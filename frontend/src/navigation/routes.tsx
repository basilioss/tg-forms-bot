import type { ComponentType, JSX } from 'react';

import { IndexPage } from '@/pages/IndexPage.tsx';
import { InitDataPage } from '@/pages/InitDataPage.tsx';
import StartParamRouter from '@/components/StartParamRouter.tsx';
import FormPage from '@/pages/FormPage.tsx';
import ResponsesPage from '@/pages/ResponsesPage.tsx';
import CreateFormPage from "@/pages/CreateFormPage.tsx";

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: '/', Component: StartParamRouter },
  { path: '/index', Component: IndexPage, title: 'Index' },
  { path: '/init-data', Component: InitDataPage, title: 'Init Data' },
  { path: '/form/:id', Component: FormPage, title: 'Form' },
  { path: '/responses/:id', Component: ResponsesPage, title: 'Responses' },
  { path: '/create', Component: CreateFormPage, title: 'Create Form' },
];
