import type { ThemeContract } from '../../contract';
import { AppShell, LoadingState } from './shell/AppShell';
import TestLab from './pages/TestLab';
import Placeholder from './pages/Placeholder';

const defaultTheme: ThemeContract = {
  id: 'default',
  pages: {
    Dashboard: () => <Placeholder pageName="Dashboard" />,
    TaskList: () => <Placeholder pageName="TaskList" />,
    TaskDetail: () => <Placeholder pageName="TaskDetail" />,
    Journal: () => <Placeholder pageName="Journal" />,
    Routines: () => <Placeholder pageName="Routines" />,
    Metrics: () => <Placeholder pageName="Metrics" />,
    Profile: () => <Placeholder pageName="Profile" />,
    Settings: () => <Placeholder pageName="Settings" />,
    Shop: () => <Placeholder pageName="Shop" />,
    TestLab: TestLab,
  },
  shell: {
    AppShell,
    LoadingState,
  },
};

export default defaultTheme;
