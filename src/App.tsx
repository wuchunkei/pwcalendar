import { Auth } from './components/Auth';
import { ProjectList } from './components/ProjectList';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a73e8',
    },
  },
});

function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            userEmail ? <Navigate to="/projects" /> : <Auth onLogin={setUserEmail} />
          } />
          <Route path="/projects" element={
            userEmail ? <ProjectList userEmail={userEmail} /> : <Navigate to="/" />
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
