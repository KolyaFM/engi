import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
import './ui/continuous-corners.css';
import './ui/interaction-palette.css';
import {installContinuousCorners} from './ui/continuous-corners';
installContinuousCorners();
createRoot(document.getElementById('root')!).render(<App/>);
