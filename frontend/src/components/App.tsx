import { useMemo } from 'react';
import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import { retrieveLaunchParams, useSignal, isMiniAppDark } from '@telegram-apps/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';

import { routes } from '@/navigation/routes.tsx';
import PollPage from '@/pages/PollPage.tsx'
import ResultsPage from '@/pages/ResultsPage.tsx'
import CreatePollPage from "@/pages/CreatePollPage.tsx";

export function App() {
  const lp = useMemo(() => retrieveLaunchParams(), []);
  const isDark = useSignal(isMiniAppDark);

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
    >
      <HashRouter>
        <Routes>
          {routes.map((route) => <Route key={route.path} {...route} />)}
          <Route path="*" element={<Navigate to="/"/>}/>
          <Route path="/poll/:id" element={<PollPage />} />
          <Route path="/results/:id" element={<ResultsPage />} />
          <Route path="/create" element={<CreatePollPage />} />
        </Routes>
      </HashRouter>
    </AppRoot>
  );
}
